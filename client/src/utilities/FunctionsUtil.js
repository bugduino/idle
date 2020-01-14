import moment from 'moment';
import BigNumber from 'bignumber.js';
class FunctionsUtil {

  // Attributes
  props = {};
  LOG_ENABLED = true;

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
    return this.props.web3.utils.fromWei(
      (wei || 0).toString(),
      "ether"
    );
  }
  toWei = eth => {
    return this.props.web3.utils.toWei(
      (eth || 0).toString(),
      "ether"
    );
  }
  BNify = s => new BigNumber(String(s))
  customLog = (...props) => { if (this.LOG_ENABLED) console.log(moment().format('HH:mm:ss'),...props); }
  customLogError = (...props) => { if (this.LOG_ENABLED) console.error(moment().format('HH:mm:ss'),...props); }
  getContractByName = (contractName) => {
    const contract = this.props.contracts.find(c => c.name === contractName);
    if (!contract) {
      return false;
    }
    return contract.contract;
  }
  getTokenDecimals = async (contractName) => {
    contractName = contractName ? contractName : this.props.selectedToken;
    return await this.genericContractCall(contractName,'decimals');
  }
  getProtocolInfoByAddress = (addr) => {
    return this.props.tokenConfig.protocols.find(c => c.address === addr);
  }
  normalizeTokenAmount = (tokenBalance,tokenDecimals) => {
    let amount = this.BNify(tokenBalance.toString()).times(this.BNify(Math.pow(10,parseInt(tokenDecimals)).toString()));
    return amount.toFixed(0);
  }
  fixTokenDecimals = (tokenBalance,tokenDecimals,exchangeRate) => {
    let balance = this.BNify(tokenBalance.toString()).div(this.BNify(Math.pow(10,parseInt(tokenDecimals)).toString()));
    if (exchangeRate){
      balance = balance.times(exchangeRate);
    }
    return balance;
  }
  checkTokenApproved = async (token,contractAddr,walletAddr) => {
    const value = this.props.web3.utils.toWei('0','ether');
    const allowance = await this.getAllowance(token,contractAddr,walletAddr);
    if (allowance){
      console.log('checkTokenApproved',token,contractAddr,walletAddr,allowance);
    }
    return allowance && this.BNify(allowance).gt(this.BNify(value.toString()));
  }
  getAllowance = async (token,contractAddr,walletAddr) => {
    console.log('getAllowance',token,contractAddr,walletAddr);
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
      this.customLogError('Error on getting balance');
    }
    return null;
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
  genericContractCall = async (contractName, methodName, params = [], callParams = {}) => {
    let contract = this.getContractByName(contractName);

    if (!contract) {
      this.customLogError('Wrong contract name', contractName);
      return null;
    }

    const value = await contract.methods[methodName](...params).call(callParams).catch(error => {
      this.customLogError(`${contractName} contract method ${methodName} error: `, error);
    });

    return value;
  }
  asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }
};

export default FunctionsUtil;