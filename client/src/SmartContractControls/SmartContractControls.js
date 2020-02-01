import styles from './SmartContractControls.module.scss';
import React from "react";
import { Form, Flex, Box, Heading, Text, Button, Link, Icon, Pill, Loader, Image, Tooltip } from "rimble-ui";
import BigNumber from 'bignumber.js';
import TxProgressBar from '../TxProgressBar/TxProgressBar.js';
import CryptoInput from '../CryptoInput/CryptoInput.js';
import ApproveModal from "../utilities/components/ApproveModal";
import WelcomeModal from "../utilities/components/WelcomeModal";
import ReferralShareModal from "../utilities/components/ReferralShareModal";
import ShareModal from "../utilities/components/ShareModal";
import axios from 'axios';
import moment from 'moment';
import CountUp from 'react-countup';
import jQuery from 'jquery';
import globalConfigs from '../configs/globalConfigs';
import FunctionsUtil from '../utilities/FunctionsUtil';
import ButtonLoader from '../ButtonLoader/ButtonLoader.js';

const env = process.env;

const daysInYear = 365.2422;
let componentUnmounted;

class SmartContractControls extends React.Component {
  state = {};

  // Utils
  functionsUtil = null;
  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

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

  renderDefaultTokenSwapper = (amount) => {
    const {defaultProvider,defaultProviderName} = this.getDefaultTokenSwapper();
    if (defaultProvider){

      const onSuccess = async (tx) => {
        this.setState({
          needsUpdate: true
        });
      };

      const onClose = async (e) => {
        return true;
      }

      const initParams = defaultProvider.getInitParams ? defaultProvider.getInitParams(this.props,globalConfigs,onSuccess,onClose) : null;

      if (window.ga){
        window.ga('send', 'event', 'UI', 'buy_with_eth', defaultProviderName);
      }

      return defaultProvider.render ? defaultProvider.render(initParams,amount,this.props) : null;
    }

    return null;
  }

