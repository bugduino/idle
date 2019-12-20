import styles from './SmartContractControls.module.scss';
import React from "react";
import { Form, Flex, Box, Heading, Text, Button, Link, Icon, Pill, Loader, Image, Tooltip } from "rimble-ui";
import BigNumber from 'bignumber.js';
import TxProgressBar from '../TxProgressBar/TxProgressBar.js';
import CryptoInput from '../CryptoInput/CryptoInput.js';
import ApproveModal from "../utilities/components/ApproveModal";
import WelcomeModal from "../utilities/components/WelcomeModal";
import MaxCapModal from "../utilities/components/MaxCapModal";
import axios from 'axios';
import moment from 'moment';
import CountUp from 'react-countup';
import jQuery from 'jquery';
import globalConfigs from '../configs/globalConfigs';

const env = process.env;

// mainnet
const OldIdleAddress = '0x10cf8e1CDba9A2Bd98b87000BCAdb002b13eA525'; // v0.1 hackathon version

const daysInYear = 365.2422;
let componentUnmounted;

const LOG_ENABLED = true;
const customLog = (...props) => { if (LOG_ENABLED) console.log(moment().format('HH:mm:ss'),...props); };
const customLogError = (...props) => { if (LOG_ENABLED) console.error(moment().format('HH:mm:ss'),...props); };

class SmartContractControls extends React.Component {
  state = {
    iDAIRate: 0,
    cDAIRate: 0,
    cDAIToRedeem: 0,
    partialRedeemEnabled: false,
    disableLendButton: false,
    disableRedeemButton: false,
    welcomeIsOpen: false,
    approveIsOpen: false,
    capReached: false,
    showFundsInfo:true,
    isApprovingToken:false,
    isApprovingDAITest: true,
    redeemProcessing: false,
    lendingProcessing: false,
    tokenBalance: this.props.accountBalanceToken,
    tokenName: 'DAI',
    baseTokenName: 'DAI',
    lendAmount: '',
    redeemAmount: '',
    updateInProgress: false,
    needsUpdate: false,
    genericError: null,
    genericErrorRedeem: null,
    buyTokenMessage:null,
    selectedTab: '1',
    amountLent: null,
    IdleDAISupply: null,
    idleDAICap: 30000,
    earning: null,
    earningIntervalId: null,
    earningPerDay: null,
    earningPerYear: null,
    tokenBalanceBNify: null,
    maxRate: '-',
    calculataingShouldRebalance: true,
    fundsTimeoutID: null,
    idleTokenBalance: null,
    executedTxs:null,
    lendingTx: null,
    redeemTx: null,
    approveTx: null,
    fundsError: false,
    showEmptyWalletOverlay:true,
    prevTxs : null,
    transactions:{}
  };

  addResources = () => {
    
    if (!document.getElementById('script_0x_overlay_click')){
      const script_0x_overlay_click = document.createElement("script");
      script_0x_overlay_click.id = 'script_0x_overlay_click';
      script_0x_overlay_click.type = 'text/javascript';
      script_0x_overlay_click.innerHTML = `
      window.jQuery(document).on('click', '.zeroExInstantOverlay', function (e) {
          const $target = window.jQuery(e.target);
          const isOverlay = window.jQuery($target.parents()[0]).hasClass('zeroExInstantOverlay');
          const isCloseButton = window.jQuery($target.parents()[1]).hasClass('zeroExInstantOverlayCloseButton') || window.jQuery($target.parents()[0]).hasClass('zeroExInstantOverlayCloseButton') || window.jQuery($target.parents()[2]).hasClass('zeroExInstantOverlayCloseButton');
          if (isOverlay || isCloseButton){
            window.zeroExInstant.unrender();
          }
      });
      `;
      document.body.appendChild(script_0x_overlay_click);
    }

    // Add 0x Instant style (mobile)
    if (!document.getElementById('zeroExInstant_style')){
      const style = document.createElement('style');
      style.id = 'zeroExInstant_style';
      style.innerHTML = `
      @media (max-width: 40em){
        .zeroExInstantOverlayCloseButton{
          display: block !important;
          z-index: 99999 !important;
        }
        .zeroExInstantOverlayCloseButton > div{
          padding: 1.3em !important;
        }
      }`;
      document.body.appendChild(style);
    }
  }

  getDefaultTokenSwapper = () => {

    const availableProviders = Object.keys(globalConfigs.payments.providers).filter((i) => { const p = globalConfigs.payments.providers[i]; return p.supportedMethods.indexOf('wallet') !== -1 && p.enabled && p.supportedTokens.indexOf(this.props.selectedToken) !== -1 });

    if (!availableProviders || !availableProviders.length){
      return false;
    }

    // Take the default token payment provider for the wallet method
    const defaultProviderName = globalConfigs.payments.methods.wallet.defaultProvider;
    let defaultProvider = null;
    if (availableProviders.indexOf(defaultProviderName) !== -1){
      defaultProvider = globalConfigs.payments.providers[defaultProviderName];
    // If the default provider is not available pick up the first one available
    } else {
      defaultProvider = globalConfigs.payments.providers[availableProviders[0]];
    }

    const onSuccess = async (tx) => {
      this.setState({
        needsUpdate:true
      });
    };

    const onClose = async (e) => {
      return true;
    }

    const initParams = defaultProvider.getInitParams ? defaultProvider.getInitParams(this.props,globalConfigs,onSuccess,onClose) : null;
    return defaultProvider.render ? (amount) => defaultProvider.render(initParams,amount) : null;
  }

  // utilities
  trimEth = (eth,decimals) => {
    decimals = !isNaN(decimals) ? decimals : 6;
    return this.BNify(eth).toFixed(decimals);
  }

  BNify = s => new BigNumber(String(s))

  toEth(wei) {
    return this.props.web3.utils.fromWei(
      (wei || 0).toString(),
      "ether"
    );
  }

  toWei(eth) {
    return this.props.web3.utils.toWei(
      (eth || 0).toString(),
      "ether"
    );
  }

  rebalanceCheck = async () => {
    this.setState({calculataingShouldRebalance:true});

    const _newAmount = 0;
    const _clientProtocolAmounts = [];
    const shouldRebalance = await this.genericIdleCall('rebalance',[_newAmount,_clientProtocolAmounts]);

    this.setState({
      calculataingShouldRebalance: false,
      shouldRebalance,
      needsUpdate: false
    });
  }

  toggleShowFundsInfo = (e) => {
    e.preventDefault();
    this.setState(state => ({
      ...state,
      showFundsInfo: !state.showFundsInfo
    }));
  }

  togglePartialRedeem = () => {
    this.setState(state => ({
      ...state,
      partialRedeemEnabled: !state.partialRedeemEnabled
    }));
  }

