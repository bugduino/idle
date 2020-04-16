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
  BNify = s => new BigNumber(String(s))
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
            .replace(/<\/p>/g,"");
  }
  strToMoment = (date,format=null) => {
    return moment(date,format);
  }
  stripHtml = (html) => {
     var tmp = document.createElement("DIV");
     tmp.innerHTML = html;
     return tmp.textContent || tmp.innerText || "";
  }
  getTxAction = (tx,tokenConfig) => {

    const migrationContractAddr = tokenConfig.migration && tokenConfig.migration.migrationContract ? tokenConfig.migration.migrationContract.address : null;
    const migrationContractOldAddrs = tokenConfig.migration && tokenConfig.migration.migrationContract && tokenConfig.migration.migrationContract.oldAddresses ? tokenConfig.migration.migrationContract.oldAddresses : [];

    const isMigrationTx = migrationContractAddr && (tx.from.toLowerCase() === migrationContractAddr.toLowerCase() || migrationContractOldAddrs.map((v) => { return v.toLowerCase(); }).indexOf(tx.from.toLowerCase()) !== -1 ) && tx.contractAddress.toLowerCase() === tokenConfig.idle.address.toLowerCase();
    const isSendTransferTx = !isMigrationTx && tx.from.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === tokenConfig.idle.address.toLowerCase();
    const isReceiveTransferTx = !isMigrationTx && tx.to.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === tokenConfig.idle.address.toLowerCase();
    const isDepositTx = !isMigrationTx && !isSendTransferTx && !isReceiveTransferTx && tx.to.toLowerCase() === tokenConfig.idle.address.toLowerCase();
    const isRedeemTx = !isMigrationTx && !isSendTransferTx && !isReceiveTransferTx && tx.to.toLowerCase() === this.props.account.toLowerCase();
    const isSwapTx = !isMigrationTx && !isSendTransferTx && !isReceiveTransferTx && tx.to.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === tokenConfig.idle.address.toLowerCase();

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

        portfolio.tokensBalance[token] = {
          tokenPrice,
          tokenBalance,
          idleTokenBalance
        };

        // Increment total balance
        portfolio.totalBalance = portfolio.totalBalance.plus(tokenBalance);
      }
    });

    return portfolio;
  }
  getAmountLent = async (enabledTokens=[],account) => {
    account = account ? account : this.props.account;

    if (!account || !enabledTokens || !enabledTokens.length || !this.props.availableTokens){
      return [];
    }

    const etherscanTxs = await this.getEtherscanTxs(account,0,'latest',enabledTokens);
    const storedTxs = this.getStoredItem('transactions',true,{});

    // Init storedTxs for pair account-token if empty
    if (typeof storedTxs[account] !== 'object'){
      storedTxs[account] = {};
    }

    const amountLents = {};

    await this.asyncForEach(enabledTokens,async (selectedToken) => {

      amountLents[selectedToken] = [];
      let amountLent = this.BNify(0);

      const tokenConfig = this.props.availableTokens[selectedToken];

      // Init storedTxs for pair account-token if empty
      if (typeof storedTxs[account][selectedToken] !== 'object'){
        storedTxs[account][selectedToken] = {};
      }

      const filteredTxs = Object.values(etherscanTxs).filter(tx => (tx.token === selectedToken));
      if (filteredTxs && filteredTxs.length){

        await this.asyncForEach(filteredTxs,async (tx,index) => {

          const txKey = `tx${tx.timeStamp}000`;
          const storedTx = storedTxs[account][selectedToken][txKey] ? storedTxs[account][selectedToken][txKey] : tx;

          let tokenPrice = null;
          if (storedTx.tokenPrice){
            tokenPrice = this.BNify(storedTx.tokenPrice);
          } else {
            tokenPrice = await this.genericContractCall(tokenConfig.idle.token, 'tokenPrice',[],{}, tx.blockNumber);
            tokenPrice = this.fixTokenDecimals(tokenPrice,tokenConfig.decimals);
            storedTx.tokenPrice = tokenPrice;
          }

          let tokensTransfered = tokenPrice.times(this.BNify(tx.value));

          // Add transactionHash to storedTx
          if (!storedTx.transactionHash){
            storedTx.transactionHash = tx.hash;
          }

          // Deposited
          switch (tx.action){
            case 'Send':
              // Decrese amountLent by the last idleToken price
              amountLent = amountLent.minus(tokensTransfered);

              if (amountLent.lte(0)){
                amountLent = this.BNify(0);
              }

              storedTx.value = tokensTransfered;
            break;
            case 'Receive':
              // Decrese amountLent by the last idleToken price
              amountLent = amountLent.plus(tokensTransfered);
              storedTx.value = tokensTransfered;
            break;
            case 'Swap':
              // Decrese amountLent by the last idleToken price
              amountLent = amountLent.plus(tokensTransfered);
              storedTx.value = tokensTransfered;
            break;
            case 'Deposit':
              amountLent = amountLent.plus(this.BNify(tx.value));
              if (!storedTx.idleTokens){

                // Init idleTokens amount
                storedTx.idleTokens = this.BNify(tx.value);
                storedTx.method = 'mintIdleToken';

                const decodeLogs = [
                  {
                    "internalType": "uint256",
                    "name": "_tokenAmount",
                    "type": "uint256"
                  }
                ];

                const walletAddress = account.replace('x','').toLowerCase();
                const res = await this.getTxDecodedLogs(tx,walletAddress,decodeLogs,storedTx);

                if (res){
                  const [txReceipt,logs] = res;
                  storedTx.idleTokens = this.fixTokenDecimals(logs._tokenAmount,18);
                  storedTx.txReceipt = txReceipt;
                }
              }
            break;
            case 'Redeem':
              const redeemedValueFixed = this.BNify(storedTx.value);

              // Decrese amountLent by redeem amount
              amountLent = amountLent.minus(redeemedValueFixed);

              // Reset amountLent if below zero
              if (amountLent.lt(0)){
                amountLent = this.BNify(0);
              }

              // Set tx method
              if (!storedTx.method){
                storedTx.method = 'redeemIdleToken';
              }
            break;
            case 'Withdraw':
              const withdrawValueFixed = this.BNify(storedTx.value);

              // Decrese amountLent by redeem amount
              amountLent = amountLent.minus(withdrawValueFixed);

              // Reset amountLent if below zero
              if (amountLent.lt(0)){
                amountLent = this.BNify(0);
              }
            break;
            case 'Migrate':
              let migrationValueFixed = 0;

              if (!storedTx.migrationValueFixed){
                storedTx.method = 'bridgeIdleV1ToIdleV2';
                migrationValueFixed = this.BNify(tx.value).times(tokenPrice);
                storedTx.migrationValueFixed = migrationValueFixed;
              } else {
                migrationValueFixed = this.BNify(storedTx.migrationValueFixed);
              }
          
              storedTx.value = migrationValueFixed;

              amountLent = amountLent.plus(migrationValueFixed);
            break;
            default:
            break;
          }
        });
      }

      // Add token Data
      amountLents[selectedToken] = amountLent;

      // Update Stored Txs
      if (storedTxs){
        this.setLocalStorage('transactions',JSON.stringify(storedTxs));
      }
    });

    return amountLents;
  }
  getEtherscanTxs = async (account=false,firstBlockNumber=0,endBlockNumber='latest',enabledTokens=[],count=0) => {
    account = account ? account : this.props.account;

    if (!account || !enabledTokens || !enabledTokens.length){
      return [];
    }

    count = count ? count : 0;

    const requiredNetwork = globalConfigs.network.requiredNetwork;
    const etherscanInfo = globalConfigs.network.providers.etherscan;

    let results = [];
    let cachedTxs = null;
    let etherscanEndpoint = null;
    let etherscanBaseEndpoint = null;

    // Check if etherscan is enabled for the required network
    if (etherscanInfo.enabled && etherscanInfo.endpoints[requiredNetwork]){
      const etherscanApiUrl = etherscanInfo.endpoints[requiredNetwork];

      // Add token variable to endpoint for separate cached requests between tokens
      etherscanEndpoint = `${etherscanApiUrl}?apikey=${env.REACT_APP_ETHERSCAN_KEY}&token=${enabledTokens.join(',')}&module=account&action=tokentx&address=${account}&startblock=${firstBlockNumber}&endblock=${endBlockNumber}&sort=asc`;
      etherscanBaseEndpoint = `${etherscanApiUrl}?apikey=${env.REACT_APP_ETHERSCAN_KEY}&token=${enabledTokens.join(',')}&module=account&action=tokentx&address=${account}&startblock=${firstBlockNumber}&endblock=${endBlockNumber}&sort=asc`;

      cachedTxs = this.getCachedRequest(etherscanEndpoint);

      // Check if cached txs are not up-to-date by comparing firstBlockNumber
      if (cachedTxs && cachedTxs.data.result && cachedTxs.data.result.length && !firstBlockNumber){
        const lastCachedBlockNumber = parseInt(Object.assign([],cachedTxs.data.result).pop().blockNumber);

        const etherscanEndpointLastBlock = `${etherscanApiUrl}?apikey=${env.REACT_APP_ETHERSCAN_KEY}&token=${enabledTokens.join(',')}&module=account&action=tokentx&address=${account}&startblock=${lastCachedBlockNumber}&endblock=${endBlockNumber}&sort=asc`;
        let latestTxs = await this.makeRequest(etherscanEndpointLastBlock);

        if (latestTxs && latestTxs.data.result && latestTxs.data.result.length){
          latestTxs = this.filterEtherscanTxs(latestTxs.data.result);
          if (latestTxs && latestTxs.length){
            const lastTx = latestTxs.pop();
            const lastRealBlockNumber = parseInt(lastTx.blockNumber);
            // If real tx blockNumber differs from lastCachedBlockNumber
            if (lastRealBlockNumber > lastCachedBlockNumber){
              cachedTxs = null;
            }
          }
        }
      }

      let txs = cachedTxs;

      if (!txs){
        // Make request
        txs = await this.makeRequest(etherscanEndpoint);
      }

      if (txs && txs.data && txs.data.result){
        results = txs.data.result;
      } else {
        return [];
      }
    }

    // Initialize prevTxs
    let etherscanTxs = [];

    if (cachedTxs){
      etherscanTxs = results;
    } else {
      etherscanTxs = this.filterEtherscanTxs(results,enabledTokens);

      // Store filtered txs
      if (etherscanTxs.length && etherscanEndpoint){
        const cachedRequestData = {
          data:{
            result:etherscanTxs
          }
        };
        this.saveCachedRequest(etherscanEndpoint,false,cachedRequestData);

        // Merge base etherscan endpoint with new data
        if (etherscanEndpoint !== etherscanBaseEndpoint){
          let etherscanBaseTxs = this.getCachedRequest(etherscanBaseEndpoint);
          if (etherscanBaseTxs){
            etherscanBaseTxs = etherscanBaseTxs.data.result;

            let updateBaseTxs = false;
            etherscanTxs.forEach((tx) => {
              const txFound = etherscanBaseTxs.find(t => { return t.hash.toLowerCase() === tx.hash.toLowerCase(); });
              if (!txFound){
                // console.log('Add tx ',tx,'to base etherscan txs');
                etherscanBaseTxs.push(tx);
                updateBaseTxs = true;
              }
            });

            if (updateBaseTxs){
              const newEtherscanBaseTxs = {
                data:{
                  result:etherscanBaseTxs
                }
              };
              this.saveCachedRequest(etherscanBaseEndpoint,false,newEtherscanBaseTxs);
            }
          }
        }
      }
    }

    return etherscanTxs;
  }
  filterEtherscanTxs = (results,tokens=[]) => {
    if (!results || !results.length){
      return [];
    }

    if (!tokens || !tokens.length){
      tokens = Object.keys(this.props.availableTokens);
    }

    const etherscanTxs = {};

    tokens.forEach(token => {
      const tokenConfig = this.props.availableTokens[token];
      const migrationContractAddr = tokenConfig.migration && tokenConfig.migration.migrationContract ? tokenConfig.migration.migrationContract.address : null;
      const migrationContractOldAddrs = tokenConfig.migration && tokenConfig.migration.migrationContract && tokenConfig.migration.migrationContract.oldAddresses ? tokenConfig.migration.migrationContract.oldAddresses : [];

      results.forEach(
        tx => {
          let tokenDecimals = tokenConfig.decimals;
          const internalTxs = results.filter(r => r.hash === tx.hash);
          const isSendTransferTx = internalTxs.length === 1 && tx.from.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === tokenConfig.idle.address.toLowerCase();
          const isReceiveTransferTx = internalTxs.length === 1 && tx.to.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === tokenConfig.idle.address.toLowerCase();
          const isMigrationTx = migrationContractAddr && (tx.from.toLowerCase() === migrationContractAddr.toLowerCase() || migrationContractOldAddrs.map((v) => { return v.toLowerCase(); }).indexOf(tx.from.toLowerCase()) !== -1 ) && tx.contractAddress.toLowerCase() === tokenConfig.idle.address.toLowerCase();
          const isRightToken = internalTxs.length>1 && internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === tokenConfig.address.toLowerCase()).length>0;
          const isDepositTx = isRightToken && !isMigrationTx && tx.from.toLowerCase() === this.props.account.toLowerCase() && tx.to.toLowerCase() === tokenConfig.idle.address.toLowerCase();
          const isRedeemTx = isRightToken && !isMigrationTx && tx.contractAddress.toLowerCase() === tokenConfig.address.toLowerCase() && internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === tokenConfig.idle.address.toLowerCase()).length && tx.to.toLowerCase() === this.props.account.toLowerCase();
          const isSwapTx = !isReceiveTransferTx && !etherscanTxs[tx.hash] && tx.to.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === tokenConfig.idle.address.toLowerCase();
          const isWithdrawTx = internalTxs.length>1 && internalTxs.filter(iTx => tokenConfig.protocols.map(p => p.address.toLowerCase()).includes(iTx.contractAddress.toLowerCase()) ).length>0 && tx.contractAddress.toLowerCase() === tokenConfig.idle.address.toLowerCase();

          if (isSendTransferTx || isReceiveTransferTx || isMigrationTx || isDepositTx || isRedeemTx || isSwapTx || isWithdrawTx){
            
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
            } else if (isWithdrawTx){
              action = 'Withdraw';
              tokenDecimals = 18;
            }

            if (etherscanTxs[tx.hash]){
              const newValue = etherscanTxs[tx.hash].value.plus(this.fixTokenDecimals(tx.value,tokenDecimals));
              // console.log(action,token,tokenDecimals,newValue.toString());
              etherscanTxs[tx.hash].value = newValue;
            } else {
              // console.log(action,token,tokenDecimals,tx.value,this.fixTokenDecimals(tx.value,tokenDecimals).toString());
              etherscanTxs[tx.hash] = ({...tx, token, action, value: this.fixTokenDecimals(tx.value,tokenDecimals)});
            }
          }
        }
      )
    });

    return Object.values(etherscanTxs);
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
    return false;
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
  simpleIDPassUserInfo = (userInfo,simpleID) => {
    if (!userInfo.address && this.props.account){
      userInfo.address = this.props.account;
    }
    if (!userInfo.walletProvider){
      userInfo.walletProvider = localStorage && localStorage.getItem('walletProvider') ? localStorage.getItem('walletProvider') : 'Infura'
    }
    if (typeof userInfo.email !== 'undefined' && !userInfo.email){
      delete userInfo.email;
    }
    if (!userInfo.address){
      return false;
    }
    simpleID = simpleID ? simpleID : (this.props.simpleID ? this.props.simpleID : this.props.initSimpleID());
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
  getTokenApiData = async (address,startTimestamp=null,endTimestamp=null) => {
    const apiInfo = globalConfigs.stats.rates;
    let endpoint = `${apiInfo.endpoint}${address}`;
    if (startTimestamp || endTimestamp){
      const params = [];
      if (startTimestamp && parseInt(startTimestamp)){
        const start = startTimestamp-(60*60*24*2); // Minus 1 day for Volume graph
        params.push(`start=${start}`);
      }
      if (endTimestamp && parseInt(endTimestamp)){
        params.push(`end=${endTimestamp}`);
      }
      endpoint += '?'+params.join('&');
    }
    const TTL = apiInfo.TTL ? apiInfo.TTL : 0;
    let output = await this.makeCachedRequest(endpoint,TTL,true);
    if (!output){
      return [];
    }
    return output;
  }
  getTokenDecimals = async (contractName) => {
    contractName = contractName ? contractName : this.props.selectedToken;
    return await this.genericContractCall(contractName,'decimals');
  }
  getAvgApr = (aprs,allocations,totalAllocation) => {
    if (aprs && allocations && totalAllocation){
      let avgApr = Object.keys(allocations).reduce((aprWeighted,protocolAddr) => {
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
  normalizeTokenAmount = (tokenBalance,tokenDecimals) => {
    let amount = this.BNify(tokenBalance).times(this.BNify(Math.pow(10,parseInt(tokenDecimals)).toString()));
    return amount.toFixed(0);
  }
  fixTokenDecimals = (tokenBalance,tokenDecimals,exchangeRate) => {
    let balance = this.BNify(tokenBalance).div(this.BNify(Math.pow(10,parseInt(tokenDecimals)).toString()));
    if (exchangeRate){
      balance = balance.times(exchangeRate);
    }
    return balance;
  }
  getStoredItem = (key,parse_json=true,return_default=null) => {
    let output = return_default;
    if (window.localStorage){
      const item = localStorage.getItem('transactions');
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
  setLocalStorage = (key,value) => {
    if (window.localStorage){
      try {
        window.localStorage.setItem(key,value);
        return true;
      } catch (error) {
        window.localStorage.removeItem(key);
      }
    }
    return false;
  }
  checkTokenApproved = async (token,contractAddr,walletAddr) => {
    const value = this.props.web3.utils.toWei('0','ether');
    const allowance = await this.getAllowance(token,contractAddr,walletAddr);
    if (allowance){
      this.customLog('checkTokenApproved',token,contractAddr,walletAddr,allowance);
    }
    return allowance && this.BNify(allowance).gt(this.BNify(value.toString()));
  }
  getAllowance = async (token,contractAddr,walletAddr) => {
    if (!token || !contractAddr || !walletAddr){
      return false;
    }
    this.customLog('getAllowance',token,contractAddr,walletAddr);
    return await this.genericContractCall(
      token, 'allowance', [walletAddr, contractAddr]
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
  getIdleTokenPrice = async (tokenConfig,blockNumber='latest') => {
    const tokenPrice = await this.genericContractCall(tokenConfig.idle.token,'tokenPrice',[],{},blockNumber);
    return this.fixTokenDecimals(tokenPrice,tokenConfig.decimals);
  }
  getTokenBalance = async (contractName,address) => {
    let tokenBalanceOrig = await this.getContractBalance(contractName,address);
    if (tokenBalanceOrig){
      const tokenDecimals = await this.getTokenDecimals(contractName);
      const tokenBalance = this.fixTokenDecimals(tokenBalanceOrig,tokenDecimals);
      this.customLog('getTokenBalance',contractName,tokenBalanceOrig,tokenBalance.toString(),tokenDecimals);
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
        this.getProtocolBalance(contractName),
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
  /*
  Get idleTokens aggregated APR
  */
  getTokenAprs = async (tokenConfig,tokenAllocation=false) => {
    const Aprs = await this.genericIdleCall('getAPRs');

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
    let newValue = parseFloat(value);
    const suffixes = ["", "K", "M", "B","T"];
    let suffixNum = 0;
    while (newValue >= 1000) {
      newValue /= 1000;
      suffixNum++;
    }

    maxPrecision = Math.max(1,maxPrecision);
    newValue = newValue.toFixed(decimals);
    if (parseFloat(newValue)>=1 && (newValue.length-1)>maxPrecision){
      newValue = parseFloat(newValue).toPrecision(maxPrecision);
    } else if ((newValue.length-1)<minPrecision) {
      newValue = parseFloat(newValue).toPrecision(minPrecision);
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