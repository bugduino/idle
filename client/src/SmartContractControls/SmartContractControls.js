import axios from 'axios';
import React from "react";
import moment from 'moment';
import jQuery from 'jquery';
import CountUp from 'react-countup';
import globalConfigs from '../configs/globalConfigs';
import FunctionsUtil from '../utilities/FunctionsUtil';
import CryptoInput from '../CryptoInput/CryptoInput.js';
import styles from './SmartContractControls.module.scss';
import ButtonLoader from '../ButtonLoader/ButtonLoader.js';
import ShareModal from "../utilities/components/ShareModal";
import TxProgressBar from '../TxProgressBar/TxProgressBar.js';
import ApproveModal from "../utilities/components/ApproveModal";
import WelcomeModal from "../utilities/components/WelcomeModal";
import ReferralShareModal from "../utilities/components/ReferralShareModal";
import { Form, Flex, Box, Heading, Text, Button, Link, Icon, Pill, Loader, Image, Tooltip } from "rimble-ui";

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
        // Toast message
        window.toastProvider.addMessage(`Purchase completed`, {
          secondaryMessage: `Your ${this.props.selectedToken} are now available`,
          colorTheme: 'light',
          actionHref: "",
          actionText: "",
          variant: "success",
        });

        this.setState({
          needsUpdate: true
        });
      };

      const onClose = async (e) => {
        return true;
      }

      const initParams = defaultProvider.getInitParams ? defaultProvider.getInitParams(this.props,globalConfigs,null,onSuccess,onClose) : null;

      this.functionsUtil.sendGoogleAnalyticsEvent({
        eventCategory: 'UI',
        eventAction: 'buy_with_eth',
        eventLabel: defaultProviderName,
      });

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

  checkContractPaused = async () => {
    const contractIsPaused = await this.functionsUtil.genericIdleCall('paused');
    this.setState({
      contractIsPaused
    });
  }

  rebalanceCheck = async () => {
    this.setState({calculatingShouldRebalance:true});

    const _newAmount = 0;
    const _clientProtocolAmounts = [];
    let shouldRebalance = null;
    const callParams = { gas: this.props.web3.utils.toBN(5000000) };

    try{
      await this.functionsUtil.estimateGas(this.props.tokenConfig.idle.token,'rebalance',[_newAmount,_clientProtocolAmounts],callParams);
    } catch (err){
      shouldRebalance = false;

      return this.setState({
        shouldRebalance,
        calculatingShouldRebalance: false,
      });
    }

    shouldRebalance = await this.functionsUtil.genericIdleCall('rebalance',[_newAmount,_clientProtocolAmounts]);

    if (!shouldRebalance && this.props.contractsInitialized){

      let [currAllocation,newAllocation] = await Promise.all([
        this.props.getAllocations(),
        this.functionsUtil.genericIdleCall('getParamsForRebalance',[_newAmount],callParams)
      ]);

      if (newAllocation && currAllocation){
        const currProtocols = Object.keys(currAllocation[0])
                                .filter((addr,i) => { return this.functionsUtil.BNify(currAllocation[0][addr].toString()).gt(0) })
                                .map(v => { return v.toLowerCase() });

        newAllocation = newAllocation[0].reduce((obj, key, index) => ({ ...obj, [key.toLowerCase()]: newAllocation[1][index] }), {});
        const newProtocols = Object.keys(newAllocation)
                              .filter((addr,i) => { return this.functionsUtil.BNify(newAllocation[addr].toString()).gt(0) })
                              .map(v => { return v.toLowerCase() });

        const diff = newProtocols.filter(x => !currProtocols.includes(x));

        // If newProtocols differs from currProtocols rebalance
        if (diff && diff.length){
          shouldRebalance = true;
        }
      }
    }

    this.setState({
      shouldRebalance,
      calculatingShouldRebalance: false,
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

  getProtocolInfoByAddress = (addr) => {
    return this.props.tokenConfig.protocols.find(c => c.address === addr);
  }

  getAllocations = async () => {
    const res = await this.props.getAllocations();

    if (res){
      const [allocations,totalAllocation,exchangeRates,protocolsBalances] = res;

      if (allocations){
        this.setState({
          allocations,
          exchangeRates,
          totalAllocation,
          protocolsBalances
        });
      }

      return allocations;
    }
  }

  getAprs = async () => {
    const Aprs = await this.functionsUtil.genericIdleCall('getAPRs');

    if (componentUnmounted){
      return false;
    }

    if (!Aprs){
      return false;
    }

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
          [`${protocolName}Rate`]: (+this.functionsUtil.toEth(protocolApr)).toFixed(2)
        });
      }
    });

    maxRate = aprs ? ((+this.functionsUtil.toEth(maxRate)).toFixed(2)) : '0.00';

    this.setState({
      aprs,
      maxRate,
      currentProtocol,
      currentRate
    });
  }

  getPriceInToken = async (contractName) => {
    contractName = contractName ? contractName : this.props.tokenConfig.idle.token;

    const totalIdleSupply = await this.functionsUtil.genericContractCall(contractName, 'totalSupply');
    const tokenDecimals = await this.getTokenDecimals();
    let tokenPrice = await this.functionsUtil.genericContractCall(contractName, 'tokenPrice');

    if (!tokenPrice || !tokenDecimals){
      return false;
    }

    tokenPrice = this.functionsUtil.fixTokenDecimals(tokenPrice,tokenDecimals);
    const navPool = this.functionsUtil.BNify(totalIdleSupply).div(1e18).times(tokenPrice);
    const idleTokenPrice = (totalIdleSupply || totalIdleSupply === 0) && totalIdleSupply.toString() === '0' ? 0 : tokenPrice.toString();

    this.setState({
      idleTokenPrice,
      navPool, // Remove for demo
      tokenPrice,
      totalIdleSupply
    });

    return tokenPrice;
  }

  getTokenDecimals = async () => {
    if (this.props.tokenDecimals){
      const tokenDecimals = await (new Promise( async (resolve, reject) => {
        resolve(this.props.tokenDecimals);
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
      const tokenBalance = await this.functionsUtil.genericContractCall(this.props.selectedToken,'balanceOf',[this.props.account]);
      if (tokenBalance){
        const tokenDecimals = await this.getTokenDecimals();
        const tokenBalanceFixed = this.functionsUtil.fixTokenDecimals(tokenBalance,tokenDecimals);
        this.setState({
          tokenBalanceBNify: tokenBalance,
          tokenBalance: tokenBalanceFixed.toString()
        });
        return tokenBalanceFixed;
      } else {
        this.functionsUtil.customLogError('Error on getting balance');
      }
    }
    return null;
  }

  reloadFunds = async(e) => {
    if (e){
      e.preventDefault();
    }
    if (localStorage){
      const storedTxs = JSON.parse(localStorage.getItem('transactions'));
      if (storedTxs){
        if (storedTxs[this.props.account]){
          delete storedTxs[this.props.account];
        }
        this.functionsUtil.setLocalStorage('transactions',JSON.stringify(storedTxs));
      }
    }
    this.getBalanceOf(this.props.tokenConfig.idle.token);
  }

  getUnderlineTokensBalance = async () => {
    const underlyingTokensAmount = {};
    await this.functionsUtil.asyncForEach(this.props.tokenConfig.protocols,async (p,i) => {
      const protocolAddr = p.address;
      underlyingTokensAmount[protocolAddr] = await this.functionsUtil.getProtocolBalance(p.token,this.props.tokenConfig.idle.address);
    });

    this.setState({
      underlyingTokensAmount
    });
  }

  getBalanceOf = async (contractName,count) => {
    count = count ? count : 0;

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

      let amountLent = this.state.amountLent;

      // console.log('AmountLent 1',amountLent);

      // this.functionsUtil.customLog('getBalanceOf 2','tokenToRedeem',tokenToRedeem.toString(),'amountLent',this.state.amountLent.toString());

      if (amountLent && this.functionsUtil.trimEth(amountLent.toString())>0 && this.functionsUtil.trimEth(tokenToRedeem.toString())>0 && parseFloat(this.functionsUtil.trimEth(tokenToRedeem.toString()))<parseFloat(this.functionsUtil.trimEth(amountLent.toString()))){
        // console.error('tokenToRedeem',tokenToRedeem.toString(),' less than amountLent',amountLent.toString());
        amountLent = tokenToRedeem;
      } else if (amountLent && amountLent.lte(0) && tokenToRedeem){
        // console.log('AmountLent 3',amountLent.toString(),tokenToRedeem.toString());
        amountLent = tokenToRedeem;
      }

      // console.log((tokenToRedeem ? tokenToRedeem.toString() : null),(amountLent ? amountLent.toString() : null));

      if (this.functionsUtil.BNify(tokenToRedeem).gt(this.functionsUtil.BNify(amountLent))){
        earning = tokenToRedeem.minus(this.functionsUtil.BNify(amountLent));
      }

      // customLog('earning',earning.toString());

      /*
      const redirectToFundsAfterLogged = localStorage && localStorage.getItem('redirectToFundsAfterLogged') ? parseInt(localStorage.getItem('redirectToFundsAfterLogged')) : true;

      // Select seconds Tab
      if (tokenToRedeem.gt(0) && redirectToFundsAfterLogged){
        this.selectTab({ preventDefault:()=>{} },'2');
      }

      if (localStorage){
        localStorage.removeItem('redirectToFundsAfterLogged');
      }
      */

      const currentApr = this.functionsUtil.BNify(this.state.maxRate).div(100);
      const earningPerYear = tokenToRedeem.times(currentApr);
      const earningPerDay = earningPerYear.div(this.functionsUtil.BNify(365.242199));

      this.functionsUtil.customLog('getBalanceOf 3',balance.toString(),tokenToRedeem.toString(),amountLent,earning,currentApr,earningPerYear);

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

      this.setState({
        earning,
        balance,
        amountLent,
        currentApr,
        earningPerDay,
        tokenToRedeem,
        earningPerYear,
        fundsError:false,
        callMintCallback:false,
        idleTokenBalance:balance.toString(),
        tokenToRedeemParsed: tokenToRedeem.toString(),
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

  disableERC20 = (e, name, address) => {

    address = address ? address : this.props.tokenConfig.idle.address;

    if (e){
      e.preventDefault();
    }
    // No need for callback atm
    this.props.contractMethodSendWrapper(name, 'approve', [
      address,
      0 // Disapprova
    ],null,(tx)=>{
      this.setState({
        needsUpdate:true,
        isApprovingToken: false,
        approveTx:null,
      });
    }, (tx) => {
      // this.addTransaction(tx);
      this.setState({
        approveTx: tx
      });
    });

    this.setState({
      isApprovingToken: true
    });
  }

  checkTransactionAlreadyMined = (tx) => {
    let transaction = this.props.transactions[tx.created];
    return transaction && transaction.status === 'success' && transaction.confirmationCount>1;
  }

  enableERC20 = async (e, token) => {
    if (e){
      e.preventDefault();
    }

    // Check if the token is already approved
    const tokenApproved = await this.checkTokenApproved();
    if (tokenApproved){
      return this.setState({
        isTokenApproved: true,
        isApprovingToken: false,
        needsUpdate: true,
        approveTx:null,
      });
    }

    this.props.contractMethodSendWrapper(token, 'approve', [
      this.props.tokenConfig.idle.address,
      this.props.web3.utils.toTwosComplement('-1') // max uint solidity
      // this.props.web3.utils.BN(0) // Disapprova
    ],null,(tx,error)=>{

      const newState = {
        isTokenApproved: false,
        isApprovingToken: false,
        needsUpdate: true,
        approveTx:null,
      };

      // Send Google Analytics event
      const eventData = {
        eventCategory: 'Approve',
        eventAction: token,
        eventLabel: tx.status,
      };

      if (error){
        eventData.eventLabel = this.functionsUtil.getTransactionError(error);
      }

      // Send Google Analytics event
      if (error || eventData.status !== 'error'){
        this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
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
    const gasLimit = _clientProtocolAmounts.length && _clientProtocolAmounts.indexOf('0') === -1 ? this.functionsUtil.BNify(1500000) : this.functionsUtil.BNify(1000000);

    const callback = (tx) => {
      const needsUpdate = tx.status === 'success' && !this.checkTransactionAlreadyMined(tx);

      // Send Google Analytics event
      this.functionsUtil.sendGoogleAnalyticsEvent({
        eventCategory: 'Rebalance',
        eventAction: this.props.selectedToken,
        eventLabel: tx.status,
      });

      this.setState({
        needsUpdate: needsUpdate,
        rebalanceProcessing: false
      });
    };

    const callback_receipt = null;

    this.props.contractMethodSendWrapper(this.props.tokenConfig.idle.token, 'rebalance', [ _newAmount, _clientProtocolAmounts ], null , callback, callback_receipt, gasLimit);
  }

  checkTokenApproved = async () => {
    if (this.props.account) {
      const isTokenApproved = await this.functionsUtil.checkTokenApproved(this.props.selectedToken,this.props.tokenConfig.idle.address,this.props.account);

      this.setState({
        isTokenApproved
      });
      return isTokenApproved;
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

    const lendAmount = this.state.lendAmount;

    const value = this.functionsUtil.normalizeTokenAmount(lendAmount,this.props.tokenDecimals).toString();

    // check if Idle is approved for DAI
    if (this.props.account && !this.state.isTokenApproved) {
      return this.setState({activeModal: 'approve'});
    }

    if (localStorage){
      this.functionsUtil.setLocalStorage('redirectToFundsAfterLogged',0);
    }

    this.setState({
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
    const gasLimit = _clientProtocolAmounts.length && _clientProtocolAmounts.indexOf('0') === -1 ? this.functionsUtil.BNify(1500000) : this.functionsUtil.BNify(1000000);

    const callback = (tx,error) => {

      const txSucceeded = tx.status === 'success';
      const txMined = this.checkTransactionAlreadyMined(tx);
      const needsUpdate = txSucceeded && !txMined;
      this.functionsUtil.customLog('mintIdleToken_callback needsUpdate:',tx,txMined,needsUpdate);

      const eventData = {
        eventCategory: 'Deposit',
        eventAction: this.props.selectedToken,
        eventLabel: tx.status,
        eventValue: parseInt(lendAmount)
      };

      if (error){
        eventData.eventLabel = this.functionsUtil.getTransactionError(error);
      }

      // Send Google Analytics event
      if (error || eventData.status !== 'error'){
        this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
      }

      const newState = {
        lendingProcessing: false,
        lendingTx:null,
        callMintCallback:false,
        needsUpdate
      };

      if (txSucceeded){
        // Reset lending amount
        this.handleChangeAmount({
          target:{
            value: ''
          }
        });

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

  redeemUnderlyingTokens = async (e,contractName) => {
    e.preventDefault();

    this.setState(state => ({
      ...state,
      disableRedeemButton:false,
      genericErrorRedeem:'',
      redeemProcessing: true
    }));

    const redeemAmount = this.state.idleTokenBalance;

    const idleTokenToRedeem = this.functionsUtil.normalizeTokenAmount(redeemAmount,18).toString();

    this.functionsUtil.customLog('redeem',idleTokenToRedeem);

    const callback = (tx,error) => {
      const txSucceeded = tx.status === 'success';
      const needsUpdate = txSucceeded && !this.checkTransactionAlreadyMined(tx);
      this.functionsUtil.customLog('redeemInterestBearingTokens_mined_callback needsUpdate:',tx.status,this.checkTransactionAlreadyMined(tx),needsUpdate);

      // Send Google Analytics event
      const eventData = {
        eventCategory: `Redeem_underline`,
        eventAction: this.props.selectedToken,
        eventLabel: tx.status,
        eventValue: parseInt(redeemAmount)
      };

      if (error){
        eventData.eventLabel = this.functionsUtil.getTransactionError(error);
      }

      // Send Google Analytics event
      if (error || eventData.status !== 'error'){
        this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
      }

      this.setState({
        redeemProcessing: false,
        redeemTx:null,
        needsUpdate
      });

      if (txSucceeded){
        // Reset lending amount
        this.handleChangeAmountRedeem({
          target:{
            value: ''
          }
        });
      }

    };

    const callback_receipt = (tx) => {
      this.functionsUtil.customLog('redeemInterestBearingTokens_receipt_callback',tx.transactionHash,tx.status);
      this.setState({
        redeemTx: tx
      });
    };

    this.props.contractMethodSendWrapper(contractName, 'redeemInterestBearingTokens', [ idleTokenToRedeem ], null, callback, callback_receipt);

  }

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
      if (!amount.toString().length || this.functionsUtil.BNify(amount).lte(0)) {
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
      redeemProcessing: true
    }));

    const redeemAmount = this.state.redeemAmount;

    const idleTokenToRedeem = this.functionsUtil.normalizeTokenAmount(redeemAmount,18).toString();

    this.functionsUtil.customLog('redeem',idleTokenToRedeem);

    // Get amounts for best allocations
    const _skipRebalance = globalConfigs.contract.methods.redeem.skipRebalance;
    let paramsForRedeem = null;

    if (this.props.account){
      const callParams = { from: this.props.account, gas: this.props.web3.utils.toBN(5000000) };
      paramsForRedeem = await this.functionsUtil.genericIdleCall('getParamsForRedeemIdleToken',[idleTokenToRedeem, _skipRebalance],callParams);
      this.functionsUtil.customLog('getParamsForRedeemIdleToken',idleTokenToRedeem,paramsForRedeem);
    }

    const _clientProtocolAmounts = paramsForRedeem ? paramsForRedeem[1] : [];
    const gasLimit = _clientProtocolAmounts.length && _clientProtocolAmounts.indexOf('0') === -1 ? this.functionsUtil.BNify(1500000) : this.functionsUtil.BNify(1000000);

    const callback = (tx,error) => {
      const txSucceeded = tx.status === 'success';
      const needsUpdate = txSucceeded && !this.checkTransactionAlreadyMined(tx);
      this.functionsUtil.customLog('redeemIdleToken_mined_callback needsUpdate:',tx.status,this.checkTransactionAlreadyMined(tx),needsUpdate);

      // Send Google Analytics event
      const redeemType = this.state.partialRedeemEnabled ? 'partial' : 'total';
      const eventData = {
        eventCategory: `Redeem_${redeemType}`,
        eventAction: this.props.selectedToken,
        eventLabel: tx.status,
        eventValue: parseInt(redeemAmount)
      };

      if (error){
        eventData.eventLabel = this.functionsUtil.getTransactionError(error);
      }

      // Send Google Analytics event
      if (error || eventData.status !== 'error'){
        this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
      }

      this.setState({
        redeemProcessing: false,
        redeemTx:null,
        needsUpdate
      });

      if (txSucceeded){
        // Reset lending amount
        this.handleChangeAmountRedeem({
          target:{
            value: ''
          }
        });
      }

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
      // customLog('handleChangeAmountRedeem',amount,this.state.balance);
      this.setState({ redeemAmount: amount });

      let disableRedeemButton = false;
      let genericErrorRedeem = '';

      if (this.props.account) {
        if (this.functionsUtil.BNify(amount).gt(this.functionsUtil.BNify(this.state.balance))){
          disableRedeemButton = true;
          genericErrorRedeem = 'The inserted amount exceeds your redeemable balance';
        } else if (this.functionsUtil.BNify(amount).lte(0)) {
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
        if (this.functionsUtil.BNify(amount).gt(this.functionsUtil.BNify(this.state.tokenBalance))){
          disableLendButton = true;
          const defaultTokenSwapper = this.getDefaultTokenSwapper();
          if (defaultTokenSwapper){
            buyTokenMessage = `The inserted amount exceeds your balance. Click here to buy more ${this.props.selectedToken}`;
          } else {
            genericError = `The inserted amount exceeds your ${this.props.selectedToken} balance`;
          }
        } else if (this.functionsUtil.BNify(amount).lte(0)) {
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
    let lastBlockNumber = this.state.lastBlockNumber;

    // Check if etherscan is enabled for the required network
    if (etherscanInfo.enabled && etherscanInfo.endpoints[requiredNetwork]){
      const etherscanApiUrl = etherscanInfo.endpoints[requiredNetwork];
      const txs = await axios.get(`${etherscanApiUrl}?apikey=${env.REACT_APP_ETHERSCAN_KEY}&module=account&action=tokentx&address=${this.props.account}&startblock=${lastBlockNumber}&endblock=999999999&sort=asc`).catch(err => {
        this.functionsUtil.customLog('Error getting prev txs');
        if (componentUnmounted){
          return false;
        }
        if (!count){
          // console.log('Retrieving prevTxs',count);
          setTimeout(() => {
            this.getPrevTxs(count+1);
          },1000);
          return false;
        }
      });

      if (!txs || !txs.data || !txs.data.result){
        return this.setState({
          prevTxs:{},
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

    const etherscanTxs = results.filter(
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
    ).map(tx => {
      return ({...tx, value: this.functionsUtil.fixTokenDecimals(tx.value,tokenDecimals)});
    });

    // console.log('etherscanTxs',etherscanTxs);

    let amountLent = this.functionsUtil.BNify(0);

    // Initialize prevTxs
    let prevTxs = this.state.prevTxs ? Object.assign({},this.state.prevTxs) : {};

    // Take storedTxs from localStorage
    const storedTxs = localStorage && JSON.parse(localStorage.getItem('transactions')) ? JSON.parse(localStorage.getItem('transactions')) : {};
    
    // Inizialize storedTxs for pair account-token if empty
    if (typeof storedTxs[this.props.account] !== 'object'){
      storedTxs[this.props.account] = {};
    }

    if (typeof storedTxs[this.props.account][this.props.selectedToken] !== 'object'){
      storedTxs[this.props.account][this.props.selectedToken] = {};
    }

    // Check if this is the first interaction with Idle
    let depositedTxs = 0;

    if (etherscanTxs && etherscanTxs.length){

      // Merge new txs with previous ones
      await this.functionsUtil.asyncForEach(etherscanTxs,async (tx,index) => {
        prevTxs[tx.hash] = tx;
      });

      const lastTx = etherscanTxs[etherscanTxs.length-1];

      // Update last block number
      if (lastTx && lastTx.blockNumber){
        lastBlockNumber = lastTx.blockNumber;
      }

      // Loop through prevTxs to have all the history
      await this.functionsUtil.asyncForEach(Object.values(prevTxs),async (tx,index) => {

        const txKey = `tx${tx.timeStamp}000`;
        const storedTx = storedTxs[this.props.account][this.props.selectedToken][txKey] ? storedTxs[this.props.account][this.props.selectedToken][txKey] : tx;
        const isNewTx = etherscanTxs.indexOf(tx) !== -1; // Just fetched from etherscan
        const isMigrationTx = migrationContractAddr && (tx.from.toLowerCase() === migrationContractAddr.toLowerCase() || migrationContractOldAddrs.map((v) => { return v.toLowerCase(); }).indexOf(tx.from.toLowerCase()) !== -1 ) && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
        const isSendTransferTx = !isMigrationTx && tx.from.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
        const isReceiveTransferTx = !isMigrationTx && tx.to.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
        const isDepositTx = !isMigrationTx && !isSendTransferTx && !isReceiveTransferTx && tx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
        const isRedeemTx = !isMigrationTx && !isSendTransferTx && !isReceiveTransferTx && tx.to.toLowerCase() === this.props.account.toLowerCase();

        // Deposited
        if (isSendTransferTx){
          // amountLent = amountLent.plus(this.functionsUtil.BNify(tx.value));
          // depositedTxs++;
          
          let tokenPrice = await this.functionsUtil.genericContractCall(this.props.tokenConfig.idle.token, 'tokenPrice',[],{}, tx.blockNumber);
          tokenPrice = this.functionsUtil.fixTokenDecimals(tokenPrice,18);

          const tokensTransfered = tokenPrice.times(this.functionsUtil.BNify(tx.value));

          // Decrese amountLent by the last idleToken price
          amountLent = amountLent.minus(tokensTransfered);

          if (amountLent.lt(0)){
            amountLent = this.functionsUtil.BNify(0);
          }

          // console.log(`Transfer sent of ${tx.value} (${tokensTransfered}) - Balance: ${idleTokenBalance.toString()}, amountLent: ${amountLent}`);

          storedTx.value = tokensTransfered;

        } else if (isReceiveTransferTx){
          
          let tokenPrice = await this.functionsUtil.genericContractCall(this.props.tokenConfig.idle.token, 'tokenPrice',[],{}, tx.blockNumber);
          tokenPrice = this.functionsUtil.fixTokenDecimals(tokenPrice,18);

          const tokensTransfered = tokenPrice.times(this.functionsUtil.BNify(tx.value));

          // Decrese amountLent by the last idleToken price
          amountLent = amountLent.plus(tokensTransfered);

          // console.log(`Transfer received of ${tx.value} (${tokensTransfered}) - Balance: ${idleTokenBalance.toString()}, amountLent: ${amountLent}`);

          storedTx.value = tokensTransfered;

        } else if (isDepositTx){
          amountLent = amountLent.plus(this.functionsUtil.BNify(tx.value));

          depositedTxs++;

          if (!storedTx.idleTokens){

            // Init idleTokens amount
            storedTx.idleTokens = this.functionsUtil.BNify(tx.value);

            const decodeLogs = [
              {
                "internalType": "uint256",
                "name": "_tokenAmount",
                "type": "uint256"
              }
            ];

            const walletAddress = this.props.account.replace('x','').toLowerCase();
            const res = await this.functionsUtil.getTxDecodedLogs(tx,walletAddress,decodeLogs,storedTx);

            if (res){
              const [txReceipt,logs] = res;

              storedTx.idleTokens = this.functionsUtil.fixTokenDecimals(logs._tokenAmount,18);
              storedTx.txReceipt = txReceipt;
            }
          }

          // console.log(`Deposited ${storedTx.idleTokens} (${tx.value}), AmountLent: ${amountLent}`);

          // Save new storedTx
          storedTxs[this.props.account][this.props.selectedToken][txKey] = storedTx;

        // Redeemed
        } else if (isRedeemTx){

          let redeemedValue = storedTx.value;
          let redeemedValueFixed = storedTx.value;

          // Get real redeemed amount from tx logs
          if (isNewTx){

            let redeemTxReceipt = storedTx.txReceipt ? storedTx.txReceipt : null;

            if (!redeemTxReceipt){
              // console.log('getPrevTxs - redeemTx - getTransactionReceipt',tx.hash);
              redeemTxReceipt = await (new Promise( async (resolve, reject) => {
                this.props.web3.eth.getTransactionReceipt(tx.hash,(err,tx)=>{
                  if (err){
                    reject(err);
                  }
                  resolve(tx);
                });
              }));
            }

            if (!redeemTxReceipt){
              return;
            }

            const walletAddress = this.props.account.replace('x','').toLowerCase();
            const internalTransfers = redeemTxReceipt.logs.filter((tx) => { return tx.topics[tx.topics.length-1].toLowerCase() === `0x00000000000000000000000${walletAddress}`; });
            
            if (!internalTransfers.length){
              return;
            }

            const internalTransfer = internalTransfers.pop();

            try {
              // Decode lons
              const decodedLogs = this.props.web3.eth.abi.decodeLog([
                {
                  "internalType": "uint256",
                  "name": "_tokenAmount",
                  "type": "uint256"
                }
              ],internalTransfer.data,internalTransfer.topics);

              if (decodedLogs){
                redeemedValue = decodedLogs._tokenAmount;
                redeemedValueFixed = this.functionsUtil.fixTokenDecimals(redeemedValue,tokenDecimals);
                storedTx.value = redeemedValueFixed;
              } else {
                return;
              }
            } catch (err) {
              return;
            }
            
            // Save txReceipt in localStorage
            if (!storedTx.txReceipt){
              storedTx.txReceipt = redeemTxReceipt;
              storedTxs[this.props.account][this.props.selectedToken][txKey] = storedTx;
            }
          }

          // Decrese amountLent by redeem amount
          amountLent = amountLent.minus(this.functionsUtil.BNify(redeemedValueFixed));

          // console.log(`Redeemed ${tx.value} (${redeemedValueFixed}), AmountLent: ${amountLent}`);
          // Reset amountLent if below zero
          if (amountLent.lt(0)){
            amountLent = this.functionsUtil.BNify(0);
          }
        // Migrated
        } else if (isMigrationTx){

          let migrationValue = tx.value;
          let migrationValueFixed = tx.value;

          // Get real migrated amount from tx logs
          if (isNewTx){

            let migrationTxReceipt = storedTx.txReceipt ? storedTx.txReceipt : null;

            if (!migrationTxReceipt){
              // console.log('getPrevTxs - migrationTx - getTransactionReceipt',tx.hash);
              migrationTxReceipt = await (new Promise( async (resolve, reject) => {
                this.props.web3.eth.getTransactionReceipt(tx.hash,(err,tx)=>{
                  if (err){
                    reject(err);
                  }
                  resolve(tx);
                });
              }));
            }

            if (!migrationTxReceipt){
              return;
            }

            const internalTransfers = migrationTxReceipt.logs.filter((tx) => { return tx.topics[tx.topics.length-1].toLowerCase() === `0x00000000000000000000000${oldContractAddr}`; });

            if (!internalTransfers.length){
              return;
            }

            const internalTransfer = internalTransfers.pop();

            try {
              const decodedLogs = this.props.web3.eth.abi.decodeLog([
                /*{
                  "internalType": "uint256",
                  "name": "_idleToken",
                  "type": "uint256"
                },*/
                {
                  "internalType": "uint256",
                  "name": "_tokenAmount",
                  "type": "uint256"
                }/*,
                {
                  "internalType": "uint256",
                  "name": "_price",
                  "type": "uint256"
                },*/
              ],internalTransfer.data,internalTransfer.topics);

              if (decodedLogs){
                migrationValue = decodedLogs._tokenAmount;
                const oldContractTokenDecimals = this.state.oldContractTokenDecimals ? this.state.oldContractTokenDecimals : await this.functionsUtil.getTokenDecimals(this.props.tokenConfig.migration.oldContract.name);
                migrationValueFixed = this.functionsUtil.fixTokenDecimals(migrationValue,oldContractTokenDecimals);

                storedTx.value = migrationValueFixed;
              } else {
                // console.log('Can\'t decode migration tx logs');
                return;
              }
            } catch (error) {
              // console.log('Error while decoding migration tx logs',error,internalTransfers);
              return;
            }

            // Save txReceipt in localStorage
            if (!storedTx.txReceipt){
              storedTx.txReceipt = migrationTxReceipt;
              storedTxs[this.props.account][this.props.selectedToken][txKey] = storedTx;
            }

          }

          amountLent = amountLent.plus(this.functionsUtil.BNify(migrationValueFixed));

          // console.log(`Migrated ${tx.value} (${migrationValueFixed}), AmountLent: ${amountLent}`);
        }

        // Update transaction
        prevTxs[tx.hash] = tx;
      });
    }

    let minedTxs = storedTxs[this.props.account][this.props.selectedToken];

    // Add missing executed transactions
    if (minedTxs){

      this.functionsUtil.customLog('getPrevTxs adding minedTxs',minedTxs);

      await this.functionsUtil.asyncForEach(Object.keys(minedTxs),async (txKey,i) => {
        const tx = minedTxs[txKey];
        const isStoredTx = storedTxs && storedTxs[this.props.account] && storedTxs[this.props.account][this.props.selectedToken] && storedTxs[this.props.account][this.props.selectedToken][txKey];

        const allowedMethods = ['mintIdleToken','redeemIdleToken','bridgeIdleV1ToIdleV2']

        // Skip invalid txs
        if (prevTxs[tx.transactionHash] || tx.status !== 'success' || !tx.transactionHash || allowedMethods.indexOf(tx.method)===-1){
          return;
        }

        let realTx = tx.realTx ? tx.realTx : null;

        if (!realTx){
          // console.log('getPrevTxs - getTransaction',tx.transactionHash);
          realTx = await (new Promise( async (resolve, reject) => {
            this.props.web3.eth.getTransaction(tx.transactionHash,(err,txReceipt)=>{
              if (err){
                reject(err);
              }
              resolve(txReceipt);
            });
          }));
        }

        this.functionsUtil.customLog('realTx (localStorage)',realTx);

        // Skip txs from other wallets
        if (!realTx || realTx.from.toLowerCase() !== this.props.account.toLowerCase()){
          // this.functionsUtil.customLog('Skipped tx '+tx.transactionHash+' not from this account.');
          return;
        }

        realTx.contractAddress = this.props.tokenConfig.address;
        realTx.timeStamp = parseInt(tx.created/1000);

        let txValue;
        switch (tx.method){
          case 'mintIdleToken':

            if (realTx.to.toLowerCase() !== this.props.tokenConfig.idle.address.toLowerCase()){
              // Remove wrong contract tx
              if (isStoredTx){
                delete storedTxs[this.props.account][this.props.selectedToken][txKey];
              }

              // this.functionsUtil.customLog('Skipped deposit tx '+tx.transactionHash+' - wrong contract');
              return;
            }

            txValue = tx.params ? this.functionsUtil.fixTokenDecimals(tx.params[0],tokenDecimals).toString() : 0;
            if (!txValue){
              // this.functionsUtil.customLog('Skipped deposit tx '+tx.transactionHash+' - value is zero ('+txValue+')');
              return;
            }
            
            depositedTxs++;
            realTx.status = 'Deposited';
            realTx.value = txValue;
          break;
          case 'redeemIdleToken':

            let redeemTxReceipt = tx.txReceipt ? tx.txReceipt : null;

            if (!redeemTxReceipt){
              // console.log('getPrevTxs - redeemTx - getTransactionReceipt',tx.hash);
              redeemTxReceipt = await (new Promise( async (resolve, reject) => {
                this.props.web3.eth.getTransactionReceipt(tx.transactionHash,(err,tx)=>{
                  if (err){
                    reject(err);
                  }
                  resolve(tx);
                });
              }));

            }

            if (!redeemTxReceipt || redeemTxReceipt.to.toLowerCase() !== this.props.tokenConfig.idle.address.toLowerCase() ){
              // Remove wrong contract tx
              if (isStoredTx){
                delete storedTxs[this.props.account][this.props.selectedToken][txKey];
              }
              return;
            }

            // Save txReceipt into the tx
            if (!tx.txReceipt){
              tx.txReceipt = redeemTxReceipt;
              if (isStoredTx){
                storedTxs[this.props.account][this.props.selectedToken][txKey] = tx;
              }
            }

            const walletAddress = this.props.account.replace('x','').toLowerCase();
            const redeemTxInternalTransfers = redeemTxReceipt.logs.filter((tx) => { return tx.topics[tx.topics.length-1].toLowerCase() === `0x00000000000000000000000${walletAddress}`; });

            if (!redeemTxInternalTransfers.length){
              return;
            }

            const redeemInternalTransfer = redeemTxInternalTransfers.pop();

            try {
              // Decode lons
              const decodedLogs = this.props.web3.eth.abi.decodeLog([
                {
                  "internalType": "uint256",
                  "name": "_tokenAmount",
                  "type": "uint256"
                }
              ],redeemInternalTransfer.data,redeemInternalTransfer.topics);

              if (decodedLogs){
                const redeemedValue = decodedLogs._tokenAmount;
                const redeemTokenDecimals = await this.getTokenDecimals();
                const redeemedValueFixed = this.functionsUtil.fixTokenDecimals(redeemedValue,redeemTokenDecimals);

                realTx.status = 'Redeemed';
                realTx.value = redeemedValueFixed.toString();

              } else {
                return;
              }
            } catch (err) {
              return;
            }

            // TODO: save tx to localstorage
          break;
          case 'bridgeIdleV1ToIdleV2':

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
              return;
            }

            const contractAddress = this.props.tokenConfig.idle.address.toLowerCase().replace('x','');
            const isMigrationRightContract = migrationTxReceipt.logs.filter((tx) => { return tx.topics[tx.topics.length-1].toLowerCase() === `0x00000000000000000000000${contractAddress}`; });

            if (!isMigrationRightContract.length){
              // Remove wrong contract tx
              if (isStoredTx){
                delete storedTxs[this.props.account][this.props.selectedToken][txKey];
              }
              return;
            }

            // Save txReceipt into the tx
            if (!tx.txReceipt){
              tx.txReceipt = migrationTxReceipt;
              if (isStoredTx){
                storedTxs[this.props.account][this.props.selectedToken][txKey] = tx;
              }
            }

            const migrationTxInternalTransfers = migrationTxReceipt.logs.filter((tx) => { return tx.topics[tx.topics.length-1].toLowerCase() === `0x00000000000000000000000${oldContractAddr}`; });

            if (!migrationTxInternalTransfers.length){
              return;
            }

            const migrationInternalTransfer = migrationTxInternalTransfers.pop();

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
            ],migrationInternalTransfer.data,migrationInternalTransfer.topics);

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

        // this.functionsUtil.customLog('realTx from localStorage:',realTx);

        if (tx.method==='mintIdleToken'){
          amountLent = amountLent.plus(this.functionsUtil.BNify(realTx.value));
          // console.log('Deposited (localStorage) '+parseFloat(realTx.value),'AmountLent',amountLent.toString());
        } else if (tx.method==='redeemIdleToken'){
          amountLent = amountLent.minus(this.functionsUtil.BNify(realTx.value));
          if (amountLent.lt(0)){
            amountLent = this.functionsUtil.BNify(0);
          }
          // console.log('Redeemed (localStorage) '+parseFloat(realTx.value),'AmountLent',amountLent.toString());
        } else if (tx.method==='bridgeIdleV1ToIdleV2'){
          amountLent = amountLent.plus(this.functionsUtil.BNify(realTx.value));
          // console.log('Migrated (localStorage) '+parseFloat(realTx.value),'AmountLent',amountLent.toString());
        }

        // Save realTx and update localStorage
        if (!tx.realTx){
          tx.realTx = realTx;
          storedTxs[this.props.account][this.props.selectedToken][txKey] = tx;
        }

        prevTxs[realTx.hash] = realTx;
      });
  
      // Update localStorage
      if (storedTxs && localStorage){
        this.functionsUtil.setLocalStorage('transactions',JSON.stringify(storedTxs));
      }
    }

    let earning = this.state.earning;
    if (this.state.tokenToRedeem){
      earning = this.state.tokenToRedeem.minus(amountLent);
    }

    if (amountLent.lt(0)){
      amountLent = this.functionsUtil.BNify(0);
    }

    const isFirstDeposit = depositedTxs === 1;

    return this.setState({
      prevTxsError: false,
      prevTxs,
      lastBlockNumber,
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
        });
      } else if (update_txs){
        this.setState({
          prevTxs: transactions,
        });
      }

      if (needsUpdate){
        // console.log('Txs updated - calling prevTxs');
        this.getPrevTxs();
      }
    }
  };

  async componentWillMount() {
    this.initState();
    this.loadUtils();
  }

  // Clear all the timeouts
  async componentWillUnmount(){
    componentUnmounted = true;

    let id = window.setTimeout(function() {}, 0);

    while (id--) {
        window.clearTimeout(id); // will do nothing if no timeout with id is present
    }
  }

  initState = async () => {
    // Init state
    return this.setState({
      iDAIRate:0,
      cDAIRate:0,
      maxRate:'-',
      prevTxs:null, // Transactions from Etherscan
      earning:null,
      balance:null,
      lendAmount:'',
      redeemTx:null,
      lendingTx:null,
      cDAIToRedeem:0,
      approveTx:null,
      redeemAmount:'',
      selectedTab:'1',
      tokenPrice:null,
      amountLent:null,
      allocations:null,
      executedTxs:null,
      activeModal:null,
      fundsError:false,
      idleDAICap:30000,
      isMigrating:false,
      migrationTx:false,
      needsUpdate:false,
      genericError:null,
      exchangeRates:null,
      IdleDAISupply:null,
      earningPerDay:null,
      showFundsInfo:true,
      prevTxsError:false,
      tokenToRedeem:null,
      fundsTimeoutID:null,
      earningPerYear:null,
      buyTokenMessage:null,
      isFirstDeposit:false,
      totalAllocation:null,
      migrationError:false,
      idleTokenBalance:null,
      isTokenApproved:false,
      earningIntervalId:null,
      contractIsPaused:false,
      callMintCallback:false,
      isApprovingToken:false,
      componentMounted:false, // this trigger the general loading
      updateAfterMount:false, // Launch componentDidUpdate after mount
      redeemProcessing:false,
      migrationEnabled:false,
      updateInProgress:false,
      protocolsBalances:null,
      lendingProcessing:false,
      disableLendButton:false,
      isApprovingDAITest:true,
      genericErrorRedeem:null,
      oldContractBalance:null,
      migrationApproveTx:null,
      tokenToRedeemParsed:null,
      underlyingTokensAmount:{},
      disableRedeemButton:false,
      lastBlockNumber:'8119247', // Idle inception block number
      partialRedeemEnabled:true, // Partial redeem enabled by default
      showEmptyWalletOverlay:true,
      oldContractTokenDecimals:null,
      migrationContractApproved:false,
      calculatingShouldRebalance:true,
      oldContractBalanceFormatted:null,
      isApprovingMigrationContract:false,
      tokenBalance:this.props.accountBalanceToken
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

    this.addResources();

    if (!this.props.web3 || !this.props.contractsInitialized){
      this.functionsUtil.customLog('Web3 or Contracts not initialized');
      return false;
    }

    if (this.props.network && !this.props.network.isCorrectNetwork){
      return false;
    }

    await Promise.all([
      this.getAprs(),
      this.checkMigration(),
      this.getAllocations(),
      this.checkContractPaused(),
      this.rebalanceCheck(),
      this.getPriceInToken(),
      this.checkTokenApproved()
    ]);

    const newState = {
      componentMounted: true,
      updateAfterMount: false,
      needsUpdate: this.props.account && (needsUpdateEnabled || this.state.updateAfterMount)
    };

    this.functionsUtil.customLog('componentDidMount',newState);

    this.setState(newState);
  }

  async checkMigrationContractApproved() {
    if (this.props.tokenConfig.migration && this.props.tokenConfig.migration.migrationContract){
      const migrationContractInfo = this.props.tokenConfig.migration.migrationContract;
      const migrationContractName = migrationContractInfo.name;
      const migrationContract = this.functionsUtil.getContractByName(migrationContractName);
      if (migrationContract){
        return await this.functionsUtil.checkTokenApproved(this.props.tokenConfig.migration.oldContract.name,migrationContractInfo.address,this.props.account);
      }
    }
    return false;
  }

  async disapproveMigration(e) {
    if (e){
      e.preventDefault();
    }
    const migrationContractInfo = this.props.tokenConfig.migration.migrationContract;
    const migrationContract = this.functionsUtil.getContractByName(migrationContractInfo.name);
    if (migrationContract){
      this.disableERC20(null,this.props.tokenConfig.migration.oldContract.name,migrationContractInfo.address);
    }
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

          // Send Google Analytics event
          this.functionsUtil.sendGoogleAnalyticsEvent({
            eventCategory: 'Migrate',
            eventAction: 'approve',
            eventLabel: tx.status
          });

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

        const oldContractBalanceFormatted = this.state.oldContractBalanceFormatted;
        const oldContractBalance = this.state.oldContractBalance;
        const toMigrate = this.functionsUtil.BNify(oldContractBalance).toString();

        const callback = (tx,error) => {

          const newState = {
            migrationError: false,
            isMigrating: false,
            migrationTx: null
          };

          // Send Google Analytics event
          const eventData = {
            eventCategory: 'Migrate',
            eventAction: migrationMethod,
            eventLabel: tx.status,
            eventValue: parseInt(oldContractBalanceFormatted)
          };

          let txDenied = false;

          if (error){
            eventData.eventLabel = this.functionsUtil.getTransactionError(error);
          }

          // Send Google Analytics event
          if (error || eventData.status !== 'error'){
            this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
          }

          if (tx.status === 'success'){
            newState.migrationEnabled = false;
            newState.needsUpdate = true;

            // Toast message
            window.toastProvider.addMessage(`Migration completed`, {
              secondaryMessage: `Your funds has been migrated`,
              colorTheme: 'light',
              actionHref: "",
              actionText: "",
              variant: "success",
            });

            this.selectTab({ preventDefault:()=>{} },'2');
          } else if (!txDenied){ // Show migration error toast only for real error
            newState.migrationError = true;
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

        // const toMigrate =  this.functionsUtil.normalizeTokenAmount('1',this.state.oldContractTokenDecimals).toString(); // TEST AMOUNT

        const migrationParams = [...params];
        migrationParams.push(toMigrate);

        let _clientProtocolAmounts = [];
        /*
        const value = this.functionsUtil.normalizeTokenAmount(this.state.oldContractBalanceFormatted,this.state.oldContractTokenDecimals).toString();
        if (this.props.account){
          // Get amounts for best allocations
          const callParams = { from: this.props.account, gas: this.props.web3.utils.toBN(5000000) };
          const paramsForMint = await this.functionsUtil.genericIdleCall('getParamsForMintIdleToken',[value],callParams);
          if (paramsForMint){
            _clientProtocolAmounts = paramsForMint[1];
          }
          this.functionsUtil.customLog('getParamsForMintIdleToken',value,paramsForMint);
        }
        */

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

        this.functionsUtil.customLog('Migration - token decimals',oldContractTokenDecimals ? oldContractTokenDecimals.toString() : null);

        // Check migration contract approval
        migrationContractApproved = await this.checkMigrationContractApproved();

        this.functionsUtil.customLog('Migration - approved',migrationContractApproved ? migrationContractApproved.toString() : null);

        // Check old contractBalance
        oldContractBalance = await this.functionsUtil.getContractBalance(oldContractName,this.props.account);

        this.functionsUtil.customLog('Migration - balance',oldContractBalance ? oldContractBalance.toString() : null);
        if (oldContractBalance){
          oldContractBalanceFormatted = this.functionsUtil.fixTokenDecimals(oldContractBalance,oldContractTokenDecimals);
          // Enable migration if old contract balance if greater than 0
          migrationEnabled = this.functionsUtil.BNify(oldContractBalance).gt(0);
        }
      }
    }

    this.functionsUtil.customLog('oldContractBalanceFormatted',(oldContractBalance ? oldContractBalanceFormatted.toString() : null),'migrationEnabled', migrationEnabled);

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

    if (this.props.network && !this.props.network.isCorrectNetwork){
      return false;
    }

    // Update util functions props
    this.loadUtils();

    // Remount the component if token changed
    const contractsInitialized = this.props.contractsInitialized && prevProps.contractsInitialized !== this.props.contractsInitialized;
    const isCorrectNetwork = !prevProps.network.isCorrectNetwork && this.props.network.isCorrectNetwork;
    const selectedTokenChanged = prevProps.selectedToken !== this.props.selectedToken;

    // Mount the component and initialize the state
    if (contractsInitialized || selectedTokenChanged || isCorrectNetwork){
      this.componentDidMount(true);
      return false;
    }

    // Exit if web3 or contracts are not initialized
    if (!this.props.web3 || !this.props.contractsInitialized){
      return false;
    }

    const getTxsList = this.state.prevTxs === null || !Object.values(this.state.prevTxs).length;
    const transactionsChanged = prevProps.transactions !== this.props.transactions;
    const accountChanged = prevProps.account !== this.props.account;
    const tokenBalanceChanged = this.props.accountBalanceToken !== this.state.tokenBalance;

    // Show welcome modal
    if (this.props.account && accountChanged){
      let welcomeIsOpen = false;

      if (globalConfigs.modals.welcome.enabled && localStorage && accountChanged){

        // Check the last login of the wallet
        const currTime = new Date().getTime();
        const walletAddress = this.props.account.toLowerCase();
        let lastLogin = localStorage.getItem('lastLogin') ? JSON.parse(localStorage.getItem('lastLogin')) : {};

        if (!lastLogin[walletAddress]){
          lastLogin[walletAddress] = {
            'signedUp':false,
            'lastTime':currTime
          };
          welcomeIsOpen = true;
        } else if (!lastLogin[walletAddress].signedUp) {
          const lastTime = parseInt(lastLogin[walletAddress].lastTime);
          const timeFromLastLogin = (currTime-lastTime)/1000;
          welcomeIsOpen = timeFromLastLogin>=globalConfigs.modals.welcome.frequency; // 1 day since last login
        }

        if (welcomeIsOpen){
          lastLogin[walletAddress].lastTime = currTime;
          this.functionsUtil.setLocalStorage('lastLogin',JSON.stringify(lastLogin));
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
        earning:null,
        amountLent:null,
        tokenBalance:null,
        needsUpdate:false,
        updateInProgress:true,
        tokenToRedeemParsed:null
      });

      this.functionsUtil.customLog('Call async functions...');

      await Promise.all([
        this.checkMigration(),
        this.checkTokenApproved(),
        this.getAllocations(),
        this.getTokenBalance(),
        (getTxsList ? this.getPrevTxs() : null)
      ]);

      this.functionsUtil.customLog('Async functions completed...');

      // Keep this call seprated from others cause it needs getPrevTxs results
      await this.getBalanceOf(this.props.tokenConfig.idle.token);

      // console.log(prevState.tokenToRedeem,this.state.tokenBalance.toString(),this.state.tokenToRedeem.toString(),this.functionsUtil.BNify(this.state.tokenBalance).eq(0));
      if (prevState.tokenToRedeem === null && this.props.selectedTab === '1' && this.functionsUtil.BNify(this.state.tokenBalance).eq(0) && this.functionsUtil.BNify(this.state.tokenToRedeem).gt(0)){
        this.selectTab({ preventDefault:()=>{} },'2');
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

    if (tokenBalanceChanged){
      this.setState({
        tokenBalance: this.props.accountBalanceToken
      });
    }

    // TO CHECK!!
    if (transactionsChanged){

      // Store transactions into Local Storage
      if (localStorage){

        // Look for txs object in localStorage
        let storedTxs = localStorage && JSON.parse(localStorage.getItem('transactions')) ? JSON.parse(localStorage.getItem('transactions')) : {};

        // Initialize txs for account
        if (!storedTxs[this.props.account]){
          storedTxs[this.props.account] = {};
        }

        // Initialize txs for selected token
        if (!storedTxs[this.props.account][this.props.selectedToken]){
          storedTxs[this.props.account][this.props.selectedToken] = {};
        }

        // Merge together stored and new transactions
        storedTxs[this.props.account][this.props.selectedToken] = Object.assign(storedTxs[this.props.account][this.props.selectedToken],this.props.transactions);
        this.functionsUtil.setLocalStorage('transactions',JSON.stringify(storedTxs));
      }

      this.processTransactionUpdates(prevProps.transactions);
    }
  }

  selectTab = async (e, tabIndex) => {
    e.preventDefault();

    const tabChanged = tabIndex !== this.props.selectedTab;

    if (tabIndex === '3') {
      // Don't send the event again if already in the tab
      if (tabChanged){
        this.functionsUtil.sendGoogleAnalyticsEvent({
          eventCategory: 'UI',
          eventAction: 'tabs',
          eventLabel: 'rebalance'
        });
      }

      this.rebalanceCheck();
      this.getAllocations();
    }

    if (tabIndex !== '2') {
      if (this.state.earningIntervalId){
        window.clearInterval(this.state.earningIntervalId);
      }
    }

    this.props.updateSelectedTab(e,tabIndex);
  }

  // TODO move in a separate component
  renderPrevTxs(prevTxs) {
    prevTxs = prevTxs ? prevTxs : (this.state.prevTxs || {});

    const txsIndexes = Object.keys(prevTxs);
    const txsToShow = 99999999;
    // let totalInterestsAccrued = 0;
    let depositedSinceLastRedeem = 0;
    let totalRedeemed = 0;
    const decimals = Math.min(this.props.tokenDecimals,8);

    const migrationContractAddr = this.props.tokenConfig.migration && this.props.tokenConfig.migration.migrationContract ? this.props.tokenConfig.migration.migrationContract.address : null;
    const migrationContractOldAddrs = this.props.tokenConfig.migration && this.props.tokenConfig.migration.migrationContract && this.props.tokenConfig.migration.migrationContract.oldAddresses ? this.props.tokenConfig.migration.migrationContract.oldAddresses : [];

    let txs = txsIndexes.map((key, i) => {

      const tx = prevTxs[key];

      const isMigrationTx = migrationContractAddr && (tx.from.toLowerCase() === migrationContractAddr.toLowerCase() || migrationContractOldAddrs.map((v) => { return v.toLowerCase(); }).indexOf(tx.from.toLowerCase()) !== -1 ) && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
      const isSendTransferTx = !isMigrationTx && tx.from.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
      const isReceiveTransferTx = !isMigrationTx && tx.to.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
      const isDepositTx = !isMigrationTx && !isSendTransferTx && !isReceiveTransferTx && tx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
      const isRedeemTx = !isMigrationTx && !isSendTransferTx && !isReceiveTransferTx && tx.to.toLowerCase() === this.props.account.toLowerCase();

      const date = new Date(tx.timeStamp*1000);
      let status = tx.status ? tx.status : null;
      if (!status){
        if (isDepositTx){
          status = 'Deposited';
        } else if (isRedeemTx){
          status = 'Redeemed';
        } else if (isMigrationTx){
          status = 'Migrated';
        } else if (isSendTransferTx){
          status = 'Transfer';
        } else if (isReceiveTransferTx){
          status = 'Received';
        }
      }

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
        case 'Transfer':
          color = 'green';
          icon = "Send";
        break;
        case 'Received':
          color = 'blue';
          icon = "Redo";
        break;
        case 'Migrated':
          color = 'blue';
          icon = "Sync";
          depositedSinceLastRedeem+=parsedValue;
        break;
        default:
          color = 'grey';
          icon = "Refresh";
        break;
      }

      if (i>=txsIndexes.length-txsToShow){
        return (
          <Link key={'tx_'+i} display={'block'} href={`https://etherscan.io/tx/${tx.hash}`} target={'_blank'} rel="nofollow noopener noreferrer">
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
                <Text textAlign={'center'} fontSize={[2,2]} fontWeight={2}>{value} {this.props.selectedToken}</Text>
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
    balance = this.functionsUtil.BNify(balance).toFixed(decimals);

    const numLen = balance.toString().replace('.','').length;
    if (numLen>maxLen){
      decimals = Math.max(0,decimals-(numLen-maxLen));
      balance = this.functionsUtil.BNify(balance).toFixed(decimals);
    }

    const intPart = Math.floor(balance);
    let decPart = (balance%1).toString().substr(2,decimals);
    decPart = (decPart+("0".repeat(decimals))).substr(0,decimals);

    if (highlightedDecimals){
      const highlightedDec = decPart.substr(0,highlightedDecimals);
      decPart = decPart.substr(highlightedDecimals);
      const highlightedIntPart = (<Text.span fontSize={'100%'} color={'blue'} fontWeight={'inerith'}>{intPart}.{highlightedDec}</Text.span>);
      return !isNaN(this.functionsUtil.trimEth(balance)) ? ( <>{highlightedIntPart}<small style={{fontSize:'70%'}}>{decPart}</small> <Text.span fontSize={[1,2]}>{label}</Text.span></> ) : defaultValue;
    } else {
      return !isNaN(this.functionsUtil.trimEth(balance)) ? ( <>{intPart}<small>.{decPart}</small> <Text.span fontSize={[1,2]}>{label}</Text.span></> ) : defaultValue;
    }
  }

  formatCountUp = (n) => {
    return n.toFixed(6);
  }

  render() {
    const hasBalance = !isNaN(this.functionsUtil.trimEth(this.state.tokenToRedeemParsed)) && this.functionsUtil.trimEth(this.state.tokenToRedeemParsed) > 0;
    // const navPool = this.getFormattedBalance(this.state.navPool,this.props.selectedToken);

    const depositedFunds = this.getFormattedBalance(this.state.amountLent,this.props.selectedToken,6,9);
    const earningPerc = !isNaN(this.functionsUtil.trimEth(this.state.tokenToRedeemParsed)) && this.functionsUtil.trimEth(this.state.tokenToRedeemParsed)>0 && this.state.amountLent>0 ? this.getFormattedBalance(this.functionsUtil.BNify(this.state.tokenToRedeemParsed).div(this.functionsUtil.BNify(this.state.amountLent)).minus(1).times(100),'%',4) : '0%';
    const currentApr = !isNaN(this.state.maxRate) ? this.getFormattedBalance(this.state.maxRate,'%',2) : '-';

    let earningPerDay = this.getFormattedBalance((this.state.earningPerYear/daysInYear),this.props.selectedToken,4);
    const earningPerWeek = this.getFormattedBalance((this.state.earningPerYear/daysInYear*7),this.props.selectedToken,4);
    const earningPerMonth = this.getFormattedBalance((this.state.earningPerYear/12),this.props.selectedToken,4);
    const earningPerYear = this.getFormattedBalance((this.state.earningPerYear),this.props.selectedToken,4);

    const currentNavPool = !isNaN(this.functionsUtil.trimEth(this.state.navPool)) ? parseFloat(this.functionsUtil.trimEth(this.state.navPool,8)) : null;
    let navPoolEarningPerYear = currentNavPool ? parseFloat(this.functionsUtil.trimEth(this.functionsUtil.BNify(this.state.navPool).times(this.functionsUtil.BNify(this.state.maxRate/100)),8)) : null;
    const navPoolEarningPerDay = navPoolEarningPerYear ? (navPoolEarningPerYear/daysInYear) : null;
    const navPoolEarningPerWeek = navPoolEarningPerDay ? (navPoolEarningPerDay*7) : null;
    const navPoolEarningPerMonth = navPoolEarningPerWeek ? (navPoolEarningPerWeek*4.35) : null;
    navPoolEarningPerYear = navPoolEarningPerYear ? navPoolEarningPerYear : null;

    const currentReedemableFunds = !isNaN(this.functionsUtil.trimEth(this.state.tokenToRedeemParsed)) && !isNaN(this.functionsUtil.trimEth(this.state.earningPerYear)) ? parseFloat(this.functionsUtil.trimEth(this.state.tokenToRedeemParsed,8)) : 0;
    const reedemableFundsAtEndOfYear = !isNaN(this.functionsUtil.trimEth(this.state.tokenToRedeemParsed)) && !isNaN(this.functionsUtil.trimEth(this.state.earningPerYear)) ? parseFloat(this.functionsUtil.trimEth(this.functionsUtil.BNify(this.state.tokenToRedeemParsed).plus(this.functionsUtil.BNify(this.state.earningPerYear)),8)) : 0;
    const currentEarning = !isNaN(this.functionsUtil.trimEth(this.state.earning)) ? parseFloat(this.functionsUtil.trimEth(this.state.earning,8)) : 0;
    const earningAtEndOfYear = !isNaN(this.functionsUtil.trimEth(this.state.earning)) ? parseFloat(this.functionsUtil.trimEth(this.functionsUtil.BNify(this.state.earning).plus(this.functionsUtil.BNify(this.state.earningPerYear)),8)) : 0;

    const idleTokenPrice = parseFloat(this.state.idleTokenPrice);
    const idleTokenPriceEndOfYear = idleTokenPrice && !isNaN(this.state.maxRate) ? parseFloat(this.functionsUtil.BNify(idleTokenPrice).plus(this.functionsUtil.BNify(idleTokenPrice).times(this.functionsUtil.BNify(this.state.maxRate)))) : idleTokenPrice;

    const fundsAreReady = this.state.fundsError || (!this.state.updateInProgress && !isNaN(this.functionsUtil.trimEth(this.state.tokenToRedeemParsed)) && !isNaN(this.functionsUtil.trimEth(this.state.earning)) && !isNaN(this.functionsUtil.trimEth(this.state.amountLent)));
    const transactionsAreReady = this.state.prevTxs !== null;

    // console.log('currentReedemableFunds',currentReedemableFunds,'reedemableFundsAtEndOfYear',reedemableFundsAtEndOfYear,'currentEarning',currentEarning,'earningAtEndOfYear',earningAtEndOfYear);

    const tokenNotApproved = this.props.account && !this.state.isTokenApproved && !this.state.isApprovingToken && !this.state.updateInProgress;
    const walletIsEmpty = this.props.account && this.state.showEmptyWalletOverlay && !tokenNotApproved && !this.state.isApprovingToken && this.state.tokenBalance !== null && !isNaN(this.state.tokenBalance) && !parseFloat(this.state.tokenBalance);
    const walletHasNoETH = this.props.account && this.state.showEmptyWalletOverlay && this.props.accountBalance !== null && !isNaN(this.props.accountBalance) && parseFloat(this.props.accountBalance)<=0.0001;

    // Check migration enabled and balance
    const migrationEnabled = this.props.account && this.props.tokenConfig.migration && this.props.tokenConfig.migration.enabled && this.state.migrationEnabled;

    const counterMaxDigits = 11;
    const counterDecimals = Math.min(Math.max(0,counterMaxDigits-parseInt(currentReedemableFunds).toString().length),Math.max(0,counterMaxDigits-parseInt(currentEarning).toString().length));
    const rebalanceCounterDecimals = this.state.allocations ? Math.max(0,Math.min(...(Object.values(this.state.allocations).map((allocation,i) => { return counterMaxDigits-parseInt(allocation.toString()).toString().length })))) : null;

    const showLendButton = !walletIsEmpty && !migrationEnabled && !tokenNotApproved && (!this.state.contractIsPaused || !this.props.account);

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
                  false &&
                  <Button
                    className={styles.gradientButton}
                    onClick={e => this.disapproveMigration(e)}
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
                    DISABLE MIGRATION
                  </Button>
                }

                {
                  (!this.state.componentMounted || this.state.updateInProgress) ? (
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
                  ) : this.state.contractIsPaused && this.props.account ? (
                    <Box pt={['50px','73px']} style={{position:'absolute',top:'0',width:'100%',height:'100%',zIndex:'99'}}>
                      <Box style={{backgroundColor:'rgba(0,0,0,0.83)',position:'absolute',top:'0',width:'100%',height:'100%',zIndex:'0',borderRadius:'15px'}}></Box>
                      <Flex style={{position:'relative',zIndex:'99',height:'100%'}} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
                        <Flex
                          flexDirection={'column'}
                          justifyContent={'center'}
                          alignItems={'center'}
                          textAlign={'center'}>
                          <Icon
                            name={'PauseCircleOutline'}
                            color={'white'}
                            size={'62'}
                          />
                          <Heading.h4 my={[2,3]} color={'white'} fontSize={[2,3]} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                            Deposits have been temporarily disabled due to the recent bZx exploits.
                          </Heading.h4>
                          <Button
                            onClick={e => {
                              e.preventDefault();
                              window.open('https://twitter.com/bzxHQ');
                            }}
                            borderRadius={4}
                            size={ this.props.isMobile ? 'small' : 'medium' }
                          >
                            READ LAST UPDATES
                          </Button>
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
                                  You still have <strong>{ this.state.oldContractBalanceFormatted ? this.state.oldContractBalanceFormatted.toFixed(4) : '0' } {this.props.tokenConfig.migration.oldContract.token}</strong> in the old contract.
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
                            Powered by <Link fontSize={1} fontWeight={1} lineHeight={1} color={'white'} activeColor={'white'} hoverColor={'white'} href={'https://recipes.dexwallet.io/'} style={{textDecoration:'underline'}} target={'_blank'} rel="nofollow noopener noreferrer">Dexwallet Recipes</Link>
                          </Text>
                        </Flex>
                      </Flex>
                    </Box>
                  ) : walletHasNoETH ? (
                  <Box pt={['50px','73px']} style={{position:'absolute',top:'0',width:'100%',height:'100%',zIndex:'99'}}>
                    <Box style={{backgroundColor:'rgba(0,0,0,0.83)',position:'absolute',top:'0',width:'100%',height:'100%',zIndex:'0',borderRadius:'15px'}}></Box>
                    <Flex style={{position:'relative',zIndex:'99',height:'100%'}} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
                      <Link onClick={e => this.hideEmptyWalletOverlay(e) } style={{position:'absolute',top:'0',right:'0',width:'35px',height:'28px',paddingTop:'7px'}}>
                        <Icon
                          name={'Close'}
                          color={'white'}
                          size={'28'}
                        />
                      </Link>
                      <Flex flexDirection={'column'} alignItems={'center'} p={[2,4]}>
                        <Flex width={1} justifyContent={'center'} flexDirection={'row'}>
                          <Image src={`images/tokens/${globalConfigs.baseToken}.svg`} height={'38px'} />
                          <Icon
                            name={'KeyboardArrowRight'}
                            color={'white'}
                            size={'38'}
                          />
                          <Image src={`images/idle-mark.png`} height={'38px'} />
                        </Flex>
                        <Heading.h4 my={[3,'15px']} color={'white'} fontSize={[2,3]} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                          You need {globalConfigs.baseToken} to interact with Idle. Click the button below to buy some.
                        </Heading.h4>
                        <Button
                          onClick={e => { this.props.openBuyModal(e,globalConfigs.baseToken); }}
                          borderRadius={4}
                          size={'medium'}
                        >
                          BUY {globalConfigs.baseToken}
                        </Button>
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
                      <Link onClick={e => this.hideEmptyWalletOverlay(e) } style={{position:'absolute',top:'0',right:'0',width:'35px',height:'28px',paddingTop:'7px'}}>
                        <Icon
                          name={'Close'}
                          color={'white'}
                          size={'28'}
                        />
                      </Link>
                      <Flex flexDirection={'column'} alignItems={'center'} p={[2,4]}>
                        <Flex width={1} justifyContent={'center'} flexDirection={'row'}>
                          <Image src={`images/tokens/${this.props.selectedToken}.svg`} height={'38px'} />
                          <Icon
                            name={'KeyboardArrowRight'}
                            color={'white'}
                            size={'38'}
                          />
                          <Image src={`images/idle-mark.png`} height={'38px'} />
                        </Flex>
                        <Heading.h4 my={[3,'15px']} color={'white'} fontSize={[2,3]} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                          You don't have any {this.props.selectedToken} in your wallet. Click the button below to buy some.
                        </Heading.h4>
                        <Button
                          onClick={e => { this.props.openBuyModal(e,this.props.selectedToken); }}
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
                    tokenDecimals={this.props.tokenDecimals}
                    defaultValue={this.state.lendAmount}
                    BNify={this.functionsUtil.BNify}
                    action={'Lend'}
                    trimEth={this.functionsUtil.trimEth}
                    color={'black'}
                    selectedAsset={this.props.selectedToken}
                    useEntireBalance={this.useEntireBalance}
                    handleChangeAmount={this.handleChangeAmount}
                    showTokenApproved={false}
                    isAssetApproved={this.state.isDAIApproved}
                    showApproveModal={this.toggleModal}
                    showLendButton={showLendButton}
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
                  <Link href={'https://certificate.quantstamp.com/full/idle-finance'} target={'_blank'} rel="nofollow noopener noreferrer">
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
                                this.state.fundsError ? (
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
                                ) : this.props.enableUnderlyingWithdraw ? (
                                  <Box>
                                    <Flex flexDirection={['column','row']} justifyContent={'center'} alignItems={'center'} pb={[2,3]} width={[1,'70%']} m={'0 auto'}>
                                      {
                                        this.state.allocations ?
                                          Object.keys(this.state.allocations).map((protocolAddr,i)=>{
                                            const protocolInfo = this.getProtocolInfoByAddress(protocolAddr);
                                            if (!protocolInfo){
                                              return false;
                                            }
                                            const protocolName = protocolInfo.token;
                                            const totalSupply = this.functionsUtil.fixTokenDecimals(this.state.totalIdleSupply,18);
                                            const protocolBalance = this.functionsUtil.fixTokenDecimals(this.state.protocolsBalances[protocolAddr],this.state.tokenDecimals);
                                            const idleTokenBalance = this.functionsUtil.BNify(this.state.balance);
                                            const tokenBalance = idleTokenBalance.times(protocolBalance).div(totalSupply);
                                            const tokenBalanceFixed = parseFloat(tokenBalance).toFixed(6);
                                            return (
                                              <Box key={`allocation_${protocolName}`} style={{flex:'1 1 0'}}>
                                                <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                                                  {protocolName}
                                                </Text>
                                                <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'} style={{whiteSpace:'nowrap'}}>
                                                  {tokenBalanceFixed}
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
                                ) : (
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
                                )
                              }

                              <Box pb={[3,4]} borderBottom={'1px solid #D6D6D6'}>
                                {
                                  !this.state.redeemProcessing ?
                                    this.props.enableUnderlyingWithdraw ? (
                                      <Flex
                                        textAlign='center'
                                        flexDirection={'column'}
                                        alignItems={'center'}
                                        >
                                          <Heading.h4 color={'red'} fontSize={[2,2]} px={[3,4]} textAlign={'center'} fontWeight={3} lineHeight={1.5}>
                                            This function allows you to close your Idle position and redeem the underlying tokens according to the current pool allocation.
                                          </Heading.h4>
                                          <Flex width={1} alignItems={'center'} justifyContent={'center'} mb={0} mx={'auto'}>
                                            <Button
                                              className={[styles.gradientButton]}
                                              onClick={e => this.redeemUnderlyingTokens(e, this.props.tokenConfig.idle.token)}
                                              size={this.props.isMobile ? 'medium' : 'medium'}
                                              borderRadius={4}
                                              mainColor={'blue'}
                                              fontWeight={3}
                                              fontSize={[2,2]}
                                              mx={'auto'}
                                              px={[4,5]}
                                              mt={3}
                                            >
                                              REDEEM UNDERLYING TOKENS
                                            </Button>
                                          </Flex>
                                      </Flex>
                                    ) : !this.state.partialRedeemEnabled ? (
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
                                              mt={0}
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
                                            BNify={this.functionsUtil.BNify}
                                            trimEth={this.functionsUtil.trimEth}
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
                      this.props.selectedTab === '2' && fundsAreReady && hasBalance && this.state.showFundsInfo && !this.state.prevTxsError &&
                        <>
                          {
                          !isNaN(this.functionsUtil.trimEth(this.state.earningPerYear)) ? (
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
                                        {
                                          idleTokenPrice ? (
                                            <CountUp
                                              start={idleTokenPrice}
                                              end={idleTokenPriceEndOfYear}
                                              useEasing={false}
                                              duration={31536000}
                                              delay={0}
                                              separator=""
                                              decimals={ 6 }
                                              decimal="."
                                            >
                                              {({ countUpRef, start }) => (
                                                <><span ref={countUpRef} /> <span style={{fontSize:'16px',fontWeight:'400',lineHeight:'1.5',color:'#3F3D4B'}}>{this.props.selectedToken}</span></>
                                              )}
                                            </CountUp>
                                          ) : '-'
                                        }
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
                            transactionsAreReady ? (
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
                          const protocolEnabled = protocolInfo.enabled;
                          const protocolApr = parseFloat(this.functionsUtil.toEth(this.state[`${protocolName}Apr`]));
                          const protocolAllocation = parseFloat(this.state.allocations[protocolAddr]);
                          const protocolEarningPerYear = parseFloat(this.functionsUtil.BNify(protocolAllocation).times(this.functionsUtil.BNify(protocolApr/100)));
                          const protocolAllocationEndOfYear = parseFloat(this.functionsUtil.BNify(protocolAllocation).plus(this.functionsUtil.BNify(protocolEarningPerYear)));
                          return (
                            <Box key={`allocation_${protocolName}`} width={[1,1/Object.keys(this.state.allocations).length]}>
                              <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'} style={{textTransform:'capitalize'}}>
                                {protocolName}
                              </Text>
                              {
                                protocolEnabled ? (
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
                                ) : (
                                  <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'darkGray'} textAlign={'center'} style={{whiteSpace:'nowrap'}}>
                                    paused
                                  </Heading.h3>
                                )
                              }
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
                        <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} pt={[2,3]} color={'dark-gray'}>
                          Estimated pool earnings
                        </Heading.h3>
                        <Flex flexDirection={['column','row']} pt={2} pb={[2,3]} width={'100%'}>
                          <Flex flexDirection={'row'} width={[1,1/2]} m={'0 auto'} alignItems={'center'} justifyContent={'center'}>
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
                          <Flex flexDirection={'row'} width={[1,1/2]} m={'0 auto'}>
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
                          mt={2}
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
              <Box px={[2,0]} textAlign={'center'} pt={[2,0]} pb={[3,2]}>
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
          simpleID={this.props.simpleID}
          initSimpleID={this.props.initSimpleID}
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
