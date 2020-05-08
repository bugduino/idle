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
      avgApr:null,
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
      avgBuyPrice:null,
      allocations:null,
      earningPerc:null,
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
      lastBlockNumber:null, // Last tx block number
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
      firstBlockNumber:8119247,
      underlyingTokensAmount:{},
      disableRedeemButton:false,
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

    // TO REMOVE
    window.getPrevTxs = this.getPrevTxs;
    window.setLastBlockNumber = (lastBlockNumber) => {
      this.setState({
        lastBlockNumber
      });
    }

    this.addResources();

    if (!this.props.web3 || !this.props.contractsInitialized){
      this.functionsUtil.customLog('Web3 or Contracts not initialized');
      return false;
    }

    if (this.props.network && !this.props.network.isCorrectNetwork){
      return false;
    }

    await Promise.all([
      this.getAprs().then(() => {
        this.getAllocations().then( () => {
          this.rebalanceCheck()
        })
      }),
      this.checkMigration(),
      this.checkContractPaused(),
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
    const accountChanged = prevProps.account !== this.props.account;

    // Mount the component and initialize the state
    if (contractsInitialized || selectedTokenChanged || isCorrectNetwork || accountChanged){
      this.componentDidMount(true);
      return false;
    }

    // Exit if web3 or contracts are not initialized
    if (!this.props.web3 || !this.props.contractsInitialized){
      return false;
    }

    const getTxsList = this.state.prevTxs === null || !Object.values(this.state.prevTxs).length;
    const tokenBalanceChanged = this.props.accountBalanceToken !== this.state.tokenBalance;

    // Show welcome modal
    if (this.props.account){
      let welcomeIsOpen = false;

      if (globalConfigs.modals.welcome.enabled && localStorage){

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

      if (welcomeIsOpen && this.state.activeModal !== 'welcome'){
        this.setState({
          activeModal: welcomeIsOpen ? 'welcome' : this.state.activeModal
        });
      }

    }

    const checkUpdateNeeded = this.props.account && !this.state.updateInProgress && (accountChanged || this.state.needsUpdate || selectedTokenChanged);

    if (checkUpdateNeeded) {

      // If the component is not mounted yet hang on
      if (!this.state.componentMounted){
        return this.setState({
          updateAfterMount: true
        });
      }

      const newState = {
        needsUpdate:false,
        updateInProgress:true,
      };

      if (accountChanged || selectedTokenChanged){
        newState.earning=null;
        newState.amountLent=null;
        newState.tokenBalance=null;
        newState.tokenToRedeemParsed=null;
      }
      // Reset funds and force loader
      this.setState(newState);

      this.functionsUtil.customLog('Call async functions...');

      // Get TokenPrice
      await this.getPriceInToken();

      await Promise.all([
        this.checkMigration(),
        this.checkTokenApproved(),
        this.getAprs().then(() => {
          this.getAllocations()
        }),
        this.getTokenBalance(),
        this.getIdleTokenBalance(),
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
    const transactionsChanged = prevProps.transactions !== this.props.transactions;
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

    if (!globalConfigs.contract.methods.rebalance.enabled){
      return this.setState({
        shouldRebalance:false,
        calculatingShouldRebalance: false
      });
    }

    this.setState({calculatingShouldRebalance:true});

    const rebalancer = await this.functionsUtil.genericIdleCall('rebalancer');

    if (!rebalancer){
      return this.setState({
        shouldRebalance:false,
        calculatingShouldRebalance: false
      });
    }

    const idleRebalancerInstance = await this.functionsUtil.createContract('idleRebalancerInstance',rebalancer,globalConfigs.contract.methods.rebalance.abi);

    if (!idleRebalancerInstance || !idleRebalancerInstance.contract){
      return this.setState({
        shouldRebalance:false,
        calculatingShouldRebalance: false
      });
    }

    // Take next protocols allocations
    const allocationsPromises = [];
    const availableTokensPromises = [];

    for (let protocolIndex=0;protocolIndex<this.props.tokenConfig.protocols.length;protocolIndex++){
      const allocationPromise = new Promise( async (resolve, reject) => {
        const allocation = await idleRebalancerInstance.contract.methods['lastAmounts'](protocolIndex).call().catch(error => {
          reject(error);
        });
        resolve({
          allocation,
          protocolIndex
        });
      });
      allocationsPromises.push(allocationPromise);

      const availableTokenPromise = new Promise( async (resolve, reject) => {
        try{
          const protocolAddr = await this.functionsUtil.genericIdleCall('allAvailableTokens',[protocolIndex]);
          resolve({
            protocolAddr,
            protocolIndex
          });
        } catch (err) {
          reject(err);
        }
      });
      availableTokensPromises.push(availableTokenPromise);
    }

    const nextAllocations = await Promise.all(allocationsPromises);
    const allAvailableTokens = await Promise.all(availableTokensPromises);

    if ((!allAvailableTokens || !allAvailableTokens.length) || (!nextAllocations || !nextAllocations.length)){
      return this.setState({
        shouldRebalance:false,
        calculatingShouldRebalance: false
      });
    }

    // Merge nextAllocations and allAvailableTokens
    const newProtocolsAllocations = allAvailableTokens.reduce((accumulator,availableTokenInfo) => {
      if (availableTokenInfo.protocolAddr){
        const nextAllocation = nextAllocations.find(v => { return v.protocolIndex === availableTokenInfo.protocolIndex; });
        if (nextAllocation){
          accumulator[availableTokenInfo.protocolAddr.toLowerCase()] = parseInt(nextAllocation.allocation);
        }
      }
      return accumulator;
    },{});

    // Check if newAllocations differs from currentAllocations
    let shouldRebalance = false;

    if (typeof this.state.protocolsAllocationsPerc === 'object'){
      Object.keys(this.state.protocolsAllocationsPerc).forEach((protocolAddr) => {
        const protocolAllocation = this.state.protocolsAllocationsPerc[protocolAddr];
        const protocolAllocationParsed = parseInt(protocolAllocation.times(10000).toFixed(0));
        const newProtocolAllocation = newProtocolsAllocations[protocolAddr.toLowerCase()] ? newProtocolsAllocations[protocolAddr.toLowerCase()] : 0;
        if (protocolAllocationParsed !== newProtocolAllocation){
          shouldRebalance = true;
        }
      });
    }

    return this.setState({
      shouldRebalance,
      calculatingShouldRebalance: false
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
    return this.props.tokenConfig.protocols.find(c => c.address.toLowerCase() === addr.toLowerCase());
  }

  getAllocations = async () => {
    const res = await this.props.getAllocations();

    if (res){
      const {
        avgApr,
        exchangeRates,
        totalAllocation,
        protocolsBalances,
        protocolsAllocations,
        protocolsAllocationsPerc
      } = res;

      if (protocolsAllocations){
        this.setState({
          avgApr,
          exchangeRates,
          totalAllocation,
          protocolsBalances,
          protocolsAllocations,
          protocolsAllocationsPerc
        });
      }

      return protocolsAllocations;
    }

    return null;
  }

  getAprs = async () => {
    const res = await this.props.getAprs();
    if (res){
      const {
        protocolsAprs,
        avgApr
      } = res;

      if (protocolsAprs){
        this.setState({
          avgApr,
          protocolsAprs
        });
      }

      return protocolsAprs;
    }

    return null;
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

  getIdleTokenBalance = async () => {
    if (this.props.account){
      const idleTokenBalance = await this.functionsUtil.getTokenBalance(this.props.tokenConfig.idle.token,this.props.account);
      if (idleTokenBalance){
        const newState = {
          idleTokenBalance: idleTokenBalance.toString()
        };

        // Set amountLent=0 if no idleToken balance
        if (idleTokenBalance.lte(0)){
          newState.amountLent = this.functionsUtil.BNify(0);
        }
        this.setState(newState);
        return idleTokenBalance;
      } else {
        this.functionsUtil.customLogError('Error on getting idleToken balance');
      }
    }
    return null;
  }

  getTokenBalance = async () => {
    if (this.props.account){
      const tokenBalance = await this.functionsUtil.getTokenBalance(this.props.selectedToken,this.props.account);
      if (tokenBalance){
        const newState = {
          tokenBalance: tokenBalance.toString()
        };
        this.setState(newState);
        return tokenBalance;
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

    const price = this.state.tokenPrice ? this.state.tokenPrice : await this.getPriceInToken(contractName);
    const balance = this.state.idleTokenBalance ? this.functionsUtil.BNify(this.state.idleTokenBalance) : await this.functionsUtil.getTokenBalance(contractName,this.props.account);

    this.functionsUtil.customLog('getBalanceOf 1',contractName,'price',price.toString(),'balance',(balance ? balance.toString() : balance));

    if (balance) {
      const tokenToRedeem = balance.times(price);
      let earning = 0;
      let earningPerc = 0;
      let amountLent = this.state.amountLent ? this.functionsUtil.BNify(this.state.amountLent) : this.functionsUtil.BNify(0);

      // console.log('AmountLent 0',amountLent.toString());

      // this.functionsUtil.customLog('getBalanceOf 2','tokenToRedeem',tokenToRedeem.toString(),'amountLent',this.state.amountLent.toString());

      if (amountLent && this.functionsUtil.trimEth(amountLent)>0 && this.functionsUtil.trimEth(tokenToRedeem.toString())>0 && parseFloat(this.functionsUtil.trimEth(tokenToRedeem.toString()))<parseFloat(this.functionsUtil.trimEth(amountLent.toString()))){
        // console.error('tokenToRedeem',tokenToRedeem.toString(),' less than amountLent',amountLent.toString());
        // amountLent = tokenToRedeem;
        // console.log('AmountLent 1',amountLent.toString(),tokenToRedeem.toString());
        if (count<2){
          // console.log('call getBalanceOf in 1 second',amountLent.toString(),tokenToRedeem.toString());
          setTimeout(() => {
            this.getBalanceOf(contractName,count+1);
          },1000);
          return false;
        }
      } else if (amountLent && amountLent.lte(0) && tokenToRedeem){
        // console.log('AmountLent 3',amountLent.toString(),tokenToRedeem.toString());
        amountLent = tokenToRedeem;
        // console.log('AmountLent 2',amountLent.toString(),tokenToRedeem.toString());
      }

      // console.log((tokenToRedeem ? tokenToRedeem.toString() : null),(amountLent ? amountLent.toString() : null));
      if (this.functionsUtil.BNify(tokenToRedeem).gt(this.functionsUtil.BNify(amountLent))){
        earning = tokenToRedeem.minus(this.functionsUtil.BNify(amountLent));
        earningPerc = tokenToRedeem.div(this.functionsUtil.BNify(amountLent)).minus(1).times(100);
      }

      const currentApr = this.functionsUtil.BNify(this.state.avgApr).div(100);
      const earningPerYear = tokenToRedeem.times(currentApr);
      const earningPerDay = earningPerYear.div(this.functionsUtil.BNify(365.242199));

      // this.functionsUtil.customLog('getBalanceOf 3',balance.toString(),tokenToRedeem.toString(),amountLent,earning,currentApr,earningPerYear);

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
        balance,
        earning,
        amountLent,
        currentApr,
        earningPerc,
        earningPerDay,
        tokenToRedeem,
        earningPerYear,
        fundsError:false,
        callMintCallback:false,
        idleTokenBalance:balance.toString(),
        tokenToRedeemParsed: tokenToRedeem.toString(),
      });
    } else {
      this.setState({
        balance:0,
        earning:0,
        amountLent:0,
        earningPerc:0,
        earningPerDay:0,
        tokenToRedeem:0,
        earningPerYear:0,
        fundsError:false,
        callMintCallback:false,
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

  getPrevTxs = async (count,endBlockNumber='latest') => {
    count = count ? count : 0;

    const requiredNetwork = globalConfigs.network.requiredNetwork;
    const etherscanInfo = globalConfigs.network.providers.etherscan;

    // Take last block number, is null take first block number
    let lastBlockNumber = this.state.firstBlockNumber;
    if (this.state.lastBlockNumber){
      lastBlockNumber = this.state.lastBlockNumber;
    }

    let results = [];
    let cachedTxs = null;
    let etherscanEndpoint = null;
    let etherscanBaseEndpoint = null;

    // Check if etherscan is enabled for the required network
    if (etherscanInfo.enabled && etherscanInfo.endpoints[requiredNetwork]){
      const etherscanApiUrl = etherscanInfo.endpoints[requiredNetwork];

      // Add token variable to endpoint for separate cached requests between tokens
      etherscanEndpoint = `${etherscanApiUrl}?apikey=${env.REACT_APP_ETHERSCAN_KEY}&token=${this.props.selectedToken}&module=account&action=tokentx&address=${this.props.account}&startblock=${lastBlockNumber}&endblock=${endBlockNumber}&sort=asc`;
      etherscanBaseEndpoint = `${etherscanApiUrl}?apikey=${env.REACT_APP_ETHERSCAN_KEY}&token=${this.props.selectedToken}&module=account&action=tokentx&address=${this.props.account}&startblock=${this.state.firstBlockNumber}&endblock=${endBlockNumber}&sort=asc`;

      cachedTxs = this.functionsUtil.getCachedRequest(etherscanEndpoint);

      // Check if cached txs are not up-to-date by comparing lastBlockNumber
      if (cachedTxs && cachedTxs.data.result && cachedTxs.data.result.length && !this.state.lastBlockNumber){
        const lastCachedBlockNumber = parseInt(Object.assign([],cachedTxs.data.result).pop().blockNumber);

        const etherscanEndpointLastBlock = `${etherscanApiUrl}?apikey=${env.REACT_APP_ETHERSCAN_KEY}&token=${this.props.selectedToken}&module=account&action=tokentx&address=${this.props.account}&startblock=${lastCachedBlockNumber}&endblock=${endBlockNumber}&sort=asc`;
        let latestTxs = await this.functionsUtil.makeRequest(etherscanEndpointLastBlock);

        if (latestTxs && latestTxs.data.result && latestTxs.data.result.length){
          latestTxs = this.functionsUtil.filterEtherscanTxs(latestTxs.data.result,[this.props.selectedToken]);
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
        txs = await axios.get(etherscanEndpoint).catch(err => {
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
      }

      if (txs && txs.data && txs.data.result){
        results = txs.data.result;
      }
    }

    // Initialize prevTxs
    let prevTxs = this.state.prevTxs ? Object.assign({},this.state.prevTxs) : {};
    let etherscanTxs = [];

    if (cachedTxs){
      etherscanTxs = results;
    } else {
      etherscanTxs = this.functionsUtil.filterEtherscanTxs(results,[this.props.selectedToken]);

      // Store filtered txs
      if (etherscanTxs.length && etherscanEndpoint){
        const cachedRequestData = {
          data:{
            result:etherscanTxs
          }
        };
        this.functionsUtil.saveCachedRequest(etherscanEndpoint,false,cachedRequestData);

        // Merge base etherscan endpoint with new data
        if (etherscanEndpoint !== etherscanBaseEndpoint){
          let etherscanBaseTxs = this.functionsUtil.getCachedRequest(etherscanBaseEndpoint);
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
              this.functionsUtil.saveCachedRequest(etherscanBaseEndpoint,false,newEtherscanBaseTxs);
            }
          }
        }
      }
    }

    // Merge new txs with previous ones
    if (etherscanTxs && etherscanTxs.length){
      etherscanTxs.forEach((tx) => {
        prevTxs[tx.hash] = tx;
      });
    }

    let amountLent = this.functionsUtil.BNify(0);

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
    let avgBuyPrice = this.functionsUtil.BNify(0);

    const tokenDecimals = await this.getTokenDecimals();
    const migrationContractAddr = this.props.tokenConfig.migration && this.props.tokenConfig.migration.migrationContract ? this.props.tokenConfig.migration.migrationContract.address : null;
    const migrationContractOldAddrs = this.props.tokenConfig.migration && this.props.tokenConfig.migration.migrationContract && this.props.tokenConfig.migration.migrationContract.oldAddresses ? this.props.tokenConfig.migration.migrationContract.oldAddresses : [];
    const oldContractAddr = this.props.tokenConfig.migration && this.props.tokenConfig.migration.oldContract ? this.props.tokenConfig.migration.oldContract.address.replace('x','').toLowerCase() : null;

    // console.log('prevTxs',prevTxs);

    if (prevTxs && Object.keys(prevTxs).length){

      const lastTx = prevTxs[Object.keys(prevTxs).pop()];

      // Update last block number
      if (lastTx && lastTx.blockNumber && (!this.state.lastBlockNumber || lastTx.blockNumber>this.state.lastBlockNumber)){
        lastBlockNumber = parseInt(lastTx.blockNumber)+1;
      }

      // Loop through prevTxs to have all the history
      await this.functionsUtil.asyncForEach(Object.values(prevTxs),async (tx,index) => {

        const txKey = `tx${tx.timeStamp}000`;
        const storedTx = storedTxs[this.props.account][this.props.selectedToken][txKey] ? storedTxs[this.props.account][this.props.selectedToken][txKey] : tx;
        // const isNewTx = etherscanTxs.indexOf(tx) !== -1; // Just fetched from etherscan
        const isMigrationTx = migrationContractAddr && (tx.from.toLowerCase() === migrationContractAddr.toLowerCase() || migrationContractOldAddrs.map((v) => { return v.toLowerCase(); }).indexOf(tx.from.toLowerCase()) !== -1 ) && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
        const isSendTransferTx = !isMigrationTx && tx.from.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
        const isReceiveTransferTx = !isMigrationTx && tx.to.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
        const isDepositTx = !isMigrationTx && !isSendTransferTx && !isReceiveTransferTx && tx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
        const isRedeemTx = !isMigrationTx && !isSendTransferTx && !isReceiveTransferTx && tx.to.toLowerCase() === this.props.account.toLowerCase();

        let tokenPrice = null;
        if (storedTx.tokenPrice){
          tokenPrice = this.functionsUtil.BNify(storedTx.tokenPrice);
        } else {
          tokenPrice = await this.functionsUtil.genericContractCall(this.props.tokenConfig.idle.token, 'tokenPrice',[],{}, tx.blockNumber);
          tokenPrice = this.functionsUtil.fixTokenDecimals(tokenPrice,this.props.tokenConfig.decimals);
          storedTx.tokenPrice = tokenPrice;
        }

        let tokensTransfered = tokenPrice.times(this.functionsUtil.BNify(tx.value));

        // Add transactionHash to storedTx
        if (!storedTx.transactionHash){
          storedTx.transactionHash = tx.hash;
        }

        // Deposited
        if (isSendTransferTx){
          // amountLent = amountLent.plus(this.functionsUtil.BNify(tx.value));
          // depositedTxs++;

          // Decrese amountLent by the last idleToken price
          amountLent = amountLent.minus(tokensTransfered);

          if (amountLent.lte(0)){
            amountLent = this.functionsUtil.BNify(0);
            avgBuyPrice = this.functionsUtil.BNify(0);
          }

          // console.log(`Transfer sent of ${tx.value} (${tokensTransfered}) - amountLent: ${amountLent}`);

          storedTx.value = tokensTransfered;

        } else if (isReceiveTransferTx){

          // Decrese amountLent by the last idleToken price
          amountLent = amountLent.plus(tokensTransfered);

          // Calculate avgBuyPrice for current earnings
          avgBuyPrice = avgBuyPrice.plus(tokensTransfered);

          // console.log(`Transfer received of ${tx.value} (${tokensTransfered}) - amountLent: ${amountLent}`);

          storedTx.value = tokensTransfered;

        } else if (isDepositTx){

          amountLent = amountLent.plus(this.functionsUtil.BNify(tx.value));

          depositedTxs++;

          if (!storedTx.idleTokens){

            // Init idleTokens amount
            storedTx.idleTokens = this.functionsUtil.BNify(tx.value);
            storedTx.method = 'mintIdleToken';

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

          // Calculate avgBuyPrice for current earnings
          avgBuyPrice = avgBuyPrice.plus(tokensTransfered);

          // console.log(`Deposited ${tx.value} (${storedTx.idleTokens}), AmountLent: ${amountLent}`);

        // Redeemed
        } else if (isRedeemTx){

          const redeemedValueFixed = this.functionsUtil.BNify(storedTx.value);

          // Decrese amountLent by redeem amount
          amountLent = amountLent.minus(redeemedValueFixed);
          avgBuyPrice = avgBuyPrice.minus(tokensTransfered);

          // Reset amountLent if below zero
          if (amountLent.lt(0)){
            amountLent = this.functionsUtil.BNify(0);

            // Reset Avg Buy Price
            avgBuyPrice = this.functionsUtil.BNify(0);
          }

          // Set tx method
          if (!storedTx.method){
            storedTx.method = 'redeemIdleToken';
          }

          // console.log(`Redeemed ${tx.value} (${redeemedValueFixed}), AmountLent: ${amountLent}`);
        // Migrated
        } else if (isMigrationTx){

          let migrationValueFixed = 0;

          if (!storedTx.migrationValueFixed){
            storedTx.method = 'bridgeIdleV1ToIdleV2';
            migrationValueFixed = this.functionsUtil.BNify(tx.value).times(tokenPrice);
            storedTx.migrationValueFixed = migrationValueFixed;
          } else {
            migrationValueFixed = this.functionsUtil.BNify(storedTx.migrationValueFixed);
          }
 
          tx.value = migrationValueFixed;

          amountLent = amountLent.plus(migrationValueFixed);

          // Calculate avgBuyPrice for current earnings
          tokensTransfered = tokenPrice.times(migrationValueFixed);
          avgBuyPrice = avgBuyPrice.plus(tokensTransfered);

          // console.log(`Migrated ${migrationValueFixed} @${tokenPrice}, AmountLent: ${amountLent}`);
        }

        // Save Tx
        storedTxs[this.props.account][this.props.selectedToken][txKey] = storedTx;

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
          // console.log(`Skip stored Tx ${tx.transactionHash}, Processed: ${!!prevTxs[tx.transactionHash]}, status: ${tx.status}, method: ${tx.method}`);
          return false;
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
          // console.log(`Skip stored Tx ${tx.transactionHash}, from: ${realTx.from}`);
          return false;
        }

        let tokenPrice = await this.functionsUtil.genericContractCall(this.props.tokenConfig.idle.token,'tokenPrice',[],{}, tx.blockNumber);
        tokenPrice = this.functionsUtil.fixTokenDecimals(tokenPrice,18);

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
              return false;
            }

            txValue = tx.params ? this.functionsUtil.fixTokenDecimals(tx.params[0],tokenDecimals).toString() : 0;
            if (!txValue){
              // this.functionsUtil.customLog('Skipped deposit tx '+tx.transactionHash+' - value is zero ('+txValue+')');
              return false;
            }
            
            depositedTxs++;
            realTx.status = 'Deposited';
            realTx.value = txValue;
          break;
          case 'redeemIdleToken':
            if (!realTx.tokenPrice){
              const redeemedValue = this.functionsUtil.BNify(tx.params[0]).times(tokenPrice);
              const redeemTokenDecimals = await this.getTokenDecimals();
              const redeemedValueFixed = this.functionsUtil.fixTokenDecimals(redeemedValue,redeemTokenDecimals);
              realTx.tokenPrice = tokenPrice;
              realTx.status = 'Redeemed';
              realTx.value = redeemedValueFixed.toString();
            }
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
              return false;
            }

            const contractAddress = this.props.tokenConfig.idle.address.toLowerCase().replace('x','');
            const isMigrationRightContract = migrationTxReceipt.logs.filter((tx) => { return tx.topics[tx.topics.length-1].toLowerCase() === `0x00000000000000000000000${contractAddress}`; });

            if (!isMigrationRightContract.length){
              // Remove wrong contract tx
              if (isStoredTx){
                delete storedTxs[this.props.account][this.props.selectedToken][txKey];
              }
              return false;
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
              return false;
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

        // console.log('Adding localStorage tx',realTx);

        // this.functionsUtil.customLog('realTx from localStorage:',realTx);
        const tokensTransfered = tokenPrice.times(this.functionsUtil.BNify(realTx.value));

        if (!isNaN(realTx.value) && parseFloat(realTx.value)){
          if (tx.method==='mintIdleToken'){
            amountLent = amountLent.plus(this.functionsUtil.BNify(realTx.value));
            avgBuyPrice = avgBuyPrice.plus(tokensTransfered);
            // console.log(`Deposited (localStorage) ${realTx.value} @${tokenPrice}, AmountLent: ${amountLent}`);
          } else if (tx.method==='redeemIdleToken'){
            amountLent = amountLent.minus(this.functionsUtil.BNify(realTx.value));
            avgBuyPrice = avgBuyPrice.minus(tokenPrice.times(this.functionsUtil.BNify(realTx.value)));

            if (amountLent.lt(0)){
              amountLent = this.functionsUtil.BNify(0);
              avgBuyPrice = this.functionsUtil.BNify(0);
            }
            // console.log(`Redeemed (localStorage) ${realTx.value} @${tokenPrice}, AmountLent: ${amountLent}`);
          } else if (tx.method==='bridgeIdleV1ToIdleV2'){
            amountLent = amountLent.plus(this.functionsUtil.BNify(realTx.value));
            avgBuyPrice = avgBuyPrice.plus(tokensTransfered);
            // console.log(`Migrated (localStorage) ${realTx.value} @${tokenPrice}, AmountLent: ${amountLent}`);
          }

          // Save realTx and update localStorage
          if (!tx.realTx){
            tx.realTx = realTx;
            storedTxs[this.props.account][this.props.selectedToken][txKey] = tx;
          }

          prevTxs[realTx.hash] = realTx;

        } else if (isStoredTx){
          delete storedTxs[this.props.account][this.props.selectedToken][txKey];
        }
      });
  
      // Update localStorage
      if (storedTxs && localStorage){
        this.functionsUtil.setLocalStorage('transactions',JSON.stringify(storedTxs));
      }
    }

    // let earning = 0;
    // let earningPerc = 0;

    if (amountLent.lte(0)){
      amountLent = this.functionsUtil.BNify(0);
      avgBuyPrice = this.functionsUtil.BNify(0);
    } else {
      avgBuyPrice = avgBuyPrice.div(amountLent);
      // earningPerc = this.state.tokenPrice.div(avgBuyPrice).minus(1);
      // earning = amountLent.times(earningPerc);
      // earningPerc = earningPerc.times(100);
    }

    // console.log(`avgBuyPrice: ${avgBuyPrice}, earning: ${earning}, earningPerc: ${earningPerc}`);

    const isFirstDeposit = depositedTxs === 1;

    return this.setState({
      // earning,
      prevTxs,
      amountLent,
      // earningPerc,
      avgBuyPrice,
      isFirstDeposit,
      lastBlockNumber,
      prevTxsError: false,
    });
  };

  // Check for updates to the transactions collection
  processTransactionUpdates = prevTxs => {

    let refresh = false;
    let update_txs = false;
    let needsUpdate = false;

    const executedTxs = {};
    const transactions = this.state.prevTxs || {};

    if (Object.keys(this.props.transactions).length){

      Object.keys(this.props.transactions).forEach(key => {
        let newTx = this.props.transactions[key];
        // Check if it is a new transaction OR status changed
        if ((!prevTxs[key] || prevTxs[key].status !== newTx.status)){
          const txSucceeded = newTx.status === 'success';
          const txCompleted = txSucceeded || newTx.status === 'error';

          // Delete pending transaction and add, if succeded, executed one
          if (txCompleted) {
            refresh = true;
            // Delete pending transaction
            delete transactions[key];

            if (txSucceeded){
              needsUpdate = true;
              executedTxs[newTx.transactionHash] = newTx;
            }
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

      const needsUpdateCallback = () => {
        if (needsUpdate){
          this.getPrevTxs().then(() => {
            this.getBalanceOf(this.props.tokenConfig.idle.token);
          });
        }
      }

      if (refresh){
        this.setState({
          executedTxs,
          prevTxs: transactions,
        },needsUpdateCallback);
      } else if (update_txs){
        this.setState({
          prevTxs: transactions,
        },needsUpdateCallback);
      }
    }
  };

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

      this.getAprs().then( () => {
        this.getAllocations().then( () => {
          this.rebalanceCheck();
        })
      });
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

      if (!parsedValue && status !== 'Pending'){
        return false;
      }

      const value = parsedValue ? (this.props.isMobile ? parsedValue.toFixed(4) : parsedValue.toFixed(decimals))+' '+this.props.selectedToken : '-';
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
                <Text textAlign={'center'} fontSize={[2,2]} fontWeight={2}>{value}</Text>
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

  formatCountUp = (n) => {
    return n.toFixed(6);
  }

  render() {
    const avgApr = !isNaN(parseFloat(this.state.avgApr)) ? parseFloat(this.state.avgApr).toFixed(2) : null;
    const hasBalance = !isNaN(parseFloat(this.state.tokenToRedeemParsed)) && parseFloat(this.state.tokenToRedeemParsed) > 0;
    // const navPool = this.functionsUtil.getFormattedBalance(this.state.navPool,this.props.selectedToken);

    const depositedFunds = this.functionsUtil.getFormattedBalance(this.state.amountLent,this.props.selectedToken,6,9);
    const earningPerc = !isNaN(this.state.earningPerc) ? this.functionsUtil.getFormattedBalance(this.state.earningPerc,'%',4) : this.functionsUtil.getFormattedBalance(0,'%',0);
    const currentApr = avgApr !== null ? this.functionsUtil.getFormattedBalance(avgApr,'%',2) : '-';

    let earningPerDay = this.functionsUtil.getFormattedBalance((this.state.earningPerYear/daysInYear),this.props.selectedToken,4);
    const earningPerWeek = this.functionsUtil.getFormattedBalance((this.state.earningPerYear/daysInYear*7),this.props.selectedToken,4);
    const earningPerMonth = this.functionsUtil.getFormattedBalance((this.state.earningPerYear/12),this.props.selectedToken,4);
    const earningPerYear = this.functionsUtil.getFormattedBalance((this.state.earningPerYear),this.props.selectedToken,4);

    const currentNavPool = !isNaN(this.functionsUtil.trimEth(this.state.navPool)) ? parseFloat(this.functionsUtil.trimEth(this.state.navPool,8)) : null;
    let navPoolEarningPerYear = currentNavPool && this.state.avgApr !== null ? parseFloat(this.functionsUtil.BNify(this.state.navPool).times(this.functionsUtil.BNify(this.state.avgApr.div(100)))) : null;
    const navPoolEarningPerDay = navPoolEarningPerYear ? (navPoolEarningPerYear/daysInYear) : null;
    const navPoolEarningPerWeek = navPoolEarningPerDay ? (navPoolEarningPerDay*7) : null;
    const navPoolEarningPerMonth = navPoolEarningPerWeek ? (navPoolEarningPerWeek*4.35) : null;
    navPoolEarningPerYear = navPoolEarningPerYear ? navPoolEarningPerYear : null;

    const currentReedemableFunds = !isNaN(parseFloat(this.state.tokenToRedeemParsed)) && !isNaN(this.functionsUtil.trimEth(this.state.earningPerYear)) ? parseFloat(parseFloat(this.state.tokenToRedeemParsed)) : 0;
    const reedemableFundsAtEndOfYear = !isNaN(parseFloat(this.state.tokenToRedeemParsed)) && !isNaN(this.functionsUtil.trimEth(this.state.earningPerYear)) ? parseFloat(this.functionsUtil.BNify(this.state.tokenToRedeemParsed).plus(this.functionsUtil.BNify(this.state.earningPerYear))) : 0;
    const currentEarning = !isNaN(this.state.earning) ? parseFloat(this.state.earning) : 0;
    const earningAtEndOfYear = !isNaN(this.functionsUtil.trimEth(this.state.earning)) ? parseFloat(this.functionsUtil.BNify(this.state.earning).plus(this.functionsUtil.BNify(this.state.earningPerYear))) : 0;

    // const idleTokenPrice = parseFloat(this.state.idleTokenPrice);
    const idleTokenPriceFormatted = this.functionsUtil.getFormattedBalance(this.state.idleTokenPrice,this.props.selectedToken,6,9);
    // const idleTokenPriceEndOfYear = idleTokenPrice && avgApr !== null ? parseFloat(this.functionsUtil.BNify(idleTokenPrice).plus(this.functionsUtil.BNify(idleTokenPrice).times(this.functionsUtil.BNify(this.state.avgApr.div(100))))) : idleTokenPrice;

    const fundsAreReady = this.state.fundsError || (!this.state.updateInProgress && !isNaN(parseFloat(this.state.tokenToRedeemParsed)) && !isNaN(this.functionsUtil.trimEth(this.state.earning)) && !isNaN(this.functionsUtil.trimEth(this.state.amountLent)));
    const transactionsAreReady = this.state.prevTxs !== null;

    // if (transactionsAreReady && !fundsAreReady){
    //   console.log(this.state.fundsError,this.state.updateInProgress,parseFloat(this.state.tokenToRedeemParsed),this.functionsUtil.trimEth(this.state.earning),this.functionsUtil.trimEth(this.state.amountLent));
    // }

    const tokenNotApproved = this.props.account && !this.state.isTokenApproved && !this.state.isApprovingToken && !this.state.updateInProgress;
    const walletIsEmpty = this.props.account && this.state.showEmptyWalletOverlay && !tokenNotApproved && !this.state.isApprovingToken && this.state.tokenBalance !== null && !isNaN(this.state.tokenBalance) && !parseFloat(this.state.tokenBalance);
    const walletHasNoETH = this.props.account && this.state.showEmptyWalletOverlay && this.props.accountBalance !== null && !isNaN(this.props.accountBalance) && parseFloat(this.props.accountBalance)<=0.0001;

    // Check migration enabled and balance
    const migrationEnabled = this.props.account && this.props.tokenConfig.migration && this.props.tokenConfig.migration.enabled && this.state.migrationEnabled;

    const counterMaxDigits = 11;
    const counterDecimals = Math.min(Math.max(0,counterMaxDigits-parseInt(currentReedemableFunds).toString().length),Math.max(0,counterMaxDigits-parseInt(currentEarning).toString().length));
    const rebalanceCounterDecimals = this.state.protocolsAllocations ? Math.max(0,Math.min(...(Object.values(this.state.protocolsAllocations).map((allocation,i) => { return counterMaxDigits-parseInt(allocation.toString()).toString().length })))) : null;

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
                  Earn <Text.span fontWeight={'bold'} fontSize={[3,4]}>{avgApr}<Text.span fontSize={'80%'}>%</Text.span> APR</Text.span> on your <Text.span fontWeight={'bold'} fontSize={[3,4]}>{this.props.selectedToken}</Text.span>
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
                                        this.state.protocolsAllocations ?
                                          Object.keys(this.state.protocolsAllocations).map((protocolAddr,i)=>{
                                            const protocolInfo = this.functionsUtil.getProtocolInfoByAddress(protocolAddr);
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
                                        <Heading.h3 style={{display:'flex',alignItems:'baseline',justifyContent:'center'}} fontFamily={'counter'} letterSpacing={'-1px'} fontSize={[4,5]} mb={[2,0]} fontWeight={2} color={'black'} textAlign={'center'}>
                                          {
                                            <CountUp
                                              start={currentReedemableFunds}
                                              end={reedemableFundsAtEndOfYear}
                                              useEasing={false}
                                              duration={31536000}
                                              delay={0}
                                              separator=""
                                              decimals={ counterDecimals }
                                              decimal={'.'}
                                            >
                                              {({ countUpRef, start }) => (
                                                <><span ref={countUpRef} /><Text.span pl={2} fontSize={'16px'} fontWeight={400} lineHeight={'1.5'} color={'#3F3D4B'} fontFamily={'sansSerif'}>{this.props.selectedToken}</Text.span></>
                                              )}
                                            </CountUp>
                                          }
                                        </Heading.h3>
                                      </Box>
                                      <Box width={[1,1/2]}>
                                        <Heading.h3 fontWeight={2} textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'blue'}>
                                          Current earnings
                                        </Heading.h3>
                                        <Heading.h3 style={{display:'flex',alignItems:'baseline',justifyContent:'center'}} fontFamily={'counter'} letterSpacing={'-1px'} fontSize={[4,5]} fontWeight={2} color={'black'} textAlign={'center'}>
                                          {
                                            <CountUp
                                              start={currentEarning}
                                              end={earningAtEndOfYear}
                                              useEasing={false}
                                              duration={31536000}
                                              delay={0}
                                              separator=""
                                              decimals={ counterDecimals }
                                              decimal={'.'}
                                              // formattingFn={(n)=>{ return this.formatCountUp(n); }}
                                            >
                                              {({ countUpRef, start }) => (
                                                <><span ref={countUpRef} /> <Text.span pl={2} fontSize={'16px'} fontWeight={400} lineHeight={'1.5'} color={'#3F3D4B'} fontFamily={'sansSerif'}>{this.props.selectedToken}</Text.span></>
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
                                        {currentApr}
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
                                      <Heading.h3 fontFamily={'sansSerif'} letterSpacing={'-1px'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        {idleTokenPriceFormatted}
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
                  <Flex flexDirection={['column','row']} justifyContent={'center'} alignItems={['center','flex-start']} pb={[2,3]} width={[1,'80%']} m={'0 auto'}>
                    {
                      this.state.protocolsAllocations ?
                        Object.keys(this.state.protocolsAllocations).map((protocolAddr,i)=>{
                          const protocolInfo = this.functionsUtil.getProtocolInfoByAddress(protocolAddr);
                          if (!protocolInfo){
                            return false;
                          }
                          const protocolName = protocolInfo.name;
                          const protocolEnabled = protocolInfo.enabled;
                          const protocolColor = 'rgb('+globalConfigs.stats.protocols[protocolName].color.rgb.join(',')+')';
                          const protocolApr = this.state.protocolsAprs ? this.state.protocolsAprs[protocolAddr] : null;
                          const protocolAllocation = parseFloat(this.state.protocolsAllocations[protocolAddr]);
                          const protocolEarningPerYear = protocolApr && protocolApr !== null ? parseFloat(this.functionsUtil.BNify(protocolAllocation).times(this.functionsUtil.BNify(protocolApr).div(100))) : 0;
                          const protocolAllocationEndOfYear = protocolEarningPerYear ? parseFloat(this.functionsUtil.BNify(protocolAllocation).plus(this.functionsUtil.BNify(protocolEarningPerYear))) : 0;
                          return (
                            <Box key={`allocation_${protocolName}`} width={[1,1/Object.keys(this.state.protocolsAllocations).length]}>
                              <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={3} color={protocolColor} textAlign={'center'} style={{textTransform:'capitalize'}}>
                                {protocolName}
                              </Text>
                              {
                                protocolEnabled ? (
                                  <Flex flexDirection={'column'}>
                                    <Heading.h3 style={{display:'flex',alignItems:'baseline',justifyContent:'center',whiteSpace:'nowrap'}} fontFamily={'counter'} letterSpacing={'-1px'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                      {protocolAllocation ?
                                        <CountUp
                                          start={protocolAllocation}
                                          end={protocolAllocationEndOfYear}
                                          useEasing={false}
                                          duration={31536000}
                                          delay={0}
                                          separator=""
                                          decimals={rebalanceCounterDecimals}
                                          decimal={'.'}
                                        >
                                          {({ countUpRef, start }) => (
                                            <>
                                              <span ref={countUpRef} />
                                              <Text.span pl={2} fontSize={'16px'} fontWeight={400} lineHeight={'1.5'} color={'#3F3D4B'} fontFamily={'sansSerif'}>{this.props.selectedToken}</Text.span>
                                            </>
                                          )}
                                        </CountUp>
                                        : parseInt(0).toFixed(6)
                                      }
                                    </Heading.h3>
                                    {
                                      !this.props.isMobile &&
                                        <Text color={'#777'} fontSize={2} fontWeight={2} textAlign={'center'}>{protocolApr ? protocolApr.toFixed(2) : '-'}<Text.span color={'#777'} fontWeight={2} fontSize={'80%'}>% APR</Text.span></Text>
                                    }
                                  </Flex>
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
                                {this.functionsUtil.getFormattedBalance(navPoolEarningPerDay,this.props.selectedToken,3)}
                              </Heading.h3>
                            </Box>
                            <Box width={1/2}>
                              <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                                Weekly
                              </Text>
                              <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                {this.functionsUtil.getFormattedBalance(navPoolEarningPerWeek,this.props.selectedToken,3)}
                              </Heading.h3>
                            </Box>
                          </Flex>
                          <Flex flexDirection={'row'} width={[1,1/2]} m={'0 auto'}>
                            <Box width={1/2}>
                              <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                                Monthly
                              </Text>
                              <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                {this.functionsUtil.getFormattedBalance(navPoolEarningPerMonth,this.props.selectedToken,3)}
                              </Heading.h3>
                            </Box>
                            <Box width={1/2}>
                              <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                                Yearly
                              </Text>
                              <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                {this.functionsUtil.getFormattedBalance(navPoolEarningPerYear,this.props.selectedToken,3)}
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
          text={`You have successfully made your first deposit!<br />Enjoy <strong>${avgApr}% APR</strong> on your <strong>${this.props.selectedToken}</strong>!`}
          tweet={`I'm earning ${avgApr}% APR on my ${this.props.selectedToken} with @idlefinance! Go to ${globalConfigs.baseURL} and start earning now from your idle tokens!`}
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
