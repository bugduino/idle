import moment from 'moment';
import BigNumber from 'bignumber.js';
class FunctionsUtil {
  // Attributes
  props = {};
  LOG_ENABLED = true;

  // Constructor
  constructor(props){
    this.props = props;
  }

  // Methods
  trimEth = eth => {
    return this.BNify(eth).toFixed(6);
  };
  toEth = wei => {
    return this.props.web3.utils.fromWei(
      (wei || 0).toString(),
      "ether"
    );
  };
  toWei = eth => {
    return this.props.web3.utils.toWei(
      (eth || 0).toString(),
      "ether"
    );
  };
  BNify = s => new BigNumber(String(s));
  customLog = (...props) => { if (this.LOG_ENABLED) console.log(moment().format('HH:mm:ss'),...props); };
  customLogError = (...props) => { if (this.LOG_ENABLED) console.error(moment().format('HH:mm:ss'),...props); };
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
  };
  getProtocolInfoByAddress = (addr) => {
    return this.props.tokenConfig.protocols.find(c => c.address === addr);
  };
  getProtocolBalance = async (contractName) => {
    return await this.genericContractCall(contractName, 'balanceOf', [this.props.tokenConfig.idle.address]);
  };
  genericIdleCall = async (methodName, params = []) => {
    return await this.genericContractCall(this.props.tokenConfig.idle.token, methodName, params).catch(err => {
      this.customLogError('Generic Idle call err:', err);
    });
  }
  genericContractCall = async (contractName, methodName, params = []) => {
    let contract = this.getContractByName(contractName);

    if (!contract) {
      this.customLogError('Wrong contract name', contractName);
      return false;
    }

    const value = await contract.methods[methodName](...params).call().catch(error => {
      this.customLogError(`${contractName} contract method ${methodName} error: `, error);
    });

    return value;
  };
  fixTokenDecimals = (tokenBalance,tokenDecimals,exchangeRate) => {
    let balance = this.BNify(tokenBalance.toString()).div(this.BNify(Math.pow(10,parseInt(tokenDecimals)).toString()));
    if (exchangeRate){
      balance = balance.times(exchangeRate);
    }
    return balance;
  };
  asyncForEach = async (array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  };
};

export default FunctionsUtil;