  asyncForEach = async(array, callback) => {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  getAllocations = async () => {
    const allocations = {};


    await this.asyncForEach(this.props.tokenConfig.protocols,async (info,i) => {
      const contractName = info.token;
      const protocolAddr = info.address;
      const protocolBalance = await this.getProtocolBalance(contractName);
      allocations[protocolAddr] = protocolBalance;
    });

    customLog('getAllocations',allocations);

    this.setState({
      allocations
    });
  }

  getAprs = async () => {
    const Aprs = await this.genericIdleCall('getAPRs');

    if (componentUnmounted){
      return false;
    }

    if (!Aprs){
      setTimeout(() => {
        this.getAprs();
      },5000);
      return false;
    }

    const aprs = Aprs.aprs;

    const maxRate = Math.max(...aprs);
    const currentRate = maxRate;
    const currentProtocol = '';

    this.setState({
      maxRate: aprs ? ((+this.toEth(maxRate)).toFixed(2)) : '0.00',
      needsUpdate: false,
      currentProtocol,
      currentRate
    });
  };

  getCurrentProtocol = async (bestToken) => {
    bestToken = bestToken ? bestToken : await this.genericIdleCall('bestToken');
    if (bestToken){
      return bestToken.toString().toLowerCase() === this.props.tokenConfig.protocols[0].address ? 'Compound' : 'Fulcrum';
    }
    return false;
  }
  getPriceInToken = async (contractName) => {
    const totalIdleSupply = await this.genericContractCall(contractName, 'totalSupply');
    let price = await this.genericContractCall(contractName, 'tokenPrice');
    const navPool = this.BNify(totalIdleSupply).div(1e18).times(this.BNify(price).div(1e18));
    // customLog('getPriceInToken',totalIdleSupply.toString(),price.toString(),navPool.toString());
    this.setState({
      idleTokenPrice: (totalIdleSupply || totalIdleSupply === 0) && totalIdleSupply.toString() === '0' ? 0 : (+this.toEth(price)),
      navPool: navPool,
      needsUpdate: false
    });
    return price;
  };
  getTotalSupply = async (contractName) => {
    const totalSupply = await this.genericContractCall(contractName, 'totalSupply');
    this.setState({
      [`${contractName}Supply`]: totalSupply,
      needsUpdate: false
    });
    return totalSupply;
  };
  getOldPriceInToken = async (contractName) => {
    const totalIdleSupply = await this.genericContractCall(contractName, 'totalSupply');
    let price = await this.genericContractCall(contractName, 'tokenPrice');
    this.setState({
      [`OldIdleDAIPrice`]: (totalIdleSupply || totalIdleSupply === 0) && totalIdleSupply.toString() === '0' ? 0 : (+this.toEth(price)),
      needsUpdate: false
    });
    return price;
  };

  getTokenDecimals = async () => {
    return await this.genericContractCall(this.props.selectedToken,'decimals');
  }

  getTokenBalance = async () => {
    if (this.props.account){
      let tokenBalance = await this.genericContractCall(this.props.selectedToken,'balanceOf',[this.props.account]);
      if (tokenBalance){
        const tokenDecimals = await this.getTokenDecimals();
        tokenBalance = this.BNify(tokenBalance.toString()).div(this.BNify(Math.pow(10,parseInt(tokenDecimals)).toString()));
        customLog('getTokenBalance',tokenBalance.toString(),tokenDecimals,this.BNify(tokenBalance.toString()).div(this.BNify(Math.pow(10,parseInt(tokenDecimals)).toString())).toString());
        this.setState({
          tokenDecimals,
          tokenBalance: tokenBalance.toString()
        });
        return tokenBalance;
      } else {
        console.error('Error on getting balance');
      }
    }
    return null;
  };
  reloadFunds = async(e) => {
    localStorage.removeItem(`transactions_${this.props.selectedToken}`);
    e.preventDefault();
    this.getBalanceOf(this.props.tokenConfig.idle.token);
  }

  getProtocolBalance = async (contractName) => {
    return await this.genericContractCall(contractName, 'balanceOf', [this.props.tokenConfig.idle.address]);
  }

  getBalanceOf = async (contractName,count) => {
    count = count ? count : 0;

    if (count===3){
      this.setState({
        fundsError:true
      });
      return false;
    }

    // Update balance in AccountOverview
    await this.props.getAccountBalance();

    let price = await this.getPriceInToken(contractName);
    let balance = await this.genericContractCall(contractName, 'balanceOf', [this.props.account]);

    customLog('getBalanceOf',balance);

    if (balance) {

      balance = this.BNify(balance).div(1e18);
      price = this.BNify(price).div(1e18);
      const tokenToRedeem = balance.times(price);
      let earning = 0;

      // customLog('BalanceOf','tokenToRedeem',tokenToRedeem.toString(),'amountLent',this.state.amountLent.toString());

      if (this.state.amountLent && this.trimEth(this.state.amountLent.toString())>0 && this.trimEth(tokenToRedeem.toString())>0 && parseFloat(tokenToRedeem.toString())<parseFloat(this.state.amountLent.toString())){
        customLogError('Balance '+this.trimEth(tokenToRedeem.toString())+' is less than AmountLent ('+this.trimEth(this.state.amountLent.toString())+').. try again');
        if (componentUnmounted){
          return false;
        }
        setTimeout(async () => {
          await this.getPrevTxs();
          this.getBalanceOf(contractName,count+1);
        },10000);
        return false;
      }

      if (this.BNify(tokenToRedeem).gt(this.BNify(this.state.amountLent))){
        earning = tokenToRedeem.minus(this.BNify(this.state.amountLent));
      }

      // customLog('earning',earning.toString());

      const redirectToFundsAfterLogged = localStorage ? parseInt(localStorage.getItem('redirectToFundsAfterLogged')) : true;

      // Select seconds Tab
      if (balance.gt(0) && !this.state.tokenToRedeemParsed && redirectToFundsAfterLogged){
        this.selectTab({ preventDefault:()=>{} },'2');
      }

      if (localStorage){
        localStorage.removeItem('redirectToFundsAfterLogged');
      }

      const currentApr = this.BNify(this.state.maxRate).div(100);
      const earningPerYear = tokenToRedeem.times(currentApr);
      const earningPerDay = earningPerYear.div(365);

      customLog('getBalanceOf',balance.toString(),tokenToRedeem.toString(),this.state.amountLent,earning,currentApr,earningPerYear);

      return this.setState({
        fundsError:false,
        [`balanceOf${contractName}`]: balance,
        tokenToRedeemParsed: tokenToRedeem.toString(),
        tokenBalanceBNify:balance,
        idleTokenBalance:balance.toString(),
        currentApr,
        tokenToRedeem,
        earning,
        earningPerDay,
        earningPerYear
      });
    }

    return balance;
  };

  getOldBalanceOf = async contractName => {
    let price = await this.getOldPriceInToken(contractName);
    let balance = await this.genericContractCall(contractName, 'balanceOf', [this.props.account]);
    if (balance) {
      balance = this.BNify(balance).div(1e18);
      price = this.BNify(price).div(1e18);
      const tokenToRedeem = balance.times(price);
      let earning = 0;

      if (this.state.amountLent){
        earning = tokenToRedeem.minus(this.BNify(this.state.amountLent));
      }
      this.setState({
        [`balanceOf${contractName}`]: balance,
        [`oldDAIToRedeem`]: tokenToRedeem.toString(),
        oldEarning: earning,
        needsUpdate: false
      });
    }
    return balance;
  };

  // should be called with DAI contract as params
  getAllowance = async contractName => {
    let allowance = await this.genericContractCall(
      contractName, 'allowance', [this.props.account, this.props.tokenConfig.idle.address]
    );
    if (allowance) {
      this.setState({
        [`${contractName}Allowance`]: allowance
      });
    }
    return allowance;
  };

  genericContractCall = async (contractName, methodName, params = []) => {
    let contract = this.props.contracts.find(c => c.name === contractName);
    contract = contract && contract.contract;
    if (!contract) {
      customLog('Wrong contract name', contractName);
      return;
    }

    const value = await contract.methods[methodName](...params).call().catch(error => {
      customLog(`${contractName} contract method ${methodName} error: `, error);
      this.setState({ error });
    });
    return value;
  }

  // Idle
  genericIdleCall = async (methodName, params = []) => {
    // console.log('genericIdleCall',this.props.tokenConfig.idle.token, methodName, params);
    return await this.genericContractCall(this.props.tokenConfig.idle.token, methodName, params).catch(err => {
      customLogError('Generic Idle call err:', err);
    });
  }

  hideEmptyWalletOverlay = e => {
    e.preventDefault();
    this.setState({
      showEmptyWalletOverlay: false
    });
  }

  disableERC20 = (e, name) => {
    e.preventDefault();
    // No need for callback atm
    this.props.contractMethodSendWrapper(name, 'approve', [
      this.props.tokenConfig.idle.address,
      0 // Disapprova
    ],null,(tx)=>{
      this.setState({
        isApprovingToken: false,
        approveTx:null,
        [`isApproving${name}`]: false, // TODO when set to false?
      });
    }, (tx) => {
      // this.addTransaction(tx);
      this.setState({
        approveTx: tx
      });
    });

    this.setState({
      isApprovingToken: true,
      [`isApproving${name}`]: true, // TODO when set to false?
      approveIsOpen: false
    });
  };

  checkTransactionMined = (tx) => {
    let transaction = this.props.transactions[tx.created];
    return transaction && transaction.status === 'success' && transaction.confirmationCount>1;
  }

  /*
  deleteTransaction = (tx) => {
    let transactions = this.state.transactions;
    if (transactions[tx.transactionHash]){
      delete transactions[tx.transactionHash];
      if (localStorage){
        localStorage.setItem(`transactions_${this.props.selectedToken}`,JSON.stringify(transactions));
      }
      return this.setState({
        transactions
      });
    }
  }

  addTransaction = (tx,update) => {
    update = update ? update : false;
    let transactions = this.state.transactions;
    if (!transactions[tx.transactionHash] || update){
      // customLog('addTransaction',tx.transactionHash,tx.status);
      transactions[tx.transactionHash] = tx;
      if (localStorage){
        localStorage.setItem(`transactions_${this.props.selectedToken}`,JSON.stringify(transactions));
      }
      return this.setState({
        transactions
      });
    }
    return null;
  }
  */

  enableERC20 = (e, token) => {
    e.preventDefault();
    // No need for callback atm
    this.props.contractMethodSendWrapper(token, 'approve', [
      this.props.tokenConfig.idle.address,
      this.props.web3.utils.toTwosComplement('-1') // max uint solidity
      // this.props.web3.utils.BN(0) // Disapprova
    ],null,(tx)=>{
      this.setState({
        isApprovingToken: false,
        [`isApproving${token}`]: false, // TODO when set to false?
        'needsUpdate': true,
        approveTx:null,
      });
    }, (tx) => {
      // this.addTransaction(tx);
      this.setState({
        approveTx: tx
      });
    });

    this.setState({
      isApprovingToken: true,
      [`isApproving${token}`]: true, // TODO when set to false?
      approveIsOpen: false
    });
  };

  rebalance = e => {
    e.preventDefault();

    this.setState(state => ({
      ...state,
      rebalanceProcessing: this.props.account ? true : false
    }));

    const _newAmount = 0;
    const _clientProtocolAmounts = [];

    this.props.contractMethodSendWrapper(this.props.tokenConfig.idle.token, 'rebalance', [ _newAmount, _clientProtocolAmounts ], null , (tx) => {
      const needsUpdate = tx.status === 'success' && !this.checkTransactionMined(tx);
      this.setState({
        needsUpdate: needsUpdate,
        rebalanceProcessing: false
      });
    });
  };

  checkTokenApproved = async () => {
    if (this.props.account) {
      const value = this.props.web3.utils.toWei('0','ether');
      const allowance = await this.getAllowance(this.props.selectedToken); // DAI
      const tokenApproved = this.BNify(allowance).gt(this.BNify(value.toString()));
      customLog('checkTokenApproved',value,allowance.toString(),tokenApproved);
      return this.setState({
        isTokenApproved: tokenApproved,
        [`is${this.props.selectedToken}Approved`]: tokenApproved
      });
    }
    return null;
  }

  mint = async (e, contractName) => {
    if (this.state[`isApprovingDAI`]){
      return false;
    }

    e.preventDefault();
    if (this.props.account && !this.state.lendAmount) {
      return this.setState({genericError: `Please insert an amount of ${this.props.selectedToken} to lend`});
    }

    const value = this.props.web3.utils.toWei(
      this.state.lendAmount || '0',
      "ether"
    );

    const IdleDAISupply = this.BNify(this.state.IdleDAISupply).div(1e18);
    const idleTokenPrice = this.BNify(this.state.idleTokenPrice);
    const toMint = this.BNify(value).div(1e18).div(idleTokenPrice);
    const newTotalSupply = toMint.plus(IdleDAISupply);
    const idleDAICap = this.BNify(this.state.idleDAICap);

    if (this.props.account && newTotalSupply.gt(idleDAICap)) {
      this.setState({capReached: true});
      return;
    }

    // check if Idle is approved for DAI
    if (this.props.account && !this.state.isTokenApproved) {
      return this.setState({approveIsOpen: true});
    }

    if (localStorage){
      localStorage.setItem('redirectToFundsAfterLogged',0);
    }

    const _clientProtocolAmounts = [];

    // No need for callback atm
    this.props.contractMethodSendWrapper(this.props.tokenConfig.idle.token, 'mintIdleToken', [
      value, _clientProtocolAmounts // _clientProtocolAmounts
    ], null, (tx) => {
      const txSucceeded = tx.status === 'success';
      const needsUpdate = txSucceeded && !this.checkTransactionMined(tx);
      customLog('mintIdleToken_callback needsUpdate:',tx.status,this.checkTransactionMined(tx),needsUpdate);
      if (txSucceeded){
        this.selectTab({ preventDefault:()=>{} },'2');
      }
      this.setState({
        lendingProcessing: false,
        [`isLoading${contractName}`]: false,
        lendingTx:null,
        needsUpdate
      });
    }, (tx) => {
      // this.addTransaction(tx);
      this.setState({
        lendingTx: tx
      });
    });

    this.setState({
      [`isLoading${contractName}`]: false,
      lendingProcessing: this.props.account,
      lendAmount: '',
      genericError: '',
    });
  };

  redeem = async (e, contractName) => {
    e.preventDefault();

    // let IdleDAIBalance = this.toWei('0');
    // if (this.props.account) {
    //   IdleDAIBalance = await this.genericContractCall(contractName, 'balanceOf', [this.props.account]);
    // }

    // Check if amount is more than 0
    let amount = document.getElementById('CryptoInput_Redeem').value;
    if (!amount.toString().length || this.BNify(amount).lte(0)) {
      return this.setState({
        disableRedeemButton:true,
        genericErrorRedeem:`Please insert an amount of ${this.props.selectedToken} to redeem`
      });
    }

    this.setState(state => ({
      ...state,
      disableRedeemButton:false,
      genericErrorRedeem:'',
      [`isLoading${contractName}`]: true,
      redeemProcessing: true
    }));

    let idleTokenToRedeem = this.props.web3.utils.toWei(
      this.state.redeemAmount || '0',
      "ether"
    );

    customLog('redeem',idleTokenToRedeem);

    const _skipRebalance = false;
    const _clientProtocolAmounts = [];

    this.props.contractMethodSendWrapper(contractName, 'redeemIdleToken', [
      idleTokenToRedeem, _skipRebalance, _clientProtocolAmounts
    ], null, (tx) => {
      const needsUpdate = tx.status === 'success' && !this.checkTransactionMined(tx);
      customLog('redeemIdleToken_mined_callback needsUpdate:',tx.status,this.checkTransactionMined(tx),needsUpdate);
      this.setState({
        [`isLoading${contractName}`]: false,
        redeemProcessing: false,
        redeemTx:null,
        needsUpdate
      });
    }, (tx) => {
      customLog('redeemIdleToken_receipt_callback',tx.transactionHash,tx.status);
      // this.addTransaction(tx);
      this.setState({
        redeemTx: tx
      });
    });
  };

  useEntireBalanceRedeem = (balance) => {
    // this.setState({ redeemAmount: balance.toString() });
    this.handleChangeAmountRedeem({
      target:{
        value: balance.toString()
      }
    });
  }

  useEntireBalance = (balance) => {
    // this.setState({ lendAmount: balance.toString() });
    this.handleChangeAmount({
      target:{
        value: balance.toString()
      }
    });
  }

  handleChangeAmountRedeem = (e) => {
    if (this.props.account){
      let amount = e.target.value;
      // customLog('handleChangeAmountRedeem',amount,this.state.tokenBalanceBNify);
      this.setState({ redeemAmount: amount });

      let disableRedeemButton = false;
      let genericErrorRedeem = '';

      if (this.props.account) {
        if (this.BNify(amount).gt(this.BNify(this.state.tokenBalanceBNify))){
          disableRedeemButton = true;
          genericErrorRedeem = 'The inserted amount exceeds your redeemable balance';
        } else if (this.BNify(amount).lte(0)) {
          disableRedeemButton = true;
          genericErrorRedeem = `Please insert an amount of ${this.props.selectedToken} to redeem`;
        }
      }

      return this.setState({
        disableRedeemButton,
        genericErrorRedeem
      });
    } else {
      this.redeem(e);
    }
  }

  handleChangeAmount = (e) => {
    if (this.props.account){
      let amount = e.target.value;
      this.setState({ lendAmount: amount });

      let disableLendButton = false;
      let genericError = '';
      let buyTokenMessage = null;

      if (this.props.account) {
        if (this.BNify(amount).gt(this.BNify(this.state.tokenBalance))){
          disableLendButton = true;
          const defaultTokenSwapper = this.getDefaultTokenSwapper();
          if (defaultTokenSwapper){
            buyTokenMessage = `The inserted amount exceeds your balance. Click here to buy more ${this.props.selectedToken}`;
          } else {
            genericError = `The inserted amount exceeds your ${this.props.selectedToken} balance`;
          }
        } else if (this.BNify(amount).lte(0)) {
          disableLendButton = true;
          genericError = `Please insert an amount of ${this.props.selectedToken} to lend`;
        }
      }

      return this.setState({
        buyTokenMessage,
        disableLendButton,
        genericError
      });
    } else {
      this.mint(e);
    }
  }

  toggleModal = (e) => {
    this.setState(state => ({...state, approveIsOpen: !state.approveIsOpen }));
  }

  toggleMaxCapModal = (e) => {
    this.setState(state => ({...state, capReached: !state.capReached }));
  }

  toggleWelcomeModal = (e) => {
    this.setState(state => ({...state, welcomeIsOpen: !state.welcomeIsOpen }));
  }

  getPrevTxs = async () => {
    // customLog('Call getPrevTxs');
    const txs = await axios.get(`
      https://api.etherscan.io/api?module=account&action=tokentx&address=${this.props.account}&startblock=8119247&endblock=999999999&sort=asc&apikey=${env.REACT_APP_ETHERSCAN_KEY}
    `).catch(err => {
      customLog('Error getting prev txs');
      if (componentUnmounted){
        return false;
      }
      setTimeout(()=>{this.getPrevTxs();},1000);
    });

    if (!txs || !txs.data || !txs.data.result) {
      return this.setState({
        amountLent:0,
        earning:0
      });
    }

    const results = txs.data.result;

    const prevTxs = results.filter(
        tx => {
          const internalTxs = results.filter(r => r.hash === tx.hash);
          const isDepositTx = tx.from.toLowerCase() === this.props.account.toLowerCase() && tx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
          const isRedeemTx = tx.contractAddress.toLowerCase() === this.props.tokenConfig.address.toLowerCase() && internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase()).length && tx.to.toLowerCase() === this.props.account.toLowerCase();

          return tx.tokenSymbol===this.props.selectedToken && (isDepositTx || isRedeemTx);
      }).map(tx => ({...tx, value: this.toEth(tx.value)}));

    let amountLent = this.BNify(0);
    let transactions = {};

    // customLog('prevTxs',prevTxs);

    prevTxs.forEach((tx,index) => {
      // Deposited
      if (tx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase()){
        amountLent = amountLent.plus(this.BNify(tx.value));
        // customLog('Deposited '+parseFloat(tx.value),'AmountLent',amountLent.toString());
      } else if (tx.to.toLowerCase() === this.props.account.toLowerCase()){
        amountLent = amountLent.minus(this.BNify(tx.value));
        if (amountLent.lt(0)){
          amountLent = this.BNify(0);
        }
        // customLog('Redeemed '+parseFloat(tx.value),'AmountLent',amountLent.toString());
      }
      transactions[tx.hash] = tx;
    });

    const minedTxs = localStorage ? JSON.parse(localStorage.getItem(`transactions_${this.props.selectedToken}`)) : this.props.transactions;

    // Add missing executed transactions
    if (minedTxs){

      customLog('getPrevTxs adding minedTxs',minedTxs);

      await this.asyncForEach(Object.keys(minedTxs),async (key,i) => {
        const tx = minedTxs[key];

        // Skip invalid txs
        if (transactions[tx.transactionHash] || tx.status !== 'success' || !tx.transactionHash || (tx.method !== 'mintIdleToken' && tx.method !== 'redeemIdleToken')){
          return;
        }

        const realTx = await (new Promise( async (resolve, reject) => {
          this.props.web3.eth.getTransaction(tx.transactionHash,(err,tx)=>{
            customLog('realTx',tx);
            if (err){
              reject(err);
            }
            resolve(tx);
          });
        }));

        // console.log('realTx',realTx);

        // Skip txs from other wallets
        if (!realTx || realTx.from.toLowerCase() !== this.props.account.toLowerCase()){
          return;
        }

        realTx.contractAddress = this.props.tokenConfig.address;
        realTx.timeStamp = parseInt(tx.created/1000);

        switch (tx.method){
          case 'mintIdleToken':
            realTx.status = 'Deposited';
            realTx.value = tx.params ? this.toEth(tx.params[0]).toString() : 0;
          break;
          case 'redeemIdleToken':
            realTx.status = 'Redeemed';
            realTx.value = tx.params ? (+this.toEth(tx.params[0])*parseFloat(this.state.idleTokenPrice)).toString() : 0;
          break;
          default:
          break;
        }
        realTx.tokenSymbol = this.props.selectedToken;
        realTx.tx = tx;

        customLog('realTx from localStorage:',realTx);

        if (tx.method==='mintIdleToken'){
          amountLent = amountLent.plus(this.BNify(realTx.value));
          customLog('Deposited (localStorage) '+parseFloat(realTx.value),'AmountLent',amountLent.toString());
        } else if (tx.method==='redeemIdleToken'){
          amountLent = amountLent.minus(this.BNify(realTx.value));
          if (amountLent.lt(0)){
            amountLent = this.BNify(0);
          }
          customLog('Redeemed (localStorage) '+parseFloat(realTx.value),'AmountLent',amountLent.toString());
        }

        transactions[realTx.hash] = realTx;

        customLog('getPrevTxs inserted executed tx',transactions[realTx.hash]);
      });
    }

    let earning = this.state.earning;
    if (this.state.tokenToRedeem){
      earning = this.state.tokenToRedeem.minus(amountLent);
    }

    if (amountLent.lt(0)){
      amountLent = this.BNify(0);
    }

    customLog('getPrevTxs',amountLent,earning);

    return this.setState({
      prevTxs: transactions,
      amountLent,
      earning
    });
  };