  getDefaultTokenSwapper = () => {

    const availableProviders = Object.keys(globalConfigs.payments.providers).filter((i) => { const p = globalConfigs.payments.providers[i]; return p.supportedMethods.indexOf('wallet') !== -1 && p.enabled && p.supportedTokens.indexOf(this.props.selectedToken) !== -1 });

    if (!availableProviders || !availableProviders.length){
      return false;
    }

    // Take the default token payment provider for the wallet method
    const defaultProviderName = globalConfigs.payments.methods.wallet.defaultProvider;
    let defaultProvider = null;
    let providerName = defaultProviderName;
    if (availableProviders.indexOf(defaultProviderName) !== -1){
      defaultProvider = globalConfigs.payments.providers[defaultProviderName];
    // If the default provider is not available pick up the first one available
    } else {
      providerName = availableProviders[0];
      defaultProvider = globalConfigs.payments.providers[providerName];
    }

    return {defaultProvider,defaultProviderName};
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
    this.setState({calculatingShouldRebalance:true});

    const _newAmount = 0;
    const _clientProtocolAmounts = [];
    const shouldRebalance = await this.functionsUtil.genericIdleCall('rebalance',[_newAmount,_clientProtocolAmounts]);

    this.setState({
      shouldRebalance,
      calculatingShouldRebalance: false,
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

  togglePartialRedeem = (e) => {
    e.preventDefault();
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

  getProtocolInfoByAddress = (addr) => {
    return this.props.tokenConfig.protocols.find(c => c.address === addr);
  }

  getAllocations = async () => {
    const [allocations,navPool] = await this.props.getAllocations();
    this.functionsUtil.customLog('getAllocations',allocations,navPool);

    if (allocations){

    }

    this.setState({
      allocations,
      // navPool // For demo purpose
    });
  }

  getAprs = async () => {
    const Aprs = await this.functionsUtil.genericIdleCall('getAPRs');

    if (componentUnmounted){
      return false;
    }

    if (!Aprs){
      setTimeout(() => {
        this.getAprs();
      },5000);
      return false;
    }

    this.functionsUtil.customLog('getAprs',Aprs);

    const addresses = Aprs.addresses.map((addr,i) => { return addr.toString().toLowerCase() });
    const aprs = Aprs.aprs;

    let maxRate = Math.max(...aprs);
    const currentRate = maxRate;
    const currentProtocol = '';

    this.props.tokenConfig.protocols.forEach((info,i) => {
      const protocolName = info.name;
      const protocolAddr = info.address.toString().toLowerCase();
      const addrIndex = addresses.indexOf(protocolAddr);
      if ( addrIndex !== -1 ) {
        const protocolApr = aprs[addrIndex];
        this.setState({
          [`${protocolName}Apr`]: protocolApr,
          [`${protocolName}Rate`]: (+this.toEth(protocolApr)).toFixed(2)
        });
      }
    });

    maxRate = aprs ? ((+this.toEth(maxRate)).toFixed(2)) : '0.00';

    this.setState({
      aprs,
      maxRate,
      needsUpdate: false,
      currentProtocol,
      currentRate
    });
  }

  getPriceInToken = async (contractName) => {

    contractName = contractName ? contractName : this.props.tokenConfig.idle.token;

    const totalIdleSupply = await this.functionsUtil.genericContractCall(contractName, 'totalSupply');
    const tokenDecimals = this.state.tokenDecimals ? this.state.tokenDecimals : await this.functionsUtil.getTokenDecimals();
    let tokenPrice = await this.functionsUtil.genericContractCall(contractName, 'tokenPrice');

    if (!tokenPrice || !tokenDecimals){
      return false;
    }

    tokenPrice = this.functionsUtil.fixTokenDecimals(tokenPrice,tokenDecimals);
    const navPool = this.BNify(totalIdleSupply).div(1e18).times(tokenPrice);
    const idleTokenPrice = (totalIdleSupply || totalIdleSupply === 0) && totalIdleSupply.toString() === '0' ? 0 : tokenPrice.toString();

    this.setState({
      idleTokenPrice,
      navPool, // Remove for demo
      tokenPrice,
      needsUpdate: false,
    });

    return tokenPrice;
  }

  getTotalSupply = async (contractName) => {
    const totalSupply = await this.functionsUtil.genericContractCall(contractName, 'totalSupply');
    this.setState({
      [`${contractName}Supply`]: totalSupply,
      needsUpdate: false
    });
    return totalSupply;
  }

  getTokenDecimals = async () => {
    if (this.state.tokenDecimals){
      const tokenDecimals = await (new Promise( async (resolve, reject) => {
        resolve(this.state.tokenDecimals);
      }));

      return tokenDecimals;
    }

    const tokenDecimals = await this.functionsUtil.getTokenDecimals();

    this.setState({
      tokenDecimals
    });

    return tokenDecimals;
  }

  getTokenBalance = async () => {
    if (this.props.account){
      let tokenBalance = await this.functionsUtil.genericContractCall(this.props.selectedToken,'balanceOf',[this.props.account]);
      if (tokenBalance){
        const tokenDecimals = await this.getTokenDecimals();
        tokenBalance = this.functionsUtil.fixTokenDecimals(tokenBalance,tokenDecimals);
        this.functionsUtil.customLog('getTokenBalance',tokenBalance.toString(),tokenDecimals);
        this.setState({
          tokenBalance: tokenBalance.toString()
        });
        return tokenBalance;
      } else {
        this.functionsUtil.customLogError('Error on getting balance');
      }
    }
    return null;
  }

  reloadFunds = async(e) => {
    localStorage.removeItem(`transactions_${this.props.selectedToken}`);
    e.preventDefault();
    this.getBalanceOf(this.props.tokenConfig.idle.token);
  }

  getProtocolBalance = async (contractName) => {
    return await this.functionsUtil.genericContractCall(contractName, 'balanceOf', [this.props.tokenConfig.idle.address]);
  }

  getBalanceOf = async (contractName,count) => {
    count = count ? count : 0;

    if (count === 2){
      this.setState({
        fundsError:true
      });
      return false;
    } else {
      this.setState({
        fundsError:false
      });
    }

    // Update balance in header (AccountOverview) and CryptoInput
    await Promise.all([
      this.props.getAccountBalance(),
      this.getTokenBalance()
    ]);

    const price = await this.getPriceInToken(contractName);
    const balance = await this.functionsUtil.getTokenBalance(contractName,this.props.account);

    this.functionsUtil.customLog('getBalanceOf 1',contractName,'price',price.toString(),'balance',(balance ? balance.toString() : balance));

    if (balance) {
      const tokenToRedeem = balance.times(price);
      let earning = 0;

      // Updateing balance
      this.setState({
        tokenToRedeemParsed: tokenToRedeem ? tokenToRedeem.toString() : null,
        tokenBalanceBNify:balance,
        idleTokenBalance:balance ? balance.toString() : null,
        tokenToRedeem
      });

      // this.functionsUtil.customLog('getBalanceOf 2','tokenToRedeem',tokenToRedeem.toString(),'amountLent',this.state.amountLent.toString());

      if (this.state.amountLent && this.trimEth(this.state.amountLent.toString())>0 && this.trimEth(tokenToRedeem.toString())>0 && parseFloat(this.trimEth(tokenToRedeem.toString()))<parseFloat(this.trimEth(this.state.amountLent.toString()))){
        /*
        this.functionsUtil.customLogError('Balance '+this.trimEth(tokenToRedeem.toString())+' ('+price.toString()+') is less than AmountLent ('+this.trimEth(this.state.amountLent.toString())+').. try again');
        if (componentUnmounted){
          return false;
        }

        this.setState({
          fundsError:true
        });

        // Clear local storage
        localStorage.removeItem(`transactions_${this.props.selectedToken}`);
        setTimeout(async () => {
          await this.getPrevTxs();
          this.getBalanceOf(contractName,count+1);
        },10000);
        return false;
        */
        this.state.amountLent = tokenToRedeem.div(this.state.tokenPrice);
      } else if (this.state.amountLent && this.state.amountLent.lte(0) && tokenToRedeem){
        this.state.amountLent = tokenToRedeem.div(this.state.tokenPrice);
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
      const earningPerDay = earningPerYear.div(this.functionsUtil.BNify(365.242199));

      this.functionsUtil.customLog('getBalanceOf 3',balance.toString(),tokenToRedeem.toString(),this.state.amountLent,earning,currentApr,earningPerYear);

      if (this.state.callMintCallback){

        // Call mintCallback passed from Landing.js
        if (typeof this.props.mintCallback === 'function'){
          this.props.mintCallback();
        }

        // Show share modal if it's the first deposit
        if (this.state.isFirstDeposit){
          // Check referral modal enabled
          if (globalConfigs.modals.first_deposit_referral){
            this.setActiveModal('referral');
          } else if (globalConfigs.modals.first_deposit_share){
            this.setActiveModal('share');
          }
        }
      }

      return this.setState({
        fundsError:false,
        [`balanceOf${contractName}`]: balance,
        tokenToRedeemParsed: tokenToRedeem.toString(),
        tokenBalanceBNify:balance,
        idleTokenBalance:balance.toString(),
        callMintCallback:false,
        currentApr,
        tokenToRedeem,
        earning,
        earningPerDay,
        earningPerYear
      });
    }

    return balance;
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
      activeModal: 'approve'
    });
  }

  checkTransactionAlreadyMined = (tx) => {
    let transaction = this.props.transactions[tx.created];
    return transaction && transaction.status === 'success' && transaction.confirmationCount>1;
  }

  enableERC20 = (e, token) => {
    e.preventDefault();
    // No need for callback atm
    this.props.contractMethodSendWrapper(token, 'approve', [
      this.props.tokenConfig.idle.address,
      this.props.web3.utils.toTwosComplement('-1') // max uint solidity
      // this.props.web3.utils.BN(0) // Disapprova
    ],null,(tx)=>{

      const newState = {
        isTokenApproved: false,
        isApprovingToken: false,
        [`isApproving${token}`]: false, // TODO when set to false?
        'needsUpdate': true,
        approveTx:null,
      };

      // Send Google Analytics event
      if (window.ga){
        window.ga('send', 'event', 'Approve', this.props.selectedToken, tx.status);
      }

      if (tx.status === 'success'){
        newState.isTokenApproved = true;
      }

      this.functionsUtil.customLog('enableERC20',tx,tx.status,newState);

      this.setState(newState);
    }, (tx) => {
      // this.addTransaction(tx);
      this.setState({
        approveTx: tx
      });
    });

    this.setState({
      isApprovingToken: true,
      [`isApproving${token}`]: true, // TODO when set to false?
      activeModal: null
    });
  };

  rebalance = async (e) => {
    e.preventDefault();

    this.setState(state => ({
      ...state,
      rebalanceProcessing: this.props.account ? true : false
    }));

    const _newAmount = 0;
    let paramsForRebalance = null;

    // Get amounts for best allocations
    if (this.props.account){
      const callParams = { from: this.props.account, gas: this.props.web3.utils.toBN(5000000) };
      paramsForRebalance = await this.functionsUtil.genericIdleCall('getParamsForRebalance',[_newAmount],callParams);
      this.functionsUtil.customLog('getParamsForRebalance',_newAmount,paramsForRebalance);
    }

    const _clientProtocolAmounts = paramsForRebalance ? paramsForRebalance[1] : [];
    const gasLimit = _clientProtocolAmounts.length && _clientProtocolAmounts.indexOf('0') === -1 ? this.functionsUtil.BNify(1500000) : 0;

    const callback = (tx) => {
      const needsUpdate = tx.status === 'success' && !this.checkTransactionAlreadyMined(tx);

      // Send Google Analytics event
      if (window.ga){
        window.ga('send', 'event', 'Rebalance', this.props.selectedToken, tx.status);
      }

      this.setState({
        needsUpdate: needsUpdate,
        rebalanceProcessing: false
      });
    };

    const callback_receipt = null;

    this.props.contractMethodSendWrapper(this.props.tokenConfig.idle.token, 'rebalance', [ _newAmount, _clientProtocolAmounts ], null , callback, callback_receipt, gasLimit);
  };

  checkTokenApproved = async () => {
    if (this.props.account) {
      const value = this.props.web3.utils.toWei('0','ether');
      const allowance = await this.functionsUtil.getAllowance(this.props.selectedToken,this.props.tokenConfig.idle.address,this.props.account);
      const tokenApproved = this.BNify(allowance).gt(this.BNify(value.toString()));
      // customLog('checkTokenApproved',value,allowance.toString(),tokenApproved);
      return this.setState({
        [`${this.props.selectedToken}Allowance`]: allowance,
        isTokenApproved: tokenApproved,
        [`is${this.props.selectedToken}Approved`]: tokenApproved
      });
    }
    return null;
  }

  mint = async (e, contractName) => {
    e.preventDefault();

    contractName = contractName ? contractName : this.props.tokenConfig.idle.token;

    if (this.state.isApprovingToken){
      return false;
    }

    if (this.props.account && !this.state.lendAmount) {
      return this.setState({genericError: `Please insert an amount of ${this.props.selectedToken} to lend`});
    }

    const value = this.functionsUtil.normalizeTokenAmount(this.state.lendAmount,this.state.tokenDecimals).toString();

    // check if Idle is approved for DAI
    if (this.props.account && !this.state.isTokenApproved) {
      return this.setState({activeModal: 'approve'});
    }

    if (localStorage){
      localStorage.setItem('redirectToFundsAfterLogged',0);
    }

    this.setState({
      [`isLoading${contractName}`]: false,
      lendingProcessing: this.props.account,
      lendAmount: '',
      genericError: '',
    });

    let paramsForMint = null;

    if (this.props.account){
      // Get amounts for best allocations
      const callParams = { from: this.props.account, gas: this.props.web3.utils.toBN(5000000) };
      paramsForMint = await this.functionsUtil.genericIdleCall('getParamsForMintIdleToken',[value],callParams);
      this.functionsUtil.customLog('getParamsForMintIdleToken',value,paramsForMint);
    }

    const _clientProtocolAmounts = paramsForMint ? paramsForMint[1] : [];
    const gasLimit = _clientProtocolAmounts.length && _clientProtocolAmounts.indexOf('0') === -1 ? this.functionsUtil.BNify(1500000) : 0;

    const callback = (tx) => {
      const txSucceeded = tx.status === 'success';
      const txMined = this.checkTransactionAlreadyMined(tx);
      const needsUpdate = txSucceeded && !txMined;
      this.functionsUtil.customLog('mintIdleToken_callback needsUpdate:',tx,txMined,needsUpdate);

      // Send Google Analytics event
      if (window.ga){
        window.ga('send', 'event', 'Deposit', this.props.selectedToken, tx.status, parseInt(value.toString().substr(0,18)));
      }

      const newState = {
        lendingProcessing: false,
        [`isLoading${contractName}`]: false,
        lendingTx:null,
        callMintCallback:false,
        needsUpdate
      };

      if (txSucceeded){
        this.selectTab({ preventDefault:()=>{} },'2');
        // Call mint callback after loading funds
        newState.callMintCallback = true;
      }

      this.setState(newState);
    };

    const callback_receipt = (tx) => {
      this.setState({
        lendingTx: tx
      });
    };

    // No need for callback atm
    this.props.contractMethodSendWrapper(contractName, 'mintIdleToken', [
      value, _clientProtocolAmounts
    ], null, callback, callback_receipt, gasLimit);
  };

  redeemAll = async (e,contractName) => {
    e.preventDefault();

    const redeemAmount = this.state.idleTokenBalance;

    this.setState({ redeemAmount }, async () => {
      this.redeem(null,contractName);
    });
  }

  redeem = async (e, contractName) => {
    if (e){
      e.preventDefault();
    }

    // Check if amount is more than 0
    if (this.state.partialRedeemEnabled){
      let amount = document.getElementById('CryptoInput_Redeem').value;
      if (!amount.toString().length || this.BNify(amount).lte(0)) {
        return this.setState({
          disableRedeemButton:true,
          genericErrorRedeem:`Please insert an amount of ${this.props.selectedToken} to redeem`
        });
      }
    }

    this.setState(state => ({
      ...state,
      disableRedeemButton:false,
      genericErrorRedeem:'',
      [`isLoading${contractName}`]: true,
      redeemProcessing: true
    }));

    const idleTokenToRedeem = this.functionsUtil.normalizeTokenAmount(this.state.redeemAmount,18).toString();

    this.functionsUtil.customLog('redeem',idleTokenToRedeem);

    // Get amounts for best allocations
    const _skipRebalance = false;
    let paramsForRedeem = null;

    if (this.props.account){
      const callParams = { from: this.props.account, gas: this.props.web3.utils.toBN(5000000) };
      paramsForRedeem = await this.functionsUtil.genericIdleCall('getParamsForRedeemIdleToken',[idleTokenToRedeem, _skipRebalance],callParams);
      this.functionsUtil.customLog('getParamsForRedeemIdleToken',idleTokenToRedeem,paramsForRedeem);
    }

    const _clientProtocolAmounts = paramsForRedeem ? paramsForRedeem[1] : [];
    const gasLimit = _clientProtocolAmounts.length && _clientProtocolAmounts.indexOf('0') === -1 ? this.functionsUtil.BNify(1500000) : 0;

    const callback = (tx) => {
      const txSucceeded = tx.status === 'success';
      const needsUpdate = txSucceeded && !this.checkTransactionAlreadyMined(tx);
      this.functionsUtil.customLog('redeemIdleToken_mined_callback needsUpdate:',tx.status,this.checkTransactionAlreadyMined(tx),needsUpdate);

      // Send Google Analytics event
      if (window.ga){
        const redeemType = this.state.partialRedeemEnabled ? 'partial' : 'total';
        window.ga('send', 'event', `Redeem_${redeemType}`, this.props.selectedToken, tx.status, parseInt(idleTokenToRedeem.toString().substr(0,18)));
      }

      this.setState({
        [`isLoading${contractName}`]: false,
        redeemProcessing: false,
        redeemTx:null,
        needsUpdate
      });
    };

    const callback_receipt = (tx) => {
      this.functionsUtil.customLog('redeemIdleToken_receipt_callback',tx.transactionHash,tx.status);
      this.setState({
        redeemTx: tx
      });
    };

    this.props.contractMethodSendWrapper(contractName, 'redeemIdleToken', [
      idleTokenToRedeem, _skipRebalance, _clientProtocolAmounts
    ], null, callback, callback_receipt, gasLimit);
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

  resetModal = () => {
    this.setState({
      activeModal: null
    });
  }

  setActiveModal = (activeModal) => {
    this.setState({
      activeModal
    });
  }

  getPrevTxs = async (count) => {
    count = count ? count : 0;

    let results = [];

    const requiredNetwork = globalConfigs.network.requiredNetwork;
    const etherscanInfo = globalConfigs.network.providers.etherscan;

    // Check if etherscan is enabled for the required network
    if (etherscanInfo.enabled && etherscanInfo.endpoints[requiredNetwork]){
      const etherscanApiUrl = etherscanInfo.endpoints[requiredNetwork];
      const txs = await axios.get(`
        ${etherscanApiUrl}?module=account&action=tokentx&address=${this.props.account}&startblock=8119247&endblock=999999999&sort=asc&apikey=${env.REACT_APP_ETHERSCAN_KEY}
      `).catch(err => {
        this.functionsUtil.customLog('Error getting prev txs');
        if (componentUnmounted){
          return false;
        }
        if (!count){
          setTimeout(()=>{this.getPrevTxs(count+1);},1000);
          return false;
        }
      });

      if (!txs || !txs.data || !txs.data.result) {
        return this.setState({
          prevTxsError:true,
          amountLent:0,
          earning:0
        });
      }

      results = txs.data.result;
    }

    const tokenDecimals = await this.getTokenDecimals();

    const migrationContractAddr = this.props.tokenConfig.migration && this.props.tokenConfig.migration.migrationContract ? this.props.tokenConfig.migration.migrationContract.address : null;
    const migrationContractOldAddrs = this.props.tokenConfig.migration && this.props.tokenConfig.migration.migrationContract && this.props.tokenConfig.migration.migrationContract.oldAddresses ? this.props.tokenConfig.migration.migrationContract.oldAddresses : [];
    const oldContractAddr = this.props.tokenConfig.migration && this.props.tokenConfig.migration.oldContract ? this.props.tokenConfig.migration.oldContract.address.replace('x','').toLowerCase() : null;

    const prevTxs = results.filter(
        tx => {
          const internalTxs = results.filter(r => r.hash === tx.hash);
          const isMigrationTx = migrationContractAddr && (tx.from.toLowerCase() === migrationContractAddr.toLowerCase() || migrationContractOldAddrs.map((v) => { return v.toLowerCase(); }).indexOf(tx.from.toLowerCase()) !== -1 ) && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
          const isRightToken = internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === this.props.tokenConfig.address.toLowerCase()).length;
          const isDepositTx = isRightToken && !isMigrationTx && tx.from.toLowerCase() === this.props.account.toLowerCase() && tx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
          const isRedeemTx = isRightToken && !isMigrationTx && tx.contractAddress.toLowerCase() === this.props.tokenConfig.address.toLowerCase() && internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase()).length && tx.to.toLowerCase() === this.props.account.toLowerCase();

          return isMigrationTx || isDepositTx || isRedeemTx;
      }
    ).map(tx => {
      return ({...tx, value: this.functionsUtil.fixTokenDecimals(tx.value,tokenDecimals)});
    });

    // this.functionsUtil.customLog('prevTxs',prevTxs);

    let amountLent = this.BNify(0);
    let transactions = {};

    // Check if this is the first interaction with Idle
    let depositedTxs = 0;

    await this.functionsUtil.asyncForEach(prevTxs,async (tx,index) => {

      const isMigrationTx = migrationContractAddr && (tx.from.toLowerCase() === migrationContractAddr.toLowerCase() || migrationContractOldAddrs.map((v) => { return v.toLowerCase(); }).indexOf(tx.from.toLowerCase()) !== -1 ) && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
      const isDepositTx = !isMigrationTx && tx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
      const isRedeemTx = !isMigrationTx && tx.to.toLowerCase() === this.props.account.toLowerCase();

      // Deposited
      if (isDepositTx){
        amountLent = amountLent.plus(this.BNify(tx.value));
        depositedTxs++;

        this.functionsUtil.customLog('Add deposited value',this.BNify(tx.value).toString(),amountLent.toString());

      // Redeemed
      } else if (isRedeemTx){

        const redeemTxReceipt = await (new Promise( async (resolve, reject) => {
          this.props.web3.eth.getTransactionReceipt(tx.hash,(err,tx)=>{
            if (err){
              reject(err);
            }
            resolve(tx);
          });
        }));

        if (!redeemTxReceipt){
          return;
        }

        const walletAddress = this.props.account.replace('x','').toLowerCase();

        const internalTransfers = redeemTxReceipt.logs.filter((tx) => { return tx.topics[tx.topics.length-1].toLowerCase() === `0x00000000000000000000000${walletAddress}`; });

        if (!internalTransfers.length){
          return;
        }

        const internalTransfer = internalTransfers[0];
        const redeemedValue = parseInt(internalTransfer.data,16);
        const redeemedValueFixed = this.functionsUtil.fixTokenDecimals(redeemedValue,tokenDecimals);

        amountLent = amountLent.minus(this.BNify(redeemedValueFixed));

        this.functionsUtil.customLog('Add redeemed value',redeemedValueFixed.toString(),amountLent.toString());

        tx.value = redeemedValueFixed;

      // Migrated
      } else if (isMigrationTx){

        const migrationTxReceipt = await (new Promise( async (resolve, reject) => {
          this.props.web3.eth.getTransactionReceipt(tx.hash,(err,tx)=>{
            if (err){
              reject(err);
            }
            resolve(tx);
          });
        }));

        if (!migrationTxReceipt){
          return;
        }

        const internalTransfers = migrationTxReceipt.logs.filter((tx) => { return tx.topics[tx.topics.length-1].toLowerCase() === `0x00000000000000000000000${oldContractAddr}`; });

        if (!internalTransfers.length){
          return;
        }

        const decodedLogs = this.props.web3.eth.abi.decodeLog([
          {
            "internalType": "uint256",
            "name": "_idleToken",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_token",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "_price",
            "type": "uint256"
          },
        ],internalTransfers[0].data,internalTransfers[0].topics);

        const migrationValue = decodedLogs._token;
        const oldContractTokenDecimals = this.state.oldContractTokenDecimals ? this.state.oldContractTokenDecimals : await this.functionsUtil.getTokenDecimals(this.props.tokenConfig.migration.oldContract.name);
        const migrationValueFixed = this.functionsUtil.fixTokenDecimals(migrationValue,oldContractTokenDecimals);

        amountLent = amountLent.plus(this.BNify(migrationValueFixed));

        // console.log('Add migrated value',tx.hash,migrationValue,migrationValueFixed.toString(),tokenDecimals,amountLent.toString());

        tx.value = migrationValueFixed;
      }

      transactions[tx.hash] = tx;
    });

    const storedTxs = localStorage ? JSON.parse(localStorage.getItem(`transactions_${this.props.selectedToken}`)) : null;
    const minedTxs = storedTxs ? storedTxs : this.props.transactions;

    // Add missing executed transactions
    if (minedTxs){

      this.functionsUtil.customLog('getPrevTxs adding minedTxs',minedTxs);

      await this.asyncForEach(Object.keys(minedTxs),async (txKey,i) => {
        const tx = minedTxs[txKey];

        const allowedMethods = ['mintIdleToken','redeemIdleToken','bridgeIdleV1ToIdleV2']

        // Skip invalid txs
        if (transactions[tx.transactionHash] || tx.status !== 'success' || !tx.transactionHash || allowedMethods.indexOf(tx.method)===-1){
          this.functionsUtil.customLog('Skip not allowed transaction',tx.transactionHash);
          return;
        }

        const realTx = await (new Promise( async (resolve, reject) => {
          this.props.web3.eth.getTransaction(tx.transactionHash,(err,txReceipt)=>{
            if (err){
              reject(err);
            }
            resolve(txReceipt);
          });
        }));

        this.functionsUtil.customLog('realTx (localStorage)',realTx);

        // Skip txs from other wallets
        if (!realTx || realTx.from.toLowerCase() !== this.props.account.toLowerCase()){
          this.functionsUtil.customLog('Skipped tx '+tx.transactionHash+' not from this account.');
          return;
        }

        realTx.contractAddress = this.props.tokenConfig.address;
        realTx.timeStamp = parseInt(tx.created/1000);

        let txValue;
        switch (tx.method){
          case 'mintIdleToken':

            if (realTx.to.toLowerCase() !== this.props.tokenConfig.idle.address.toLowerCase()){
              // Remove wrong contract tx
              if (storedTxs && storedTxs[txKey]){
                delete storedTxs[txKey];
                localStorage.setItem(`transactions_${this.props.selectedToken}`,JSON.stringify(storedTxs));
              }

              this.functionsUtil.customLog('Skipped deposit tx '+tx.transactionHash+' - wrong contract');
              return;
            }

            txValue = tx.params ? this.functionsUtil.fixTokenDecimals(tx.params[0],tokenDecimals).toString() : 0;
            if (!txValue){
              this.functionsUtil.customLog('Skipped deposit tx '+tx.transactionHash+' - value is zero ('+txValue+')');
              return;
            }
            depositedTxs++;
            realTx.status = 'Deposited';
            realTx.value = txValue;
          break;
          case 'redeemIdleToken':
            const redeemTxReceipt = await (new Promise( async (resolve, reject) => {
              this.props.web3.eth.getTransactionReceipt(tx.transactionHash,(err,tx)=>{
                if (err){
                  reject(err);
                }
                resolve(tx);
              });
            }));

            if (!redeemTxReceipt || redeemTxReceipt.to.toLowerCase() !== this.props.tokenConfig.idle.address.toLowerCase() ){
              // Remove wrong contract tx
              if (storedTxs && storedTxs[txKey]){
                delete storedTxs[txKey];
                localStorage.setItem(`transactions_${this.props.selectedToken}`,JSON.stringify(storedTxs));
              }
              return;
            }

            const walletAddress = this.props.account.replace('x','').toLowerCase();

            const redeemTxInternalTransfers = redeemTxReceipt.logs.filter((tx) => { return tx.topics[tx.topics.length-1].toLowerCase() === `0x00000000000000000000000${walletAddress}`; });

            if (!redeemTxInternalTransfers.length){
              return;
            }

            const internalTransfer = redeemTxInternalTransfers[0];
            const redeemedValue = parseInt(internalTransfer.data,16);

            const redeemTokenDecimals = this.state.tokenDecimals ? this.state.tokenDecimals : await this.functionsUtil.getTokenDecimals();
            const redeemedValueFixed = this.functionsUtil.fixTokenDecimals(redeemedValue,redeemTokenDecimals);

            realTx.status = 'Redeemed';
            realTx.value = redeemedValueFixed.toString();
          break;
          case 'bridgeIdleV1ToIdleV2':

            const migrationTxReceipt = await (new Promise( async (resolve, reject) => {
              this.props.web3.eth.getTransactionReceipt(tx.transactionHash,(err,tx)=>{
                if (err){
                  reject(err);
                }
                resolve(tx);
              });
            }));

            if (!migrationTxReceipt){
              return;
            }

            const contractAddress = this.props.tokenConfig.idle.address.toLowerCase().replace('x','');
            const isMigrationRightContract = migrationTxReceipt.logs.filter((tx) => { return tx.topics[tx.topics.length-1].toLowerCase() === `0x00000000000000000000000${contractAddress}`; });

            if (!isMigrationRightContract.length){

              // Remove wrong contract tx
              if (storedTxs && storedTxs[txKey]){
                delete storedTxs[txKey];
                localStorage.setItem(`transactions_${this.props.selectedToken}`,JSON.stringify(storedTxs));
              }

              return;
            }

            const migrationTxInternalTransfers = migrationTxReceipt.logs.filter((tx) => { return tx.topics[tx.topics.length-1].toLowerCase() === `0x00000000000000000000000${oldContractAddr}`; });

            if (!migrationTxInternalTransfers.length){
              return;
            }

            const decodedLogs = this.props.web3.eth.abi.decodeLog([
              {
                "internalType": "uint256",
                "name": "_idleToken",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "_token",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "_price",
                "type": "uint256"
              },
            ],migrationTxInternalTransfers[0].data,migrationTxInternalTransfers[0].topics);

            const migrationValue = decodedLogs._token;
            const migrationTokenDecimals = this.state.oldContractTokenDecimals ? this.state.oldContractTokenDecimals : await this.functionsUtil.getTokenDecimals(this.props.tokenConfig.migration.oldContract.name);
            const migrationValueFixed = this.functionsUtil.fixTokenDecimals(migrationValue,migrationTokenDecimals);

            realTx.status = 'Migrated';
            realTx.value = migrationValueFixed.toString();
          break;
          default:
          break;
        }

        realTx.tokenSymbol = this.props.selectedToken;
        realTx.tx = tx;

        // this.functionsUtil.customLog('realTx from localStorage:',realTx);

        if (tx.method==='mintIdleToken'){
          amountLent = amountLent.plus(this.BNify(realTx.value));
          this.functionsUtil.customLog('Deposited (localStorage) '+parseFloat(realTx.value),'AmountLent',amountLent.toString());
        } else if (tx.method==='redeemIdleToken'){
          amountLent = amountLent.minus(this.BNify(realTx.value));
          if (amountLent.lt(0)){
            amountLent = this.BNify(0);
          }
          this.functionsUtil.customLog('Redeemed (localStorage) '+parseFloat(realTx.value),'AmountLent',amountLent.toString());
        } else if (tx.method==='bridgeIdleV1ToIdleV2'){
          amountLent = amountLent.plus(this.BNify(realTx.value));
          this.functionsUtil.customLog('Migrated (localStorage) '+parseFloat(realTx.value),'AmountLent',amountLent.toString());
        }

        transactions[realTx.hash] = realTx;

        this.functionsUtil.customLog('getPrevTxs inserted executed tx',transactions[realTx.hash]);
      });
    }

    let earning = this.state.earning;
    if (this.state.tokenToRedeem){
      earning = this.state.tokenToRedeem.minus(amountLent);
    }

    if (amountLent.lt(0)){
      amountLent = this.functionsUtil.BNify(0);
    }

    const isFirstDeposit = depositedTxs === 1;

    this.functionsUtil.customLog('getPrevTxs',amountLent,earning);

    return this.setState({
      prevTxsError: false,
      prevTxs: transactions,
      isFirstDeposit,
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

  async componentWillMount() {
    this.initState();
  }

  // Clear all the timeouts
  async componentWillUnmount(){
    componentUnmounted = true;

    let id = window.setTimeout(function() {}, 0);

    while (id--) {
        window.clearTimeout(id); // will do nothing if no timeout with id is present
    }
  }

  async initState(){
    // Init state
    return this.setState({
      iDAIRate: 0,
      cDAIRate: 0,
      cDAIToRedeem: 0,
      updateAfterMount:false, // Launch componentDidUpdate after mount
      componentMounted:false, // this trigger the general loading
      partialRedeemEnabled: false,
      disableLendButton: false,
      disableRedeemButton: false,
      showFundsInfo:true,
      isFirstDeposit:false,
      isTokenApproved:false,
      isApprovingToken:false,
      isApprovingDAITest: true,
      redeemProcessing: false,
      lendingProcessing: false,
      tokenBalance: this.props.accountBalanceToken,
      lendAmount: '',
      redeemAmount: '',
      isMigrating: false,
      migrationEnabled: false,
      migrationError: false,
      isApprovingMigrationContract: false,
      oldContractBalance: null,
      oldContractBalanceFormatted:null,
      oldContractTokenDecimals:null,
      migrationContractApproved: false,
      migrationTx:false,
      migrationApproveTx: null,
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
      calculatingShouldRebalance: true,
      fundsTimeoutID: null,
      idleTokenBalance: null,
      tokenPrice: null,
      allocations:null,
      executedTxs:null,
      lendingTx: null,
      callMintCallback: false,
      redeemTx: null,
      approveTx: null,
      activeModal: null,
      fundsError: false,
      showEmptyWalletOverlay:true,
      prevTxs : null,
      tokenDecimals: null,
      prevTxsError: false,
      transactions:{}
    });
  }

  async componentDidMount(needsUpdateEnabled) {

    if (needsUpdateEnabled === undefined){
      needsUpdateEnabled = true;
    }

    this.loadUtils();

    await this.initState();

    componentUnmounted = false;

    window.jQuery = jQuery;
    // window.BNify = this.BNify;
    // window.toEth = this.toEth.bind(this);
    // customLog('SmartContractControls componentDidMount',jQuery);

    this.addResources();

    this.functionsUtil.customLog('Smart contract didMount');
    // do not wait for each one just for the first who will guarantee web3 initialization
    const web3 = await this.props.initWeb3();

    if (!web3) {
      this.functionsUtil.customLog('No Web3 SmartContractControls');
      return false;
    }

    this.functionsUtil.customLog('Web3 SmartContractControls initialized');

    await this.props.initContract(this.props.tokenConfig.idle.token, this.props.tokenConfig.idle.address, this.props.tokenConfig.idle.abi);

    await Promise.all([
      this.getAllocations(),
      this.getAprs(),
      this.getPriceInToken(),
      this.checkMigration()
    ]);

    /*
    // PUT TEMP FUNCTIONS HERE
    window.tempFunc = (tx) => {}
    */
    window.renderWyre = this.renderWyre;

    this.props.initContract(this.props.selectedToken, this.props.tokenConfig.address, this.props.tokenConfig.abi);

    const newState = {
      componentMounted: true,
      updateAfterMount: false,
      needsUpdate: this.props.account && (needsUpdateEnabled || this.state.updateAfterMount)
    };

    this.functionsUtil.customLog('componentDidMount',newState);

    this.setState(newState);
  }

  async checkMigrationContractApproved() {
    const migrationContractInfo = this.props.tokenConfig.migration.migrationContract;
    const migrationContractName = migrationContractInfo.name;
    const migrationContract = this.functionsUtil.getContractByName(migrationContractName);
    if (migrationContract){
      return await this.functionsUtil.checkTokenApproved(this.props.tokenConfig.migration.oldContract.name,migrationContractInfo.address,this.props.account);
    }
    return false;
  }

  async approveMigration(e) {
    if (e){
      e.preventDefault();
    }
    const migrationContractInfo = this.props.tokenConfig.migration.migrationContract;
    const migrationContract = this.functionsUtil.getContractByName(migrationContractInfo.name);
    if (migrationContract){

      // Check if the migration contract is approved
      const migrationContractApproved = await this.checkMigrationContractApproved();

      if (!migrationContractApproved){

        const callback = tx => {
          const newState = {
            isApprovingMigrationContract: false,
            needsUpdate: true,
            migrationApproveTx: null
          };
          if (tx.status === 'success'){
            newState.migrationContractApproved = true;
          }
          this.setState(newState);
        }

        const callback_receipt = tx => {
          this.setState({
            migrationApproveTx: tx
          });
        }

        this.setState({
          isApprovingMigrationContract: true
        });

        this.functionsUtil.enableERC20(this.props.tokenConfig.migration.oldContract.name,migrationContractInfo.address,callback,callback_receipt);
      } else {
        this.setState({
          migrationContractApproved:true
        });
      }
    }
  }

  async migrate(e,migrationMethod,params) {
    e.preventDefault();

    const migrationContractInfo = this.props.tokenConfig.migration.migrationContract;
    const migrationContract = this.functionsUtil.getContractByName(migrationContractInfo.name);
    if (migrationContract){

      // Check if the migration contract is approved
      const migrationContractApproved = await this.checkMigrationContractApproved();

      if (!migrationContractApproved){
        return this.approveMigration();
      } else {
        // Call migration contract function to migrate funds

        const callback = tx => {

          const newState = {
            migrationError: true, // Throw error by default
            isMigrating: false,
            migrationTx: null
          };

          if (tx.status === 'success'){
            newState.migrationError = false; // Reset error
            newState.migrationEnabled = false;
            newState.needsUpdate = true;

            // Check migration again
            this.checkMigration();

            // Toast message
            /*
            window.toastProvider.addMessage(`Migration completed`, {
              secondaryMessage: `Your funds has been migrated`,
              colorTheme: 'light',
              actionHref: "",
              actionText: "",
              variant: "success",
            });
            */

            this.selectTab({ preventDefault:()=>{} },'2');
          } else {
            // Toast message
            window.toastProvider.addMessage(`Migration error`, {
              secondaryMessage: `The migration has failed, try again...`,
              colorTheme: 'light',
              actionHref: "",
              actionText: "",
              variant: "failure",
            });
          }

          this.setState(newState);
        }

        const callback_receipt = tx => {
          this.setState({
            migrationTx: tx
          });
        }

        this.setState({
          migrationError: false,
          isMigrating: true
        });

        const toMigrate = this.functionsUtil.BNify(this.state.oldContractBalance).toString();
        const value = this.functionsUtil.normalizeTokenAmount(this.state.oldContractBalanceFormatted,this.state.oldContractTokenDecimals).toString();

        const migrationParams = [...params];
        migrationParams.push(toMigrate);

        let _clientProtocolAmounts = [];
        if (this.props.account){
          // Get amounts for best allocations
          const callParams = { from: this.props.account, gas: this.props.web3.utils.toBN(5000000) };
          const paramsForMint = await this.functionsUtil.genericIdleCall('getParamsForMintIdleToken',[value],callParams);
          if (paramsForMint){
            _clientProtocolAmounts = paramsForMint[1];
          }
          this.functionsUtil.customLog('getParamsForMintIdleToken',value,paramsForMint);
        }

        migrationParams.push(_clientProtocolAmounts);

        // Send migration tx
        await this.functionsUtil.contractMethodSendWrapper(migrationContractInfo.name, migrationMethod, migrationParams, callback, callback_receipt);
      }
    }
  }

  async checkMigration() {
    let oldContractTokenDecimals = null;
    let oldContractBalance = null;
    let oldContractBalanceFormatted = null;
    let migrationContractApproved = false;
    let migrationEnabled = false;

    // Check migration contract enabled and balance
    if (this.props.tokenConfig.migration && this.props.tokenConfig.migration.enabled){
      const oldContractName = this.props.tokenConfig.migration.oldContract.name;
      const oldContract = this.functionsUtil.getContractByName(oldContractName);
      const migrationContract = this.functionsUtil.getContractByName(this.props.tokenConfig.migration.migrationContract.name);

      if (oldContract && migrationContract){
        // Get old contract token decimals
        oldContractTokenDecimals = await this.functionsUtil.getTokenDecimals(oldContractName);
        // Check migration contract approval
        migrationContractApproved = await this.checkMigrationContractApproved();
        // Check old contractBalance
        oldContractBalance = await this.functionsUtil.getContractBalance(oldContractName,this.props.account);
        if (oldContractBalance){
          oldContractBalanceFormatted = this.functionsUtil.fixTokenDecimals(oldContractBalance,oldContractTokenDecimals);
          // Enable migration if old contract balance if greater than 0
          migrationEnabled = this.functionsUtil.BNify(oldContractBalance).gt(0);
        }
      }
    }

    this.functionsUtil.customLog('oldContractBalanceFormatted',oldContractBalance ? oldContractBalanceFormatted.toString() : null);

    // Set migration contract balance
    return this.setState({
      migrationEnabled,
      migrationContractApproved,
      oldContractBalanceFormatted,
      oldContractBalance,
      oldContractTokenDecimals
    });
  }

  async componentDidUpdate(prevProps, prevState) {

    // Update util functions props
    this.loadUtils();

    const accountChanged = prevProps.account !== this.props.account;
    const selectedTokenChanged = prevProps.selectedToken !== this.props.selectedToken;

    // Remount the component if token changed
    if (selectedTokenChanged){
      const needsUpdateEnabled = false;
      // Mount the component and initialize the state
      await this.componentDidMount(needsUpdateEnabled);
    }

    // Show welcome modal
    if (this.props.account && accountChanged){
      let welcomeIsOpen = false;

      if (globalConfigs.modals.welcome.enabled && localStorage && accountChanged){

        // Check the last login of the wallet
        const currTime = new Date().getTime();
        const walletAddress = this.props.account.toLowerCase();
        let lastLogin = localStorage.getItem('lastLogin');

        if (lastLogin){
          lastLogin = JSON.parse(lastLogin);
        }

        if (!lastLogin || !lastLogin[walletAddress]){
          lastLogin = {};
          lastLogin[walletAddress] = currTime;
          welcomeIsOpen = true;
        } else {
          const timeFromLastLogin = (currTime-parseInt(lastLogin[walletAddress]))/1000;
          welcomeIsOpen = timeFromLastLogin>=globalConfigs.modals.welcome.frequency; // 1 day since last login
        }

        if (welcomeIsOpen){
          lastLogin[walletAddress] = currTime;
          localStorage.setItem('lastLogin',JSON.stringify(lastLogin));
        }
      }

      this.setState({
        activeModal: welcomeIsOpen ? 'welcome' : this.state.activeModal
      });
    }

    const checkUpdateNeeded = this.props.account && !this.state.updateInProgress && (accountChanged || this.state.needsUpdate || selectedTokenChanged);

    if (checkUpdateNeeded) {

      // If the component is not mounted yet hang on
      if (!this.state.componentMounted){
        return this.setState({
          updateAfterMount: true
        });
      }

      // Reset funds and force loader
      this.setState({
        tokenBalance:null,
        tokenToRedeemParsed:null,
        amountLent:null,
        earning:null,
        updateInProgress: true,
        needsUpdate: false
      });

      this.functionsUtil.customLog('Call async functions...');

      await Promise.all([
        this.getTokenBalance(),
        this.getAllocations(),
        this.checkTokenApproved(), // Check if the token is already approved
        this.getPrevTxs(),
        this.checkMigration(),
        this.getTotalSupply(this.props.tokenConfig.idle.token)
      ]);

      this.functionsUtil.customLog('Async functions completed...');

      // Keep this call seprated from others cause it needs getPrevTxs results
      await this.getBalanceOf(this.props.tokenConfig.idle.token);

      this.functionsUtil.customLog('getBalanceOf function completed...');

      if (this.props.selectedTab === '3') {
        this.rebalanceCheck();
      }

      this.setState({
        updateInProgress: false
      });
    }

    if (this.props.selectedTab !== '2' && this.state.fundsTimeoutID){
      this.functionsUtil.customLog("Clear funds timeout "+this.state.fundsTimeoutID);
      clearTimeout(this.state.fundsTimeoutID);
      this.setState({fundsTimeoutID:null});
    }

    // TO CHECK!!
    if (prevProps.transactions !== this.props.transactions){

      // Store transactions into Local Storage
      if (localStorage){

        // Merge together stored and new transactions
        let storedTxs = localStorage.getItem(`transactions_${this.props.selectedToken}`);
        if (storedTxs){
          storedTxs = JSON.parse(storedTxs);
        } else {
          storedTxs = {};
        }

        storedTxs = Object.assign(storedTxs,this.props.transactions);
        localStorage.setItem(`transactions_${this.props.selectedToken}`,JSON.stringify(storedTxs));
      }

      this.processTransactionUpdates(prevProps.transactions);
    }
  }

  async selectTab(e, tabIndex) {
    e.preventDefault();
    this.props.updateSelectedTab(e,tabIndex);

    if (tabIndex === '3') {
      // Send Google Analytics event
      if (window.ga){
        window.ga('send', 'event', 'UI', 'tabs', 'rebalance');
      }

      await this.rebalanceCheck();
    }

    if (tabIndex !== '2') {
      if (this.state.earningIntervalId){
        window.clearInterval(this.state.earningIntervalId);
      }
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
    const decimals = Math.min(this.state.tokenDecimals,8);

    const migrationContractAddr = this.props.tokenConfig.migration && this.props.tokenConfig.migration.migrationContract ? this.props.tokenConfig.migration.migrationContract.address : null;
    const migrationContractOldAddrs = this.props.tokenConfig.migration && this.props.tokenConfig.migration.migrationContract && this.props.tokenConfig.migration.migrationContract.oldAddresses ? this.props.tokenConfig.migration.migrationContract.oldAddresses : [];

    let txs = txsIndexes.map((key, i) => {

      const tx = prevTxs[key];

      const isMigrationTx = migrationContractAddr && (tx.from.toLowerCase() === migrationContractAddr.toLowerCase() || migrationContractOldAddrs.map((v) => { return v.toLowerCase(); }).indexOf(tx.from.toLowerCase()) !== -1 ) && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
      const isDepositTx = !isMigrationTx && tx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
      const isRedeemTx = !isMigrationTx && tx.to.toLowerCase() === this.props.account.toLowerCase();

      const date = new Date(tx.timeStamp*1000);
      let status = tx.status ? tx.status : null;
      if (!status){
        if (isDepositTx){
          status = 'Deposited';
        } else if (isRedeemTx){
          status = 'Redeemed';
        } else if (isMigrationTx){
          status = 'Migrated';
        }
      }

      let tokenSymbol = tx.tokenSymbol;
      const parsedValue = parseFloat(tx.value);
      const value = parsedValue ? (this.props.isMobile ? parsedValue.toFixed(4) : parsedValue.toFixed(decimals)) : '-';
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
          if (totalRedeemed<depositedSinceLastRedeem){
            interest = null;
          } else {
            interest = totalRedeemed-depositedSinceLastRedeem;
            interest = interest>0 ? '+'+(this.props.isMobile ? parseFloat(interest).toFixed(4) : parseFloat(interest).toFixed(decimals))+' '+this.props.selectedToken : null;
            depositedSinceLastRedeem -= totalRedeemed;
            depositedSinceLastRedeem = Math.max(0,depositedSinceLastRedeem);
            totalRedeemed = 0;
          }
        break;
        case 'Migrated':
          color = 'blue';
          icon = "Sync";
          depositedSinceLastRedeem+=parsedValue;
          tokenSymbol = this.props.selectedToken;
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
                <Text textAlign={'center'} fontSize={[2,2]} fontWeight={2}>{value} {tokenSymbol}</Text>
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
    const hasBalance = !isNaN(this.trimEth(this.state.tokenToRedeemParsed)) && this.trimEth(this.state.tokenToRedeemParsed) > 0;
    // const navPool = this.getFormattedBalance(this.state.navPool,this.props.selectedToken);
    const idleTokenPrice = this.getFormattedBalance(this.state.idleTokenPrice,this.props.selectedToken);
    const depositedFunds = this.getFormattedBalance(this.state.amountLent,this.props.selectedToken);
    const earningPerc = !isNaN(this.trimEth(this.state.tokenToRedeemParsed)) && this.trimEth(this.state.tokenToRedeemParsed)>0 && this.state.amountLent>0 ? this.getFormattedBalance(this.BNify(this.state.tokenToRedeemParsed).div(this.BNify(this.state.amountLent)).minus(1).times(100),'%',4) : '0%';
    const currentApr = !isNaN(this.state.maxRate) ? this.getFormattedBalance(this.state.maxRate,'%',2) : '-';

    let earningPerDay = this.getFormattedBalance((this.state.earningPerYear/daysInYear),this.props.selectedToken,4);
    const earningPerWeek = this.getFormattedBalance((this.state.earningPerYear/daysInYear*7),this.props.selectedToken,4);
    const earningPerMonth = this.getFormattedBalance((this.state.earningPerYear/12),this.props.selectedToken,4);
    const earningPerYear = this.getFormattedBalance((this.state.earningPerYear),this.props.selectedToken,4);

    const currentNavPool = !isNaN(this.trimEth(this.state.navPool)) ? parseFloat(this.trimEth(this.state.navPool,8)) : null;
    let navPoolEarningPerYear = currentNavPool ? parseFloat(this.trimEth(this.BNify(this.state.navPool).times(this.BNify(this.state.maxRate/100)),8)) : null;
    const navPoolEarningPerDay = navPoolEarningPerYear ? (navPoolEarningPerYear/daysInYear) : null;
    const navPoolEarningPerWeek = navPoolEarningPerDay ? (navPoolEarningPerDay*7) : null;
    const navPoolEarningPerMonth = navPoolEarningPerWeek ? (navPoolEarningPerWeek*4.35) : null;
    navPoolEarningPerYear = navPoolEarningPerYear ? navPoolEarningPerYear : null;

    const currentReedemableFunds = !isNaN(this.trimEth(this.state.tokenToRedeemParsed)) && !isNaN(this.trimEth(this.state.earningPerYear)) ? parseFloat(this.trimEth(this.state.tokenToRedeemParsed,8)) : 0;
    const reedemableFundsAtEndOfYear = !isNaN(this.trimEth(this.state.tokenToRedeemParsed)) && !isNaN(this.trimEth(this.state.earningPerYear)) ? parseFloat(this.trimEth(this.BNify(this.state.tokenToRedeemParsed).plus(this.BNify(this.state.earningPerYear)),8)) : 0;
    const currentEarning = !isNaN(this.trimEth(this.state.earning)) ? parseFloat(this.trimEth(this.state.earning,8)) : 0;
    const earningAtEndOfYear = !isNaN(this.trimEth(this.state.earning)) ? parseFloat(this.trimEth(this.BNify(this.state.earning).plus(this.BNify(this.state.earningPerYear)),8)) : 0;

    const fundsAreReady = this.state.fundsError || (!this.state.updateInProgress && !isNaN(this.trimEth(this.state.tokenToRedeemParsed)) && !isNaN(this.trimEth(this.state.earning)) && !isNaN(this.trimEth(this.state.amountLent)));

    // console.log('currentReedemableFunds',currentReedemableFunds,'reedemableFundsAtEndOfYear',reedemableFundsAtEndOfYear,'currentEarning',currentEarning,'earningAtEndOfYear',earningAtEndOfYear);

    const tokenNotApproved = this.props.account && !this.state.isTokenApproved && !this.state.isApprovingToken && !this.state.updateInProgress;
    const walletIsEmpty = this.props.account && this.state.showEmptyWalletOverlay && !tokenNotApproved && !this.state.isApprovingToken && this.state.tokenBalance !== null && !isNaN(this.state.tokenBalance) && !parseFloat(this.state.tokenBalance);

    // Check migration enabled and balance
    const migrationEnabled = this.props.account && this.props.tokenConfig.migration && this.props.tokenConfig.migration.enabled && this.state.migrationEnabled;

    const counterMaxDigits = 11;
    const counterDecimals = Math.min(Math.max(0,counterMaxDigits-parseInt(currentReedemableFunds).toString().length),Math.max(0,counterMaxDigits-parseInt(currentEarning).toString().length));
    const rebalanceCounterDecimals = this.state.allocations ? Math.min(...(Object.values(this.state.allocations).map((allocation,i) => { return counterMaxDigits-parseInt(allocation.toString()).toString().length }))) : null;

    return (
      <Box textAlign={'center'} alignItems={'center'} width={'100%'}>
        <Form minHeight={ migrationEnabled ? ['28em','24em'] : ['auto','17em'] } backgroundColor={'white'} color={'blue'} boxShadow={'0 0 25px 5px rgba(102, 139, 255, 0.7)'} borderRadius={'15px'} style={{position:'relative'}}>
          <Flex justifyContent={'center'} position={'relative'} zIndex={'999'} backgroundColor={'#fff'} borderRadius={'15px 15px 0 0'}>
            <Flex flexDirection={['row','row']} width={['100%','80%']} pt={[2,3]}>
              <Box className={[styles.tab,this.props.selectedTab==='1' ? styles.tabSelected : '']} width={[1/3]} textAlign={'center'}>
                <Link display={'block'} pt={[2,3]} pb={2} fontSize={[2,3]} fontWeight={2} onClick={e => this.selectTab(e, '1')}>
                  Lend
                </Link>
              </Box>
              <Box className={[styles.tab,this.props.selectedTab==='2' ? styles.tabSelected : '']} width={[1/3]} textAlign={'center'} borderLeft={'1px solid #fff'} borderRight={'1px solid #fff'}>
                <Link display={'block'} pt={[2,3]} pb={2} fontSize={[2,3]} fontWeight={2} onClick={e => this.selectTab(e, '2')}>
                  Dashboard
                </Link>
              </Box>
              <Box className={[styles.tab,this.props.selectedTab==='3' ? styles.tabSelected : '']} width={[1/3]} textAlign={'center'} borderRight={'none'}>
                <Link display={'block'} pt={[2,3]} pb={2} fontSize={[2,3]} fontWeight={2} onClick={e => this.selectTab(e, '3')}>
                  Pool
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
                  !this.state.componentMounted ? (
                    <Box pt={['50px','73px']} style={{position:'absolute',top:'0',width:'100%',height:'100%',zIndex:'99'}}>
                      <Box style={{backgroundColor:'rgba(0,0,0,0.83)',position:'absolute',top:'0',width:'100%',height:'100%',zIndex:'0',borderRadius:'15px'}}></Box>
                      <Flex style={{position:'relative',zIndex:'99',height:'100%'}} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
                        <Flex
                          flexDirection={'column'}
                          justifyContent={'center'}
                          alignItems={'center'}
                          textAlign={'center'}>
                          <Loader size="80px" color={'white'} />
                          <Heading.h4 my={[2,'15px']} color={'white'} fontSize={[2,3]} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                            Loading data, please wait...
                          </Heading.h4>
                        </Flex>
                      </Flex>
                    </Box>
                  ) : migrationEnabled ? (
                    <Box pt={['50px','73px']} style={{position:'absolute',top:'0',width:'100%',height:'100%',zIndex:'99'}}>
                      <Box style={{backgroundColor:'rgba(0,0,0,0.83)',position:'absolute',top:'0',width:'100%',height:'100%',zIndex:'0',borderRadius:'15px'}}></Box>
                      <Flex style={{position:'relative',zIndex:'99',height:'100%'}} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
                        <Flex flexDirection={'column'} alignItems={'center'} p={[2,4]}>
                          <Heading.h4 mb={[3,'15px']} color={'white'} fontSize={[2,3]} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                            A new version of <strong>{globalConfigs.appName}</strong> has been released
                          </Heading.h4>
                          <Flex width={1} justifyContent={'center'} alignItems={'center'} flexDirection={'row'}>
                            <Image src={`images/idle-mark-old.png`} height={'42px'} />
                            <Icon
                              name={'KeyboardArrowRight'}
                              color={'white'}
                              size={'28'}
                            />
                            <Image src={`images/tokens/${this.props.selectedToken}.svg`} height={'32px'} />
                            <Icon
                              name={'KeyboardArrowRight'}
                              color={'white'}
                              size={'28'}
                            />
                            <Image src={`images/idle-mark.png`} height={'42px'} />
                          </Flex>

                          {
                            this.state.isApprovingMigrationContract ? (
                              <Box mt={2}>
                                {
                                  this.state.migrationApproveTx ? (
                                    <TxProgressBar textColor={'white'} web3={this.props.web3} waitText={'Approving estimated in'} endMessage={'Finalizing approve request...'} hash={this.state.migrationApproveTx.transactionHash} />
                                  ) : (
                                    <Flex
                                      justifyContent={'center'}
                                      alignItems={'center'}
                                      textAlign={'center'}>
                                      <Loader size="40px" /> <Text ml={2} color={'white'}>Sending approve request...</Text>
                                    </Flex>
                                  )
                                }
                              </Box>
                            ) : this.state.isMigrating ? (
                              <Box mt={2}>
                                {
                                  this.state.migrationTx ? (
                                    <TxProgressBar textColor={'white'} web3={this.props.web3} waitText={'Migration estimated in'} endMessage={'Finalizing migration request...'} hash={this.state.migrationTx.transactionHash} />
                                  ) : (
                                    <Flex
                                      justifyContent={'center'}
                                      alignItems={'center'}
                                      textAlign={'center'}>
                                      <Loader size="40px" /> <Text ml={2} color={'white'}>Starting migration process...</Text>
                                    </Flex>
                                  )
                                }
                              </Box>
                            ) : (
                              <>
                                <Heading.h4 mt={[3,'15px']} color={'white'} fontSize={2} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                                  You still have <strong>{ this.state.oldContractBalanceFormatted.toFixed(4) } {this.props.tokenConfig.migration.oldContract.token}</strong> in the old contract.
                                </Heading.h4>
                                { !this.state.migrationContractApproved ? (
                                  <>
                                    <Heading.h4 mb={[3,'15px']} color={'white'} fontSize={2} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                                      Click the button below to approve the migration contract:
                                    </Heading.h4>
                                    <Button
                                      onClick={e => { this.approveMigration(e); }}
                                      borderRadius={4}
                                      size={ this.props.isMobile ? 'small' : 'medium' }
                                    >
                                      APPROVE MIGRATION CONTRACT
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Heading.h4 color={'white'} fontSize={2} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                                      Choose the way you want to migrate your funds:
                                    </Heading.h4>
                                    {
                                      this.state.migrationError && (
                                        <Heading.h4 color={'red'} fontSize={2} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                                          An error occured during the migration, please try again...
                                        </Heading.h4>
                                      )
                                    }
                                    <Flex mt={[3,'15px']} flexDirection={['column','row']} alignItems={'center'} justifyContent={'center'}>
                                      {
                                        this.props.tokenConfig.migration.migrationContract.functions.map((functionInfo,i) => {
                                          const functionName = functionInfo.name;
                                          return (
                                            <Button
                                              key={`migrate_${i}`}
                                              mx={ this.props.isMobile ? 0 : 2 }
                                              my={ this.props.isMobile ? 2 : 0 }
                                              onClick={e => { this.migrate(e,functionName,functionInfo.params); }}
                                              borderRadius={4}
                                              size={ this.props.isMobile ? 'small' : 'medium' }
                                            >
                                              { functionInfo.label }
                                            </Button>
                                          )
                                        })
                                      }
                                    </Flex>
                                  </>
                                ) }
                              </>
                            )
                          }
                          <Text mt={3} color={'#ccc'} fontSize={1} textAlign={'center'} fontWeight={1} lineHeight={1}>
                            Powered by <Link fontSize={1} fontWeight={1} lineHeight={1} color={'white'} activeColor={'white'} hoverColor={'white'} href={'https://recipes.dexwallet.io/'} style={{textDecoration:'underline'}} target={'_blank'}>Dexwallet Recipes</Link>
                          </Text>
                        </Flex>
                      </Flex>
                    </Box>
                  ) : tokenNotApproved ? (
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
                  ) : walletIsEmpty &&
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

                <Heading.h3 pb={[2, 0]} mb={[2,3]} fontFamily={'sansSerif'} fontSize={[2, 3]} fontWeight={2} color={'dark-gray'} textAlign={'center'}>
                  Earn <Text.span fontWeight={'bold'} fontSize={[3,4]}>{this.state.maxRate}% APR</Text.span> on your <Text.span fontWeight={'bold'} fontSize={[3,4]}>{this.props.selectedToken}</Text.span>
                </Heading.h3>

                { !this.state.isApprovingToken && !this.state.lendingProcessing &&
                  <CryptoInput
                    renderTokenSwapper={ this.renderDefaultTokenSwapper }
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
                    showLendButton={!walletIsEmpty && !migrationEnabled && !tokenNotApproved}
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

                <Flex mt={3} alignItems={'center'} justifyContent={'center'}>
                  <Link href={'https://certificate.quantstamp.com/full/idle-finance'} target={'_blank'}>
                    <Image src={`images/quantstamp-badge.svg`} height={'40px'} />
                  </Link>
                </Flex>

              </Box>
            }

              <Box px={[2,0]} py={[3,0]} display={ this.props.selectedTab === '2' ? 'block' : 'none' } textAlign={'text'}>
                {this.props.account &&
                  <>
                    {
                      fundsAreReady ? (
                        <>
                          {
                            hasBalance ? (
                            <>
                              {
                                !this.state.fundsError ? (
                                  <Box>
                                    <Flex flexDirection={['column','row']} py={[2,3]} width={[1,'80%']} m={'0 auto'}>
                                      <Box width={[1,1/2]}>
                                        <Heading.h3 fontWeight={2} textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'blue'}>
                                          Redeemable Funds
                                        </Heading.h3>
                                        <Heading.h3 fontFamily={'sansSerif'} fontSize={[4,5]} mb={[2,0]} fontWeight={2} color={'black'} textAlign={'center'}>
                                          {
                                            <CountUp
                                              start={currentReedemableFunds}
                                              end={reedemableFundsAtEndOfYear}
                                              useEasing={false}
                                              duration={31536000}
                                              delay={0}
                                              separator=""
                                              decimals={ counterDecimals }
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
                                              useEasing={false}
                                              duration={31536000}
                                              delay={0}
                                              separator=""
                                              decimals={ counterDecimals }
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
                                ) : this.state.fundsError && (
                                  <Flex
                                    alignItems={'center'}
                                    flexDirection={'column'}
                                    textAlign={'center'}
                                    py={[1,3]}
                                    mb={2}>
                                      <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontWeight={2} fontSize={[2,3]} color={'dark-gray'}>
                                        Something went wrong while loading your funds...
                                      </Heading.h3>
                                      <Button
                                        className={[styles.gradientButton,styles.empty]}
                                        onClick={e => this.reloadFunds(e) }
                                        size={this.props.isMobile ? 'medium' : 'medium'}
                                        borderRadius={4}
                                        contrastColor={'blue'}
                                        fontWeight={3}
                                        fontSize={[2,2]}
                                        mx={'auto'}
                                        px={[4,5]}
                                        mt={3}
                                      >
                                        RELOAD FUNDS
                                      </Button>
                                  </Flex>
                                )
                              }

                              <Box pb={[3,4]} borderBottom={'1px solid #D6D6D6'}>
                                {
                                  !this.state.redeemProcessing ?
                                      !this.state.partialRedeemEnabled ? (
                                        <Flex
                                          textAlign='center'
                                          flexDirection={'column'}
                                          alignItems={'center'}
                                          >
                                            <Flex width={1} alignItems={'center'} justifyContent={'center'} mb={0} mx={'auto'}>
                                              <Button
                                                className={[styles.gradientButton]}
                                                onClick={e => this.redeemAll(e, this.props.tokenConfig.idle.token)}
                                                size={this.props.isMobile ? 'medium' : 'medium'}
                                                borderRadius={4}
                                                mainColor={'blue'}
                                                fontWeight={3}
                                                fontSize={[2,2]}
                                                mx={'auto'}
                                                px={[4,5]}
                                                mt={3}
                                              >
                                                REDEEM {this.props.selectedToken}
                                              </Button>
                                            </Flex>
                                            <Flex mt={2} alignItems={'center'} justifyContent={'center'}>
                                              <Link
                                                color={'primary'}
                                                hoverColor={'primary'}
                                                href="#"
                                                onClick={ e => this.togglePartialRedeem(e) }
                                              >
                                                Redeem partial amount
                                              </Link>
                                            </Flex>
                                        </Flex>
                                      ) : (
                                        <Flex
                                          textAlign='center'
                                          flexDirection={'column'}
                                          alignItems={'center'}>
                                            <Heading.h3 fontWeight={2} textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'blue'}>
                                              Redeem your {this.props.selectedToken}
                                            </Heading.h3>
                                            <CryptoInput
                                              genericError={this.state.genericErrorRedeem}
                                              icon={`images/tokens/${this.props.tokenConfig.idle.token}.png`}
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
                                              handleClick={e => this.redeem(e, this.props.tokenConfig.idle.token)}
                                            />
                                            <Flex mt={2} alignItems={'center'} justifyContent={'center'}>
                                              <Link
                                                color={'primary'}
                                                hoverColor={'primary'}
                                                href="#"
                                                onClick={ e => this.togglePartialRedeem(e) }
                                              >
                                                Redeem entire amount
                                              </Link>
                                            </Flex>
                                        </Flex>
                                      )
                                   : this.state.redeemTx ? (
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
                      this.props.selectedTab === '2' && hasBalance && this.state.showFundsInfo && !this.state.prevTxsError &&
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
                          ) : fundsAreReady && !this.state.fundsError && this.state.showFundsInfo && (
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
                            ) : this.state.prevTxsError ? (
                              <Flex
                                alignItems={'center'}
                                flexDirection={'column'}
                                textAlign={'center'}
                                >
                                  <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontWeight={2} fontSize={[2,3]} color={'dark-gray'}>
                                  Ops! Something went wrong while loading your transactions...
                                  </Heading.h3>
                              </Flex>
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

                      <ButtonLoader
                        buttonProps={{className:styles.gradientButton,fontWeight:600,fontSize:16,mx:'auto',borderRadius:'2rem',mt:[3,4],px:[4,5],minWidth:['95px','145px'],size:['small','medium']}}
                        handleClick={e => this.mint(e, this.props.tokenConfig.idle.token)}
                        buttonText={'CONNECT'}
                        isLoading={this.props.connecting}
                      >
                      </ButtonLoader>
                  </Flex>
                }
              </Box>

              <Box display={ this.props.selectedTab === '3' ? 'block' : 'none' }>
                <Box width={'100%'} borderBottom={'1px solid #D6D6D6'}>
                  <Flex flexDirection={['column','row']} justifyContent={'center'} alignItems={'center'} pb={[2,3]} width={[1,'80%']} m={'0 auto'}>
                    {
                      this.state.allocations ?
                        Object.keys(this.state.allocations).map((protocolAddr,i)=>{
                          const protocolInfo = this.getProtocolInfoByAddress(protocolAddr);
                          if (!protocolInfo){
                            return false;
                          }
                          const protocolName = protocolInfo.name;
                          const protocolApr = parseFloat(this.toEth(this.state[`${protocolName}Apr`]));
                          const protocolAllocation = parseFloat(this.state.allocations[protocolAddr]);
                          const protocolEarningPerYear = parseFloat(this.BNify(protocolAllocation).times(this.BNify(protocolApr/100)));
                          const protocolAllocationEndOfYear = parseFloat(this.BNify(protocolAllocation).plus(this.BNify(protocolEarningPerYear)));
                          return (
                            <Box key={`allocation_${protocolName}`} style={{flex:'1 1 0'}}>
                              <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'} style={{textTransform:'capitalize'}}>
                                {protocolName}
                              </Text>
                              <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'} style={{whiteSpace:'nowrap'}}>
                                {protocolAllocation ?
                                  <CountUp
                                    start={protocolAllocation}
                                    end={protocolAllocationEndOfYear}
                                    useEasing={false}
                                    duration={31536000}
                                    delay={0}
                                    separator=""
                                    decimals={rebalanceCounterDecimals}
                                    decimal="."
                                  >
                                    {({ countUpRef, start }) => (
                                      <><span ref={countUpRef} /> <span style={{fontSize:'16px',fontWeight:'400',lineHeight:'1.5',color:'#3F3D4B'}}>{this.props.selectedToken}</span></>
                                    )}
                                  </CountUp>
                                  : parseInt(0).toFixed(6)
                                }
                              </Heading.h3>
                            </Box>
                          )
                        })
                      : (
                        <Flex
                          justifyContent={'center'}
                          alignItems={'center'}
                          textAlign={'center'}>
                          <Loader size="40px" /> <Text ml={2}>Loading pool information...</Text>
                        </Flex>
                      )
                    }
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
                                {this.getFormattedBalance(navPoolEarningPerDay,this.props.selectedToken,3)}
                              </Heading.h3>
                            </Box>
                            <Box width={1/2}>
                              <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                                Weekly
                              </Text>
                              <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                {this.getFormattedBalance(navPoolEarningPerWeek,this.props.selectedToken,3)}
                              </Heading.h3>
                            </Box>
                          </Flex>
                          <Flex flexDirection={'row'} py={[2,3]} width={[1,'1/2']} m={'0 auto'}>
                            <Box width={1/2}>
                              <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                                Monthly
                              </Text>
                              <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                {this.getFormattedBalance(navPoolEarningPerMonth,this.props.selectedToken,3)}
                              </Heading.h3>
                            </Box>
                            <Box width={1/2}>
                              <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                                Yearly
                              </Text>
                              <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                {this.getFormattedBalance(navPoolEarningPerYear,this.props.selectedToken,3)}
                              </Heading.h3>
                            </Box>
                          </Flex>
                        </Flex>
                      </Flex>
                    </Box>
                    { !!this.state.calculatingShouldRebalance &&
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

            { this.props.selectedTab === '3' && !this.state.calculatingShouldRebalance && !!this.state.shouldRebalance &&
              <Box px={[2,0]} py={[3,2]}>
                {this.state.rebalanceProcessing ? (
                    <>
                      <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} pt={[0,3]} pb={[2,2]} color={'blue'}>
                        Thanks for rebalancing!
                      </Heading.h3>
                      <Flex
                        justifyContent={'center'}
                        alignItems={'center'}
                        textAlign={'center'}>
                        <Loader size="40px" /> <Text ml={2} color={'dark-gray'}>Processing rebalance request...</Text>
                      </Flex>
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
              this.props.selectedTab === '3' && !this.state.calculatingShouldRebalance && !this.state.shouldRebalance &&
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

        <ShareModal
          account={this.props.account}
          isOpen={this.state.activeModal === 'share'}
          closeModal={this.resetModal}
          title={`Congratulations!`}
          icon={`images/medal.svg`}
          confettiEnabled={true}
          text={`You have successfully made your first deposit!<br />Enjoy <strong>${this.state.maxRate}% APR</strong> on your <strong>${this.props.selectedToken}</strong>!`}
          tweet={`I'm earning ${this.state.maxRate}% APR on my ${this.props.selectedToken} with @idlefinance! Go to ${globalConfigs.baseURL} and start earning now from your idle tokens!`}
          tokenName={this.props.selectedToken} />

        <ReferralShareModal
          account={this.props.account}
          isOpen={this.state.activeModal === 'referral'}
          closeModal={this.resetModal}
          tokenName={this.props.selectedToken} />

        <WelcomeModal
          account={this.props.account}
          isOpen={this.state.activeModal === 'welcome'}
          closeModal={this.resetModal}
          tokenName={this.props.selectedToken}
          baseTokenName={this.props.selectedToken}
          network={this.props.network.current} />

        <ApproveModal
          account={this.props.account}
          isOpen={this.state.activeModal === 'approve'}
          closeModal={this.resetModal}
          onClick={e => this.enableERC20(e, this.props.selectedToken)}
          tokenName={this.props.selectedToken}
          baseTokenName={this.props.selectedToken}
          network={this.props.network.current} />
      </Box>
    );
  }
}

export default SmartContractControls;
