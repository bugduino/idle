import React from "react";
import axios from 'axios';
import moment from 'moment';
import { Text } from "rimble-ui";
import BigNumber from 'bignumber.js';
import globalConfigs from '../configs/globalConfigs';
// import availableTokens from '../configs/availableTokens';

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

    return portfolio;
  }
  getAvgBuyPrice = async (enabledTokens=[],account) => {
    account = account ? account : this.props.account;

    if (!account || !enabledTokens || !enabledTokens.length || !this.props.availableTokens){
      return [];
    }

    const output = {};
    const etherscanTxs = await this.getEtherscanTxs(account,0,'latest',enabledTokens);

    enabledTokens.forEach((selectedToken) => {

      output[selectedToken] = [];
      let avgBuyPrice = this.BNify(0);
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
          if (idleTokensBalance.lt(0)){
            avgBuyPrice = this.BNify(0);
            idleTokensBalance = this.BNify(0);
          }
        });
      }

      // Add token Data
      output[selectedToken] = avgBuyPrice;
    });

    return output;
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
      amountLents[selectedToken] = [];

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
        let latestTxs = await this.makeRequest(etherscanEndpointLastBlock);

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

    return etherscanTxs;
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

          if (isSendTransferTx || isReceiveTransferTx || isMigrationTx || isDepositTx || isRedeemTx || isSwapTx || isSwapOutTx || isWithdrawTx){
            
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
              if (!output[txKey] && tx.token.toUpperCase() === selectedToken.toUpperCase()){
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
            tokenPrice = await this.getIdleTokenPrice(tokenConfig,tx.blockNumber);
            storedTx.tokenPrice = tokenPrice;
            // console.log(tx.blockNumber,tokenPrice,tokenPrice.toString());
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

      // Remove Pending txs

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
          migrateFromToIdle:'Migrated',
          mintIdleTokensProxy:'Deposit',
          migrateFromAaveToIdle:'Migrated',
          migrateFromIearnToIdle:'Migrated',
          executeMetaTransaction:'Migrated',
          migrateFromFulcrumToIdle:'Migrated',
          migrateFromCompoundToIdle:'Migrated',
        };
        const pendingStatus = ['pending','started'];

        const txHash = tx.transactionHash ? tx.transactionHash : null;
        const txSucceeded = tx.status === 'success';
        const txPending = pendingStatus.indexOf(tx.status)!==-1;
        const methodIsAllowed = Object.keys(allowedMethods).indexOf(tx.method)!==-1;

        // Skip transaction if already present in etherscanTxs with same status
        if (txHash && etherscanTxs[txHash] && etherscanTxs[txHash].tokenPrice){
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
            hash:txHash ? tx.transactionHash : null,
            tokenSymbol:selectedToken,
            action:allowedMethods[tx.method],
            timeStamp:parseInt(tx.created/1000),
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

        // Skip txs from other wallets
        if (!realTx || realTx.from.toLowerCase() !== this.props.account.toLowerCase()){
          return false;
        }

        let tokenPrice = await this.getIdleTokenPrice(tokenConfig,realTx.blockNumber);

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

            const oldContractAddr1 = tokenConfig.migration.oldContract.address.replace('x','').toLowerCase();
            const executeMetaTransactionInternalTransfers = executeMetaTransactionReceipt.logs.filter((tx) => { return tx.address.toLowerCase()===tokenConfig.address.toLowerCase() && tx.topics[tx.topics.length-1].toLowerCase() === `0x00000000000000000000000${oldContractAddr1}`; });

            if (!executeMetaTransactionInternalTransfers.length){
              return false;
            }

            const metaTxValue = parseInt(executeMetaTransactionInternalTransfers.data,16);
            const metaTxValueFixed = this.fixTokenDecimals(metaTxValue,tokenConfig.decimals);
            realTx.value = metaTxValueFixed;
            realTx.tokenAmount = metaTxValueFixed;
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

  getTokenApiData = async (address,startTimestamp=null,endTimestamp=null,forceStartTimestamp=false) => {
    if (globalConfigs.network.requiredNetwork!==1 || !globalConfigs.stats.enabled){
      return [];
    }

    const apiInfo = globalConfigs.stats.rates;
    let endpoint = `${apiInfo.endpoint}${address}`;

    if (startTimestamp || endTimestamp){
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
      if (params.length){
        endpoint += '?'+params.join('&');
      }
    }
    let output = await this.makeRequest(endpoint);
    if (!output){
      return [];
    }
    return output.data;
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
  normalizeTokenAmount = (tokenBalance,tokenDecimals) => {
    const normalizedTokenDecimals = this.normalizeTokenDecimals(tokenDecimals);
    return this.BNify(tokenBalance).times(normalizedTokenDecimals).integerValue(BigNumber.ROUND_FLOOR).toFixed();
  }
  fixTokenDecimals = (tokenBalance,tokenDecimals,exchangeRate) => {
    const normalizedTokenDecimals = this.normalizeTokenDecimals(tokenDecimals);
    let balance = this.BNify(tokenBalance).div(normalizedTokenDecimals);
    if (exchangeRate){
      balance = balance.times(exchangeRate);
    }
    return balance;
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

      if (oldContract && migrationContract){
        // Get old contract token decimals
        oldContractTokenDecimals = await this.getTokenDecimals(oldContractName);

        // console.log('Migration - token decimals',oldContractTokenDecimals ? oldContractTokenDecimals.toString() : null);

        // Check migration contract approval
        // migrationContractApproved = await this.checkMigrationContractApproved();

        // console.log('Migration - approved',migrationContractApproved ? migrationContractApproved.toString() : null);

        // Check old contractBalance
        oldContractBalance = await this.getContractBalance(oldContractName,account);

        // console.log('Migration - oldContractBalance',oldContractBalance ? oldContractBalance.toString() : null);
        if (oldContractBalance){
          oldContractBalanceFormatted = this.fixTokenDecimals(oldContractBalance,oldContractTokenDecimals);
          // Enable migration if old contract balance if greater than 0
          migrationEnabled = this.BNify(oldContractBalance).gt(0);
        }
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
      return false
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
      // console.info(`User signature is ${signature}`);
      const { r, s, v } = this.getSignatureParameters_v4(signature);

      // console.log(userAddress);
      // console.log(JSON.stringify(message));
      // console.log(message);
      // console.log(getSignatureParameters(signature));
      this.contractMethodSendWrapper(contractName, 'executeMetaTransaction', [userAddress, functionSignature, message, `${messageToSign.length}`, r, s, v], callback, callback_receipt);
    } catch (error) {
      callback(null,error);
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
  getIdleTokenPrice = async (tokenConfig,blockNumber='latest',decimals=false) => {
    let tokenPrice = await this.genericContractCall(tokenConfig.idle.token,'tokenPrice',[],{},blockNumber);
    decimals = decimals ? decimals : tokenConfig.decimals;
    tokenPrice = this.fixTokenDecimals(tokenPrice,decimals);
    if (tokenPrice.lt(1)){
      tokenPrice = this.BNify(1);
    }
    return tokenPrice;
  }
  getTokenBalance = async (contractName,address) => {
    let tokenBalanceOrig = await this.getContractBalance(contractName,address);
    if (tokenBalanceOrig){
      const tokenDecimals = await this.getTokenDecimals(contractName);
      const tokenBalance = this.fixTokenDecimals(tokenBalanceOrig,tokenDecimals);
      // console.log('getTokenBalance',contractName,tokenBalanceOrig,tokenBalance.toString(),tokenDecimals);
      return tokenBalance;
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
    let contract = this.getContractByName(contractName);

    if (!contract) {
      this.customLogError('Wrong contract name', contractName);
      return null;
    }

    const value = await contract.methods[methodName](...params).call(callParams,blockNumber).catch(error => {
      this.customLogError(`${contractName} contract method ${methodName} error: `, error);
    });

    return value;
  }
  asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }
  apr2apy = (apr) => {
    return (this.BNify(1).plus(this.BNify(apr).div(12))).pow(12).minus(1);
  }
  /*
  Get idleToken allocation between protocols
  */
  getTokenAllocation = async (tokenConfig,protocolsAprs=false) => {

    let totalAllocation = this.BNify(0);

    const tokenAllocation = {
      avgApr: null,
      totalAllocation:null,
      protocolsAllocations:null,
      protocolsAllocationsPerc:null
    };

    const exchangeRates = {};
    const protocolsBalances = {};
    const protocolsAllocations = {};
    const protocolsAllocationsPerc = {};

    await this.asyncForEach(tokenConfig.protocols,async (protocolInfo,i) => {
      const contractName = protocolInfo.token;
      const protocolAddr = protocolInfo.address.toLowerCase();

      let [protocolBalance, tokenDecimals, exchangeRate] = await Promise.all([
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

    Object.keys(protocolsAllocations).forEach((protocolAddr,i) => {
      const protocolAllocation = protocolsAllocations[protocolAddr];
      const protocolAllocationPerc = protocolAllocation.div(totalAllocation);
      protocolsAllocationsPerc[protocolAddr] = protocolAllocationPerc;
    });

    tokenAllocation.totalAllocation = totalAllocation;
    tokenAllocation.protocolsAllocations = protocolsAllocations;
    tokenAllocation.protocolsAllocationsPerc = protocolsAllocationsPerc;

    if (protocolsAprs){
      tokenAllocation.avgApr = this.getAvgApr(protocolsAprs,protocolsAllocations,totalAllocation);
    }

    return tokenAllocation;
  }
  getAggregatedStats = async () => {
    let avgAPR = this.BNify(0);
    let totalAUM = this.BNify(0);
    await this.asyncForEach(Object.keys(this.props.availableStrategies),async (strategy) => {
      const availableTokens = this.props.availableStrategies[strategy];
      await this.asyncForEach(Object.keys(availableTokens),async (token) => {
        const tokenConfig = availableTokens[token];
        const tokenAllocation = await this.getTokenAllocation(tokenConfig);
        const tokenAprs = await this.getTokenAprs(tokenConfig,tokenAllocation);
        if (tokenAllocation && tokenAllocation.totalAllocation && !tokenAllocation.totalAllocation.isNaN()){
          totalAUM = totalAUM.plus(tokenAllocation.totalAllocation);
          if (tokenAprs.avgApr && !tokenAprs.avgApr.isNaN()){
            avgAPR = avgAPR.plus(tokenAllocation.totalAllocation.times(tokenAprs.avgApr))
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
  /*
  Get protocols tokens balances
  */
  getProtocolsTokensBalances = async () => {
    if (!this.props.account){
      return false;
    }
    const tokenBalances = {};
    const protocolsTokens = this.getGlobalConfig(['tools','tokenMigration','props','availableTokens']);
    if (protocolsTokens){
      await this.asyncForEach(Object.keys(protocolsTokens),async (token) => {
        const tokenConfig = protocolsTokens[token];
        let tokenContract = this.getContractByName(token);
        if (!tokenContract && tokenConfig.abi){
          tokenContract = await this.props.initContract(token,tokenConfig.address,tokenConfig.abi);
        }
        if (tokenContract){
          const tokenBalance = await this.getTokenBalance(token,this.props.account);
          if (tokenBalance && tokenBalance.gt(0)){
            tokenBalances[token] = {
              tokenConfig,
              balance:tokenBalance,
            };
          }
        }
      })
    }

    return tokenBalances;
  }
  /*
  Get idleToken conversion rate
  */
  getTokenConversionRate = async (tokenConfig,isRisk,conversionRateField) => {
    const startTimestamp = parseInt(new Date().getTime()/1000)-60*60;
    let tokenData = await this.getTokenApiData(tokenConfig.address,startTimestamp);

    if (tokenData){
      tokenData = tokenData.filter( d => ( d.isRisk === isRisk ) ).pop();

      if (tokenData && tokenData[conversionRateField]){
        return this.fixTokenDecimals(tokenData[conversionRateField],18);
      }
    }

    return null;
  }
  /*
  Get idleToken score
  */
  getTokenScore = async (tokenConfig,isRisk) => {
    const startTimestamp = parseInt(new Date().getTime()/1000)-60*60*2;
    let tokenData = await this.getTokenApiData(tokenConfig.address,startTimestamp);

    if (tokenData){
      tokenData = tokenData.filter( d => ( d.isRisk === isRisk ) );

      let index = tokenData.length-1;
      let tokenScore = this.BNify(0);
      do{
        const apiData = tokenData[index];
        if (apiData && apiData.idleScore){
          tokenScore = this.BNify(apiData.idleScore);
        }
      } while (tokenScore.lte(0) && (index--)>=0);

      if (tokenScore && tokenScore.gt(0)){
        return tokenScore;
      }
    }

    return null;
  }
  /*
  Get idleTokens aggregated APR
  */
  getTokenAprs = async (tokenConfig,tokenAllocation=false) => {
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

    tokenConfig.protocols.forEach((protocolInfo,i) => {
      const protocolAddr = protocolInfo.address.toString().toLowerCase();
      const addrIndex = addresses.indexOf(protocolAddr);
      if ( addrIndex !== -1 ) {
        const protocolApr = aprs[addrIndex];
        protocolsAprs[protocolAddr] = this.BNify(+this.toEth(protocolApr));
      }
    });

    const tokenAprs = {
      avgApr: null,
      protocolsAprs
    };

    if (tokenAllocation){
      tokenAprs.avgApr = this.getAvgApr(protocolsAprs,tokenAllocation.protocolsAllocations,tokenAllocation.totalAllocation);
    }

    return tokenAprs;
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