  // Check for updates to the transactions collection
  processTransactionUpdates = prevTxs => {
    const transactions = this.state.prevTxs || {};
    let update_txs = false;
    let refresh = false;
    let needsUpdate = false; 
    const executedTxs = {};
    if (Object.keys(this.props.transactions).length){
      Object.keys(this.props.transactions).forEach(key => {
        let newTx = this.props.transactions[key];
        // Check if it is a new transaction OR status changed 
        if ((!prevTxs[key] || prevTxs[key].status !== newTx.status)){

          needsUpdate = newTx.status === 'success';
          refresh = needsUpdate || newTx.status === 'error';

          // Delete pending transaction if succeded or error
          if (refresh) {
              if (needsUpdate){
                executedTxs[newTx.transactionHash] = newTx;
              }

              // Delete pending transaction
              delete transactions[key];
          // Transaction is pending add it in the list
          } else {
            let tx = {
              from: '',
              to: '',
              contractAddress:this.props.tokenConfig.address,
              status: 'Pending',
              hash: key,
              value: 0,
              tokenName: '',
              tokenSymbol: '',
              timeStamp: parseInt(newTx.lastUpdated/1000)
            };

            if (newTx.transactionHash) {
              tx.hash = newTx.transactionHash.toString();
            }

            transactions[key] = tx;

            update_txs = true;
          }
        }
      });

      if (refresh){
        this.setState({
          executedTxs,
          prevTxs: transactions,
          needsUpdate
        });
      } else if (update_txs){
        this.setState({
          prevTxs: transactions,
          needsUpdate
        });
      }
    }
  };

