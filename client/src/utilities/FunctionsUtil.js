import React from "react";
import axios from 'axios';
import moment from 'moment';
import { Text } from "rimble-ui";
import BigNumber from 'bignumber.js';
import globalConfigs from '../configs/globalConfigs';

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
  strToMoment = date => {
    return moment(date);
  }
  stripHtml = (html) => {
     var tmp = document.createElement("DIV");
     tmp.innerHTML = html;
     return tmp.textContent || tmp.innerText || "";
  }
  filterEtherscanTxs = (results) => {
    if (!results || !results.length){
      return [];
    }

    const tokenDecimals = this.props.tokenConfig.decimals;
    const migrationContractAddr = this.props.tokenConfig.migration && this.props.tokenConfig.migration.migrationContract ? this.props.tokenConfig.migration.migrationContract.address : null;
    const migrationContractOldAddrs = this.props.tokenConfig.migration && this.props.tokenConfig.migration.migrationContract && this.props.tokenConfig.migration.migrationContract.oldAddresses ? this.props.tokenConfig.migration.migrationContract.oldAddresses : [];
    const etherscanTxs = {};
    results.filter(
      tx => {
        const internalTxs = results.filter(r => r.hash === tx.hash);
        const isSendTransferTx = internalTxs.length === 1 && tx.from.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
        const isReceiveTransferTx = internalTxs.length === 1 && tx.to.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
        const isMigrationTx = migrationContractAddr && (tx.from.toLowerCase() === migrationContractAddr.toLowerCase() || migrationContractOldAddrs.map((v) => { return v.toLowerCase(); }).indexOf(tx.from.toLowerCase()) !== -1 ) && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
        const isRightToken = internalTxs.length>1 && internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === this.props.tokenConfig.address.toLowerCase()).length;
        const isDepositTx = isRightToken && !isMigrationTx && tx.from.toLowerCase() === this.props.account.toLowerCase() && tx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
        const isRedeemTx = isRightToken && !isMigrationTx && tx.contractAddress.toLowerCase() === this.props.tokenConfig.address.toLowerCase() && internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase()).length && tx.to.toLowerCase() === this.props.account.toLowerCase();
        return isSendTransferTx || isReceiveTransferTx || isMigrationTx || isDepositTx || isRedeemTx;
      }
    ).forEach(tx => {
      if (etherscanTxs[tx.hash]){
        etherscanTxs[tx.hash].value = etherscanTxs[tx.hash].value.plus(this.fixTokenDecimals(tx.value,tokenDecimals));
      } else {
        etherscanTxs[tx.hash] = ({...tx, value: this.fixTokenDecimals(tx.value,tokenDecimals)});
      }
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
  getEtherscanTxs = async (address,TTL) => {
    const etherscanInfo = globalConfigs.network.providers.etherscan;
    const etherscanApiUrl = etherscanInfo.endpoints[globalConfigs.network.requiredNetwork];
    const endpoint = `${etherscanApiUrl}?apikey=${env.REACT_APP_ETHERSCAN_KEY}&module=account&action=tokentx&address=${address}&startblock=0&endblock=999999999&sort=asc`;
    const txs = await this.makeCachedRequest(endpoint,TTL,true);
    if (txs && txs.result){
      return txs.result;
    }
    return null;
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