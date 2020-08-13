import React from "react";
import axios from 'axios';
import moment from 'moment';
import { Text } from "rimble-ui";
import BigNumber from 'bignumber.js';
import globalConfigs from '../configs/globalConfigs';
// import availableTokens from '../configs/availableTokens';
// import { ChainId, Token, Fetcher, Route } from '@uniswap/sdk';

const env = process.env;

class FunctionsUtil {

  // Attributes
  props = {};

  // Constructor
  constructor(props){
    this.setProps(props);
  }

  // Methods
  setProps = props => {
    this.props = props;
  }
  trimEth = eth => {
    return this.BNify(eth).toFixed(6);
  }
  toEth = wei => {
    if (!this.props.web3){
      return null;
    }
    return this.props.web3.utils.fromWei(
      (wei || 0).toString(),
      "ether"
    );
  }
  toWei = eth => {
    if (!this.props.web3){
      return null;
    }
    return this.props.web3.utils.toWei(
      (eth || 0).toString(),
      "ether"
    );
  }
  BNify_obj = s => new BigNumber(s)
  BNify = s => new BigNumber( typeof s === 'object' ? s : String(s) )
  customLog = (...props) => { if (globalConfigs.logs.messagesEnabled) console.log(moment().format('HH:mm:ss'),...props); }
  customLogError = (...props) => { if (globalConfigs.logs.errorsEnabled) console.error(moment().format('HH:mm:ss'),...props); }
  getContractByName = (contractName) => {
    const contract = this.props.contracts.find(c => c.name === contractName);
    if (!contract) {
      return false;
    }
    return contract.contract;
  }
  normalizeSimpleIDNotification = (n) => {
    return n.replace(/<\/p><p>/g,"\n")
            .replace(/<p>/g,"")
            .replace(/<br>/g,"")
            .replace(/&nbsp;/g," ")
            .replace(/<\/p>/g,"");
  }
  capitalize = (str) => {
    return str.substr(0,1).toUpperCase()+str.substr(1);
  }
  strToMoment = (date,format=null) => {
    return moment(date,format);
  }
  stripHtml = (html) => {
     var tmp = document.createElement("DIV");
     tmp.innerHTML = html;
     return tmp.textContent || tmp.innerText || "";
  }
  // VanillaJS function for smooth scroll
  scrollTo = (to, duration) => {
    const start = window.scrollY;
    const change = to - start;
    const increment = 20;
    let currentTime = 0;

    Math.easeInOutQuad = function (t, b, c, d) {
      t /= d/2;
      if (t < 1) return c/2*t*t + b;
      t--;
      return -c/2 * (t*(t-2) - 1) + b;
    };

    const animateScroll = () => {
        currentTime += increment;
        var val = Math.easeInOutQuad(currentTime, start, change, duration);
        window.scrollTo(0,val);
        if(currentTime < duration) {
          window.setTimeout(animateScroll, increment);
        }
    };

    animateScroll();
  }
  getTxAction = (tx,tokenConfig) => {

    const idleTokenAddress = tokenConfig.idle.address;
    const depositProxyContractInfo = this.getGlobalConfig(['contract','methods','deposit','proxyContract']);
    const migrationContractAddr = tokenConfig.migration && tokenConfig.migration.migrationContract ? tokenConfig.migration.migrationContract.address : null;
    const migrationContractOldAddrs = tokenConfig.migration && tokenConfig.migration.migrationContract && tokenConfig.migration.migrationContract.oldAddresses ? tokenConfig.migration.migrationContract.oldAddresses : [];

    const isMigrationTx = migrationContractAddr && (tx.from.toLowerCase() === migrationContractAddr.toLowerCase() || migrationContractOldAddrs.map((v) => { return v.toLowerCase(); }).indexOf(tx.from.toLowerCase()) !== -1 ) && tx.contractAddress.toLowerCase() === idleTokenAddress.toLowerCase();
    const isSendTransferTx = !isMigrationTx && tx.from.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === idleTokenAddress.toLowerCase();
    const isReceiveTransferTx = !isMigrationTx && tx.to.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === idleTokenAddress.toLowerCase();
    const isDepositTx = !isMigrationTx && !isSendTransferTx && !isReceiveTransferTx && (tx.to.toLowerCase() === idleTokenAddress.toLowerCase() || (depositProxyContractInfo && tx.to.toLowerCase() === depositProxyContractInfo.address.toLowerCase()));
    const isRedeemTx = !isMigrationTx && !isSendTransferTx && !isReceiveTransferTx && tx.to.toLowerCase() === this.props.account.toLowerCase();
    const isSwapTx = !isMigrationTx && !isSendTransferTx && !isReceiveTransferTx && !isDepositTx && tx.to.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === idleTokenAddress.toLowerCase();

    let action = null;

    if (isDepositTx){
      action = 'Deposit';
    } else if (isRedeemTx){
      action = 'Redeem';
    } else if (isMigrationTx){
      action = 'Migrate';
    } else if (isSendTransferTx){
      action = 'Send';
    } else if (isReceiveTransferTx){
      action = 'Receive';
    } else if (isSwapTx){
      action = 'Swap';
    } else if (isSwapTx){
      action = 'SwapOut';
    }

    return action;
  }
  getAccountPortfolio = async (availableTokens=null,account=null) => {

    const portfolio = {
      tokensBalance:{},
      totalBalance:this.BNify(0)
    };

    availableTokens = availableTokens ? availableTokens : this.props.availableTokens;
    account = account ? account : this.props.account;

    if (!account || !availableTokens){
      return portfolio;
    }

    await this.asyncForEach(Object.keys(availableTokens),async (token) => {
      const tokenConfig = availableTokens[token];
      const idleTokenBalance = await this.getTokenBalance(tokenConfig.idle.token,account);
      if (idleTokenBalance){
        const tokenPrice = await this.getIdleTokenPrice(tokenConfig);
        const tokenBalance = idleTokenBalance.times(tokenPrice);

        if (!tokenPrice.isNaN() && !tokenBalance.isNaN()){
          portfolio.tokensBalance[token] = {
            tokenPrice,
            tokenBalance,
            idleTokenBalance
          };

          // Increment total balance
          portfolio.totalBalance = portfolio.totalBalance.plus(tokenBalance);
        }
      }
    });

    const orderedTokensBalance = {};
    Object.keys(availableTokens).forEach( token => {
      if (portfolio.tokensBalance[token]){
        orderedTokensBalance[token] = portfolio.tokensBalance[token];
      }
    });

    portfolio.tokensBalance = orderedTokensBalance;

    return portfolio;
  }
  getAvgBuyPrice = async (enabledTokens=[],account) => {
    account = account ? account : this.props.account;

    if (!account || !enabledTokens || !enabledTokens.length || !this.props.availableTokens){
      return [];
    }

    const output = {};
    const etherscanTxs = await this.getEtherscanTxs(account,0,'latest',enabledTokens);

    await this.asyncForEach(enabledTokens, async (selectedToken) => {

      output[selectedToken] = [];
      let avgBuyPrice = this.BNify(0);

      // Try to get the avgBuyPrice with using the new method
      // const tokenConfig = this.props.availableTokens[selectedToken];
      // const userAvgPrice = await this.genericContractCall(tokenConfig.idle.token, 'userAvgPrices', [account]);
      // if (userAvgPrice){
      //   avgBuyPrice = this.fixTokenDecimals(userAvgPrice,tokenConfig.decimals);
      // } else {

        let idleTokensBalance= this.BNify(0);
        const filteredTxs = Object.values(etherscanTxs).filter(tx => (tx.token === selectedToken));

        if (filteredTxs && filteredTxs.length){

          filteredTxs.forEach((tx,index) => {

            // Skip transactions with no hash or pending
            if (!tx.hash || (tx.status && tx.status === 'Pending') || !tx.idleTokens || !tx.tokenPrice){
              return false;
            }

            const prevAvgBuyPrice = avgBuyPrice;
            let idleTokens = this.BNify(tx.idleTokens);
            const tokenPrice = this.BNify(tx.tokenPrice);

            // Deposited
            switch (tx.action){
              case 'Deposit':
              case 'Receive':
              case 'Swap':
              case 'Migrate':
                avgBuyPrice = idleTokens.times(tokenPrice).plus(prevAvgBuyPrice.times(idleTokensBalance)).div(idleTokensBalance.plus(idleTokens));
              break;
              case 'Withdraw':
              case 'Send':
              case 'Redeem':
              case 'SwapOut':
                idleTokens = idleTokens.times(this.BNify(-1));
              break;
              default:
              break;
            }

            // Update idleTokens balance
            idleTokensBalance = idleTokensBalance.plus(idleTokens);
            if (idleTokensBalance.lte(0)){
              avgBuyPrice = this.BNify(0);
              idleTokensBalance = this.BNify(0);
            }
          });
        }
      // }

      // Add token Data
      output[selectedToken] = avgBuyPrice;
    });

    return output;
  }
  getDepositTimestamp = async (enabledTokens=[],account) => {
    account = account ? account : this.props.account;

    if (!account || !enabledTokens || !enabledTokens.length || !this.props.availableTokens){
      return [];
    }

    const etherscanTxs = await this.getEtherscanTxs(account,0,'latest',enabledTokens);

    const deposits = {};

    enabledTokens.forEach((selectedToken) => {
      let amountLent = this.BNify(0);
      let depositTimestamp = null;
      deposits[selectedToken] = depositTimestamp;

      const filteredTxs = Object.values(etherscanTxs).filter(tx => (tx.token === selectedToken));
      if (filteredTxs && filteredTxs.length){

        filteredTxs.forEach((tx,index) => {
          // Skip transactions with no hash or pending
          if (!tx.hash || (tx.status && tx.status === 'Pending') || !tx.tokenAmount){
            return false;
          }

          switch (tx.action){
            case 'Swap':
            case 'Deposit':
            case 'Receive':
            case 'Migrate':
              amountLent = amountLent.plus(tx.tokenAmount);
              if (!depositTimestamp){
                depositTimestamp = tx.timeStamp;
              }
            break;
            case 'Send':
            case 'Redeem':
            case 'SwapOut':
            case 'Withdraw':
              amountLent = amountLent.minus(tx.tokenAmount);
            break;
            default:
            break;
          }

          // Reset amountLent if below zero
          if (amountLent.lt(0)){
            amountLent = this.BNify(0);
            depositTimestamp = null;
          }
        });
      }

      // Add token Data
      deposits[selectedToken] = depositTimestamp;
    });

    return deposits;
  }
  getAmountLent = async (enabledTokens=[],account) => {
    account = account ? account : this.props.account;

    if (!account || !enabledTokens || !enabledTokens.length || !this.props.availableTokens){
      return [];
    }

    const etherscanTxs = await this.getEtherscanTxs(account,0,'latest',enabledTokens);

    const amountLents = {};

    enabledTokens.forEach((selectedToken) => {
      let amountLent = this.BNify(0);
      amountLents[selectedToken] = amountLent;

      const filteredTxs = Object.values(etherscanTxs).filter(tx => (tx.token === selectedToken));
      if (filteredTxs && filteredTxs.length){

        filteredTxs.forEach((tx,index) => {
          // Skip transactions with no hash or pending
          if (!tx.hash || (tx.status && tx.status === 'Pending') || !tx.tokenAmount){
            return false;
          }

          switch (tx.action){
            case 'Swap':
            case 'Deposit':
            case 'Receive':
            case 'Migrate':
              amountLent = amountLent.plus(tx.tokenAmount);
            break;
            case 'Send':
            case 'Redeem':
            case 'SwapOut':
            case 'Withdraw':
              amountLent = amountLent.minus(tx.tokenAmount);
            break;
            default:
            break;
          }

          // Reset amountLent if below zero
          if (amountLent.lt(0)){
            amountLent = this.BNify(0);
          }
        });
      }

      // Add token Data
      amountLents[selectedToken] = amountLent;
    });

    return amountLents;
  }
  getEtherscanTxs = async (account=false,firstBlockNumber=0,endBlockNumber='latest',enabledTokens=[],count=0) => {
    account = account ? account.toLowerCase() : (this.props.account ? this.props.account.toLowerCase() : null);

    if (!account || !enabledTokens || !enabledTokens.length){
      return [];
    }

    const selectedStrategy = this.props.selectedStrategy;
    const allAvailableTokens = Object.keys(this.props.availableTokens);

    // Check if firstBlockNumber is less that firstIdleBlockNumber
    const firstIdleBlockNumber = this.getGlobalConfig(['network','firstBlockNumber']);
    firstBlockNumber = Math.max(firstIdleBlockNumber,firstBlockNumber);

    count = count ? count : 0;

    const requiredNetwork = globalConfigs.network.requiredNetwork;
    const etherscanInfo = globalConfigs.network.providers.etherscan;

    let results = [];
    let etherscanBaseTxs = null;
    let etherscanBaseEndpoint = null;

    // Check if etherscan is enabled for the required network
    if (etherscanInfo.enabled && etherscanInfo.endpoints[requiredNetwork]){
      const etherscanApiUrl = etherscanInfo.endpoints[requiredNetwork];

      // Get base endpoint cached transactions
      etherscanBaseEndpoint = `${etherscanApiUrl}?strategy=${selectedStrategy}&apikey=${env.REACT_APP_ETHERSCAN_KEY}&module=account&action=tokentx&address=${account}&startblock=${firstIdleBlockNumber}&endblock=${endBlockNumber}&sort=asc`;
      etherscanBaseTxs = this.getCachedRequest(etherscanBaseEndpoint);

      // Check if the latest blockNumber is actually the latest one
      if (etherscanBaseTxs && etherscanBaseTxs.data.result && Object.values(etherscanBaseTxs.data.result).length){

        const lastCachedTx = Object.values(etherscanBaseTxs.data.result).pop();
        const lastCachedBlockNumber = lastCachedTx && lastCachedTx.blockNumber ? parseInt(lastCachedTx.blockNumber)+1 : firstBlockNumber;

        const etherscanEndpointLastBlock = `${etherscanApiUrl}?strategy=${selectedStrategy}&apikey=${env.REACT_APP_ETHERSCAN_KEY}&module=account&action=tokentx&address=${account}&startblock=${lastCachedBlockNumber}&endblock=${endBlockNumber}&sort=asc`;
        let latestTxs = await this.makeCachedRequest(etherscanEndpointLastBlock,15);

        if (latestTxs && latestTxs.data.result && latestTxs.data.result.length){
          
          latestTxs = await this.filterEtherscanTxs(latestTxs.data.result,enabledTokens);

          if (latestTxs && Object.values(latestTxs).length){

            const latestBlockNumbers = Object.values(latestTxs).map( lastTx => (parseInt(lastTx.blockNumber)) );
            const lastRealBlockNumber = Math.max(...latestBlockNumbers);

            // If real tx blockNumber differs from last blockNumber
            if (lastRealBlockNumber>=lastCachedBlockNumber){
              // Merge latest Txs with etherscanBaseTxs
              Object.values(latestTxs).forEach((tx) => {
                const txFound = Object.keys(etherscanBaseTxs.data.result).includes(tx.hash.toLowerCase());
                if (!txFound){
                  etherscanBaseTxs.data.result[tx.hash.toLowerCase()] = tx;
                }
              });

              // Save new etherscan txs
              this.saveCachedRequest(etherscanBaseEndpoint,false,etherscanBaseTxs);
            }
          }
        }
      } else {
        etherscanBaseTxs = null;
      }

      let txs = etherscanBaseTxs;

      if (!txs){
        // Make request
        txs = await this.makeRequest(etherscanBaseEndpoint);
      }

      if (txs && txs.data && txs.data.result){
        results = txs.data.result;
      } else {
        return [];
      }
    }

    // Initialize prevTxs
    let etherscanTxs = {};

    if (etherscanBaseTxs){
      // Filter txs for token
      etherscanTxs = await this.processStoredTxs(results,enabledTokens);
    } else {
      // Save base endpoint with all available tokens
      etherscanTxs = await this.filterEtherscanTxs(results,allAvailableTokens);

      // Store filtered txs
      if (etherscanTxs && Object.keys(etherscanTxs).length){

        const etherscanTxsToStore = {};

        Object.keys(etherscanTxs).forEach(txHash => {
          const txInfo = etherscanTxs[txHash];
          if (txInfo.blockNumber){
            etherscanTxsToStore[txHash] = txInfo;
          }
        });

        const cachedRequestData = {
          data:{
            result:etherscanTxsToStore
          }
        };

        this.saveCachedRequest(etherscanBaseEndpoint,false,cachedRequestData);
      }
    }

    etherscanTxs = Object.values(etherscanTxs).filter(tx => (enabledTokens.includes(tx.token.toUpperCase())) );

    const orderedTxsTimestamps = etherscanTxs.map( tx => (parseInt(tx.timeStamp)) ).sort();
    const orderedEtherscanTxs = orderedTxsTimestamps.map( timeStamp => ( etherscanTxs.find( tx => (parseInt(tx.timeStamp) === timeStamp) ) ) );

    return orderedEtherscanTxs;
  }
  filterEtherscanTxs = async (results,enabledTokens=[],processTxs=true) => {
    if (!results || !results.length || typeof results.forEach !== 'function'){
      return [];
    }

    if (!enabledTokens || !enabledTokens.length){
      enabledTokens = Object.keys(this.props.availableTokens);
    }

    let etherscanTxs = {};

    enabledTokens.forEach(token => {
      const tokenConfig = this.props.availableTokens[token];
      const depositProxyContractInfo = this.getGlobalConfig(['contract','methods','deposit','proxyContract']);
      const migrationContractAddr = tokenConfig.migration && tokenConfig.migration.migrationContract ? tokenConfig.migration.migrationContract.address : null;
      const migrationContractOldAddrs = tokenConfig.migration && tokenConfig.migration.migrationContract && tokenConfig.migration.migrationContract.oldAddresses ? tokenConfig.migration.migrationContract.oldAddresses : [];
      const tokenMigrationToolParams = this.getGlobalConfig(['tools','tokenMigration','props','migrationContract']);

      results.forEach(
        tx => {

          let tokenDecimals = tokenConfig.decimals;
          const internalTxs = results.filter(r => r.hash === tx.hash);
          const isRightToken = internalTxs.length>1 && internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === tokenConfig.address.toLowerCase()).length>0;
          const isSendTransferTx = internalTxs.length === 1 && tx.from.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === tokenConfig.idle.address.toLowerCase();
          const isReceiveTransferTx = internalTxs.length === 1 && tx.to.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === tokenConfig.idle.address.toLowerCase();
          const isMigrationTx = migrationContractAddr && (tx.from.toLowerCase() === migrationContractAddr.toLowerCase() || migrationContractOldAddrs.map((v) => { return v.toLowerCase(); }).includes(tx.from.toLowerCase()) ) && tx.contractAddress.toLowerCase() === tokenConfig.idle.address.toLowerCase();
          const isConversionTx = tokenMigrationToolParams && (tx.from.toLowerCase() === tokenMigrationToolParams.address.toLowerCase() || tokenMigrationToolParams.oldAddresses.map((v) => { return v.toLowerCase(); }).includes(tx.from.toLowerCase())) && tx.to.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === tokenConfig.idle.address.toLowerCase();
          const isDepositTx = isRightToken && !isMigrationTx && tx.from.toLowerCase() === this.props.account.toLowerCase() && (tx.to.toLowerCase() === tokenConfig.idle.address.toLowerCase() || (depositProxyContractInfo && tx.to.toLowerCase() === depositProxyContractInfo.address.toLowerCase() && internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === tokenConfig.idle.address.toLowerCase()).length>0 ));
          const isRedeemTx = isRightToken && !isMigrationTx && tx.contractAddress.toLowerCase() === tokenConfig.address.toLowerCase() && internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === tokenConfig.idle.address.toLowerCase()).length && tx.to.toLowerCase() === this.props.account.toLowerCase();
          const isWithdrawTx = internalTxs.length>1 && internalTxs.filter(iTx => tokenConfig.protocols.map(p => p.address.toLowerCase()).includes(iTx.contractAddress.toLowerCase()) ).length>0 && tx.contractAddress.toLowerCase() === tokenConfig.idle.address.toLowerCase();
          const isSwapTx = !isReceiveTransferTx && !isConversionTx && !etherscanTxs[tx.hash] && tx.to.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === tokenConfig.idle.address.toLowerCase();
          const isSwapOutTx = !isSendTransferTx && !isWithdrawTx && !etherscanTxs[tx.hash] && tx.from.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === tokenConfig.idle.address.toLowerCase();

          if (isSendTransferTx || isReceiveTransferTx || isMigrationTx || isDepositTx || isRedeemTx || isSwapTx || isSwapOutTx || isWithdrawTx || isConversionTx){
            
            let action = null;

            if (isDepositTx){
              action = 'Deposit';
            } else if (isRedeemTx){
              action = 'Redeem';
            } else if (isMigrationTx || isConversionTx){
              action = 'Migrate';
            } else if (isSendTransferTx){
              action = 'Send';
            } else if (isReceiveTransferTx){
              action = 'Receive';
            } else if (isSwapTx){
              action = 'Swap';
            } else if (isSwapOutTx){
              action = 'SwapOut';
            } else if (isWithdrawTx){
              action = 'Withdraw';
            }

            if (tx.contractAddress.toLowerCase() === tokenConfig.idle.address.toLowerCase()){
              tokenDecimals = 18;
            }

            // Sum the value if already processed
            if (etherscanTxs[tx.hash]){
              // Prevent second internal tx to sum SwapOut original value
              switch (etherscanTxs[tx.hash].action){
                case 'SwapOut':
                  if (etherscanTxs[tx.hash].action !== action && isRedeemTx){
                    etherscanTxs[tx.hash].tokenValue = this.fixTokenDecimals(tx.value,tokenDecimals);
                  }
                break;
                default:
                  const newValue = etherscanTxs[tx.hash].value.plus(this.fixTokenDecimals(tx.value,tokenDecimals));
                  etherscanTxs[tx.hash].value = newValue;
                break;
              }
            } else {
              etherscanTxs[tx.hash] = ({...tx, token, action, value: this.fixTokenDecimals(tx.value,tokenDecimals)});
                
              // Take right tokenSymbol
              switch (action){
                case 'Withdraw':
                  const iTxs = internalTxs.filter(iTx => (iTx !== tx));
                  if (iTxs.length>0){
                    const iTx = iTxs[0];
                    etherscanTxs[tx.hash].withdrawnValue = this.fixTokenDecimals(iTx.value,iTx.tokenDecimal);
                    etherscanTxs[tx.hash].tokenSymbol = iTx.tokenSymbol;
                  }
                break;
                default:
                break;
              }
            }
          }
        }
      )
    });
  
    if (processTxs){
      etherscanTxs = await this.processEtherscanTransactions(etherscanTxs,enabledTokens);
    }

    return etherscanTxs;
  }
  addStoredTransaction = (txKey,transaction) => {

    const account = this.props && this.props.account ? this.props.account : null;
    const selectedToken = this.props && this.props.selectedToken ? this.props.selectedToken : null;

    if (!account || !selectedToken || !this.props.availableTokens || !this.props.availableTokens[selectedToken]){
      return false;
    }

    const tokenConfig = this.props.availableTokens[selectedToken];
    const tokenKey = tokenConfig.idle.token;

    let storedTxs = this.getStoredTransactions();
    if (!storedTxs[account]){
      storedTxs[account] = {};
    }

    if (!storedTxs[account][tokenKey]){
      storedTxs[account][tokenKey] = {};
    }

    storedTxs[account][tokenKey][txKey] = transaction;
    this.updateStoredTransactions(storedTxs);
  }
  updateStoredTransactions = transactions => {
    this.setLocalStorage('transactions',JSON.stringify(transactions));
  }
  /*
  Merge storedTxs with this.props.transactions
  */
  getStoredTransactions = (account=null,tokenKey=null,selectedToken=null) => {
    const storedTxs = this.getStoredItem('transactions',true,{});
    const transactions = this.props.transactions ? { ...this.props.transactions } : {};
    let output = storedTxs;

    if (account){
      if (storedTxs[account]){
        output = storedTxs[account];
        if (tokenKey){
          output = output[tokenKey] ? output[tokenKey] : {};

          if (selectedToken){
            Object.keys(transactions).forEach(txKey => {
              const tx = transactions[txKey];
              if (!output[txKey] && tx.token && tx.token.toUpperCase() === selectedToken.toUpperCase()){
                output[txKey] = transactions[txKey];
              }
            });
          }
        }
      } else {
        output = {};
      }
    }

    return output;
  }

  processEtherscanTransactions = async (etherscanTxs,enabledTokens=[]) => {

    if (!enabledTokens || !enabledTokens.length){
      enabledTokens = Object.keys(this.props.availableTokens);
    }

    let storedTxs = this.getStoredTransactions();

    // Init storedTxs for pair account-token if empty
    if (typeof storedTxs[this.props.account] !== 'object'){
      storedTxs[this.props.account] = {};
    }

    await this.asyncForEach(enabledTokens,async (selectedToken) => {

      const tokenConfig = this.props.availableTokens[selectedToken];
      const tokenKey = tokenConfig.idle.token;

      // Init storedTxs for pair account-token if empty
      if (typeof storedTxs[this.props.account][tokenKey] !== 'object'){
        storedTxs[this.props.account][tokenKey] = {};
      }

      const minedTxs = {...storedTxs[this.props.account][tokenKey]};

      const filteredTxs = Object.values(etherscanTxs).filter(tx => (tx.token === selectedToken));
      if (filteredTxs && filteredTxs.length){

        await this.asyncForEach(filteredTxs,async (tx,index) => {
          const txKey = `tx${tx.timeStamp}000`;
          const storedTx = storedTxs[this.props.account][tokenKey][txKey] ? storedTxs[this.props.account][tokenKey][txKey] : tx;

          let tokenPrice = null;
          
          if (storedTx.tokenPrice && !this.BNify(storedTx.tokenPrice).isNaN()){
            tokenPrice = this.BNify(storedTx.tokenPrice);
          } else {
            tokenPrice = await this.getIdleTokenPrice(tokenConfig,tx.blockNumber,tx.timeStamp);
            storedTx.tokenPrice = tokenPrice;
          }

          const idleTokens = this.BNify(tx.value);
          let tokensTransfered = tokenPrice.times(idleTokens);

          // Add transactionHash to storedTx
          if (!storedTx.transactionHash){
            storedTx.transactionHash = tx.hash;
          }

          // Deposited
          switch (tx.action){
            case 'Send':
            case 'Receive':
            case 'Swap':
            case 'SwapOut':
            case 'Migrate':
              if (!storedTx.tokenAmount){
                storedTx.idleTokens = idleTokens;
                storedTx.value = tokensTransfered;
                storedTx.tokenAmount = tokensTransfered;
                storedTx.tokenSymbol = selectedToken;
              }
            break;
            case 'Deposit':
            case 'Redeem':
              if (!storedTx.tokenAmount){
                storedTx.value = idleTokens;
                storedTx.tokenAmount = idleTokens;
                storedTx.idleTokens = idleTokens.div(tokenPrice);
              }
            break;
            case 'Withdraw':
              if (!storedTx.tokenAmount){
                storedTx.idleTokens = idleTokens;
                storedTx.tokenAmount = tokensTransfered;
                storedTx.value = storedTx.withdrawnValue;
              }
            break;
            default:
            break;
          }
            
          // Save token for future filtering
          storedTx.token = selectedToken;

          // Save processed tx
          etherscanTxs[tx.hash] = storedTx;

          // Store processed Tx
          storedTxs[this.props.account][tokenKey][txKey] = storedTx;

          // Remove from minted Txs
          delete minedTxs[txKey];
        });
      }

      // Process Stored txs
      etherscanTxs = await this.processStoredTxs(etherscanTxs,[selectedToken],this.props.transactions);
    });

    // Update Stored txs
    if (storedTxs){
      this.updateStoredTransactions(storedTxs);
    }

    return etherscanTxs;
  }
  processStoredTxs = async (etherscanTxs,enabledTokens=[],txsToProcess=null) => {

    if (!enabledTokens || !enabledTokens.length){
      enabledTokens = Object.keys(this.props.availableTokens);
    }

    let storedTxs = this.getStoredItem('transactions',true,{})

    // Init storedTxs
    if (!storedTxs[this.props.account]){
      storedTxs[this.props.account] = {};
    }

    // console.log('Processing stored txs',enabledTokens);

    await this.asyncForEach(enabledTokens,async (selectedToken) => {

      const tokenConfig = this.props.availableTokens[selectedToken];
      const tokenKey = tokenConfig.idle.token;

      // Init storedTxs
      if (!storedTxs[this.props.account][tokenKey]){
        storedTxs[this.props.account][tokenKey] = {};
      }

      txsToProcess = txsToProcess && Object.values(txsToProcess).length ? txsToProcess : this.getStoredTransactions(this.props.account,tokenKey,selectedToken);
      
      // console.log('txsToProcess',selectedToken,txsToProcess);

      // if (!Object.values(txsToProcess).length && selectedToken==='DAI' && Object.values(this.props.transactions).length>0){
      //   debugger;
      // }

      // Debug transactions
      /*
      txsToProcess['xxxxx'] = {
        status:'success',
        created:new Date().getTime(),
        method:'executeMetaTransaction',
        token:selectedToken.toUpperCase(),
        transactionHash:'0x000000000000000000000000000'
      };
      */

      await this.asyncForEach(Object.keys(txsToProcess),async (txKey,i) => {
        const tx = txsToProcess[txKey];

        // Skip wrong token
        if (!tx || !tx.token || tx.token.toUpperCase() !== selectedToken.toUpperCase()){
          return false;
        }

        const isStoredTx = storedTxs && storedTxs[this.props.account] && storedTxs[this.props.account][tokenKey] && storedTxs[this.props.account][tokenKey][txKey];

        const allowedMethods = {
          mintIdleToken:'Deposit',
          redeemIdleToken:'Redeem',
          migrateFromToIdle:'Migrate',
          mintIdleTokensProxy:'Deposit',
          migrateFromAaveToIdle:'Migrate',
          migrateFromIearnToIdle:'Migrate',
          executeMetaTransaction:'Migrate',
          migrateFromFulcrumToIdle:'Migrate',
          migrateFromCompoundToIdle:'Migrate',
        };
        const pendingStatus = ['pending','started'];

        const txSucceeded = tx.status === 'success';
        const txPending = pendingStatus.includes(tx.status);
        const isMetaTx = tx.method === 'executeMetaTransaction';
        const txHash = tx.transactionHash ? tx.transactionHash : null;
        const methodIsAllowed = Object.keys(allowedMethods).includes(tx.method);

        // Skip transaction if already present in etherscanTxs with same status
        if (txHash && etherscanTxs[txHash] && etherscanTxs[txHash].tokenPrice/* && txHash.toLowerCase() !== '0x000000000000000000000000000'.toLowerCase()*/){
          return false;
        }
        // const txFound = etherscanTxs.find(etherscanTx => (etherscanTx.hash === tx.transactionHash && etherscanTx.status === tx.status) );
        // if (txFound){
        //   return false;
        // }

        if (txPending && methodIsAllowed && tx.params.length){
          // console.log('processStoredTxs',tx.method,tx.status,tx.params);
          etherscanTxs[`t${tx.created}`] = {
            status:'Pending',
            token:selectedToken,
            tokenSymbol:selectedToken,
            action:allowedMethods[tx.method],
            timeStamp:parseInt(tx.created/1000),
            hash:txHash ? tx.transactionHash : null,
            value: this.fixTokenDecimals(tx.params[0],tokenConfig.decimals).toString()
          };
          return false;
        }

        // Skip invalid txs
        if (!txSucceeded || !txHash || !methodIsAllowed){
          return false;
        }

        let realTx = tx.realTx ? tx.realTx : null;

        if (!realTx){
          // console.log('loadTxs - getTransaction',tx.transactionHash);
          realTx = await (new Promise( async (resolve, reject) => {
            this.props.web3.eth.getTransaction(tx.transactionHash,(err,txReceipt)=>{
              if (err){
                reject(err);
              }
              resolve(txReceipt);
            });
          }));
        }

        // this.customLog('realTx (localStorage)',realTx);

        // Skip txs from other wallets if not meta-txs
        if (!realTx || (!isMetaTx && realTx.from.toLowerCase() !== this.props.account.toLowerCase())){
          return false;
        }

        const tokenPrice = await this.getIdleTokenPrice(tokenConfig,realTx.blockNumber,realTx.timeStamp);

        realTx.status = 'Completed';
        realTx.action = allowedMethods[tx.method];
        realTx.contractAddress = tokenConfig.address;
        realTx.timeStamp = parseInt(tx.created/1000);

        let txValue = null;
        switch (tx.method){
          case 'mintIdleToken':
          case 'mintIdleTokensProxy':
            if (!tx.params){
              if (isStoredTx){
                storedTxs[this.props.account][tokenKey][txKey] = tx;
              }
              return false;
            }

            if (realTx.to.toLowerCase() !== tokenConfig.idle.address.toLowerCase()){
              // Remove wrong contract tx
              if (isStoredTx){
                delete storedTxs[this.props.account][tokenKey][txKey];
              }
              // this.customLog('Skipped deposit tx '+tx.transactionHash+' - wrong contract');
              return false;
            }

            txValue = tx.params ? this.fixTokenDecimals(tx.params[0],tokenConfig.decimals).toString() : 0;
            if (!txValue){
              // this.customLog('Skipped deposit tx '+tx.transactionHash+' - value is zero ('+txValue+')');
              return false;
            }

            realTx.value = txValue;
            realTx.tokenAmount = txValue;
          break;
          case 'redeemIdleToken':
            if (!tx.params){
              if (isStoredTx){
                storedTxs[this.props.account][tokenKey][txKey] = tx;
              }
              return false;
            }

            if (!realTx.tokenPrice){
              const redeemedValue = this.BNify(tx.params[0]).times(tokenPrice);
              const redeemTokenDecimals = await this.getTokenDecimals(selectedToken);
              const redeemedValueFixed = this.fixTokenDecimals(redeemedValue,redeemTokenDecimals);
              realTx.tokenPrice = tokenPrice;
              realTx.value = redeemedValueFixed;
              realTx.tokenAmount = redeemedValueFixed;
            }
          break;
          case 'executeMetaTransaction':
            let executeMetaTransactionReceipt = tx.txReceipt ? tx.txReceipt : null;

            if (!executeMetaTransactionReceipt){
              executeMetaTransactionReceipt = await (new Promise( async (resolve, reject) => {
                this.props.web3.eth.getTransactionReceipt(tx.transactionHash,(err,tx)=>{
                  if (err){
                    reject(err);
                  }
                  resolve(tx);
                });
              }));
            }

            if (!executeMetaTransactionReceipt){
              return false;
            }

            // Save txReceipt into the tx
            if (!tx.txReceipt){
              tx.txReceipt = executeMetaTransactionReceipt;
              if (isStoredTx){
                storedTxs[this.props.account][tokenKey][txKey] = tx;
              }
            }

            let action = null;
            let executeMetaTransactionContractAddr = null;
            let executeMetaTransactionInternalTransfers = [];
            const IdleProxyMinterInfo = this.getGlobalConfig(['contract','deposit','proxyContract']);

            // Handle migration tx
            if (tokenConfig.migration && tokenConfig.migration.oldContract){
              if (executeMetaTransactionReceipt.logs){
                executeMetaTransactionContractAddr = tokenConfig.migration.oldContract.address.replace('x','').toLowerCase();
                executeMetaTransactionInternalTransfers = executeMetaTransactionReceipt.logs.filter((tx) => { return tx.address.toLowerCase()===tokenConfig.address.toLowerCase() && tx.topics[tx.topics.length-1].toLowerCase() === `0x00000000000000000000000${executeMetaTransactionContractAddr}`; });
              } else if (executeMetaTransactionReceipt.events){
                executeMetaTransactionInternalTransfers = Object.values(executeMetaTransactionReceipt.events).filter((tx) => { return tx.address.toLowerCase()===tokenConfig.address.toLowerCase(); });
              }

              if (executeMetaTransactionInternalTransfers.length){
                action = 'Migrate';
              }
            }

            // Handle deposit tx
            if (!executeMetaTransactionInternalTransfers.length){
              if (executeMetaTransactionReceipt.logs){
                executeMetaTransactionContractAddr = tokenConfig.idle.address.replace('x','').toLowerCase();
                executeMetaTransactionInternalTransfers = executeMetaTransactionReceipt.logs.filter((tx) => { return tx.address.toLowerCase()===tokenConfig.address.toLowerCase() && tx.topics[tx.topics.length-1].toLowerCase() === `0x00000000000000000000000${executeMetaTransactionContractAddr}`; });

                // Handle deposit made with proxy contract
                if (!executeMetaTransactionInternalTransfers.length && IdleProxyMinterInfo){
                  executeMetaTransactionContractAddr = IdleProxyMinterInfo.address.replace('x','').toLowerCase();
                  executeMetaTransactionInternalTransfers = executeMetaTransactionReceipt.logs.filter((tx) => { return tx.address.toLowerCase()===tokenConfig.address.toLowerCase() && tx.topics[tx.topics.length-1].toLowerCase() === `0x00000000000000000000000${executeMetaTransactionContractAddr}`; });
                }
              } else if (executeMetaTransactionReceipt.events){
                executeMetaTransactionInternalTransfers = Object.values(executeMetaTransactionReceipt.events).filter((tx) => { return tx.address.toLowerCase()===tokenConfig.address.toLowerCase(); });
              }

              if (executeMetaTransactionInternalTransfers.length){
                action = 'Deposit';
              }
            }

            if (!executeMetaTransactionInternalTransfers.length){
              return false;
            }

            const internalTransfer = executeMetaTransactionInternalTransfers[0];

            const metaTxValue = internalTransfer.data ? parseInt(internalTransfer.data,16) : (internalTransfer.raw && internalTransfer.raw.data) ? parseInt(internalTransfer.raw.data,16) : null;

            if (!metaTxValue){
              return false;
            }

            const metaTxValueFixed = this.fixTokenDecimals(metaTxValue,tokenConfig.decimals);
            realTx.action = action;
            realTx.value = metaTxValueFixed;
            realTx.tokenAmount = metaTxValueFixed;
            // console.log(metaTxValueFixed.toString());
          break;
          case 'migrateFromCompoundToIdle':
          case 'migrateFromFulcrumToIdle':
          case 'migrateFromAaveToIdle':
          case 'migrateFromIearnToIdle':
          case 'migrateFromToIdle':
            if (!tokenConfig.migration || !tokenConfig.migration.oldContract){
              return false;
            }

            let migrationTxReceipt = tx.txReceipt ? tx.txReceipt : null;

            if (!migrationTxReceipt){
              migrationTxReceipt = await (new Promise( async (resolve, reject) => {
                this.props.web3.eth.getTransactionReceipt(tx.transactionHash,(err,tx)=>{
                  if (err){
                    reject(err);
                  }
                  resolve(tx);
                });
              }));
            }

            if (!migrationTxReceipt){
              return false;
            }

            // Save txReceipt into the tx
            if (!tx.txReceipt){
              tx.txReceipt = migrationTxReceipt;
              if (isStoredTx){
                storedTxs[this.props.account][tokenKey][txKey] = tx;
              }
            }

            const migrationContractAddr = tokenConfig.migration.migrationContract.address.toLowerCase().replace('x','');
            const contractAddress = tokenConfig.idle.address.toLowerCase().replace('x','');
            const migrationTxInternalTransfers = migrationTxReceipt.logs.filter((tx) => { return tx.topics.length>=3 && tx.topics[tx.topics.length-2].toLowerCase() === `0x00000000000000000000000${migrationContractAddr}` && tx.topics[tx.topics.length-1].toLowerCase() === `0x00000000000000000000000${contractAddress}`; });

            if (!migrationTxInternalTransfers.length){
              return false;
            }

            const migrationInternalTransfer = migrationTxInternalTransfers.pop();

            const decodedLogs = this.props.web3.eth.abi.decodeLog([
              {
                internalType: "uint256",
                name: "_token",
                type: "uint256"
              },
            ],migrationInternalTransfer.data,migrationInternalTransfer.topics);

            if (!decodedLogs || !decodedLogs._token){
              return false;
            }

            const migrationValue = decodedLogs._token;
            const migrationValueFixed = this.fixTokenDecimals(migrationValue,tokenConfig.decimals);
            realTx.value = migrationValueFixed.toString();
          break;
          default:
          break;
        }

        realTx.tokenPrice = tokenPrice;
        realTx.token = selectedToken;
        realTx.tokenSymbol = selectedToken;
        realTx.idleTokens = tokenPrice.times(this.BNify(realTx.value));

        // Save processed tx
        etherscanTxs[txHash] = realTx;
        // etherscanTxs.push(realTx);

        // Store processed Tx
        if (!tx.realTx){
          tx.realTx = realTx;
          storedTxs[this.props.account][tokenKey][txKey] = tx;
        }
      });
    });

    // Update Stored Txs
    if (storedTxs){
      this.updateStoredTransactions(storedTxs);
    }

    return etherscanTxs;
  }
  saveCachedRequest = (endpoint,alias=false,data) => {
    const key = alias ? alias : endpoint;
    let cachedRequests = {};
    // Check if already exists
    if (localStorage && localStorage.getItem('cachedRequests')){
      cachedRequests = JSON.parse(localStorage.getItem('cachedRequests'));
    }

    if (localStorage) {
      const timestamp = parseInt(new Date().getTime()/1000);
      cachedRequests[key] = {
        data,
        timestamp
      };
      return this.setLocalStorage('cachedRequests',JSON.stringify(cachedRequests));
    }
    return false;
  }
  getCachedRequest = (endpoint,alias=false) => {
    const key = alias ? alias : endpoint;
    let cachedRequests = {};
    // Check if already exists
    if (localStorage && localStorage.getItem('cachedRequests')){
      cachedRequests = JSON.parse(localStorage.getItem('cachedRequests'));
      // Check if it's not expired
      if (cachedRequests && cachedRequests[key]){
        return cachedRequests[key].data;
      }
    }
    return null;
  }
  makeRequest = async(endpoint,error_callback=false) => {
    const data = await axios
                  .get(endpoint)
                  .catch(err => {
                    if (typeof error_callback === 'function'){
                      error_callback(err);
                    }
                  });
    return data;
  }
  makeCachedRequest = async (endpoint,TTL=0,return_data=false,alias=false) => {
    const key = alias ? alias : endpoint;
    const timestamp = parseInt(new Date().getTime()/1000);
    let cachedRequests = {};
    // Check if already exists
    if (localStorage && localStorage.getItem('cachedRequests')){
      cachedRequests = JSON.parse(localStorage.getItem('cachedRequests'));
      // Check if it's not expired
      if (cachedRequests && cachedRequests[key] && cachedRequests[key].timestamp && timestamp-cachedRequests[key].timestamp<TTL){
        return (cachedRequests[key].data && return_data ? cachedRequests[key].data.data : cachedRequests[key].data);
      }
    }

    const data = await axios
                        .get(endpoint)
                        .catch(err => {
                          console.error('Error getting request');
                        });
    if (localStorage) {
      cachedRequests[key] = {
        data,
        timestamp
      };
      this.setLocalStorage('cachedRequests',JSON.stringify(cachedRequests));
    }
    return (data && return_data ? data.data : data);
  }
  getTransactionError = error => {
    let output = 'error';
    if (parseInt(error.code)){
      const errorCode = parseInt(error.code);
      switch (errorCode){
        case 4001:
          output = 'denied';
        break;
        default:
          output = `error_${errorCode}`;
        break;
      }
    } else if (error.message){
      output = error.message.split("\n")[0]; // Take just the first line of the error
    }

    return output;
  }
  getGlobalConfigs = () => {
    return globalConfigs;
  }
  getGlobalConfig = (path,configs=false) => {
    configs = configs ? configs : globalConfigs;
    if (path.length>0){
      const prop = path.shift();
      if (!path.length){
        return configs[prop] ? configs[prop] : null;
      } else if (configs[prop]) {
        return this.getGlobalConfig(path,configs[prop]);
      }
    }
    return null;
  }
  checkUrlOrigin = () => {
    return window.location.origin.toLowerCase().includes(globalConfigs.baseURL.toLowerCase());
  }
  sendGoogleAnalyticsEvent = async (eventData) => {

    const googleEventsInfo = globalConfigs.analytics.google.events;
    const debugEnabled = googleEventsInfo.debugEnabled;
    const originOk = window.location.origin.toLowerCase().includes(globalConfigs.baseURL.toLowerCase());
    if (googleEventsInfo.enabled && window.ga && ( debugEnabled || originOk)){

      // Check if testnet postfix required
      if (googleEventsInfo.addPostfixForTestnet){
        // Postfix network name if not mainnet
        if (globalConfigs.network.requiredNetwork !== 1){
          const currentNetwork = globalConfigs.network.availableNetworks[globalConfigs.network.requiredNetwork];
          eventData.eventCategory += `_${currentNetwork}`;
        // Postfix test for debug
        } else if (debugEnabled && !originOk) {
          eventData.eventCategory += '_test';
        }
      }

      await (new Promise( async (resolve, reject) => {
        eventData.hitCallback = () => {
          resolve(true);
        };
        eventData.hitCallbackFail = () => {
          reject();
        };

        window.ga('send', 'event', eventData);
      }));
    }
    return false;
  }
  createContract = async (name, address, abi) => {
    try {
      const contract = new this.props.web3.eth.Contract(abi, address);
      return {name, contract};
    } catch (error) {
      this.customLogError("Could not create contract.",name,address,error);
    }
    return null;
  }
  getWalletProvider = () => {
    return this.getStoredItem('walletProvider',false,null);
  }
  simpleIDPassUserInfo = (userInfo,simpleID) => {
    if (!userInfo.address && this.props.account){
      userInfo.address = this.props.account;
    }
    if (!userInfo.provider){
      userInfo.provider = this.getWalletProvider();
    }
    if (typeof userInfo.email !== 'undefined' && !userInfo.email){
      delete userInfo.email;
    }
    if (!userInfo.address){
      return false;
    }
    simpleID = simpleID ? simpleID : (this.props.simpleID ? this.props.simpleID : (typeof this.props.initSimpleID === 'function' ? this.props.initSimpleID() : null));
    if (simpleID){
      return simpleID.passUserInfo(userInfo);
    }
    return false;
  }
  formatMoney = (amount, decimalCount = 2, decimal = ".", thousands = ",") => {
    try {
      decimalCount = Math.abs(decimalCount);
      decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

      const negativeSign = amount < 0 ? "-" : "";

      let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
      let j = (i.length > 3) ? i.length % 3 : 0;

      return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
    } catch (e) {
      return null;
    }
  }

  getTokenApiData = async (address,isRisk=null,startTimestamp=null,endTimestamp=null,forceStartTimestamp=false,frequency=null,order=null,limit=null) => {
    if (globalConfigs.network.requiredNetwork!==1 || !globalConfigs.stats.enabled){
      return [];
    }

    // Check for cached data
    const cachedDataKey = `tokenApiData_${address}_${isRisk}_${frequency}_${order}_${limit}`;
    let cachedData = this.getCachedData(cachedDataKey);

    if (cachedData !== null){
      // Check for fittable start and end time
      const filteredCachedData = cachedData.filter( c => ( (c.startTimestamp===null || (startTimestamp && c.startTimestamp<=startTimestamp)) && (c.endTimestamp===null || (endTimestamp && c.endTimestamp>=endTimestamp)) ) )

      if (filteredCachedData && filteredCachedData.length>0){
        const filteredData = filteredCachedData.pop().data;
        if (filteredData){
          return filteredData.filter( d => ((!startTimestamp || d.timestamp>=startTimestamp) && (!endTimestamp || d.timestamp<=endTimestamp)) );
        }
        return null;
      }
    // Initialize cachedData
    } else {
      cachedData = [];
    }

    const apiInfo = globalConfigs.stats.rates;
    let endpoint = `${apiInfo.endpoint}${address}`;

    if (startTimestamp || endTimestamp || isRisk !== null || frequency !== null){
      const params = [];

      if (startTimestamp && parseInt(startTimestamp)){
        if (forceStartTimestamp){
          params.push(`start=${startTimestamp}`);
        } else {
          const start = startTimestamp-(60*60*24*2); // Minus 1 day for Volume graph
          params.push(`start=${start}`);
        }
      }

      if (endTimestamp && parseInt(endTimestamp)){
        params.push(`end=${endTimestamp}`);
      }

      if (isRisk !== null){
        params.push(`isRisk=${isRisk}`);
      }

      if (frequency !== null && parseInt(frequency)){
        params.push(`frequency=${frequency}`);
      }

      if (order !== null){
        params.push(`order=${order}`);
      }

      if (limit !== null && parseInt(limit)){
        params.push(`limit=${limit}`);
      }

      if (params.length){
        endpoint += '?'+params.join('&');
      }
    }

    let output = await this.makeRequest(endpoint);
    if (!output){
      return [];
    }

    let data = output.data;
    if (isRisk !== null){
      data = data.filter( d => ( d.isRisk === isRisk ) );
    }

    cachedData.push({
      data,
      isRisk,
      endTimestamp,
      startTimestamp,
    });

    this.setCachedData(cachedDataKey,cachedData);

    return data;
  }
  getTokenDecimals = async (contractName) => {
    contractName = contractName ? contractName : this.props.selectedToken;
    return await this.genericContractCall(contractName,'decimals');
  }
  getAvgApr = (aprs,allocations,totalAllocation) => {
    if (aprs && allocations && totalAllocation){
      let avgApr = Object.keys(aprs).reduce((aprWeighted,protocolAddr) => {
        const allocation = this.BNify(allocations[protocolAddr]);
        const apr = this.BNify(aprs[protocolAddr]);
        return this.BNify(aprWeighted).plus(allocation.times(apr));
      },0);

      if (avgApr){
        return this.BNify(avgApr).div(totalAllocation);
      }
    }
    return null;
  }
  getFrequencySeconds = (frequency,quantity=1) => {
    const frequency_seconds = {
      hour:3600,
      day:86400,
      week:604800
    };
    return frequency_seconds[frequency]*quantity;
  }
  getProtocolInfoByAddress = (addr) => {
    return this.props.tokenConfig.protocols.find(c => c.address.toLowerCase() === addr.toLowerCase());
  }
  integerValue = value => {
    return this.BNify(value).integerValue(BigNumber.ROUND_FLOOR).toFixed();
  }
  normalizeTokenDecimals = tokenDecimals => {
    return this.BNify(`1e${tokenDecimals}`);
  }
  normalizeTokenAmount = (tokenBalance,tokenDecimals,round=true) => {
    const normalizedTokenDecimals = this.normalizeTokenDecimals(tokenDecimals);
    return this.BNify(tokenBalance).times(normalizedTokenDecimals).integerValue(BigNumber.ROUND_FLOOR).toFixed();
  }
  fixTokenDecimals = (tokenBalance,tokenDecimals,exchangeRate) => {
    const normalizedTokenDecimals = this.normalizeTokenDecimals(tokenDecimals);
    let balance = this.BNify(tokenBalance).div(normalizedTokenDecimals);
    if (exchangeRate && !exchangeRate.isNaN()){
      balance = balance.times(exchangeRate);
    }
    return balance;
  }
  checkContractPaused = async (contractName=null) => {
    contractName = contractName ? contractName : this.props.tokenConfig.idle.token;
    const contractPaused = await this.genericContractCall(contractName, 'paused', [], {}).catch(err => {
      this.customLogError('Generic Idle call err:', err);
    });
    // console.log('checkContractPaused',this.props.tokenConfig.idle.token,contractPaused);
    return contractPaused;
  }
  getStoredItem = (key,parse_json=true,return_default=null) => {
    let output = return_default;
    if (window.localStorage){
      const item = localStorage.getItem(key);
      if (item){
        output = item;
        if (parse_json){
          output = JSON.parse(item);
        }
      }
    }
    if (!output){
      return return_default;
    }
    return output;
  }
  clearStoredData = (excludeKeys=[]) => {
    if (window.localStorage){

      if (!excludeKeys || !excludeKeys.length){
        return window.localStorage.clear();
      }

      const storedKeysToRemove = [];
      for (let i=0;i<window.localStorage.length;i++){
        const storedKey = window.localStorage.key(i);
        if (!excludeKeys.includes(storedKey)){
          storedKeysToRemove.push(storedKey);
        }
      }
      storedKeysToRemove.forEach((storedKey) => {
        this.removeStoredItem(storedKey)
      });
    }
  }
  removeStoredItem = (key) => {
    if (window.localStorage){
      window.localStorage.removeItem(key);
      return true;
    }
    return false;
  }
  setLocalStorage = (key,value,stringify=false) => {
    if (window.localStorage){
      try {
        value = stringify ? JSON.stringify(value) : value;
        window.localStorage.setItem(key,value);
        return true;
      } catch (error) {
        // console.log('setLocalStorage',error);
        window.localStorage.removeItem(key);
      }
    }
    return false;
  }
  checkRebalance = async (tokenConfig) => {

    if (!tokenConfig && this.props.tokenConfig){
      tokenConfig = this.props.tokenConfig;
    }

    if (!globalConfigs.contract.methods.rebalance.enabled || !tokenConfig){
      return false;
    }

    const rebalancer = await this.genericContractCall(tokenConfig.idle.token, 'rebalancer');

    if (!rebalancer){
      return false;
    }

    const idleRebalancerInstance = await this.createContract('idleRebalancerInstance',rebalancer,globalConfigs.contract.methods.rebalance.abi);


    if (!idleRebalancerInstance || !idleRebalancerInstance.contract){
      return false;
    }

    // Take next protocols allocations
    const allocationsPromises = [];
    const availableTokensPromises = [];

    for (let protocolIndex=0;protocolIndex<tokenConfig.protocols.length;protocolIndex++){
      const allocationPromise = new Promise( async (resolve, reject) => {
        try{
          const allocation = await idleRebalancerInstance.contract.methods.lastAmounts(protocolIndex).call();
          resolve({
            allocation,
            protocolIndex
          });
        } catch (error){
          resolve(null);
        }
      });
      allocationsPromises.push(allocationPromise);

      const availableTokenPromise = new Promise( async (resolve, reject) => {
        try {
          const protocolAddr = await this.genericContractCall(tokenConfig.idle.token, 'allAvailableTokens', [protocolIndex]);
          resolve({
            protocolAddr,
            protocolIndex
          });
        } catch (error){
          resolve(null);
        }
      });
      availableTokensPromises.push(availableTokenPromise);
    }

    let nextAllocations = null;
    let allAvailableTokens = null;

    try{
      nextAllocations = await Promise.all(allocationsPromises);
      allAvailableTokens = await Promise.all(availableTokensPromises);
    } catch (error){
      
    }

    nextAllocations = nextAllocations && nextAllocations.length ? nextAllocations.filter(v => (v !== null)) : null;
    allAvailableTokens = allAvailableTokens && allAvailableTokens.length ? allAvailableTokens.filter(v => (v !== null)) : null;

    if ((!allAvailableTokens || !allAvailableTokens.length) || (!nextAllocations || !nextAllocations.length)){
      return false;
    }

    // Merge nextAllocations and allAvailableTokens
    let newTotalAllocation = this.BNify(0);
    const newProtocolsAllocations = allAvailableTokens.reduce((accumulator,availableTokenInfo) => {
      if (availableTokenInfo.protocolAddr){
        const nextAllocation = nextAllocations.find(v => { return v.protocolIndex === availableTokenInfo.protocolIndex; });
        if (nextAllocation){
          const allocation = this.BNify(nextAllocation.allocation);
          accumulator[availableTokenInfo.protocolAddr.toLowerCase()] = allocation;
          newTotalAllocation = newTotalAllocation.plus(allocation);
        }
      }
      return accumulator;
    },{});

    // Check if newAllocations differs from currentAllocations
    let shouldRebalance = false;

    const tokenAllocation = await this.getTokenAllocation(tokenConfig);
    const protocolsAllocationsPerc = tokenAllocation ? tokenAllocation.protocolsAllocationsPerc : null;

    if (typeof protocolsAllocationsPerc === 'object'){
      Object.keys(protocolsAllocationsPerc).forEach((protocolAddr) => {

        // Get current protocol allocation percentage
        const protocolAllocation = protocolsAllocationsPerc[protocolAddr];
        const protocolAllocationPerc = parseFloat(protocolAllocation).toFixed(3);
        
        // Calculate new protocol allocation percentage
        const newProtocolAllocation = newProtocolsAllocations[protocolAddr.toLowerCase()] ? newProtocolsAllocations[protocolAddr.toLowerCase()] : this.BNify(0);
        const newProtocolAllocationPerc = newProtocolAllocation ? parseFloat(newProtocolAllocation.div(newTotalAllocation)).toFixed(3) : this.BNify(0);

        // console.log(protocolAddr,protocolAllocation.toString(),newProtocolAllocation.toString(),newTotalAllocation.toString(),protocolAllocationPerc,newProtocolAllocationPerc);

        if (protocolAllocationPerc !== newProtocolAllocationPerc){
          shouldRebalance = true;
        }
      });
    }

    return shouldRebalance;
  }
  checkMigration = async (tokenConfig,account) => {

    if (!tokenConfig || !account){
      return false;
    }

    let migrationEnabled = false;
    let oldContractBalance = null;
    let oldContractTokenDecimals = null;
    // let migrationContractApproved = false;
    let oldContractBalanceFormatted = null;

    // Check migration contract enabled and balance
    if (tokenConfig.migration && tokenConfig.migration.enabled){
      const oldContractName = tokenConfig.migration.oldContract.name;
      const oldContract = this.getContractByName(oldContractName);
      const migrationContract = this.getContractByName(tokenConfig.migration.migrationContract.name);

      // console.log(oldContractName,tokenConfig.migration.migrationContract.name);

      if (oldContract && migrationContract){
        // Get old contract token decimals
        oldContractTokenDecimals = await this.getTokenDecimals(oldContractName);

        // console.log('Migration - token decimals',oldContractTokenDecimals ? oldContractTokenDecimals.toString() : null);

        // Check migration contract approval
        // migrationContractApproved = await this.checkMigrationContractApproved();

        // console.log('Migration - approved',migrationContractApproved ? migrationContractApproved.toString() : null);

        // Check old contractBalance
        oldContractBalance = await this.getContractBalance(oldContractName,account);

        if (oldContractBalance){
          oldContractBalanceFormatted = this.fixTokenDecimals(oldContractBalance,oldContractTokenDecimals);
          // Enable migration if old contract balance if greater than 0
          migrationEnabled = this.BNify(oldContractBalance).gt(0);
        }

        // console.log('Migration - oldContractBalance',oldContractName,account,oldContractBalance,oldContractBalanceFormatted);
      }
    }

    // Set migration contract balance
    return {
      migrationEnabled,
      oldContractBalance,
      oldContractTokenDecimals,
      oldContractBalanceFormatted,
    };
  }

  executeMetaTransaction = async (contract, userAddress, signedParameters, callback, callback_receipt) => {
    try {

      // const gasLimit = await contract.methods
      //   .executeMetaTransaction(userAddress, ...signedParameters)
      //   .estimateGas({ from: userAddress });

      // console.log(gasLimit);

      const gasPrice = await this.props.web3.eth.getGasPrice();

      const tx = contract.methods
        .executeMetaTransaction(userAddress, ...signedParameters)
        .send({
          from: userAddress,
          gasPrice
          // gasLimit
        });

      tx.on("transactionHash", function(hash) {
        console.log(`Transaction sent by relayer with hash ${hash}`);
        callback_receipt()
      }).once("confirmation", function(confirmationNumber, receipt) {
        console.log("Transaction confirmed on chain",receipt);
        callback_receipt(receipt);
      });
    } catch (error) {
      console.log(error);
      callback(null,error);
    }
  }

  getSignatureParameters_v4 = signature => {
    if (!this.props.web3.utils.isHexStrict(signature)) {
      throw new Error(
        'Given value "'.concat(signature, '" is not a valid hex string.')
      );
    }
    var r = signature.slice(0, 66);
    var s = "0x".concat(signature.slice(66, 130));
    var v = "0x".concat(signature.slice(130, 132));
    v = this.props.web3.utils.hexToNumber(v);
    if (![27, 28].includes(v)) v += 27;
    return {
      r: r,
      s: s,
      v: v
    };
  };

  sendBiconomyTxWithPersonalSign = async (contractName,functionSignature,callback,callback_receipt) => {
    const contract = this.getContractByName(contractName);

    if (!contract){
      callback(null,'Contract not found');
      return false;
    }

    try{
      let userAddress = this.props.account;
      let nonce = await contract.methods.getNonce(userAddress).call();
      let message = "Please provide your signature to send the transaction without paying gas. Tracking Id: ";
      let messageToSign = `${message}${nonce}`;

      const signature = await this.props.web3.eth.personal.sign(
        messageToSign,
        userAddress
      );

      const { r, s, v } = this.getSignatureParameters_v4(signature);

      // console.log('executeMetaTransaction', [userAddress, functionSignature, messageToSign, `${messageToSign.length}`, r, s, v]);

      this.contractMethodSendWrapper(contractName, 'executeMetaTransaction', [userAddress, functionSignature, message, `${messageToSign.length}`, r, s, v], callback, callback_receipt);

      return true;
    } catch (error) {
      callback(null,error);
      return false;
    }
  }

  sendBiconomyTx = async (contractName,contractAddress,functionSignature,callback,callback_receipt) => {

    const EIP712Domain = [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" }
    ];

    const MetaTransaction = [
      { name: "nonce", type: "uint256" },
      { name: "from", type: "address" },
      { name: "functionSignature", type: "bytes" }
    ];

    const chainId = await this.props.web3.eth.getChainId();

    const domainData = {
      chainId,
      version: '1',
      name: contractName,
      verifyingContract: contractAddress
    };

    const contract = this.getContractByName(contractName);

    if (!contract){
      callback(null,'Contract not found');
      return false
    }

    let userAddress = this.props.account;
    let nonce = await contract.methods.getNonce(userAddress).call();
    let message = {};
    message.nonce = nonce;
    message.from = userAddress;
    message.functionSignature = functionSignature;

    const dataToSign = JSON.stringify({
      types: {
        EIP712Domain,
        MetaTransaction
      },
      domain: domainData,
      primaryType: "MetaTransaction",
      message
    });

    // console.log('dataToSign',dataToSign);

    this.props.web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        id: 999999999999,
        from: userAddress,
        method: "eth_signTypedData_v4",
        params: [userAddress, dataToSign]
      },
      (error, response) => {
        if (error || (response && response.error)) {
          return callback(null,error);
        } else if (response && response.result) {
          const signedParameters = this.getSignatureParameters_v4(response.result);
          const { r, s, v } = signedParameters;
            
          this.contractMethodSendWrapper(contractName, 'executeMetaTransaction', [userAddress, functionSignature, r, s, v], callback, callback_receipt);
        }
      }
    );
  }

  checkTokenApproved = async (contractName,contractAddr,walletAddr) => {
    const value = this.props.web3.utils.toWei('0','ether');
    const allowance = await this.getAllowance(contractName,contractAddr,walletAddr);
    return allowance && this.BNify(allowance).gt(this.BNify(value.toString()));
  }
  getAllowance = async (contractName,contractAddr,walletAddr) => {
    if (!contractName || !contractAddr || !walletAddr){
      return false;
    }
    this.customLog('getAllowance',contractName,contractAddr,walletAddr);
    return await this.genericContractCall(
      contractName, 'allowance', [walletAddr, contractAddr]
    );
  }
  contractMethodSendWrapper = (contractName,methodName,params,callback,callback_receipt) => {
    this.props.contractMethodSendWrapper(contractName, methodName, params, null, (tx)=>{
      if (typeof callback === 'function'){
        callback(tx);
      }
    }, (tx) => {
      if (typeof callback_receipt === 'function'){
        callback_receipt(tx);
      }
    });
  }
  enableERC20 = (contractName,address,callback,callback_receipt) => {
    // const contract = this.getContractByName(contractName);
    // this.customLog('enableERC20',contractName,contract,address);
    this.props.contractMethodSendWrapper(contractName, 'approve', [
      address,
      this.props.web3.utils.toTwosComplement('-1') // max uint solidity
    ],null,(tx)=>{
      if (typeof callback === 'function'){
        callback(tx);
      }
    }, (tx) => {
      if (typeof callback_receipt === 'function'){
        callback_receipt(tx);
      }
    });
  }
  loadAssetField = async (field,token,tokenConfig,account,addGovTokens=true) => {

    let output = null;
    const govTokens = this.getGlobalConfig(['govTokens']);

    // Take available tokens for gov tokens fields
    let govTokenAvailableTokens = null;
    if (this.props.selectedStrategy && this.props.selectedToken){
      const newTokenConfig = this.props.availableStrategies[this.props.selectedStrategy][this.props.selectedToken];
      govTokenAvailableTokens = {};
      govTokenAvailableTokens[newTokenConfig.token] = newTokenConfig;
    } else if (!Object.keys(govTokens).includes(token)){
      govTokenAvailableTokens = {};
      govTokenAvailableTokens[token] = tokenConfig;
    }

    switch (field){
      case 'earningsPerc':
        let [amountLent1,redeemableBalance1] = await Promise.all([
          this.loadAssetField('amountLent',token,tokenConfig,account),
          this.loadAssetField('redeemableBalance',token,tokenConfig,account)
        ]);

        if (amountLent1 && redeemableBalance1){
          output = redeemableBalance1.div(amountLent1).minus(1).times(100);
        }
      break;
      case 'daysFirstDeposit':
        const depositTimestamp = await this.loadAssetField('depositTimestamp',token,tokenConfig,account);
        if (depositTimestamp){
          const currTimestamp = parseInt(new Date().getTime()/1000);
          output = (currTimestamp-depositTimestamp)/86400;
        }
      break;
      case 'pool':
        if (Object.keys(govTokens).includes(token)){
          output = await this.getGovTokenPool(token, govTokenAvailableTokens);
        } else {
          const tokenAllocation = await this.getTokenAllocation(tokenConfig,false,addGovTokens);
          if (tokenAllocation && tokenAllocation.totalAllocationWithUnlent){
            output = tokenAllocation.totalAllocationWithUnlent;
          }
        }
      break;
      case 'apr':
        switch (token){
          case 'COMP':
            output = await this.getCompAvgApr(govTokenAvailableTokens);
          break;
          default:
            const tokenAprs = await this.getTokenAprs(tokenConfig,false,addGovTokens);
            if (tokenAprs && tokenAprs.avgApr !== null){
              output = tokenAprs.avgApr;
            }
          break;
        }
      break;
      case 'apy':
        const tokenApys = await this.getTokenAprs(tokenConfig,false,addGovTokens);

        // console.log('apr',token,tokenApys.avgApr ? tokenApys.avgApr.toString() : null,tokenApys.avgApy ? tokenApys.avgApy.toString() : null);

        if (tokenApys && tokenApys.avgApy !== null){
          output = tokenApys.avgApy;
        }
      break;
      case 'avgAPY':
        const [daysFirstDeposit,earningsPerc] = await Promise.all([
          this.loadAssetField('daysFirstDeposit',token,tokenConfig,account),
          this.loadAssetField('earningsPerc',token,tokenConfig,account), // Take earnings perc instead of earnings
        ]);

        if (daysFirstDeposit && earningsPerc){
          output = earningsPerc.times(365).div(daysFirstDeposit);
        }
      break;
      case 'depositTimestamp':
        const depositTimestamps = account ? await this.getDepositTimestamp([token],account) : false;
        if (depositTimestamps && depositTimestamps[token]){
          output = depositTimestamps[token];
        }
      break;
      case 'amountLent':
        const amountLents = account ? await this.getAmountLent([token],account) : false;
        if (amountLents && amountLents[token]){
          output = amountLents[token];
        }
      break;
      case 'tokenPrice':
        if (Object.keys(govTokens).includes(token)){
          const govTokenConfig = govTokens[token];
          const DAITokenConfig = this.getGlobalConfig(['stats','tokens','DAI']);
          output = await this.getUniswapConversionRate(DAITokenConfig,govTokenConfig);
        } else {
          output = await this.genericContractCall(tokenConfig.idle.token, 'tokenPrice');
        }
      break;
      case 'fee':
        output = await this.getUserTokenFees(tokenConfig,account);
      break;
      case 'tokenBalance':
        if (Object.keys(govTokens).includes(token)){
          output = await this.getTokenBalance(token,account);
        } else {
          let tokenBalance = account ? await this.getTokenBalance(tokenConfig.token,account) : false;
          if (!tokenBalance || tokenBalance.isNaN()){
            tokenBalance = '-';
          }
          output = tokenBalance;
        }
      break;
      case 'idleTokenBalance':
        const idleTokenBalance = account ? await this.getTokenBalance(tokenConfig.idle.token,account) : false;
        if (idleTokenBalance){
          output = idleTokenBalance;
        }
      break;
      case 'redeemableBalanceCounter':
        let [tokenAPY1,amountLent2,redeemableBalanceStart] = await Promise.all([
          this.loadAssetField('apy',token,tokenConfig,account),
          this.loadAssetField('amountLent',token,tokenConfig,account),
          this.loadAssetField('redeemableBalance',token,tokenConfig,account),
        ]);

        let redeemableBalanceEnd = null;

        if (redeemableBalanceStart && tokenAPY1 && amountLent2){
          const earningPerYear = amountLent2.times(tokenAPY1.div(100));
          redeemableBalanceEnd = redeemableBalanceStart.plus(earningPerYear);
        }

        // console.log('redeemableBalanceCounter',redeemableBalanceStart.toString(),redeemableBalanceEnd.toString());

        output = {
          redeemableBalanceEnd,
          redeemableBalanceStart
        };
      break;
      case 'redeemableBalance':
        if (Object.keys(govTokens).includes(token)){
          const govTokenConfig = govTokens[token];
          output = await this.getGovTokenUserBalance(govTokenConfig,account,govTokenAvailableTokens);
        } else {
          const [idleTokenPrice1,idleTokenBalance2,govTokensBalance] = await Promise.all([
            this.genericContractCall(tokenConfig.idle.token, 'tokenPrice'),
            this.loadAssetField('idleTokenBalance',token,tokenConfig,account),
            this.getGovTokensUserTotalBalance(account,govTokenAvailableTokens,'DAI'),
          ]);

          if (idleTokenBalance2 && idleTokenPrice1){
            const tokenBalance = this.fixTokenDecimals(idleTokenBalance2.times(idleTokenPrice1),tokenConfig.decimals);

            let redeemableBalance = tokenBalance;

            if (govTokensBalance && !this.BNify(govTokensBalance).isNaN()){
              redeemableBalance = redeemableBalance.plus(this.BNify(govTokensBalance));
            }

            output = redeemableBalance;

            // console.log('redeemableBalance',tokenBalance.toString(),govTokensBalance.toString(),output.toString());
          }
        }
      break;
      case 'earnings':
        let [amountLent,redeemableBalance2] = await Promise.all([
          this.loadAssetField('amountLent',token,tokenConfig,account),
          this.loadAssetField('redeemableBalance',token,tokenConfig,account)
        ]);

        if (!amountLent){
          amountLent = this.BNify(0);
        }
        if (!redeemableBalance2){
          redeemableBalance2 = this.BNify(0);
        }

        output = redeemableBalance2.minus(amountLent);

        // if (fee1 && !this.BNify(fee1).isNaN()){
        //   output = output.minus(this.BNify(fee1));
        // }

        // console.log('earnings',amountLent.toString(),redeemableBalance2.toString(),output.toString());
      break;
      default:
      break;
    }

    return output;
  }
  getIdleTokenPrice = async (tokenConfig,blockNumber='latest',timestamp=false) => {

    const cachedDataKey = `idleTokenPrice_${tokenConfig.idle.token}_${blockNumber}`;
    if (blockNumber !== 'latest'){
      const cachedData = this.getCachedData(cachedDataKey);
      if (cachedData !== null && !this.BNify(cachedData).isNaN()){
        return cachedData;
      }
    }

    let decimals = tokenConfig.decimals;

    let tokenPrice = await this.genericContractCall(tokenConfig.idle.token,'tokenPrice',[],{},blockNumber);

    // If price is NaN try to take it from APIs
    if (!tokenPrice && timestamp){
      const isRisk = this.props.selectedStrategy === 'risk';
      const startTimestamp = parseInt(timestamp)-(60*60);
      const endTimestamp = parseInt(timestamp)+(60*60);
      const tokenData = await this.getTokenApiData(tokenConfig.address,isRisk,startTimestamp,endTimestamp,true);

      let beforePrice = {
        data:null,
        timeDiff:null
      };

      let afterPrice = {
        data:null,
        timeDiff:null
      };

      tokenData.forEach( d => {
        const timeDiff = Math.abs(parseInt(d.timestamp)-parseInt(timestamp));
        if (parseInt(d.timestamp)<parseInt(timestamp) && (!beforePrice.timeDiff || timeDiff<beforePrice.timeDiff)){
          beforePrice.timeDiff = timeDiff;
          beforePrice.data = d;
        }

        if (parseInt(d.timestamp)>parseInt(timestamp) && !afterPrice.timeDiff){
          afterPrice.timeDiff = timeDiff;
          afterPrice.data = d;
        }
      });

      // Take before and after and calculate correct tokenPrice based from price acceleration
      if (beforePrice.data && afterPrice.data){
        const tokenPriceBefore = this.BNify(beforePrice.data.idlePrice);
        const tokenPriceAfter = this.BNify(afterPrice.data.idlePrice);
        const timeBefore = this.BNify(beforePrice.data.timestamp);
        const timeAfter = this.BNify(afterPrice.data.timestamp);
        const timeDiff = timeAfter.minus(timeBefore);
        const priceDiff = tokenPriceAfter.minus(tokenPriceBefore);
        const priceAcceleration = priceDiff.div(timeDiff);
        const timeDiffFromBeforePrice = this.BNify(timestamp).minus(timeBefore);
        tokenPrice = tokenPriceBefore.plus(priceAcceleration.times(timeDiffFromBeforePrice));
      }
    }

    // Fix token price decimals
    if (tokenPrice && !this.BNify(tokenPrice).isNaN()){
      tokenPrice = this.fixTokenDecimals(tokenPrice,decimals);
    }

    // If price is NaN then return 1
    if (!tokenPrice || this.BNify(tokenPrice).isNaN() || this.BNify(tokenPrice).lt(1)){
      tokenPrice = this.BNify(1);
    }

    if (blockNumber !== 'latest'){
      this.setCachedData(cachedDataKey,tokenPrice);
    }

    return tokenPrice;
  }
  clearCachedData = () => {
    if (this.props.clearCachedData && typeof this.props.clearCachedData === 'function'){
      // console.log('clearCachedData',this.props.clearCachedData,typeof this.props.clearCachedData === 'function');
      this.props.clearCachedData();
    } else {
      // console.log('clearCachedData - Function not found!');
    }
    return false;
  }
  /*
  Cache data locally for 5 minutes
  */
  setCachedData = (key,data,TTL=120) => {
    if (this.props.setCachedData && typeof this.props.setCachedData === 'function'){
      // console.log('setCachedData',key);
      this.props.setCachedData(key,data,TTL);
    }
    return data;
  }
  getCachedData = (key,defaultValue=null) => {
    if (this.props.cachedData && this.props.cachedData[key.toLowerCase()]){
      const cachedData = this.props.cachedData[key.toLowerCase()];
      if (!cachedData.expirationDate || cachedData.expirationDate>=parseInt(new Date().getTime()/1000)){
        return cachedData.data;
      }
    }
    return defaultValue;
  }
  getTokenBalance = async (contractName,walletAddr) => {
    if (!walletAddr){
      return false;
    }

    // Check for cached data
    const cachedDataKey = `tokenBalance_${contractName}_${walletAddr}`;
    const cachedData = this.getCachedData(cachedDataKey);
    if (cachedData !== null){
      return cachedData;
    }

    let [
      tokenBalance,
      tokenDecimals
    ] = await Promise.all([
      this.getContractBalance(contractName,walletAddr),
      this.getTokenDecimals(contractName)
    ]);

    if (tokenBalance){
      tokenBalance = this.fixTokenDecimals(tokenBalance,tokenDecimals);

      // Set cached data
      return this.setCachedData(cachedDataKey,tokenBalance);
    } else {
      this.customLogError('Error on getting balance for ',contractName);
    }
    return null;
  }
  copyToClipboard = (copyText) => {
    if (typeof copyText.select === 'function'){
      copyText.select();
      copyText.setSelectionRange(0, 99999); // Select
      const res = document.execCommand("copy");
      copyText.setSelectionRange(0, 0); // Deselect
      return res;
    }
    return false;
  }
  loadScript = (url,props,callback) => {
    const script = document.createElement("script");
    script.src = url;

    // Append props
    if (props){
      Object.keys(props).forEach((attr,i) => {
        script[attr] = props[attr];
      });
    }

    if (typeof callback === 'function'){
      if (script.readyState) {  // only required for IE <9
        script.onreadystatechange = function() {
          if ( script.readyState === 'loaded' || script.readyState === 'complete' ) {
            script.onreadystatechange = null;
            callback();
          }
        };
      } else {  //Others
        script.onload = callback;
      }
    }

    if (!script.id || !document.getElementById(script.id)){
      document.body.appendChild(script);
    }
  }
  getContractBalance = async (contractName,address) => {
    return await this.getProtocolBalance(contractName,address);
  }
  getProtocolBalance = async (contractName,address) => {
    address = address ? address : this.props.tokenConfig.idle.address;
    return await this.genericContractCall(contractName, 'balanceOf', [address]);
  }
  getAprs = async (contractName) => {
    contractName = contractName ? contractName : this.props.tokenConfig.idle.token;
    return await this.genericContractCall(contractName, 'getAPRs');
  }
  genericIdleCall = async (methodName, params = [], callParams = {}) => {
    return await this.genericContractCall(this.props.tokenConfig.idle.token, methodName, params, callParams).catch(err => {
      this.customLogError('Generic Idle call err:', err);
    });
  }
  estimateGas = async (contractName, methodName, params = [], callParams = {}) => {
    let contract = this.getContractByName(contractName);

    if (!contract) {
      this.customLogError('Wrong contract name', contractName);
      return null;
    }

    return await contract.methods[methodName](...params).estimateGas(callParams);
  }
  getTxDecodedLogs = async (tx,logAddr,decodeLogs,storedTx) => {

    let txReceipt = storedTx && storedTx.txReceipt ? storedTx.txReceipt : null;

    if (!txReceipt){
      txReceipt = await (new Promise( async (resolve, reject) => {
        this.props.web3.eth.getTransactionReceipt(tx.hash,(err,tx)=>{
          if (err){
            reject(err);
          }
          resolve(tx);
        });
      }));

    }

    if (!txReceipt){
      return null;
    }

    const internalTransfers = txReceipt.logs.filter((tx) => { return tx.topics[tx.topics.length-1].toLowerCase() === `0x00000000000000000000000${logAddr}`; });

    if (!internalTransfers.length){
      return null;
    }

    try {
      return [
        txReceipt,
        this.props.web3.eth.abi.decodeLog(decodeLogs,internalTransfers[0].data,internalTransfers[0].topics)
      ];
    } catch (error) {
      return null;
    }
  }
  genericContractCall = async (contractName, methodName, params = [], callParams = {}, blockNumber = 'latest') => {

    if (!contractName){
      return null;
    }

    const contract = this.getContractByName(contractName);

    if (!contract) {
      this.customLogError('Wrong contract name', contractName);
      return null;
    }

    if (!contract.methods[methodName]) {
      this.customLogError('Wrong method name', methodName);
      return null;
    }

    blockNumber = blockNumber !== 'latest' && blockNumber && !isNaN(blockNumber) ? parseInt(blockNumber) : blockNumber;

    try{
      const value = await contract.methods[methodName](...params).call(callParams,blockNumber).catch(error => {
        this.customLogError(`${contractName} contract method ${methodName} error: `, error);
      });
      return value;
    } catch (error) {
      this.customLogError("genericContractCall error", error);
    }
  }
  asyncForEach = async (array, callback, async=true) => {
    if (async){
      await Promise.all(array.map( (c,index) => {
        return callback(c, index, array);
      }));
    } else {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
      }
    }
  }
  apr2apy = (apr) => {
    return (this.BNify(1).plus(this.BNify(apr).div(12))).pow(12).minus(1);
  }
  /*
  Get idleToken allocation between protocols
  */
  getTokenAllocation = async (tokenConfig,protocolsAprs=false,addGovTokens=true) => {

    if (!tokenConfig.idle){
      return false;
    }

    // Check for cached data
    const cachedDataKey = `tokenAllocation_${tokenConfig.idle.address}`;
    const cachedData = this.getCachedData(cachedDataKey);
    if (cachedData !== null){
      return cachedData;
    }

    let totalAllocation = this.BNify(0);

    const tokenAllocation = {
      avgApr: null,
      totalAllocation:null,
      protocolsAllocations:null,
      protocolsAllocationsPerc:null,
      totalAllocationWithUnlent:null
    };

    const exchangeRates = {};
    const protocolsBalances = {};
    const protocolsAllocations = {};
    const protocolsAllocationsPerc = {};

    await this.asyncForEach(tokenConfig.protocols,async (protocolInfo,i) => {
      const contractName = protocolInfo.token;
      const protocolAddr = protocolInfo.address.toLowerCase();

      let [
        protocolBalance,
        tokenDecimals,
        exchangeRate
      ] = await Promise.all([
        this.getProtocolBalance(contractName,tokenConfig.idle.address),
        this.getTokenDecimals(contractName),
        ( protocolInfo.functions.exchangeRate ? this.genericContractCall(contractName,protocolInfo.functions.exchangeRate.name,protocolInfo.functions.exchangeRate.params) : null )
      ]);

      if (!protocolBalance){
        return;
      }

      if (exchangeRate && protocolInfo.decimals){
        exchangeRates[protocolAddr] = exchangeRate;
        exchangeRate = this.fixTokenDecimals(exchangeRate,protocolInfo.decimals);
      }

      const protocolAllocation = this.fixTokenDecimals(protocolBalance,tokenDecimals,exchangeRate);

      totalAllocation = totalAllocation.plus(protocolAllocation);

      protocolsBalances[protocolAddr] = protocolBalance;
      protocolsAllocations[protocolAddr] = protocolAllocation;

      // console.log('getTokenAllocation',contractName,protocolAddr,protocolAllocation.toString(),exchangeRate ? exchangeRate.toString() : null,totalAllocation.toString());
    });

    tokenAllocation.unlentBalance = this.BNify(0);
    tokenAllocation.totalAllocationWithUnlent = totalAllocation;

    // Add unlent balance to the pool
    let unlentBalance = await this.getProtocolBalance(tokenConfig.token,tokenConfig.idle.address);
    if (unlentBalance){
      unlentBalance = this.fixTokenDecimals(unlentBalance,tokenConfig.decimals);
      tokenAllocation.unlentBalance = unlentBalance;
      tokenAllocation.totalAllocationWithUnlent = tokenAllocation.totalAllocationWithUnlent.plus(unlentBalance);
    }

    Object.keys(protocolsAllocations).forEach((protocolAddr,i) => {
      const protocolAllocation = protocolsAllocations[protocolAddr];
      const protocolAllocationPerc = protocolAllocation.div(totalAllocation);
      protocolsAllocationsPerc[protocolAddr] = protocolAllocationPerc;
    });

    tokenAllocation.totalAllocation = totalAllocation;
    tokenAllocation.protocolsAllocations = protocolsAllocations;
    tokenAllocation.protocolsAllocationsPerc = protocolsAllocationsPerc;

    if (addGovTokens){
      const govTokensBalances = await this.getGovTokensBalances(tokenConfig.idle.address);

      // Sum gov tokens balances
      if (govTokensBalances.total){
        const tokenUsdConversionRate = await this.getTokenConversionRate(tokenConfig,false);
        if (tokenUsdConversionRate){
          govTokensBalances.total = govTokensBalances.total.div(tokenUsdConversionRate);
        }

        tokenAllocation.totalAllocation = tokenAllocation.totalAllocation.plus(govTokensBalances.total);
      }
    }

    if (protocolsAprs){
      tokenAllocation.avgApr = this.getAvgApr(protocolsAprs,protocolsAllocations,totalAllocation);
    }

    return this.setCachedData(cachedDataKey,tokenAllocation);
  }
  getUniswapConversionRate = async (tokenConfigFrom,tokenConfigDest) => {
    const WETHAddr = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    const one = this.normalizeTokenDecimals(18);
    const unires = await this.genericContractCall('UniswapRouter','getAmountsIn',[one.toFixed(),[tokenConfigFrom.address, WETHAddr, tokenConfigDest.address]]);
    if (unires){
      return this.BNify(unires[0]).div(one);
    }
    return null;
  }
  /*
  getUniswapConversionRate_old = async (tokenConfigFrom,tokenConfigDest) => {
    const cachedDataKey = `compUniswapConverstionRate_${tokenConfigFrom.address}_${tokenConfigDest.address}`;
    const cachedData = this.getCachedData(cachedDataKey);
    if (cachedData !== null && !this.BNify(cachedData).isNaN()){
      return cachedData;
    }

    const tokenFrom = new Token(ChainId.MAINNET, tokenConfigFrom.address, tokenConfigFrom.decimals);
    const tokenTo = new Token(ChainId.MAINNET, tokenConfigDest.address, tokenConfigDest.decimals);

    const pair = await Fetcher.fetchPairData(tokenFrom, tokenTo);
    const route = new Route([pair], tokenTo);

    let output = null;
    if (route && route.midPrice){
      output = this.BNify(route.midPrice.toSignificant(tokenConfigDest.decimals));
      this.setCachedData(cachedDataKey,output);
    }
    return output;
  }
  */
  getCompAPR = async (token,tokenConfig,cTokenIdleSupply=null,compConversionRate=null) => {
    const COMPTokenConfig = this.getGlobalConfig(['govTokens','COMP']);
    if (!COMPTokenConfig.enabled){
      return false;
    }

    const cachedDataKey = `getCompAPR_${tokenConfig.idle.token}_${cTokenIdleSupply}_${compConversionRate}`;
    const cachedData = this.getCachedData(cachedDataKey);
    if (cachedData !== null && !this.BNify(cachedData).isNaN()){
      return cachedData;
    }

    let compAPR = this.BNify(0);

    const compDistribution = await this.getCompDistribution(tokenConfig,cTokenIdleSupply);

    // console.log('getCompAPR',token,compDistribution ? compDistribution.toString() : null);

    if (compDistribution){
      const cTokenInfo = tokenConfig.protocols.find( p => (p.name === 'compound') );

      const DAITokenConfig = this.getGlobalConfig(['stats','tokens','DAI']);
        
      // Get COMP conversion rate
      if (!compConversionRate){
        compConversionRate = await this.getUniswapConversionRate(DAITokenConfig,COMPTokenConfig);
        if (!compConversionRate || compConversionRate.isNaN()){
          compConversionRate = this.BNify(1);
        }
      }

      const compValue = this.BNify(compConversionRate).times(compDistribution);

      let compoundAllocation = null;

      cTokenIdleSupply = await this.genericContractCall(cTokenInfo.token,'totalSupply');

      // console.log('getCompAPR',cTokenInfo.token,cTokenIdleSupply ? cTokenIdleSupply.toString() : null);

      if (cTokenIdleSupply){
        let [exchangeRate,tokenDecimals] = await Promise.all([
          this.genericContractCall(cTokenInfo.token,cTokenInfo.functions.exchangeRate.name,cTokenInfo.functions.exchangeRate.params),
          this.getTokenDecimals(cTokenInfo.token)
        ]);
        if (exchangeRate){
          exchangeRate = this.fixTokenDecimals(exchangeRate,cTokenInfo.decimals);
          compoundAllocation = this.fixTokenDecimals(cTokenIdleSupply,tokenDecimals,exchangeRate);
          // console.log('getCompAPR',token,compValue.toString(),cTokenIdleSupply.toString(),exchangeRate.toString(),tokenDecimals.toString(),compoundAllocation.toString());
        }
      }

      if (compoundAllocation){
        compoundAllocation = await this.convertTokenBalance(compoundAllocation,token,tokenConfig,false);
        compAPR = compValue.div(compoundAllocation).times(100);

        // console.log('getCompAPR',cTokenInfo.token,compConversionRate.toString(),compDistribution.toString(),compValue.toString(),cTokenIdleSupply.toString(),compoundAllocation.toString(),compAPR.toString()+'%');

        this.setCachedData(cachedDataKey,compAPR);
      }
    }

    return compAPR;
  }
  getCompDistribution = async (tokenConfig,cTokenIdleSupply=null) => {

    const cachedDataKey = `getCompDistribution_${tokenConfig.idle.token}_${cTokenIdleSupply}`;
    const cachedData = this.getCachedData(cachedDataKey);
    if (cachedData !== null && !this.BNify(cachedData).isNaN()){
      return cachedData;
    }

    const cTokenInfo = tokenConfig.protocols.find( p => (p.name === 'compound') );
    if (cTokenInfo){

      // Get IdleToken allocation in compound
      const tokenAllocation = await this.getTokenAllocation(tokenConfig,false,false);
      const compoundAllocationPerc = tokenAllocation.protocolsAllocationsPerc[cTokenInfo.address.toLowerCase()];

      // console.log('getCompDistribution 1',cTokenInfo.token,cTokenInfo.address,tokenAllocation.protocolsAllocationsPerc,compoundAllocationPerc ? compoundAllocationPerc.toString() : null);

      // Calculate distribution if compound allocation >= 0.1%
      if (compoundAllocationPerc && compoundAllocationPerc.gte(0.001)){

        // Get COMP distribution speed and Total Supply
        const [compSpeed,cTokenTotalSupply] = await Promise.all([
          this.genericContractCall('Comptroller','compSpeeds',[cTokenInfo.address]),
          this.genericContractCall(cTokenInfo.token,'totalSupply')
        ]);

        // console.log('getCompDistribution 2',cTokenInfo.token,compSpeed ? compSpeed.toString() : null,cTokenTotalSupply ? cTokenTotalSupply.toString() : null);

        if (compSpeed && cTokenTotalSupply){

          // Get Idle liquidity supply
          if (!cTokenIdleSupply){
            cTokenIdleSupply = await this.genericContractCall(cTokenInfo.token,'balanceOf',[tokenConfig.idle.address]);
          }

          // console.log('getCompDistribution 3',cTokenInfo.token,cTokenIdleSupply ? cTokenIdleSupply.toString() : null);

          if (cTokenIdleSupply){

            // Get COMP distribution for Idle in a Year
            const blocksPerYear = this.getGlobalConfig(['network','blocksPerYear']);

            // Take 50% of distrubution for lenders side
            const compDistribution = this.BNify(compSpeed).times(this.BNify(blocksPerYear)).div(1e18);

            // console.log('getCompDistribution 4',cTokenInfo.token,this.BNify(compSpeed).div(1e18).toString(),cTokenTotalSupply.toString(),cTokenIdleSupply.toString(),compDistribution.toString());

            this.setCachedData(cachedDataKey,compDistribution);

            return compDistribution;
          }
        }
      }
    }

    return null;
  }
  getCompAvgApr = async (availableTokens=null) => {
    if (!availableTokens){
      availableTokens = this.props.availableStrategies[this.props.selectedStrategy];
    }
    let output = this.BNify(0);
    let totalAllocation = this.BNify(0);
    await this.asyncForEach(Object.keys(availableTokens),async (token) => {
      const tokenConfig = availableTokens[token];
      const [compApr,tokenAllocation] = await Promise.all([
        this.getCompAPR(token,tokenConfig),
        this.getTokenAllocation(tokenConfig,false,false)
      ]);
      
      if (compApr && tokenAllocation){
        output = output.plus(compApr.times(tokenAllocation.totalAllocation));
        totalAllocation = totalAllocation.plus(tokenAllocation.totalAllocation);
        // console.log(token,compApr.toString(),tokenAllocation.totalAllocation.toString(),output.toString(),totalAllocation.toString());
      }
    });

    output = output.div(totalAllocation);

    return output;
  }
  getGovTokenPool = async (govToken=null,availableTokens=null,convertToken=null) => {
    let output = this.BNify(0);

    if (!availableTokens){
      availableTokens = this.props.availableStrategies[this.props.selectedStrategy];
    }

    await this.asyncForEach(Object.keys(availableTokens),async (token) => {
      const tokenConfig = availableTokens[token];
      const enabledTokens = govToken ? [govToken] : null;
      const compTokenBalance = await this.getGovTokensBalances(tokenConfig.idle.address,convertToken,enabledTokens);
      if (compTokenBalance && compTokenBalance.total){
        output = output.plus(compTokenBalance.total);
      }
    });
    return output;
  }
  getGovTokensBalances = async (address=null,convertToken='DAI',enabledTokens=null) => {
    if (!address){
      address = this.props.tokenConfig.idle.address;
    }
    const govTokens = this.getGlobalConfig(['govTokens']);
    const govTokensBalances = {}

    await this.asyncForEach(Object.keys(govTokens),async (token) => {

      if (enabledTokens && !enabledTokens.includes(token)){
        return;
      }
      
      const govTokenConfig = govTokens[token];

      if (!govTokenConfig.enabled){
        return;
      }

      // Get gov token balance
      let govTokenBalance = await this.getProtocolBalance(token,address);

      if (govTokenBalance){
        // Get gov token conversion rate
        let tokenConversionRate = null;
        if (convertToken){
          const fromTokenConfig = this.getGlobalConfig(['stats','tokens',convertToken]);
          tokenConversionRate = await this.getUniswapConversionRate(fromTokenConfig,govTokenConfig);
        }

        // Fix token decimals and convert
        govTokensBalances[token] = this.fixTokenDecimals(govTokenBalance,govTokens[token].decimals,tokenConversionRate);

        // Initialize Total gov Tokens
        if (!govTokensBalances.total){
          govTokensBalances.total = this.BNify(0);
        }

        // Sum Total gov Tokens
        govTokensBalances.total = govTokensBalances.total.plus(govTokensBalances[token]);
      }
    });

    return govTokensBalances;
  }
  getGovTokenConfigByAddress = (address) => {
    if (!address){
      return false;
    }
    const govTokens = this.getGlobalConfig(['govTokens']);
    return Object.values(govTokens).find( tokenConfig => tokenConfig.address.toLowerCase() === address.toLowerCase() );
  }
  getGovTokensUserTotalBalance = async (account=null,availableTokens=null,convertToken=null) => {
    const govTokensUserBalances = await this.getGovTokensUserBalances(account,availableTokens,convertToken);
    if (govTokensUserBalances){
      // debugger;
      const govTokensEarnings = Object.values(govTokensUserBalances).reduce( (acc, govTokenAmount) => {
        acc = acc.plus(this.BNify(govTokenAmount));
        return acc;
      }, this.BNify(0));

      return govTokensEarnings;
    }
    return this.BNify(0);
  }
  getGovTokensUserBalances = async (account=null,availableTokens=null,convertToken=null,govTokenConfig=null) => {
    if (!account){
      account = this.props.account;
    }
    if (!availableTokens){
      availableTokens = this.props.availableStrategies[this.props.selectedStrategy];
    }

    const output = {};

    await this.asyncForEach(Object.keys(availableTokens),async (token) => {
      const idleTokenConfig = availableTokens[token].idle;

      // Get govTokens amounts
      const govTokensAmounts = await this.genericContractCall(idleTokenConfig.token,'getGovTokensAmounts',[account]);

      if (govTokensAmounts){
        await this.asyncForEach(govTokensAmounts, async (govTokenAmount,govTokenIndex) => {
          govTokenAmount = this.BNify(govTokenAmount);
          // Get gov Token config by index
          const govTokenAddress = await this.genericContractCall(idleTokenConfig.token,'govTokens',[govTokenIndex]);
          if (govTokenAddress){
            govTokenConfig = govTokenConfig ? govTokenConfig : this.getGovTokenConfigByAddress(govTokenAddress);
            if (govTokenConfig && govTokenConfig.address && govTokenConfig.address.toLowerCase() === govTokenAddress.toLowerCase()){

              // Get gov token conversion rate
              let tokenConversionRate = null;
              if (convertToken){
                const fromTokenConfig = this.getGlobalConfig(['stats','tokens',convertToken]);
                if (fromTokenConfig){
                  tokenConversionRate = await this.getUniswapConversionRate(fromTokenConfig,govTokenConfig);
                }
              }
              govTokenAmount = this.fixTokenDecimals(govTokenAmount,govTokenConfig.decimals,tokenConversionRate);

              // Initialize govToken balance
              if (!output[govTokenConfig.token]){
                output[govTokenConfig.token] = this.BNify(0); // this.BNify(1) for testing
              }

              // Add govTokens balance
              output[govTokenConfig.token] = output[govTokenConfig.token].plus(govTokenAmount);
            }
          }
        });
      }
    });

    return output;
  }
  getTokenFees = async (tokenConfig=null) => {
    if (!tokenConfig && this.props.tokenConfig){
      tokenConfig = this.props.tokenConfig;
    }
    const fee = await this.genericContractCall(tokenConfig.idle.token, 'fee');
    if (fee){
      return this.BNify(fee).div(this.BNify(100000));
    }
    return null;
  }
  getUserTokenFees = async (tokenConfig=null,account=null) => {
    if (!tokenConfig && this.props.tokenConfig){
      tokenConfig = this.props.tokenConfig;
    }
    if (!account && this.props.account){
      account = this.props.account;
    }

    if (!account || !tokenConfig){
      return null;
    }

    let [
      feePercentage,
      amountLent,
      redeemableBalance
    ] = await Promise.all([
      this.getTokenFees(tokenConfig),
      this.loadAssetField('amountLent',tokenConfig.token,tokenConfig,account),
      this.loadAssetField('redeemableBalance',tokenConfig.token,tokenConfig,account)
    ]);

    if (feePercentage && amountLent && redeemableBalance){
      const gain = redeemableBalance.minus(amountLent);
      const fees = gain.times(feePercentage);

      // console.log('fees',tokenConfig.token,amountLent.toString(),redeemableBalance.toString(),gain.toString(),fees.toString());

      return fees;
    }

    return null;
  }
  getGovTokenUserBalance = async (govTokenConfig,account=null,availableTokens=null,convertToken=null) => {
    const govTokensUserBalances = await this.getGovTokensUserBalances(account,availableTokens,convertToken,govTokenConfig);
    return govTokensUserBalances && govTokensUserBalances[govTokenConfig.token] ? govTokensUserBalances[govTokenConfig.token] : this.BNify(0);
  }
  getAggregatedStats = async (addGovTokens=true) => {
    let avgAPR = this.BNify(0);
    let totalAUM = this.BNify(0);
    await this.asyncForEach(Object.keys(this.props.availableStrategies),async (strategy) => {
      const isRisk = strategy === 'risk';
      const availableTokens = this.props.availableStrategies[strategy];
      await this.asyncForEach(Object.keys(availableTokens),async (token) => {
        const tokenConfig = availableTokens[token];
        const tokenAllocation = await this.getTokenAllocation(tokenConfig,false,addGovTokens);
        const tokenAprs = await this.getTokenAprs(tokenConfig,tokenAllocation,addGovTokens);
        if (tokenAllocation && tokenAllocation.totalAllocationWithUnlent && !tokenAllocation.totalAllocationWithUnlent.isNaN()){
          const totalAllocation = await this.convertTokenBalance(tokenAllocation.totalAllocationWithUnlent,token,tokenConfig,isRisk);
          totalAUM = totalAUM.plus(totalAllocation);
          // console.log(strategy,token,totalAllocation.toString(),totalAUM.toString());
          if (tokenAprs && tokenAprs.avgApr && !tokenAprs.avgApr.isNaN()){
            avgAPR = avgAPR.plus(totalAllocation.times(tokenAprs.avgApr))
          }
        }


        // Get old token allocation
        if (tokenConfig.migration && tokenConfig.migration.oldContract){
          const oldTokenConfig = Object.assign({},tokenConfig);
          oldTokenConfig.idle = tokenConfig.migration.oldContract;

          // Replace protocols with old protocols
          if (oldTokenConfig.migration.oldProtocols){
            oldTokenConfig.migration.oldProtocols.forEach( oldProtocol => {
              const foundProtocol = oldTokenConfig.protocols.find( p => (p.name === oldProtocol.name) );
              if (foundProtocol){
                const protocolPos = oldTokenConfig.protocols.indexOf(foundProtocol);
                oldTokenConfig.protocols[protocolPos] = oldProtocol;
              }
            });
            // debugger;
          }

          const oldTokenAllocation = await this.getTokenAllocation(oldTokenConfig,false,false);
          if (oldTokenAllocation && oldTokenAllocation.totalAllocation && !oldTokenAllocation.totalAllocation.isNaN()){
            const oldTokenTotalAllocation = await this.convertTokenBalance(oldTokenAllocation.totalAllocation,token,oldTokenConfig,isRisk);
            totalAUM = totalAUM.plus(oldTokenTotalAllocation);
            // console.log(strategy,token,'old',oldTokenTotalAllocation.toString(),totalAUM.toString());
          }
        }
      });
    });

    avgAPR = avgAPR.div(totalAUM);
    const avgAPY = this.apr2apy(avgAPR.div(100)).times(100);

    return {
      avgAPR,
      avgAPY,
      totalAUM
    };
  }
  getTokenApy = async (tokenConfig) => {
    const tokenAprs = await this.getTokenAprs(tokenConfig);
    if (tokenAprs && tokenAprs.avgApr !== null){
      return this.apr2apy(tokenAprs.avgApr.div(100));
    }
    return null;
  }
  getTokensToMigrate = async () => {

    if (!this.props.availableTokens || !this.props.account){
      return false;
    }

    const tokensToMigrate = {};
    await this.asyncForEach(Object.keys(this.props.availableTokens),async (token) => {
      const tokenConfig = this.props.availableTokens[token];
      const {
        migrationEnabled,
        oldContractBalanceFormatted
      } = await this.checkMigration(tokenConfig,this.props.account);
      
      if (migrationEnabled){
        tokensToMigrate[token] = {
          tokenConfig,
          oldContractBalanceFormatted
        }
      }
    });

    return tokensToMigrate;
  }
  /*
  Get protocols tokens balances
  */
  getProtocolsTokensBalances = async (protocol=null) => {
    if (!this.props.account){
      return false;
    }
    const tokenBalances = {};
    const minTokenBalance = this.BNify(1).div(1e4);
    const protocolsTokens = this.getGlobalConfig(['tools','tokenMigration','props','availableTokens']);
    if (protocolsTokens){
      await this.asyncForEach(Object.keys(protocolsTokens),async (token) => {
        const tokenConfig = protocolsTokens[token];
        if (protocol !== null && tokenConfig.protocol.toLowerCase() !== protocol.toLowerCase() ){
          return;
        }
        let tokenContract = this.getContractByName(tokenConfig.token);
        if (!tokenContract && tokenConfig.abi){
          tokenContract = await this.props.initContract(tokenConfig.token,tokenConfig.address,tokenConfig.abi);
        }
        if (tokenContract){
          const tokenBalance = await this.getTokenBalance(tokenConfig.token,this.props.account);
          if (tokenBalance && tokenBalance.gte(minTokenBalance)){
            tokenBalances[token] = {
              tokenConfig,
              balance:tokenBalance,
            };
          }
        }
      });
    }

    return tokenBalances;
  }
  /*
  Convert token Balance
  */
  convertTokenBalance = async (tokenBalance,token,tokenConfig,isRisk) => {
    // Check for USD conversion rate
    tokenBalance = this.BNify(tokenBalance);
    if (tokenBalance.gt(0)){
      const tokenUsdConversionRate = await this.getTokenConversionRate(tokenConfig,isRisk);
      if (tokenUsdConversionRate){
        tokenBalance = tokenBalance.times(tokenUsdConversionRate);
      }
    }
    return tokenBalance;
  }
  /*
  Get idleToken conversion rate
  */
  getTokenConversionRate = async (tokenConfig,isRisk,conversionRateField=null) => {

    if (!conversionRateField){
      conversionRateField = this.getGlobalConfig(['stats','tokens',tokenConfig.token,'conversionRateField']);
      if (!conversionRateField){
        return null;
      }
    }

    // Check for cached data
    const cachedDataKey = `tokenConversionRate_${tokenConfig.address}_${isRisk}_${conversionRateField}`;
    const cachedData = this.getCachedData(cachedDataKey);
    if (cachedData !== null){
      return cachedData;
    }

    let tokenData = await this.getTokenApiData(tokenConfig.address,isRisk,null,null,false,null,'desc',1);

    if (tokenData && tokenData.length){
      tokenData = tokenData.pop();
      if (tokenData && tokenData[conversionRateField]){
        const conversionRate = this.fixTokenDecimals(tokenData[conversionRateField],18);
        return this.setCachedData(cachedDataKey,conversionRate);
      }
    }

    return null;
  }
  /*
  Get idleToken score
  */
  getTokenScore = async (tokenConfig,isRisk) => {
    // Check for cached data
    const cachedDataKey = `tokenScore_${tokenConfig.address}_${isRisk}`;
    const cachedData = this.getCachedData(cachedDataKey);
    if (cachedData !== null){
      return cachedData;
    }

    const apiInfo = globalConfigs.stats.scores;
    const endpoint = `${apiInfo.endpoint}${tokenConfig.address}?isRisk=${isRisk}`;
    const tokenData = await this.makeCachedRequest(endpoint,apiInfo.TTL,true);

    if (tokenData){
      const tokenScore = this.BNify(tokenData[0].idleScore);
      if (tokenScore && tokenScore.gt(0)){
        // Set cached data
        return this.setCachedData(cachedDataKey,tokenScore);
      }
    }

    return null;
  }
  /*
  Get idleTokens aggregated APR
  */
  getTokenAprs = async (tokenConfig,tokenAllocation=false,addGovTokens=true) => {

    if (!tokenConfig.idle){
      return false;
    }

    // Check for cached data
    const cachedDataKey = `tokenAprs_${tokenConfig.idle.address}_${addGovTokens}`;
    const cachedData = this.getCachedData(cachedDataKey);
    if (cachedData !== null){
      return cachedData;
    }

    const Aprs = await this.getAprs(tokenConfig.idle.token);

    if (!Aprs){
      return false;
    }

    if (!tokenAllocation){
      tokenAllocation = await this.getTokenAllocation(tokenConfig);
    }

    if (!tokenAllocation){
      return false;
    }

    const addresses = Aprs.addresses.map((addr,i) => { return addr.toString().toLowerCase() });
    const aprs = Aprs.aprs;

    const protocolsAprs = {};
    const protocolsApys = {};

    await this.asyncForEach(tokenConfig.protocols,async (protocolInfo,i) => {
      const protocolAddr = protocolInfo.address.toString().toLowerCase();
      const addrIndex = addresses.indexOf(protocolAddr);
      if ( addrIndex !== -1 ) {
        let protocolApr = this.BNify(+this.toEth(aprs[addrIndex]));
        let protocolApy = this.apr2apy(protocolApr.div(100)).times(100);

        if (addGovTokens && protocolInfo.name === 'compound'){
          const compAPR = await this.getCompAPR(tokenConfig.token,tokenConfig);

          if (compAPR){
            protocolApr = protocolApr.plus(compAPR);
            protocolApy = protocolApy.plus(compAPR); 
          }
        }

        protocolsApys[protocolAddr] = protocolApy;
        protocolsAprs[protocolAddr] = protocolApr;
      }
    });

    const tokenAprs = {
      avgApr: null,
      avgApy: null,
      protocolsAprs,
      protocolsApys
    };

    if (tokenAllocation){
      tokenAprs.avgApr = this.getAvgApr(protocolsAprs,tokenAllocation.protocolsAllocations,tokenAllocation.totalAllocation);
      tokenAprs.avgApy = this.getAvgApr(protocolsApys,tokenAllocation.protocolsAllocations,tokenAllocation.totalAllocation);
    }

    return this.setCachedData(cachedDataKey,tokenAprs);
  }
  abbreviateNumber(value,decimals=3,maxPrecision=5,minPrecision=0){
    const isNegative = parseFloat(value)<0;
    let newValue = Math.abs(parseFloat(value));
    const suffixes = ["", "K", "M", "B","T"];
    let suffixNum = 0;
    while (newValue >= 1000) {
      newValue /= 1000;
      suffixNum++;
    }

    maxPrecision = Math.max(1,maxPrecision);

    // Prevent decimals on integer number
    if (value>=1000){
      const decimalPart = decimals ? (newValue%1).toString().substr(2,decimals) : null;
      newValue = parseFloat(parseInt(newValue)+( decimalPart ? '.'+decimalPart : '' ) );
    } else {
      newValue = newValue.toFixed(decimals);
    }

    if (newValue>=1 && (newValue.length-1)>maxPrecision){
      newValue = parseFloat(newValue).toPrecision(maxPrecision);
    } else if ((newValue.length-1)<minPrecision) {
      const difference = minPrecision-(newValue.length-1);
      decimals += difference;
      newValue = Math.abs(parseFloat(value));
      newValue = newValue.toFixed(decimals);
    }

    // Add minus if number is negative
    if (isNegative){
      newValue = '-'+newValue;
    }

    newValue += suffixes[suffixNum];

    return newValue;
  }
  getFormattedBalance(balance,label,decimals,maxLen,highlightedDecimals){
    const defaultValue = '-';
    decimals = !isNaN(decimals) ? decimals : 6;
    maxLen = !isNaN(maxLen) ? maxLen : 10;
    highlightedDecimals = !isNaN(highlightedDecimals) ? highlightedDecimals : 0;
    balance = parseFloat(this.BNify(balance)).toFixed(decimals);

    const numLen = balance.toString().replace('.','').length;
    if (numLen>maxLen){
      decimals = Math.max(0,decimals-(numLen-maxLen));
      balance = parseFloat(this.BNify(balance)).toFixed(decimals);
    }

    const intPart = Math.floor(balance);
    let decPart = (balance%1).toPrecision(decimals).substr(2,decimals);;
    decPart = (decPart+("0".repeat(decimals))).substr(0,decimals);

    if (highlightedDecimals){
      const highlightedDec = decPart.substr(0,highlightedDecimals);
      decPart = decPart.substr(highlightedDecimals);
      const highlightedIntPart = (<Text.span fontSize={'100%'} color={'blue'} fontWeight={'inerith'}>{intPart}.{highlightedDec}</Text.span>);
      return !isNaN(this.trimEth(balance)) ? ( <>{highlightedIntPart}<small style={{fontSize:'70%'}}>{decPart}</small> <Text.span fontSize={[1,2]}>{label}</Text.span></> ) : defaultValue;
    } else {
      return !isNaN(this.trimEth(balance)) ? ( <>{intPart}<small>.{decPart}</small>{ label !== '%' ? ' ' : null }{ label ? <Text.span fontSize={[1,2]}>{label}</Text.span> : null }</> ) : defaultValue;
    }
  }
};

export default FunctionsUtil;