  // Clear all the timeouts
  async componentWillUnmount(){
    componentUnmounted = true;

    let id = window.setTimeout(function() {}, 0);

    while (id--) {
        window.clearTimeout(id); // will do nothing if no timeout with id is present
    }
  }

  async componentDidMount() {

    componentUnmounted = false;

    window.jQuery = jQuery;
    // customLog('SmartContractControls componentDidMount',jQuery);

    this.addResources();

    customLog('Smart contract didMount');
    // do not wait for each one just for the first who will guarantee web3 initialization
    const web3 = await this.props.initWeb3();

    if (!web3) {
      customLog('No Web3 SmartContractControls');
      return false;
    }

    customLog('Web3 SmartContractControls initialized');

    await this.props.initContract('OldIdleDAI', OldIdleAddress, this.props.tokenConfig.idle.abi);
    await this.props.initContract(this.props.tokenConfig.idle.token, this.props.tokenConfig.idle.address, this.props.tokenConfig.idle.abi);
    await Promise.all([
      this.getAllocations(),
      this.getAprs(),
      this.getPriceInToken(this.props.tokenConfig.idle.token)
    ]);

    /*
    // PUT TEMP FUNCTIONS HERE
    window.tempFunc = (tx) => {}
    */
    window.renderWyre = this.renderWyre;

    this.props.initContract(this.props.selectedToken, this.props.tokenConfig.address, this.props.tokenConfig.abi);

    if (this.props.account){
      this.setState({
        needsUpdate:true
      });
    }
  }

  async componentDidUpdate(prevProps, prevState) {
    const accountChanged = prevProps.account !== this.props.account;
    const selectedTokenChanged = prevProps.selectedToken !== this.props.selectedToken;

    // Remount the component if token changed
    if (selectedTokenChanged){
      await this.componentDidMount();
    }

    if (this.props.account && !this.state.updateInProgress && (accountChanged || this.state.needsUpdate || selectedTokenChanged)) {

      // Reset funds and force loader
      this.setState({
        tokenBalance:null,
        tokenToRedeemParsed:null,
        amountLent:null,
        earning:null,
        updateInProgress: true,
        needsUpdate: false
      });

      customLog('Call async functions...');

      await Promise.all([
        this.getTokenBalance(),
        this.checkTokenApproved(), // Check if the token is already approved
        this.getPrevTxs(),
        // this.getOldBalanceOf('OldIdleDAI'),
        this.getTotalSupply(this.props.tokenConfig.idle.token)
      ]);

      customLog('Async functions completed...');

      // Keep this call seprated from others cause it needs getPrevTxs results
      await this.getBalanceOf(this.props.tokenConfig.idle.token);

      customLog('getBalanceOf function completed...');

      if (this.props.selectedTab === '3') {
        this.rebalanceCheck();
      }

      /*
      // Check if first time entered
      let welcomeIsOpen = prevProps.account !== this.props.account;
      if (localStorage){
        welcomeIsOpen = welcomeIsOpen && !localStorage.getItem('firstLogin');
        localStorage.setItem('firstLogin',new Date().getTime().toString());
      } else {
        welcomeIsOpen = false;
      }
      */

      this.setState({
        updateInProgress: false
      });
    }

    if (this.props.selectedTab !== '2' && this.state.fundsTimeoutID){
      customLog("Clear funds timeout "+this.state.fundsTimeoutID);
      clearTimeout(this.state.fundsTimeoutID);
      this.setState({fundsTimeoutID:null});
    }

    // TO CHECK!!
    if (prevProps.transactions !== this.props.transactions){
      // Store transactions into Local Storage
      if (localStorage){
        localStorage.setItem(`transactions_${this.props.selectedToken}`,JSON.stringify(this.props.transactions));
      }

      // console.log('Transactions changed from',prevProps.transactions,'to',this.props.transactions);
      this.processTransactionUpdates(prevProps.transactions);
    }
  }

  async selectTab(e, tabIndex) {
    e.preventDefault();
    this.props.updateSelectedTab(e,tabIndex);

    if (tabIndex === '3') {
      await this.rebalanceCheck();
    }

    if (tabIndex !== '2') {
      if (this.state.earningIntervalId){
        window.clearInterval(this.state.earningIntervalId);
      }
    } else {
      
    }

  }

  // TODO move in a separate component
  renderPrevTxs(prevTxs) {
    prevTxs = prevTxs ? prevTxs : (this.state.prevTxs || {});

    const txsIndexes = Object.keys(prevTxs);
    const txsToShow = 99999999;
    // let totalInterestsAccrued = 0;
    let depositedSinceLastRedeem = 0;
    let totalRedeemed = 0;

    let txs = txsIndexes.map((key, i) => {

      const tx = prevTxs[key];

      const date = new Date(tx.timeStamp*1000);
      const status = tx.status ? tx.status : tx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase() ? 'Deposited' : 'Redeemed';
      const parsedValue = parseFloat(tx.value);
      const value = parsedValue ? (this.props.isMobile ? parsedValue.toFixed(4) : parsedValue.toFixed(8)) : '-';
      const momentDate = moment(date);
      const formattedDate = momentDate.fromNow();
      const formattedDateAlt = momentDate.format('YYYY-MM-DD HH:mm:ss');
      let color;
      let icon;
      let interest = null;
      switch (status) {
        case 'Deposited':
          color = 'blue';
          icon = "ArrowDownward";
          depositedSinceLastRedeem+=parsedValue;
          // totalRedeemed = 0;
        break;
        case 'Redeemed':
          color = 'green';
          icon = "ArrowUpward";
          totalRedeemed += Math.abs(parsedValue);

          // customLog(formattedDateAlt,totalRedeemed,depositedSinceLastRedeem,totalRedeemed-depositedSinceLastRedeem);
          if (totalRedeemed<depositedSinceLastRedeem){
            interest = null;
          } else {
            interest = totalRedeemed-depositedSinceLastRedeem;
            interest = interest>0 ? '+'+(this.props.isMobile ? parseFloat(interest).toFixed(4) : parseFloat(interest).toFixed(8))+' DAI' : null;
            depositedSinceLastRedeem -= totalRedeemed;
            depositedSinceLastRedeem = Math.max(0,depositedSinceLastRedeem);
            totalRedeemed = 0;
          }

          // if (interest){
          //   totalInterestsAccrued += interest;
          // }
        break;
        default:
          color = 'grey';
          icon = "Refresh";
        break;
      }

      if (i>=txsIndexes.length-txsToShow){
        return (
          <Link key={'tx_'+i} display={'block'} href={`https://etherscan.io/tx/${tx.hash}`} target={'_blank'}>
            <Flex alignItems={'center'} flexDirection={['row','row']} width={'100%'} p={[2,3]} borderBottom={'1px solid #D6D6D6'}>
              <Box width={[1/12,1/12]} textAlign={'right'}>
                  <Icon name={icon} color={color} style={{float:'left'}}></Icon>
              </Box>
              <Box width={[2/12,2/12]} display={['none','block']} textAlign={'center'}>
                <Pill color={color}>
                  {status}
                </Pill>
              </Box>
              <Box width={[6/12,3/12]}>
                <Text textAlign={'center'} fontSize={[2,2]} fontWeight={2}>{value} {tx.tokenSymbol}</Text>
              </Box>
              <Box width={3/12} display={['none','block']}>
                <Text textAlign={'center'} fontSize={[2,2]} fontWeight={2}>
                  {interest ? <Pill color={'green'}>{interest}</Pill> : '-'}
                </Text>
              </Box>
              <Box width={[5/12,3/12]} textAlign={'center'}>
                <Text alt={formattedDateAlt} textAlign={'center'} fontSize={[1,2]} fontWeight={2}>{formattedDate}</Text>
              </Box>
            </Flex>
          </Link>
        );
      }

      return null;
    });

    txs = txs
            .reverse()
            .filter(function( element ) {
               return (element !== undefined) && (element !== null);
            });

    return (
      <Flex flexDirection={'column'} width={[1,'90%']} m={'0 auto'}>
        <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'dark-gray'}>
          Last transactions
        </Heading.h3>
        <Box maxHeight={'500px'} overflow={'auto'}>
        {
          txs && txs.length ? txs : (
            <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontWeight={2} fontSize={[2]} color={'dark-gray'}>
              There are no transactions for {this.props.selectedToken}
            </Heading.h3>
          )
        }
        </Box>
      </Flex>
    );
  }

  getFormattedBalance(balance,label,decimals,maxLen,highlightedDecimals){
    const defaultValue = '-';
    decimals = !isNaN(decimals) ? decimals : 6;
    maxLen = !isNaN(maxLen) ? maxLen : 10;
    highlightedDecimals = !isNaN(highlightedDecimals) ? highlightedDecimals : 0;
    balance = this.BNify(balance).toFixed(decimals);

    const numLen = balance.toString().replace('.','').length;
    if (numLen>maxLen){
      decimals = Math.max(0,decimals-(numLen-maxLen));
      balance = this.BNify(balance).toFixed(decimals);
    }

    const intPart = Math.floor(balance);
    let decPart = (balance%1).toString().substr(2,decimals);
    decPart = (decPart+("0".repeat(decimals))).substr(0,decimals);

    if (highlightedDecimals){
      const highlightedDec = decPart.substr(0,highlightedDecimals);
      decPart = decPart.substr(highlightedDecimals);
      const highlightedIntPart = (<Text.span fontSize={'100%'} color={'blue'} fontWeight={'inerith'}>{intPart}.{highlightedDec}</Text.span>);
      return !isNaN(this.trimEth(balance)) ? ( <>{highlightedIntPart}<small style={{fontSize:'70%'}}>{decPart}</small> <Text.span fontSize={[1,2]}>{label}</Text.span></> ) : defaultValue;
    } else {
      return !isNaN(this.trimEth(balance)) ? ( <>{intPart}<small>.{decPart}</small> <Text.span fontSize={[1,2]}>{label}</Text.span></> ) : defaultValue;
    }
  }

  formatCountUp = (n) => {
    return n.toFixed(6);
  }

  render() {
    let hasBalance = !isNaN(this.trimEth(this.state.tokenToRedeemParsed)) && this.trimEth(this.state.tokenToRedeemParsed) > 0;
    // const navPool = this.getFormattedBalance(this.state.navPool,this.props.selectedToken);
    const idleTokenPrice = this.getFormattedBalance(this.state.idleTokenPrice,this.props.selectedToken);
    const depositedFunds = this.getFormattedBalance(this.state.amountLent,this.props.selectedToken);
    const earningPerc = !isNaN(this.trimEth(this.state.tokenToRedeemParsed)) && this.trimEth(this.state.tokenToRedeemParsed)>0 && this.state.amountLent>0 ? this.getFormattedBalance(this.BNify(this.state.tokenToRedeemParsed).div(this.BNify(this.state.amountLent)).minus(1).times(100),'%',4) : '0%';
    const currentApr = !isNaN(this.state.maxRate) ? this.getFormattedBalance(this.state.maxRate,'%',2) : '-';
    // const balanceOfIdleDAI = this.getFormattedBalance(this.state.tokenBalanceBNify,this.props.tokenConfig.idle.token);

    let earningPerDay = this.getFormattedBalance((this.state.earningPerYear/daysInYear),this.props.selectedToken,4);
    const earningPerWeek = this.getFormattedBalance((this.state.earningPerYear/daysInYear*7),this.props.selectedToken,4);
    const earningPerMonth = this.getFormattedBalance((this.state.earningPerYear/12),this.props.selectedToken,4);
    const earningPerYear = this.getFormattedBalance((this.state.earningPerYear),this.props.selectedToken,4);

    const currentNavPool = !isNaN(this.trimEth(this.state.navPool)) ? parseFloat(this.trimEth(this.state.navPool,8)) : null;
    let navPoolEarningPerYear = currentNavPool ? parseFloat(this.trimEth(this.BNify(this.state.navPool).times(this.BNify(this.state.maxRate/100)),8)) : null;
    const navPoolAtEndOfYear = currentNavPool ? parseFloat(this.trimEth(this.BNify(this.state.navPool).plus(this.BNify(navPoolEarningPerYear)),8)) : null;
    const navPoolEarningPerDay = navPoolEarningPerYear ? (navPoolEarningPerYear/daysInYear) : null;
    const navPoolEarningPerWeek = navPoolEarningPerDay ? (navPoolEarningPerDay*7) : null;
    const navPoolEarningPerMonth = navPoolEarningPerWeek ? (navPoolEarningPerWeek*4.35) : null;
    navPoolEarningPerYear = navPoolEarningPerYear ? navPoolEarningPerYear : null;

    const currentReedemableFunds = !isNaN(this.trimEth(this.state.tokenToRedeemParsed)) && !isNaN(this.trimEth(this.state.earningPerYear)) ? parseFloat(this.trimEth(this.state.tokenToRedeemParsed,8)) : 0;
    const reedemableFundsAtEndOfYear = !isNaN(this.trimEth(this.state.tokenToRedeemParsed)) && !isNaN(this.trimEth(this.state.earningPerYear)) ? parseFloat(this.trimEth(this.BNify(this.state.tokenToRedeemParsed).plus(this.BNify(this.state.earningPerYear)),8)) : 0;
    const currentEarning = !isNaN(this.trimEth(this.state.earning)) ? parseFloat(this.trimEth(this.state.earning,8)) : 0;
    const earningAtEndOfYear = !isNaN(this.trimEth(this.state.earning)) ? parseFloat(this.trimEth(this.BNify(this.state.earning).plus(this.BNify(this.state.earningPerYear)),8)) : 0;

    const fundsAreReady = !this.state.fundsError && !this.state.updateInProgress && !isNaN(this.trimEth(this.state.tokenToRedeemParsed)) && !isNaN(this.trimEth(this.state.earning)) && !isNaN(this.trimEth(this.state.amountLent));

    // customLog('fundsAreReady',this.state.fundsError,this.state.updateInProgress,this.trimEth(this.state.tokenToRedeemParsed),this.trimEth(this.state.earning),this.trimEth(this.state.amountLent));

    const tokenNotApproved = (this.props.account && this.state.isTokenApproved===false && !this.state.isApprovingToken);
    const walletIsEmpty = this.props.account && this.state.showEmptyWalletOverlay && !tokenNotApproved && !this.state.isApprovingToken && this.state.tokenBalance !== null && !isNaN(this.state.tokenBalance) && !parseFloat(this.state.tokenBalance);

    const defaultTokenSwapper = this.getDefaultTokenSwapper();

    return (
      <Box textAlign={'center'} alignItems={'center'} width={'100%'}>
        <Form minHeight={['auto','17em']} backgroundColor={'white'} color={'blue'} boxShadow={'0 0 25px 5px rgba(102, 139, 255, 0.7)'} borderRadius={'15px'} style={{position:'relative'}}>
          <Flex justifyContent={'center'} position={'relative'} zIndex={'999'} backgroundColor={'#fff'} borderRadius={'15px 15px 0 0'}>
            <Flex flexDirection={['row','row']} width={['100%','80%']} pt={[2,3]}>
              <Box className={[styles.tab,this.props.selectedTab==='1' ? styles.tabSelected : '']} width={[1/3]} textAlign={'center'}>
                <Link display={'block'} pt={[2,3]} pb={2} fontSize={[2,3]} fontWeight={2} onClick={e => this.selectTab(e, '1')}>
                  Lend
                </Link>
              </Box>
              <Box className={[styles.tab,this.props.selectedTab==='2' ? styles.tabSelected : '']} width={[1/3]} textAlign={'center'} borderLeft={'1px solid #fff'} borderRight={'1px solid #fff'}>
                <Link display={'block'} pt={[2,3]} pb={2} fontSize={[2,3]} fontWeight={2} onClick={e => this.selectTab(e, '2')}>
                  Funds
                </Link>
              </Box>
              <Box className={[styles.tab,this.props.selectedTab==='3' ? styles.tabSelected : '']} width={[1/3]} textAlign={'center'} borderRight={'none'}>
                <Link display={'block'} pt={[2,3]} pb={2} fontSize={[2,3]} fontWeight={2} onClick={e => this.selectTab(e, '3')}>
                  Rebalance
                </Link>
              </Box>
            </Flex>
          </Flex>

          <Box boxShadow={'inset 0px 7px 4px -4px rgba(0,0,0,0.1)'} py={[2, 3]}>
            {this.props.selectedTab === '1' &&
              <Box textAlign={'text'} py={3}>
                {
                  false &&
                  <Button
                    className={styles.gradientButton}
                    onClick={e => this.disableERC20(e, this.props.selectedToken)}
                    size={this.props.isMobile ? 'medium' : 'medium'}
                    borderRadius={4}
                    mainColor={'blue'}
                    contrastColor={'white'}
                    fontWeight={3}
                    fontSize={[2,2]}
                    mx={'auto'}
                    px={[4,5]}
                    mt={[3,4]}
                  >
                    DISABLE DAI
                  </Button>
                }

                {
                  walletIsEmpty &&
                  <Box pt={['50px','73px']} style={{position:'absolute',top:'0',width:'100%',height:'100%',zIndex:'99'}}>
                    <Box style={{backgroundColor:'rgba(0,0,0,0.83)',position:'absolute',top:'0',width:'100%',height:'100%',zIndex:'0',borderRadius:'15px'}}></Box>
                    <Flex style={{position:'relative',zIndex:'99',height:'100%'}} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
                      {
                        !this.props.isMobile && (
                          <Link onClick={e => this.hideEmptyWalletOverlay(e) } style={{position:'absolute',top:'0',right:'0',width:'35px',height:'28px',paddingTop:'7px'}}>
                            <Icon
                              name={'Close'}
                              color={'white'}
                              size={'28'}
                            />
                          </Link>
                        )
                      }
                      <Flex flexDirection={'column'} alignItems={'center'} p={[2,4]}>
                        <Flex width={1} justifyContent={'center'} flexDirection={'row'}>
                          <Image src={`images/tokens/${this.props.selectedToken}.svg`} height={'38px'} />
                          <Icon
                            name={'KeyboardArrowRight'}
                            color={'white'}
                            size={'38'}
                          />
                          <Icon
                            name={'AccountBalanceWallet'}
                            color={'white'}
                            size={'38'}
                          />
                        </Flex>
                        <Heading.h4 my={[3,'15px']} color={'white'} fontSize={[2,3]} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                          You don't have any {this.props.selectedToken} in your wallet. Click the button below to buy some.
                        </Heading.h4>
                        <Button
                          onClick={e => { this.props.openBuyModal(e); }}
                          borderRadius={4}
                          size={'medium'}
                        >
                          BUY {this.props.selectedToken}
                        </Button>
                      </Flex>
                    </Flex>
                  </Box>
                }

                {
                  tokenNotApproved &&
                  <Box pt={['50px','73px']} style={{position:'absolute',top:'0',width:'100%',height:'100%',zIndex:'99'}}>
                    <Box style={{backgroundColor:'rgba(0,0,0,0.83)',position:'absolute',top:'0',width:'100%',height:'100%',zIndex:'0',borderRadius:'15px'}}></Box>
                    <Flex style={{position:'relative',zIndex:'99',height:'100%'}} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
                      <Flex flexDirection={'column'} alignItems={'center'} p={[2,4]}>
                        <Flex width={1} justifyContent={'center'} flexDirection={'row'}>
                          <Image src={`images/tokens/${this.props.selectedToken}.svg`} height={'38px'} />
                          <Icon
                            name={'KeyboardArrowRight'}
                            color={'white'}
                            size={'38'}
                          />
                          <Icon
                            name={'LockOpen'}
                            color={'white'}
                            size={'38'}
                          />
                        </Flex>
                        <Heading.h4 my={[2,'15px']} color={'white'} fontSize={[2,3]} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                          By clicking on ENABLE you are allowing Idle smart contract to actually move {this.props.selectedToken} on your behalf so we can forward them on various lending protocols.
                        </Heading.h4>
                        <Button
                          onClick={e => this.enableERC20(e, this.props.selectedToken)}
                          borderRadius={4}
                          size={'medium'}
                        >
                          ENABLE {this.props.selectedToken}
                        </Button>
                      </Flex>
                    </Flex>
                  </Box>
                }

                <Heading.h3 pb={[2, 0]} mb={[2,3]} fontFamily={'sansSerif'} fontSize={[2, 3]} fontWeight={2} color={'dark-gray'} textAlign={'center'}>
                  Earn <Text.span fontWeight={'bold'} fontSize={[3,4]}>{this.state.maxRate}% APR</Text.span> on your <Text.span fontWeight={'bold'} fontSize={[3,4]}>{this.props.selectedToken}</Text.span>
                </Heading.h3>

                { !this.state.isApprovingToken && !this.state.lendingProcessing &&
                  <CryptoInput
                    renderTokenSwapper={ defaultTokenSwapper ? defaultTokenSwapper : false }
                    genericError={this.state.genericError}
                    buyTokenMessage={this.state.buyTokenMessage}
                    disableLendButton={this.state.disableLendButton}
                    isMobile={this.props.isMobile}
                    account={this.props.account}
                    balance={this.state.tokenBalance}
                    tokenDecimals={this.state.tokenDecimals}
                    defaultValue={this.state.lendAmount}
                    BNify={this.BNify}
                    action={'Lend'}
                    trimEth={this.trimEth}
                    color={'black'}
                    selectedAsset={this.props.selectedToken}
                    useEntireBalance={this.useEntireBalance}
                    handleChangeAmount={this.handleChangeAmount}
                    showTokenApproved={false}
                    isAssetApproved={this.state.isDAIApproved}
                    showApproveModal={this.toggleModal}
                    showLendButton={!walletIsEmpty && !tokenNotApproved}
                    handleClick={e => this.mint(e)} />
                }

                { this.state.lendingProcessing &&
                  <>
                    {
                      this.state.lendingTx ? (
                        <TxProgressBar web3={this.props.web3} waitText={'Lending estimated in'} endMessage={'Finalizing lend request...'} hash={this.state.lendingTx.transactionHash} />
                      ) : (
                        <Flex
                          justifyContent={'center'}
                          alignItems={'center'}
                          textAlign={'center'}>
                          <Loader size="40px" /> <Text ml={2}>Sending lend request...</Text>
                        </Flex>
                      )
                    }
                  </>
                }

                {this.state.isApprovingToken && (
                  <>
                    {
                      this.state.approveTx ? (
                        <TxProgressBar web3={this.props.web3} waitText={'Approving estimated in'} endMessage={'Finalizing approve request...'} hash={this.state.approveTx.transactionHash} />
                      ) : (
                        <Flex
                          justifyContent={'center'}
                          alignItems={'center'}
                          textAlign={'center'}>
                          <Loader size="40px" /> <Text ml={2}>Sending approve request...</Text>
                        </Flex>
                      )
                    }
                  </>
                )}

                <Flex justifyContent={'center'} mt={[0,3]}>
                  <Heading.h5 mt={2} color={'darkGray'} fontWeight={1} fontSize={1} textAlign={'center'}>
                    *This is beta software. Use at your own risk.
                  </Heading.h5>
                </Flex>

              </Box>
            }

              <Box px={[2,0]} py={[3,0]} display={ this.props.selectedTab === '2' ? 'block' : 'none' } textAlign={'text'}>
                {this.props.account &&
                  <>
                    {
                      fundsAreReady ? (
                        <>
                          {hasBalance ? (
                            <>
                              <Box>
                                <Flex flexDirection={['column','row']} py={[2,3]} width={[1,'70%']} m={'0 auto'}>
                                  <Box width={[1,1/2]}>
                                    <Heading.h3 fontWeight={2} textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'blue'}>
                                      Redeemable Funds
                                    </Heading.h3>
                                    <Heading.h3 fontFamily={'sansSerif'} fontSize={[4,5]} mb={[2,0]} fontWeight={2} color={'black'} textAlign={'center'}>
                                      {
                                        <CountUp
                                          start={currentReedemableFunds}
                                          end={reedemableFundsAtEndOfYear}
                                          duration={31536000}
                                          delay={0}
                                          separator=""
                                          decimals={8}
                                          decimal="."
                                        >
                                          {({ countUpRef, start }) => (
                                            <><span ref={countUpRef} /> <span style={{fontSize:'16px',fontWeight:'400',lineHeight:'1.5',color:'#3F3D4B'}}>{this.props.selectedToken}</span></>
                                          )}
                                        </CountUp>
                                      }
                                    </Heading.h3>
                                  </Box>
                                  <Box width={[1,1/2]}>
                                    <Heading.h3 fontWeight={2} textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'blue'}>
                                      Current earnings
                                    </Heading.h3>
                                    <Heading.h3 fontFamily={'sansSerif'} fontSize={[4,5]} fontWeight={2} color={'black'} textAlign={'center'}>
                                      {
                                        <CountUp
                                          start={currentEarning}
                                          end={earningAtEndOfYear}
                                          duration={31536000}
                                          delay={0}
                                          separator=""
                                          decimals={8}
                                          decimal="."
                                          // formattingFn={(n)=>{ return this.formatCountUp(n); }}
                                        >
                                          {({ countUpRef, start }) => (
                                            <><span ref={countUpRef} /> <span style={{fontSize:'16px',fontWeight:'400',lineHeight:'1.5',color:'#3F3D4B'}}>{this.props.selectedToken}</span></>
                                          )}
                                        </CountUp>
                                      }
                                    </Heading.h3>
                                  </Box>
                                </Flex>
                              </Box>
                              <Box pb={[3,4]} borderBottom={'1px solid #D6D6D6'}>
                                {!this.state.redeemProcessing ? (
                                  <Flex
                                    textAlign='center'
                                    flexDirection={'column'}
                                    alignItems={'center'}>
                                      <Heading.h3 fontWeight={2} textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'blue'}>
                                        Redeem your {this.props.selectedToken}
                                      </Heading.h3>
                                      <CryptoInput
                                        genericError={this.state.genericErrorRedeem}
                                        icon={'images/idle-round.png'}
                                        buttonLabel={`REDEEM ${this.props.selectedToken}`}
                                        placeholder={`Enter ${this.props.tokenConfig.idle.token} amount`}
                                        disableLendButton={this.state.disableRedeemButton}
                                        isMobile={this.props.isMobile}
                                        account={this.props.account}
                                        action={'Redeem'}
                                        defaultValue={this.state.redeemAmount}
                                        idleTokenPrice={(1/this.state.idleTokenPrice)}
                                        convertedLabel={this.props.selectedToken}
                                        balanceLabel={this.props.tokenConfig.idle.token}
                                        BNify={this.BNify}
                                        trimEth={this.trimEth}
                                        color={'black'}
                                        balance={this.state.idleTokenBalance}
                                        selectedAsset={this.props.selectedToken}
                                        useEntireBalance={this.useEntireBalanceRedeem}
                                        handleChangeAmount={this.handleChangeAmountRedeem}
                                        handleClick={e => this.redeem(e, this.props.tokenConfig.idle.token)} />
                                  </Flex>
                                  ) : 
                                    this.state.redeemTx ? (
                                      <TxProgressBar web3={this.props.web3} waitText={'Redeeming estimated in'} endMessage={'Finalizing redeem request...'} hash={this.state.redeemTx.transactionHash} />
                                    ) : (
                                      <Flex
                                        justifyContent={'center'}
                                        alignItems={'center'}
                                        textAlign={'center'}>
                                        <Loader size="40px" /> <Text ml={2}>Sending redeem request...</Text>
                                      </Flex>
                                    )
                                }
                              </Box>
                            </>
                            ) : (
                              <Box pb={[3,4]} borderBottom={'1px solid #D6D6D6'}>
                                <Flex
                                  flexDirection={'column'}
                                  textAlign='center'>
                                  <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontWeight={2} fontSize={[2,3]} color={'dark-gray'} py={[2,3]}>
                                    You don't have any <strong>{this.props.selectedToken}</strong> allocated yet!
                                  </Heading.h3>
                                  <Button
                                    className={styles.gradientButton}
                                    onClick={e => this.selectTab(e, '1')}
                                    borderRadius={4}
                                    size={this.props.isMobile ? 'medium' : 'medium'}
                                    mainColor={'blue'}
                                    contrastColor={'white'}
                                    fontWeight={3}
                                    fontSize={[2,2]}
                                    mx={'auto'}
                                    px={[4,5]}
                                    mt={2}
                                  >
                                    LEND NOW
                                  </Button>
                                </Flex>
                              </Box>
                            )
                          }
                          <Flex flexDirection={'column'} pt={[3,3]} pb={[0,2]} alignItems={'center'}>
                            <Link
                              color={'primary'}
                              hoverColor={'primary'}
                              href="#"
                              onClick={e => this.toggleShowFundsInfo(e) }
                            >
                              <Flex flexDirection={'column'} pb={0} alignItems={'center'}>
                                { this.state.showFundsInfo ? 'Hide info & transactions' : 'Show info & transactions' }
                              </Flex>
                            </Link>
                          </Flex>
                        </>
                      ) : (!this.state.updateInProgress && this.state.fundsError) ? (
                          <Flex
                            alignItems={'center'}
                            flexDirection={'column'}
                            textAlign={'center'}
                            py={[1,3]}>
                              <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontWeight={2} fontSize={[2,3]} color={'dark-gray'}>
                                We were not able to load your funds...
                              </Heading.h3>
                              <Button
                                className={styles.gradientButton}
                                onClick={e => this.reloadFunds(e) }
                                size={this.props.isMobile ? 'medium' : 'medium'}
                                borderRadius={4}
                                mainColor={'blue'}
                                contrastColor={'white'}
                                fontWeight={3}
                                fontSize={[2,2]}
                                mx={'auto'}
                                px={[4,5]}
                                mt={[3,4]}
                              >
                                TRY AGAIN
                              </Button>
                          </Flex>
                        ) : (
                          <Flex
                            py={[2,3]}
                            justifyContent={'center'}
                            alignItems={'center'}
                            textAlign={'center'}>
                            <Loader size="40px" /> <Text ml={2}>Processing funds...</Text>
                          </Flex>
                        ) 
                    }
                    {
                      this.props.selectedTab === '2' && hasBalance && this.state.showFundsInfo &&
                        <>
                          {
                          !isNaN(this.trimEth(this.state.earningPerYear)) ? (
                          <>
                            <Box my={[3,4]} pb={[3,4]} borderBottom={'1px solid #D6D6D6'}>
                              <Flex flexDirection={'column'} width={[1,'90%']} m={'0 auto'}>
                                <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'dark-gray'}>
                                  Funds overview
                                </Heading.h3>
                                <Flex flexDirection={['column','row']} width={'100%'}>
                                  <Flex flexDirection={'row'} py={[2,3]} width={[1,'1/2']} m={'0 auto'}>
                                    <Box width={1/2}>
                                      <Flex flexDirection={'row'} alignItems={'center'} justifyContent={'center'}>
                                        <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'black'} textAlign={'center'}>
                                          Deposited funds
                                        </Text>
                                        <Tooltip message={`The total amount of ${this.props.selectedToken} you have deposited.`} placement="top">
                                          <Icon
                                            style={{cursor:'pointer'}}
                                            ml={1}
                                            name={'InfoOutline'}
                                            size={'1.1em'}
                                            color={'dark-gray'}
                                          />
                                        </Tooltip>
                                      </Flex>
                                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        { depositedFunds }
                                      </Heading.h3>
                                    </Box>
                                    <Box width={1/2}>
                                      <Flex flexDirection={'row'} alignItems={'center'} justifyContent={'center'}>
                                        <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'black'} textAlign={'center'}>
                                          Total earned
                                        </Text>
                                        <Tooltip message="The percentage of interests you have earned so far." placement="top">
                                          <Icon
                                            style={{cursor:'pointer'}}
                                            ml={1}
                                            name={'InfoOutline'}
                                            size={'1.1em'}
                                            color={'dark-gray'}
                                          />
                                        </Tooltip>
                                      </Flex>
                                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        { earningPerc }
                                      </Heading.h3>
                                    </Box>
                                  </Flex>
                                  <Flex flexDirection={'row'} py={[2,3]} width={[1,'1/2']} m={'0 auto'}>
                                    <Box width={1/2}>
                                      <Flex flexDirection={'row'} alignItems={'center'} justifyContent={'center'}>
                                        <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'black'} textAlign={'center'}>
                                          Current APR
                                        </Text>
                                        <Tooltip message="The Annual Percentage Rate for your funds." placement="top">
                                          <Icon
                                            style={{cursor:'pointer'}}
                                            ml={1}
                                            name={'InfoOutline'}
                                            size={'1.1em'}
                                            color={'dark-gray'}
                                          />
                                        </Tooltip>
                                      </Flex>
                                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        { currentApr }
                                      </Heading.h3>
                                    </Box>
                                    <Box width={1/2}>
                                      <Flex flexDirection={'row'} alignItems={'center'} justifyContent={'center'}>
                                        <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'black'} textAlign={'center'}>
                                          {this.props.tokenConfig.idle.token} price
                                        </Text>
                                        <Tooltip message={`The exchange rate between ${this.props.tokenConfig.idle.token} and ${this.props.selectedToken}.`} placement="top">
                                          <Icon
                                            style={{cursor:'pointer'}}
                                            ml={1}
                                            name={'InfoOutline'}
                                            size={'1.1em'}
                                            color={'dark-gray'}
                                          />
                                        </Tooltip>
                                      </Flex>
                                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        { idleTokenPrice }
                                      </Heading.h3>
                                    </Box>
                                  </Flex>
                                </Flex>
                              </Flex>
                            </Box>
                            <Box my={[3,4]} pb={[3,4]} borderBottom={'1px solid #D6D6D6'}>
                              <Flex flexDirection={'column'} width={[1,'90%']} m={'0 auto'}>
                                <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'dark-gray'}>
                                  Estimated earnings
                                </Heading.h3>
                                <Flex flexDirection={['column','row']} width={'100%'}>
                                  <Flex flexDirection={'row'} py={[2,3]} width={[1,'1/2']} m={'0 auto'}>
                                    <Box width={1/2}>
                                      <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        Daily
                                      </Text>
                                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        {earningPerDay}
                                      </Heading.h3>
                                    </Box>
                                    <Box width={1/2}>
                                      <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        Weekly
                                      </Text>
                                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        {earningPerWeek}
                                      </Heading.h3>
                                    </Box>
                                  </Flex>
                                  <Flex flexDirection={'row'} py={[2,3]} width={[1,'1/2']} m={'0 auto'}>
                                    <Box width={1/2}>
                                      <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        Monthly
                                      </Text>
                                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        {earningPerMonth}
                                      </Heading.h3>
                                    </Box>
                                    <Box width={1/2}>
                                      <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        Yearly
                                      </Text>
                                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        {earningPerYear}
                                      </Heading.h3>
                                    </Box>
                                  </Flex>
                                </Flex>
                              </Flex>
                            </Box>
                          </>
                          ) : (
                            <Flex
                              py={[2,3]}
                              justifyContent={'center'}
                              alignItems={'center'}
                              textAlign={'center'}>
                              <Loader size="40px" /> <Text ml={2}>Processing funds info...</Text>
                            </Flex>
                          )
                        }
                        </>
                    }
                    {
                      this.props.selectedTab === '2' && this.state.showFundsInfo &&
                        <Box my={[3,4]} pb={[3,4]}>
                          {
                            this.state.prevTxs ? (
                              this.renderPrevTxs()
                            ) : (
                              <Flex
                                justifyContent={'center'}
                                alignItems={'center'}
                                textAlign={'center'}>
                                <Loader size="40px" /> <Text ml={2}>Processing transactions...</Text>
                              </Flex>
                            )
                          }
                        </Box>
                    }
                  </>
                }

                {!this.props.account &&
                  <Flex
                    alignItems={'center'}
                    flexDirection={'column'}
                    textAlign={'center'}
                    py={[1,3]}>
                      <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontWeight={2} fontSize={[2,3]} color={'dark-gray'}>
                        Please connect to view your available funds.
                      </Heading.h3>
                      <Button
                        className={styles.gradientButton}
                        onClick={e => this.mint(e, this.props.tokenConfig.idle.token)}
                        size={this.props.isMobile ? 'medium' : 'medium'}
                        borderRadius={4}
                        mainColor={'blue'}
                        contrastColor={'white'}
                        fontWeight={3}
                        fontSize={[2,2]}
                        mx={'auto'}
                        px={[4,5]}
                        mt={[3,4]}
                      >
                        CONNECT
                      </Button>
                  </Flex>
                }
              </Box>

              <Box display={ this.props.selectedTab === '3' ? 'block' : 'none' }>
                <Box width={'100%'} borderBottom={'1px solid #D6D6D6'}>
                  <Flex flexDirection={['column','row']} py={[2,3]} width={[1,'80%']} m={'0 auto'}>
                    <Box width={[1,1/3]}>
                      <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                        Allocated funds
                      </Text>
                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'} style={{whiteSpace:'nowrap'}}>
                        {currentNavPool && navPoolAtEndOfYear ? 
                          <CountUp
                            start={currentNavPool}
                            end={navPoolAtEndOfYear}
                            duration={315569260}
                            delay={0}
                            separator=""
                            decimals={6}
                            decimal="."
                          >
                            {({ countUpRef, start }) => (
                              <><span ref={countUpRef} /> <span style={{fontSize:'16px',fontWeight:'400',lineHeight:'1.5',color:'#3F3D4B'}}>{this.props.selectedToken}</span></>
                            )}
                          </CountUp>
                          : '-'
                        }
                      </Heading.h3>
                    </Box>
                    <Box width={[1,1/3]}>
                      <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                        Current protocol
                      </Text>
                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'} style={{whiteSpace:'nowrap'}}>
                        { this.state.currentProtocol ? this.state.currentProtocol : '-' }
                      </Heading.h3>
                    </Box>
                    <Box width={[1,1/3]}>
                      <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                        Current APR
                      </Text>
                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'} style={{whiteSpace:'nowrap'}}>
                        { this.state.maxRate ? `${this.state.maxRate}%` : '-' }
                      </Heading.h3>
                    </Box>
                  </Flex>
                </Box>
                { this.props.selectedTab === '3' &&
                  <>
                    <Box borderBottom={'1px solid #D6D6D6'}>
                      <Flex flexDirection={'column'} width={[1,'90%']} m={'0 auto'}>
                        <Flex flexDirection={['column','row']} width={'100%'}>
                          <Flex flexDirection={'row'} py={[2,3]} width={[1,'1/2']} m={'0 auto'}>
                            <Box width={1/2}>
                              <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                                Daily
                              </Text>
                              <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                {this.getFormattedBalance(navPoolEarningPerDay,this.props.selectedToken,4)}
                              </Heading.h3>
                            </Box>
                            <Box width={1/2}>
                              <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                                Weekly
                              </Text>
                              <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                {this.getFormattedBalance(navPoolEarningPerWeek,this.props.selectedToken,4)}
                              </Heading.h3>
                            </Box>
                          </Flex>
                          <Flex flexDirection={'row'} py={[2,3]} width={[1,'1/2']} m={'0 auto'}>
                            <Box width={1/2}>
                              <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                                Monthly
                              </Text>
                              <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                {this.getFormattedBalance(navPoolEarningPerMonth,this.props.selectedToken,4)}
                              </Heading.h3>
                            </Box>
                            <Box width={1/2}>
                              <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                                Yearly
                              </Text>
                              <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                {this.getFormattedBalance(navPoolEarningPerYear,this.props.selectedToken,4)}
                              </Heading.h3>
                            </Box>
                          </Flex>
                        </Flex>
                      </Flex>
                    </Box>
                    { !!this.state.calculataingShouldRebalance && 
                      <Box px={[2,0]} textAlign={'text'} py={[3,2]}>
                        <Flex
                          justifyContent={'center'}
                          alignItems={'center'}
                          textAlign={'center'}
                          pt={3}>
                              <Loader size="40px" /> <Text ml={2}>Checking rebalance status...</Text>
                        </Flex>
                      </Box>
                    }
                  </>
                }
              </Box>

            { this.props.selectedTab === '3' && !this.state.calculataingShouldRebalance && !!this.state.shouldRebalance && 
              <Box px={[2,0]} py={[3,2]}>
                {this.state.rebalanceProcessing ? (
                    <>
                      <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} pt={[0,3]} pb={[2,2]} color={'blue'}>
                        Thanks for rebalancing!
                      </Heading.h3>
                      <Loader size="40px" /> <Text ml={2}>Processing rebalance request...</Text>
                    </>
                  ) : (
                    <>
                      <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} pt={[0,3]} pb={[2,2]} color={'blue'}>
                        Rebalance the entire pool. All users will bless you.
                      </Heading.h3>
                      <Heading.h4 color={'dark-gray'} fontSize={[2,2]} px={[3,0]} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                        The whole pool is automatically rebalanced each time a user interacts with Idle.<br />
                        But you can also trigger a rebalance anytime and this will benefit all users (included you).
                      </Heading.h4>
                      <Flex
                        justifyContent={'center'}
                        alignItems={'center'}
                        textAlign={'center'}
                        pt={2}>
                        <Button
                          className={styles.gradientButton}
                          onClick={this.rebalance}
                          size={this.props.isMobile ? 'medium' : 'medium'}
                          borderRadius={4}
                          contrastColor={'white'}
                          fontWeight={3}
                          fontSize={[2,2]}
                          mx={'auto'}
                          px={[4,5]}
                          mt={[2,3]}
                        >
                          REBALANCE NOW
                        </Button>
                      </Flex>
                    </>
                  )
                }
              </Box>
            }

            {
              this.props.selectedTab === '3' && !this.state.calculataingShouldRebalance && !this.state.shouldRebalance &&
              <Box px={[2,0]} textAlign={'center'} py={[3,2]}>
                <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} pt={[0,3]} pb={[2,2]} color={'blue'}>
                  The pool is already balanced.
                </Heading.h3>
                <Heading.h4 color={'dark-gray'} fontSize={[2,2]} px={[3,0]} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                  The current interest rate is already the best between the integrated protocols.<br />Sit back and enjoy your earnings.
                </Heading.h4>
              </Box>
            }

            </Box>
        </Form>

        <WelcomeModal
          account={this.props.account}
          isOpen={this.state.welcomeIsOpen}
          closeModal={this.toggleWelcomeModal}
          tokenName={this.props.selectedToken}
          baseTokenName={this.props.selectedToken}
          network={this.props.network.current} />

        <ApproveModal
          account={this.props.account}
          isOpen={this.state.approveIsOpen}
          closeModal={this.toggleModal}
          onClick={e => this.enableERC20(e, this.props.selectedToken)}
          tokenName={this.props.selectedToken}
          baseTokenName={this.props.selectedToken}
          network={this.props.network.current} />

        <MaxCapModal
          account={this.props.account}
          isOpen={this.state.capReached}
          maxCap={this.BNify(this.state.idleDAICap)}
          currSupply={this.BNify(this.state.IdleDAISupply)}
          closeModal={this.toggleMaxCapModal}
          network={this.props.network.current} />
      </Box>
    );
  }
}

export default SmartContractControls;
