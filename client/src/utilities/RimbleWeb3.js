import Web3 from "web3";
import React from 'react';
import BigNumber from 'bignumber.js';
import Biconomy from "@biconomy/mexa";
import SimpleID from 'simpleid-js-sdk';
import NetworkUtil from "./NetworkUtil";
import * as Sentry from '@sentry/browser';
import FunctionsUtil from './FunctionsUtil';
import globalConfigs from '../configs/globalConfigs';
import ConnectionModalUtil from "./ConnectionModalsUtil";
import detectEthereumProvider from '@metamask/detect-provider';
import ConnectionErrorModal from './components/ConnectionErrorModal';
import TransactionErrorModal from './components/TransactionErrorModal';
import { TerminalHttpProvider, SourceType } from '@terminal-packages/sdk';

require('dotenv').config();
const INFURA_KEY = process.env["REACT_APP_INFURA_KEY"];

const RimbleTransactionContext = React.createContext({
  web3: {},
  account: {},
  biconomy: {},
  simpleID: {},
  contracts: [],
  web3Infura: {},
  tokenConfig: {},
  transactions: {},
  accountBalance: {},
  initWeb3: () => {},
  accountValidated: {},
  initAccount: () => {},
  accountBalanceLow: {},
  initSimpleID: () => {},
  initContract: () => {},
  accountBalanceToken: {},
  checkPreflight: () => {},
  validateAccount: () => {},
  network: {
    current: {},
    required: {},
    checkNetwork: () => {},
    isCorrectNetwork: null,
  },
  accountInizialized: false,
  getTokenDecimals: () => {},
  rejectValidation: () => {},
  getAccountBalance: () => {},
  contractsInitialized: false,
  accountValidationPending: {},
  initializeContracts: () => {},
  rejectAccountConnect: () => {},
  enableUnderlyingWithdraw: false,
  connectAndValidateAccount: () => {},
  modals: {
    data: {
      connectionError: {},
      lowFundsModalIsOpen: {},
      noWalletModalIsOpen: {},
      userRejectedConnect: {},
      connectionModalIsOpen: {},
      userRejectedValidation: {},
      wrongNetworkModalIsOpen: {},
      accountValidationPending: {},
      accountConnectionPending: {},
      noWeb3BrowserModalIsOpen: {},
      transactionConnectionModalIsOpen: {},
    },
    methods: {
      openLowFundsModal: () => {},
      closeLowFundsModal: () => {},
      openWrongNetworkModal: () => {},
      closeWrongNetworkModal: () => {},
      openNoWeb3BrowserModal: () => {},
      closeNoWeb3BrowserModal: () => {},
      openConnectionErrorModal: () => {},
      closeConnectionErrorModal: () => {},
      openTransactionErrorModal: () => {},
      closeTransactionErrorModal: () => {},
      openConnectionPendingModal: () => {},
      closeConnectionPendingModal: () => {},
      openUserRejectedConnectionModal: () => {},
      openUserRejectedValidationModal: () => {},
      closeUserRejectedConnectionModal: () => {},
      closeUserRejectedValidationModal: () => {},
    }
  },
  transaction: {
    data: {
      transactions: {}
    },
    meta: {},
    methods: {}
  }
});

let setConnectorName = null;
let biconomyLoginProcessing = false;

class RimbleTransaction extends React.Component {
  static Consumer = RimbleTransactionContext.Consumer;

  componentUnmounted = false;

  // Utils
  functionsUtil = null;

  loadUtils(){
    const props = Object.assign({},this.props);
    props.contracts = this.state.contracts;
    if (this.functionsUtil){
      props.account = this.state.account;
      this.functionsUtil.setProps(props);
    } else {
      props.account = this.state.account;
      this.functionsUtil = new FunctionsUtil(props);
    }
  }

  componentWillUnmount(){
    this.componentUnmounted = true;
  }

  componentWillMount(){
    this.loadUtils();
    window.initWeb3 = this.initWeb3;
  }

  componentDidMount = async () => {
    this.initSimpleID();

    // this.functionsUtil.customLog('RimbleWeb3 componentDidMount');
    this.initWeb3();

    // TEST - Manually triggers transaction error
    // this.openTransactionErrorModal(null,'Your Ledger device is Ineligible');

    window.testTransaction = (method) => {
      const transaction = this.createTransaction();
      transaction.method = method;
      this.addTransaction(transaction);
      return transaction;
    }

    window.updateTransaction = (transaction,hash,status,params) => {
      // Add meta data to transaction
      transaction.type = "contract";
      transaction.status = status;
      transaction.params = params;
      transaction.transactionHash = hash;
      this.updateTransaction(transaction);
      return transaction;
    }
  }

  componentDidUpdate = async (prevProps, prevState) => {

    this.loadUtils();

    // this.functionsUtil.customLog('componentDidUpdate',prevProps.connectorName,this.props.connectorName,this.props.context.connectorName,this.props.context.active,(this.props.context.error ? this.props.context.error.message : null));

    if (prevProps.connectorName !== this.props.connectorName && this.props.connectorName){
      this.initWeb3();
    } else if ( prevProps.context !== this.props.context ){
      if (this.props.context.error instanceof Error && this.props.context.error.message.length){
        const errorMessage = this.props.context.error.message;
        const isWalletConnectClosedModalError = (errorMessage === 'User closed WalletConnect modal' || errorMessage === 'User closed modal');
        // this.functionsUtil.customLog('componentDidUpdate',setConnectorName,errorMessage);
        if (setConnectorName === 'WalletConnect' && isWalletConnectClosedModalError){
          // this.functionsUtil.customLog('WalletConnect disconnected! Set Infura connector');
          this.props.setConnector('Infura',null);
          // this.functionsUtil.removeStoredItem('walletProvider');
          // this.functionsUtil.removeStoredItem('connectorName');
          // this.functionsUtil.setLocalStorage('context',JSON.stringify({active:this.props.context.active,connectorName:'Infura'}));
          setConnectorName = null;
          // await this.props.context.setConnector('Infura');
        } else if (!isWalletConnectClosedModalError) {
          this.openConnectionErrorModal(null,errorMessage);
        } else {
          this.initWeb3();
        }
      // WalletConnect double trigger initWeb3
      } else if (this.props.context.active && this.props.context.connectorName!=='WalletConnect' && this.props.connectorName==='WalletConnect') {
        this.initWeb3();
      }
    } else if ( (this.props.context.connectorName && this.props.context.connectorName !== this.props.connectorName) || prevProps.customAddress !== this.props.customAddress){
      this.initWeb3();
    }

    const tokenChanged = prevProps.selectedToken !== this.props.selectedToken;
    // const availableTokensChanged = prevProps.availableTokens && this.props.availableTokens && JSON.stringify(Object.keys(prevProps.availableTokens)) !== JSON.stringify(Object.keys(this.props.availableTokens));
    const availableStrategiesChanged = prevProps.availableStrategies && this.props.availableStrategies && JSON.stringify(Object.keys(prevProps.availableStrategies)) !== JSON.stringify(Object.keys(this.props.availableStrategies));

    // Reset tokenDecimals if token is changed
    if (tokenChanged){
      this.setState({
        tokenDecimals: null
      });
    }

    // this.functionsUtil.customLog(prevProps.enableUnderlyingWithdraw,this.props.enableUnderlyingWithdraw,this.state.enableUnderlyingWithdraw);
    if (prevProps.enableUnderlyingWithdraw !== this.props.enableUnderlyingWithdraw){
      this.setState({
        enableUnderlyingWithdraw:this.props.enableUnderlyingWithdraw
      });
    }

    if (localStorage){
      const context = JSON.parse(localStorage.getItem('context'));
      if (!context || (this.props.context.active !== context.active || this.props.context.connectorName !== context.connectorName)){
        this.functionsUtil.setLocalStorage('context',JSON.stringify({active:this.props.context.active,connectorName:this.props.context.connectorName}));
      }
    }

    if (tokenChanged/* || availableTokensChanged*/ || availableStrategiesChanged){
      await this.initializeContracts();
    }
  }

  // Initialize a web3 provider
  initWeb3 = async (connectorName=null) => {

    // Detect ethereum provider
    const metamaskProvider = await detectEthereumProvider();
    if (metamaskProvider && (!window.ethereum || window.ethereum !== metamaskProvider)){
      window.ethereum = metamaskProvider;
    }

    // Suppress console warning
    if (window.ethereum && window.ethereum.autoRefreshOnNetworkChange) {
      window.ethereum.autoRefreshOnNetworkChange = false;
    }

    const context = this.props.context;

    const web3Infura = new Web3(new Web3.providers.HttpProvider(globalConfigs.network.providers.infura[globalConfigs.network.requiredNetwork]+INFURA_KEY));

    let web3 = context.library;

    // 0x Instant Wallet Provider Injection
    if (!window.RimbleWeb3_context || context.connectorName !== window.RimbleWeb3_context.connectorName){
      window.RimbleWeb3_context = context;
    }

    // Reset setConnectorName if force connectorName
    if (connectorName){
      setConnectorName = null;
    } else {
      connectorName = this.props.connectorName;
    }

    // const last_context = localStorage ? JSON.parse(localStorage.getItem('context')) : null;

    // this.functionsUtil.customLog('initWeb3',context.active,connectorName,context.connectorName,context.connector,(web3 && web3.currentProvider ? web3.currentProvider.disable : null),(context.connector ? context.connector.disable : null));
    if (context && connectorName === 'Infura' && connectorName !== context.connectorName){
      if (web3 && typeof web3.currentProvider.disable === 'function'){
        web3.currentProvider.disable();
      } else if (context.connector && typeof context.connector.disable === 'function'){
        context.connector.disable();
      }
      web3 = null;
      setConnectorName = null;
    }

    const connectorNameChanged = (context.connectorName && context.connectorName !== connectorName) || (connectorName !== 'Infura' && connectorName !== setConnectorName);

    // this.functionsUtil.customLog('initWeb3',context.active,connectorNameChanged,context.connectorName,connectorName,setConnectorName);

    if (!context.active || connectorNameChanged) {
      // Select preferred web3 provider
      if (connectorName && connectorNameChanged){
        // this.functionsUtil.customLog('initWeb3 set connector',connectorName);
        setConnectorName = connectorName;
        await context.setConnector(connectorName);
        // await context.setFirstValidConnector([connectorName, 'Infura']);
        return web3;
      }
      /*
      else if (setConnectorName){
        // Catch WalletConnect unexpected disconnect and fallback to Infura
        if (connectorName === 'WalletConnect' && connectorName === setConnectorName && last_context && last_context.active && last_context.connectorName==='WalletConnect' && !context.connectorName){
          this.functionsUtil.customLog('WalletConnect disconnected! Set Infura connector');
          this.props.setConnector('Infura',null);
          this.functionsUtil.removeStoredItem('walletProvider');
          this.functionsUtil.removeStoredItem('connectorName');
          this.functionsUtil.setLocalStorage('context',JSON.stringify({active:context.active,connectorName:context.connectorName}));
          setConnectorName = null;
          await context.setConnector('Infura');
          if (context.connector && typeof context.connector.disable === 'function'){
            await context.connector.disable();
          }
        }

        this.functionsUtil.customLog('initWeb3 skip due to setConnectorName ('+setConnectorName+') already set');
        return web3;
      }
      */
    }
    /* else if (context.connectorName === "WalletConnect") {
      if (!context.account) {

        // WalletConnect already opened
        if (document.getElementById('walletconnect-wrapper')){
          return web3;
        }

        WalletConnectQRCodeModal.open(
          context.connector.walletConnector.uri,
          async () => {
            document.getElementById('walletconnect-wrapper').remove();
            this.props.setConnector('Infura',null);
            await context.setConnector('Infura');
            setConnectorName = null;
          }
        );
      } else {
        try {
          WalletConnectQRCodeModal.close();
        } catch {}
      }
    // Reset web3 if Infura
    } */
    /*
    else if (context.active && (connectorName === 'Infura' || context.connectorName === "Infura")){
      if (typeof web3.currentProvider.disable === 'function'){
        await web3.currentProvider.disable();
      } else if (context.connector && typeof context.connector.disable === 'function'){
        await context.connector.disable();
      }
      web3 = null;
      setConnectorName = null;
    }
    */

    let web3Host = null;
    let web3Provider = null;

    if (!web3) { // safety web3 implementation
      if (window.ethereum) {
        this.functionsUtil.customLog("Using modern web3 provider.");
        web3Provider = window.ethereum;
      } else if (window.web3) {
        this.functionsUtil.customLog("Legacy web3 provider. Try updating.");
        web3Provider = window.web3;
      } else {
        this.functionsUtil.customLog("Non-Ethereum browser detected. Using Infura fallback.");
        web3Host = globalConfigs.network.providers.infura[globalConfigs.network.requiredNetwork]+INFURA_KEY;
      }
    } else {
      web3Provider = web3.currentProvider;
    }

    let forceCallback = false;

    if ((!connectorName || connectorName === 'Infura') && web3Provider && typeof web3Provider.enable === 'function'){
      try {
        await web3Provider.enable();
      } catch (connectionError){
        web3Provider = null;
        web3Host = globalConfigs.network.providers.infura[globalConfigs.network.requiredNetwork]+INFURA_KEY;
        forceCallback = true;
      }
    }

    const terminalInfo = globalConfigs.network.providers.terminal;

    if (terminalInfo && terminalInfo.enabled && terminalInfo.supportedNetworks.indexOf(globalConfigs.network.requiredNetwork) !== -1 ){
      const TerminalHttpProviderParams = terminalInfo.params;
      const terminalSourceType = localStorage && localStorage.getItem('walletProvider') ? localStorage.getItem('walletProvider') : SourceType.Infura;
      TerminalHttpProviderParams.source = terminalSourceType;

      if (web3Provider){
        TerminalHttpProviderParams.customHttpProvider = web3Provider;
      } else if (web3Host){
        TerminalHttpProviderParams.host = web3Host;
      }

      const terminalHttpProvider = new TerminalHttpProvider(TerminalHttpProviderParams);
      web3 = new Web3(terminalHttpProvider);
    } else {
      // Injected web3 provider
      if (web3Provider){
        web3 = new Web3(web3Provider);
      // Infura
      } else if (web3Host) {
        web3 = new Web3(new Web3.providers.HttpProvider(web3Host));
        if (connectorName !== 'Infura'){
          this.props.setConnector('Infura',null);
        }
      }
    }

    const web3Callback = async () => {

      window.web3Injected = this.state.web3;
      // window.web3InfuraInjected = this.state.web3Infura;

      if (typeof this.props.callbackAfterLogin === 'function'){
        this.props.callbackAfterLogin();
        this.props.setCallbackAfterLogin(null);
      }

      // After setting the web3 provider, check network
      try {
        await this.checkNetwork();
        if (this.state.network.isCorrectNetwork){

          if (!this.state.contractsInitialized){
            await this.initializeContracts();
          }

          if (context.account){
            // Login with biconomy
            if (this.state.biconomy){
              const biconomy = this.state.biconomy;
              const biconomyInfo = globalConfigs.network.providers.biconomy;
              if (biconomyInfo.enableLogin && !biconomy.isLogin && !biconomyLoginProcessing){
                biconomyLoginProcessing = true;
                biconomy.login(context.account, (error, response) => {
                  // this.functionsUtil.customLog('biconomy login',error,response);
                  // Failed to login with Biconomy
                  if (error) {
                    return this.setState({
                      biconomy:false,
                    },() => {
                      this.initAccount(context.account);
                    });
                  }

                  biconomyLoginProcessing = false;

                  if (response.transactionHash) {
                    this.initAccount(context.account);
                  } else if(response.userContract) {
                    this.initAccount(context.account);
                  }
                });
                return false;
              }
            }

            await this.initAccount(context.account);
          } else {
            await this.setState({
              accountInizialized: true,
              account: this.props.customAddress
            });
          }
        }
      // Initialize Infura Web3 and display error
      } catch (error) {
        this.openConnectionErrorModal(null,error.message);
      }
    }

    // Save original web3 connector in case Mexa initialization fails
    const originalWeb3 = web3;
    const biconomyInfo = globalConfigs.network.providers.biconomy;
    const walletProvider = this.functionsUtil.getWalletProvider();

    if (connectorName !== 'Infura' && biconomyInfo && biconomyInfo.enabled && biconomyInfo.supportedNetworks.includes(globalConfigs.network.requiredNetwork) && (!walletProvider || !biconomyInfo.disabledWallets.includes(walletProvider.toLowerCase()))){

      if (this.state.biconomy === null){
        const biconomyWeb3Provider = web3Provider ? web3Provider : web3Host;
        const biconomy = new Biconomy(biconomyWeb3Provider,biconomyInfo.params);

        if (biconomy && typeof biconomy.onEvent === 'function'){
          web3 = new Web3(biconomy);
          biconomy.onEvent(biconomy.READY, () => {
            if (this.componentUnmounted || this.state.biconomy === false || this.state.biconomy === biconomy){
              return false;
            }

            const newState = {
              web3,
              biconomy,
              web3Infura
            };
            if (web3 !== this.state.web3){
              this.setState(newState, web3Callback);
            }
          }).onEvent(biconomy.ERROR, (error, message) => {
            // this.functionsUtil.customLog('Biconomy error',error,message,this.state.biconomy);
            web3 = originalWeb3;
            // Handle error while initializing mexa
            if (this.state.biconomy !== false){
              this.setState({
                web3,
                web3Infura,
                biconomy:false
              }, web3Callback);
            }
          });
        } else {
          this.setState({
            web3,
            web3Infura,
            biconomy:false
          }, web3Callback);
        }
      }
    } else {
      if (web3 !== this.state.web3){
        this.setState({
          web3,
          web3Infura,
        }, web3Callback);
      } else if (context.account || forceCallback){
        web3Callback();
      }
    }

    return web3;
  }

  initContract = async (name, address, abi, useInfuraProvider=false) => {
    this.functionsUtil.customLog(`Init contract: ${name}`);
    return await this.createContract(name, address, abi, useInfuraProvider);
  }

  createContract = async (name, address, abi, useInfuraProvider=false) => {
    this.functionsUtil.customLog(`creating contract ${name} - addr: ${address}`);

    const web3Provider = useInfuraProvider && this.state.web3Infura ? this.state.web3Infura : this.state.web3;

    if (!web3Provider){
      return null;
    }

    // Create contract on initialized web3 provider with given abi and address
    try {
      const contract = new web3Provider.eth.Contract(abi, address);
      this.setState(state => ({
        ...state,
        contracts: [...state.contracts, {name, contract}]
      }));
      return {name, contract};
    } catch (error) {
      this.functionsUtil.customLogError("Could not create contract.",name,address,error);
    }

    return null;
  }

  initSimpleID = () => {

    if (this.state.simpleID){
      return this.state.simpleID;
    }

    const simpleIDInfo = globalConfigs.network.providers.simpleID;
    let simpleID = null;

    if (simpleIDInfo && simpleIDInfo.enabled && simpleIDInfo.supportedNetworks.indexOf(globalConfigs.network.requiredNetwork) !== -1 ){
      const simpleIDParams = simpleIDInfo.params;
      simpleIDParams.network = simpleIDInfo.getNetwork(this.state.network.current.id,globalConfigs.network.availableNetworks);
      simpleID = new SimpleID(simpleIDParams);
    }

    window.simpleID = simpleID;

    this.setState({
      simpleID
    });

    return simpleID;
  }

  initAccount = async (account=false) => {

    this.functionsUtil.customLog('initAccount',account);

    if (this.props.customAddress){

      // Set custom account
      this.setState({
        accountInizialized: true,
        account: this.props.customAddress
      });

      // After account is complete, get the balance
      this.getAccountBalance();

      return false;
    }

    try {
      if (!account){
        const wallets = await this.state.web3.eth.getAccounts();
        if (wallets && wallets.length){
          account = wallets[0];
        }
      }

      if (!account || this.state.account === account){
        this.setState({
          accountInizialized: true
        });
        return false;
      }

      // Request account access if needed
      if (account){

        const walletProvider = localStorage && localStorage.getItem('walletProvider') ? localStorage.getItem('walletProvider') : 'Infura';

        // Send address info to SimpleID
        const simpleID = this.initSimpleID();

        if (simpleID){

          const notifications = await simpleID.notifications();

          if (notifications && notifications.length && window.$crisp){

            let shownNotifications = [];
            if (localStorage){
              shownNotifications = localStorage.getItem('shownNotifications') && JSON.parse(localStorage.getItem('shownNotifications')) ? JSON.parse(localStorage.getItem('shownNotifications')) : [];
            }

            notifications.forEach((n,i) => {

              const notificationId = n.name;

              // Show notification if not shown already
              if (shownNotifications.indexOf(notificationId) === -1){
                window.$crisp.push(["do", "message:show", ["text", this.functionsUtil.normalizeSimpleIDNotification(n.content) ]]);

                // Save notification id
                shownNotifications.push(notificationId);
              }
            });

            // Store shown notification
            if (localStorage){
              this.functionsUtil.setLocalStorage('shownNotifications',JSON.stringify(shownNotifications));
            }
          }
        }

        // Send Google Analytics connection event
        this.functionsUtil.sendGoogleAnalyticsEvent({
          eventCategory: 'Connect',
          eventAction: 'connected',
          eventLabel: walletProvider
        });

        /*
        // Unsubscribes to all subscriptions
        if (this.state.web3SocketProvider && typeof this.state.web3SocketProvider.clearSubscriptions === 'function'){
          this.functionsUtil.customLog('Clear all web3SocketProvider subscriptions');
          this.state.web3SocketProvider.clearSubscriptions();
        }

        const networkName = globalConfigs.network.availableNetworks[globalConfigs.network.requiredNetwork].toLowerCase();
        const web3SocketProvider = new Web3(new Web3.providers.WebsocketProvider(`wss://${networkName}.infura.io/ws/v3/${INFURA_KEY}`));

        // Subscribe to logs
        const addressTopic = '0x00000000000000000000000'+account.toLowerCase().replace('x','');

        // Subscribe for payment methods
        const paymentProviders = Object.keys(globalConfigs.payments.providers).filter((providerName,i) => { const providerInfo = globalConfigs.payments.providers[providerName]; return providerInfo.enabled && providerInfo.web3Subscription && providerInfo.web3Subscription.enabled  })
        if (paymentProviders && paymentProviders.length){
          paymentProviders.forEach((providerName,i) => {
            const providerInfo = globalConfigs.payments.providers[providerName];

            this.functionsUtil.customLog(`Subscribe to ${providerName} logs`);

            // Subscribe for deposit transactions
            web3SocketProvider.eth.subscribe('logs', {
                address: [account,providerInfo.web3Subscription.contractAddress],
                topics: [null,[addressTopic]]
            }, function(error, result){
              
            })
            .on("data", async (log) => {
              this.functionsUtil.customLog(providerName,'logs',log);

              if (log){
                const txHash = log.transactionHash;
                const subscribedTransactions = this.state.subscribedTransactions;
                const walletAddressFound = log.topics.filter((addr,i) => { return addr.toLowerCase().includes(addressTopic); });

                this.functionsUtil.customLog(providerName,txHash,walletAddressFound);

                if (!subscribedTransactions[txHash] && walletAddressFound.length){
                  const decodedLogs = web3SocketProvider.eth.abi.decodeLog(providerInfo.web3Subscription.decodeLogsData,log.data,log.topics);

                  this.functionsUtil.customLog(providerName,txHash,decodedLogs);

                  if (decodedLogs && decodedLogs._tokenAmount && decodedLogs._tokenAddress && decodedLogs._tokenAddress.toLowerCase() === this.props.tokenConfig.address.toLowerCase()){

                    const receiptCallback = async (tx,decodedLogs) => {
                      const tokenDecimals = await this.getTokenDecimals();
                      const tokenAmount = this.functionsUtil.BNify(decodedLogs._tokenAmount);
                      const tokenAmountFixed = this.functionsUtil.fixTokenDecimals(tokenAmount,tokenDecimals);
                      const tokenAmountFormatted = parseFloat(tokenAmountFixed.toString()).toFixed(2);
                      const isProviderTx = tx.from.toLowerCase() === account.toLowerCase() && tx.to.toLowerCase() === providerInfo.web3Subscription.contractAddress.toLowerCase();

                      if (isProviderTx){

                        // Mined
                        if (tx.blockNumber && tx.status){
                          // Toast message
                          window.showToastMessage({
                            variant:'success',
                            message:'Deposit completed',
                            secondaryMessage:`${providerName} sent you ${tokenAmountFormatted} ${this.props.selectedToken}`,
                          });

                          // Update User Balance
                          this.getAccountBalance(tokenAmount);
                        } else {
                          // Toast message
                          window.showToastMessage({
                            variant:'processing',
                            message:'Deposit pending',
                            secondaryMessage:`${providerName} is sending ${tokenAmountFormatted} ${this.props.selectedToken}`,
                          });
                        }
                      }
                    }

                    let checkTransactionReceiptTimeoutID = null;

                    const checkTransactionReceipt = (txHash,decodedLogs) => {
                      if (checkTransactionReceiptTimeoutID){
                        window.clearTimeout(checkTransactionReceiptTimeoutID);
                      }
                      web3SocketProvider.eth.getTransactionReceipt(txHash,(err,txReceipt)=>{
                        if (!err){
                          if (txReceipt){
                            receiptCallback(txReceipt,decodedLogs);
                          } else{
                            checkTransactionReceiptTimeoutID = window.setTimeout(() => { checkTransactionReceipt(txHash,decodedLogs) },3000);
                          }
                        }
                      });
                    }

                    checkTransactionReceipt(txHash,decodedLogs);

                    subscribedTransactions[txHash] = log;
                    this.setState({subscribedTransactions});
                  }
                }
              }
            });
          })
        }

        // Subscribe for deposit transactions
        web3SocketProvider.eth.subscribe('logs', {
            address: [account,this.props.tokenConfig.address],
            topics: [null,null,[addressTopic]]
        }, function(error, result){

        })
        .on("data", async (log) => {
          if (log){
            const txHash = log.transactionHash;
            const subscribedTransactions = this.state.subscribedTransactions;
            const walletAddressFound = log.topics.filter((addr,i) => { return addr.toLowerCase().includes(addressTopic); });

            if (!subscribedTransactions[txHash] && walletAddressFound.length){
              const decodedLogs = web3SocketProvider.eth.abi.decodeLog([
                {
                  "internalType": "uint256",
                  "name": "_tokenAmount",
                  "type": "uint256"
                },
              ],log.data,log.topics);

              if (decodedLogs && decodedLogs._tokenAmount){

                const receiptCallback = async (tx,decodedLogs) => {
                  const tokenDecimals = await this.getTokenDecimals();
                  const tokenAmount = this.functionsUtil.BNify(decodedLogs._tokenAmount);
                  const tokenAmountFixed = this.functionsUtil.fixTokenDecimals(tokenAmount,tokenDecimals);
                  const tokenAmountFormatted = parseFloat(tokenAmountFixed.toString()).toFixed(2);
                  const isDepositTokenTx = tx.to.toLowerCase() === this.props.tokenConfig.address.toLowerCase();

                  if (isDepositTokenTx){

                    // Mined
                    if (tx.blockNumber && tx.status){
                      // Toast message
                      window.showToastMessage({
                        message:'Deposit completed',
                        secondaryMessage: `${tokenAmountFormatted} ${this.props.selectedToken} has been deposited`,
                        variant: "success",
                      });

                      // Update User Balance
                      this.getAccountBalance(tokenAmount);
                    } else {
                      // Toast message
                      window.showToastMessage({
                        message:'Deposit pending',
                        secondaryMessage: `${tokenAmountFormatted} ${this.props.selectedToken} are on the way`,
                        variant: "processing",
                      });
                    }
                  }
                }

                let checkTransactionReceiptTimeoutID = null;

                const checkTransactionReceipt = (txHash,decodedLogs) => {
                  if (checkTransactionReceiptTimeoutID){
                    window.clearTimeout(checkTransactionReceiptTimeoutID);
                  }
                  web3SocketProvider.eth.getTransactionReceipt(txHash,(err,txReceipt)=>{
                    if (!err){
                      if (txReceipt){
                        receiptCallback(txReceipt,decodedLogs);
                      } else{
                        checkTransactionReceiptTimeoutID = window.setTimeout(() => { checkTransactionReceipt(txHash,decodedLogs) },3000);
                      }
                    }
                  });
                }

                checkTransactionReceipt(txHash,decodedLogs);

                subscribedTransactions[txHash] = log;
                this.setState({subscribedTransactions});
              }
            }
          }
        })
        .on("changed", log => {
          
        });
        */

        // this.functionsUtil.customLog('initAccount',account);

        // Set custom account
        this.setState({
          account,
          // web3SocketProvider,
          accountInizialized: true
        });

        // After account is complete, get the balance
        this.getAccountBalance();

        // TODO subscribe for account changes, no polling
        // set a state flag which indicates if the subscribe handler has been
        // called at least once
      }
    } catch (error) {

      this.setState({
        accountInizialized: true
      });

      // User denied account access...
      this.functionsUtil.customLog("User cancelled connect request. Error:", error);

      // this.functionsUtil.customLog(error);

      // Catch ledger error
      if (error && error.message && error.message.includes('MULTIPLE_OPEN_CONNECTIONS_DISALLOWED')) {
        return;
      }

      // Send Sentry connection error
      const isError = error instanceof Error;
      if (this.functionsUtil.checkUrlOrigin() && isError){
        Sentry.captureException(error);
      }

      // Reject Connect
      // this.rejectAccountConnect(error);
    }
  }

  // TODO: Can this be moved/combined?
  rejectAccountConnect = error => {
    let modals = { ...this.state.modals };
    modals.data.accountConnectionPending = false;
    modals.data.userRejectedConnect = true;
    this.setState({ modals });
  }

  getAccountBalance = async (increaseAmount) => {

    increaseAmount = increaseAmount ? this.functionsUtil.BNify(increaseAmount) : null;

    try {

      let [accountBalance,accountBalanceToken,tokenDecimals] = await Promise.all([
        this.state.web3.eth.getBalance(this.state.account), // Get ETH balance
        this.getTokenBalance(this.state.account), // Get token balance
        this.getTokenDecimals()
      ]);

      if (accountBalance) {

        // Convert to wei if decimals found
        if (accountBalance.toString().includes('.')){
          accountBalance = this.state.web3.utils.toWei(accountBalance);
        }

        // Convert to Eth amount
        accountBalance = this.state.web3.utils.fromWei(
          accountBalance,
          'ether'
        );

        accountBalance = this.functionsUtil.BNify(accountBalance).toString();

        this.setState({
          accountBalance
        });

        this.functionsUtil.customLog("account balance: ", accountBalance);
      }

      // this.functionsUtil.customLog('accountBalance',res,(accountBalanceToken ? accountBalanceToken.toString() : null),tokenDecimals,increaseAmount);

      if (accountBalanceToken) {

        accountBalanceToken = this.functionsUtil.BNify(accountBalanceToken);

        // Increase balance amount if passed and balance didn't change
        if (increaseAmount && this.state.accountBalanceToken && this.functionsUtil.normalizeTokenAmount(this.state.accountBalanceToken,tokenDecimals).toString() === accountBalanceToken.toString()){
          accountBalanceToken = accountBalanceToken.plus(increaseAmount);
        }
        
        accountBalanceToken = this.functionsUtil.fixTokenDecimals(accountBalanceToken,tokenDecimals).toString();

        // this.functionsUtil.customLog('increaseAmount',(increaseAmount ? increaseAmount.toString() : '0'),(this.state.accountBalanceToken ? this.state.accountBalanceToken.toString() : '0'),(accountBalanceToken ? accountBalanceToken.toString() : 'ERROR'));
        // this.functionsUtil.customLog(`account balance ${this.props.selectedToken}: `, accountBalanceToken);

        this.setState({
          accountBalanceToken,
          [`accountBalance${this.props.selectedToken}`]:accountBalanceToken
        });

      } else {
        this.functionsUtil.customLog('accountBalanceToken is not set:',accountBalanceToken);
      }
    } catch (error) {
      this.functionsUtil.customLogError("Failed to get account balance.", error);
    }
  }

  initializeContracts = async () => {

    const contracts = this.functionsUtil.getGlobalConfig(['contracts']);
    await this.functionsUtil.asyncForEach(Object.keys(contracts),async (contractName) => {
      const contractInfo = contracts[contractName];
      if (contractInfo.address !== null && contractInfo.abi !== null){
        this.functionsUtil.customLog('initializeContracts, init contract', contractName, contractInfo.address);
        await this.initContract(contractName, contractInfo.address, contractInfo.abi);
      }
    });

    const govTokens = this.functionsUtil.getGlobalConfig(['govTokens']);
    await this.functionsUtil.asyncForEach(Object.keys(govTokens),async (token) => {
      const govTokenConfig = govTokens[token];
      if (!govTokenConfig.enabled){
        return;
      }
      // Initialize govToken contracts
      let foundGovTokenContract = this.state.contracts.find(c => c.name === token);
      if (!foundGovTokenContract) {
        this.functionsUtil.customLog('initializeContracts, init contract', token, govTokenConfig.address);
        await this.initContract(token, govTokenConfig.address, govTokenConfig.abi);
      }
    });

    if (this.props.availableStrategies){
      // Initialize Tokens Contracts
      await this.functionsUtil.asyncForEach(Object.keys(this.props.availableStrategies),async (strategy) => {
        
        const availableTokens = this.props.availableStrategies[strategy];

        await this.functionsUtil.asyncForEach(Object.keys(availableTokens),async (token) => {
          const tokenConfig = availableTokens[token];

          let foundTokenContract = this.state.contracts.find(c => c.name === token);
          if (!foundTokenContract) {
            this.functionsUtil.customLog('initializeContracts, init contract',token, tokenConfig.address);
            await this.initContract(token, tokenConfig.address, tokenConfig.abi);
          }

          // Initialize idleTokens contracts
          let foundIdleTokenContract = this.state.contracts.find(c => c.name === tokenConfig.idle.token);
          if (!foundIdleTokenContract) {
            this.functionsUtil.customLog('initializeContracts, init contract',tokenConfig.idle.token, tokenConfig.idle.address);
            await this.initContract(tokenConfig.idle.token, tokenConfig.idle.address, tokenConfig.idle.abi);
          }

          // Initialize protocols contracts
          tokenConfig.protocols.forEach(async (p,i) => {
            let foundProtocolContract = this.state.contracts.find(c => c.name === p.token);
            if (!foundProtocolContract) {
              this.functionsUtil.customLog('initializeContracts, init '+p.token+' contract',p);
              await this.initContract(p.token, p.address, p.abi);
            }
          });

          // Check migration contract
          if (tokenConfig.migration){

            if (tokenConfig.migration.oldContract){
              const oldContract = tokenConfig.migration.oldContract;
              this.functionsUtil.customLog('initializeContracts, init '+oldContract.name+' contract',oldContract);
              await this.initContract(oldContract.name, oldContract.address, oldContract.abi);
            }

            // Initialize protocols contracts
            if (tokenConfig.migration.oldProtocols){
              tokenConfig.migration.oldProtocols.forEach(async (p,i) => {
                let foundProtocolContract = this.state.contracts.find(c => c.name === p.token);
                if (!foundProtocolContract) {
                  this.functionsUtil.customLog('initializeContracts, init '+p.token+' contract',p);
                  await this.initContract(p.token, p.address, p.abi);
                }
              });
            }

            if (tokenConfig.migration.migrationContract){
              const migrationContract = tokenConfig.migration.migrationContract;
              this.functionsUtil.customLog('initializeContracts, init '+migrationContract.name+' contract',migrationContract);
              await this.initContract(migrationContract.name, migrationContract.address, migrationContract.abi);
            }
          }
        })
      });
    }

    return this.setState({
      contractsInitialized:true
    });
  }

  getContractByName = async (contractName) => {
    let contract = this.state.contracts.find(c => c.name === contractName);

    if (!contract && this.props.tokenConfig) {
      const tokenConfig = this.props.tokenConfig;
      contract = await this.initContract(contractName, tokenConfig.address, tokenConfig.abi);
    }

    return contract ? contract.contract : null;
  }

  getTokenDecimals = async () => {
    let tokenDecimals = null;

    if (!this.state.tokenDecimals){

      tokenDecimals = await this.functionsUtil.getTokenDecimals(this.props.selectedToken);

      this.setState({
        tokenDecimals
      });
    } else {
      tokenDecimals = await (new Promise( async (resolve, reject) => {
        resolve(this.state.tokenDecimals);
      }));
    }

    return tokenDecimals;
  }

  getTokenBalance = async (account) => {
    const contract = await this.getContractByName(this.props.selectedToken);

    if (!contract) {
      this.functionsUtil.customLogError('Wrong contract name', this.props.selectedToken);
      return null;
    }

    if (!contract.methods['balanceOf']){
      this.customLogError('Wrong method name balanceOf');
      return null;
    }

    return await contract.methods.balanceOf(account).call().catch(error => {
      this.functionsUtil.customLog(`Failed to get ${this.props.selectedToken} balance`, error);
    });
  }

  determineAccountLowBalance = () => {
    // If provided a minimum from config then use it, else default to 1
    const accountBalanceMinimum =
      typeof this.props.config !== "undefined" &&
      typeof this.props.config.accountBalanceMinimum !== "undefined"
        ? this.props.config.accountBalanceMinimum
        : 1;
    // Determine if the account balance is low
    const accountBalanceLow =
      this.state.accountBalance < accountBalanceMinimum;

    this.setState({
      accountBalanceLow
    });
  }

  connectAndValidateAccount = async (callbackAfterLogin) => {
    // Check for account
    if (!this.state.account) {
      this.props.setCallbackAfterLogin(callbackAfterLogin);
      // Show modal to connect account
      this.openConnectionModal();
    }
  }

  getRequiredNetwork = () => {

    const networkId =
      typeof this.props.config !== "undefined" &&
      typeof this.props.config.requiredNetwork !== "undefined"
        ? this.props.config.requiredNetwork
        : globalConfigs.network.requiredNetwork;

    let networkName = globalConfigs.network.availableNetworks[networkId] ? globalConfigs.network.availableNetworks[networkId] : 'unknown';

    let requiredNetwork = {
      name: networkName,
      id: networkId
    };

    let network = { ...this.state.network };
    network.required = requiredNetwork;

    this.setState({ network });
  }

  getNetworkId = async () => {
    try {
      return this.state.web3.eth.net.getId((error, networkId) => {
        let current = { ...this.state.network.current };
        current.id = networkId;
        let network = { ...this.state.network };
        network.current = current;
        this.setState({ network });
      });
    } catch (error) {
      this.functionsUtil.customLog("Could not get network ID: ", error);
    }
  }

  getNetworkName = async () => {
    try {
      return this.state.web3.eth.net.getNetworkType((error, networkName) => {
        let current = { ...this.state.network.current };
        current.name = networkName;
        let network = { ...this.state.network };
        network.current = current;
        this.setState({ network });
      });
    } catch (error) {
      this.functionsUtil.customLog("Could not get network Name: ", error);
    }
  }

  checkNetwork = async () => {
    this.getRequiredNetwork();

    await Promise.all([
      this.getNetworkId(),
      this.getNetworkName()
    ]);

    let network = { ...this.state.network };
    network.isCorrectNetwork = this.state.network.current.id === this.state.network.required.id;

    // To do, check window.web3.currentProvider.networkVersion to see if Metamask is in the requiredNetwork

    this.setState({ network });
  }

  contractMethodSendWrapper = async (contractName, contractMethod, params = [], value = null, callback = null, callback_receipt = null, gasLimit = null, txData = null) => {
    // Is it on the correct network?
    if (!this.state.network.isCorrectNetwork) {
      // wrong network modal
      this.state.modals.methods.openWrongNetworkModal();
      return false;
    }

    // Is a wallet connected and verified?
    if (!this.state.account) {
      this.openConnectionModal();
      if (typeof callback === 'function') {
        callback(null,'account_not_connected');
      }
      return false;
    }

    // Are there a minimum amount of funds?
    if (this.state.accountBalanceLow) {
      this.openLowFundsModal();
      if (typeof callback === 'function') {
        callback(null,'account_balance_low');
      }
      return false;
    }

    // Is the contract loaded?

    // Create new tx and add to collection
    // Maybe this needs to get moved out of the wrapper?
    let transaction = this.createTransaction(txData);
    transaction.method = contractMethod;

    this.addTransaction(transaction);

    // Add meta data to transaction
    transaction.type = "contract";
    transaction.status = "started";
    transaction.params = params;

    // Show toast for starting transaction
    this.updateTransaction(transaction);

    const { account, contracts } = this.state;
    let contract = contracts.find(c => c.name === contractName);
    if (!contract) {
      if (typeof callback === 'function') {
        callback(null,'contract_not_found');
      }
      return this.functionsUtil.customLog(`No contract with name ${contractName}`);
    }

    contract = contract.contract;

    // Does the method exists?
    // if (typeof contract.methods[contractMethod] === 'undefined'){
    //   return false;
    // }

    let manualConfirmationTimeoutId = null;

    try {

      if (!value){
        value = this.functionsUtil.BNify(0);
      }

      this.functionsUtil.customLog('contractMethodSendWrapper',contractName,contract._address,account,contractMethod,params,(value ? { from: account, value } : { from: account }));

      // estimate gas price
      let gas = await contract.methods[contractMethod](...params)
        .estimateGas(value ? { from: account, value } : { from: account })
        .catch(e => console.error(e));

      if (gas) {

        gas = this.functionsUtil.BNify(gas);
        gas = gas.plus(gas.times(this.functionsUtil.BNify('0.2'))); // Increase 20% of enstimation

        // Check if gas is under the gasLimit param
        if (gasLimit && gas.lt(this.functionsUtil.BNify(gasLimit))){
          gas = this.functionsUtil.BNify(gasLimit);
        }

        // Convert gasLimit toBN with web3 utils
        gas = this.state.web3.utils.toBN(gas.integerValue(BigNumber.ROUND_FLOOR));
      }

      const confirmationCallback = (confirmationNumber, receipt) => {

        // this.functionsUtil.customLog('confirmationCallback', confirmationNumber, receipt);

        if (manualConfirmationTimeoutId){
          window.clearTimeout(manualConfirmationTimeoutId);
        }

        // this.functionsUtil.customLog('txOnConfirmation', receipt);
        // Update confirmation count on each subsequent confirmation that's received
        transaction.confirmationCount += 1;

        const call_callback = !globalConfigs.network.isForked && typeof callback === 'function' && transaction.confirmationCount===1;

        // How many confirmations should be received before informing the user
        const confidenceThreshold = this.props.config.requiredConfirmations || 1;

        if (transaction.confirmationCount === 1) {
          // Initial confirmation receipt
          transaction.status = "confirmed";
        } else if (transaction.confirmationCount < confidenceThreshold) {
          // Not enough confirmations to match threshold
        }

        if (transaction.confirmationCount === confidenceThreshold) {
          // Confirmations match threshold
          // Check the status from result since we are confident in the result
          if (receipt.status) {
            transaction.status = "success";
          } else if (!receipt.status) {
            transaction.status = "error";
          }
        } else if (transaction.confirmationCount > confidenceThreshold) {
          // Confidence threshold met
        }


        if (call_callback){
          // Update transaction with receipt details
          transaction.recentEvent = "confirmation";
          this.updateTransaction(transaction);
          
          callback(transaction);

          this.functionsUtil.customLog('Confirmed', confirmationNumber, receipt, transaction);
        }
      };

      const manualConfirmation = (transactionHash,timeout) => {
        if (!transactionHash){
          return false;
        }
        this.state.web3.eth.getTransactionReceipt(transactionHash,(err,txReceipt) => {
          if (txReceipt && txReceipt.status){
            this.functionsUtil.customLog('Tx manualConfirmation', txReceipt);
            confirmationCallback(1,txReceipt);
          } else {
            manualConfirmationTimeoutId = window.setTimeout( () => manualConfirmation(transactionHash,timeout) , timeout);
          }
        });
      };

      const receiptCallback = receipt => {

        // this.functionsUtil.customLog('txOnReceipt', receipt);

        if (manualConfirmationTimeoutId){
          window.clearTimeout(manualConfirmationTimeoutId);
        }

        // Received receipt, met total number of confirmations
        transaction.recentEvent = "receipt";

        // If the network is forked use the receipt for confirmation
        if (globalConfigs.network.isForked){
          transaction.status = "success";
          if (typeof callback === 'function') {
            callback(transaction);
          }
        } else {
          this.updateTransaction(transaction);

          // Transaction mined, wait for manual confirmation
          if (receipt.status){
            manualConfirmationTimeoutId = window.setTimeout( () => manualConfirmation(receipt.transactionHash,4000), 2000);
          }
        }
      };

      return contract.methods[contractMethod](...params)
        .send(value ? { from: account, value, gas  } : { from: account, gas })
        .on("transactionHash", hash => {
          this.functionsUtil.customLog('txOnTransactionHash', hash);

          if (!hash){
            this.functionsUtil.customLog('Skip transactionHash due to hash empty', hash);
            return false;
          }

          transaction.transactionHash = hash;
          transaction.status = "pending";
          transaction.recentEvent = "transactionHash";
          this.updateTransaction(transaction);

          if (callback_receipt){
            callback_receipt(transaction);
          }

          // Wait for manual confirmation only for mobile
          if (this.props.isMobile){
            if (manualConfirmationTimeoutId){
              window.clearTimeout(manualConfirmationTimeoutId);
            }
            manualConfirmationTimeoutId = window.setTimeout( () => manualConfirmation(hash,60000), 20000);
          }
        })
        .on("receipt", receiptCallback)
        .on("confirmation", confirmationCallback)
        .on("error", error => {

          console.log('Tx error',error);
          
          const isDeniedTx = error && error.message && typeof error.message.includes === 'function' ? error.message.includes('User denied transaction signature') : false;
          
          // Set error on transaction
          transaction.status = "error";
          transaction.recentEvent = "error";
          this.updateTransaction(transaction);


          // Show ToastProvider
          if (!isDeniedTx){
            window.toastProvider.addMessage("Something went wrong", {
              icon: 'Block',
              actionHref: "",
              actionText: "",
              variant: "failure",
              colorTheme: 'light',
              secondaryMessage: "Please retry",
            });

            const isError = error instanceof Error;

            if (typeof error.message !== 'undefined'){
              this.openTransactionErrorModal(null,error.message);
            } else if (this.functionsUtil.checkUrlOrigin() && isError){
              Sentry.captureException(error);
            }
          }

          if (typeof callback === 'function') {
            callback(transaction,error);
          }
        });
    } catch (error) {

      console.log('Tx catch error',error);

      transaction.status = "error";
      this.updateTransaction(transaction);

      // TODO: should this be a custom error? What is the error here?
      // TODO: determine how to handle error messages globally
      window.toastProvider.addMessage("Something went really wrong, we are sorry", {
        icon: 'Block',
        actionHref: "",
        actionText: "",
        variant: "failure",
        colorTheme: 'light',
        secondaryMessage: "Try refreshing the page :(",
      });

      const isDeniedTx = error && error.message ? error.message.includes('User denied transaction signature') : false;

      const isError = error instanceof Error;
      if ( this.functionsUtil.checkUrlOrigin() && isError && !isDeniedTx){
        Sentry.captureException(error);
      }

      if (typeof callback === 'function') {
        // this.functionsUtil.customLog('Tx Failed',error,transaction,typeof callback);
        callback(transaction,error);
      }

      return false;
    }
  }

  // Create tx
  createTransaction = (txData=null) => {
    let transaction = {
      ...txData
    };
    transaction.created = Date.now();
    transaction.lastUpdated = Date.now();
    transaction.status = "initialized";
    transaction.confirmationCount = 0;
    transaction.token = this.props.selectedToken;
    transaction.strategy = this.props.selectedStrategy;
    return transaction;
  }

  addTransaction = transaction => {
    const transactions = { ...this.state.transactions };
    transactions[`tx${transaction.created}`] = transaction;
    this.setState({ transactions });
  }

  // Add/update transaction in state
  updateTransaction = updatedTransaction => {
    const transactions = { ...this.state.transactions };
    const transaction = { ...updatedTransaction };
    transaction.lastUpdated = Date.now();
    transactions[`tx${updatedTransaction.created}`] = transaction;
    this.setState({ transactions });

    // this.functionsUtil.customLog('updateTransaction',transactions);

    // Save transactions in localStorage only if pending or succeeded
    // console.log('updateTransaction',transaction.transactionHash,transaction.status.toLowerCase());
    if (transaction.transactionHash){
      // Clear cached data
      this.functionsUtil.clearCachedData();

      // Store transaction
      this.functionsUtil.addStoredTransaction(`tx${transaction.created}`,transaction);
    }

    return transaction;
  }

  // CONNECTION MODAL METHODS
  closeConnectionModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.connectionModalIsOpen = false;
    // this.functionsUtil.customLog("this.state", this.state);
    this.setState({ modals });
  }

  openConnectionModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.connectionModalIsOpen = true;
    this.setState({ modals: modals });
  }

  closeConnectionPendingModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.accountConnectionPending = false;
    this.setState({ modals });
  }

  openConnectionPendingModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.accountConnectionPending = true;
    modals.data.transactionConnectionModalIsOpen = false;
    modals.data.connectionModalIsOpen = false;

    this.setState({ modals });
  }

  closeTransactionErrorModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.transactionError = false;
    this.setState({ modals });
  }

  openTransactionErrorModal = (e,error) => {
    if (typeof e !== "undefined" && e) {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.transactionError = error;

    this.setState({ modals });
  }

  closeConnectionErrorModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.connectionError = false;
    this.setState({ modals });
  }

  openConnectionErrorModal = (e,error) => {
    if (typeof e !== "undefined" && e) {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };

    // Handle generic error
    if (error==='[object Object]'){
      error = 'Unable to access to the wallet.'
    }

    // this.functionsUtil.customLog('openConnectionErrorModal',typeof error,typeof error === 'object' ? JSON.stringify(error) : error);

    modals.data.connectionError = error;

    this.setState({ modals });
  }

  closeUserRejectedConnectionModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.userRejectedConnect = false;
    this.setState({ modals });
  }

  openUserRejectedConnectionModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.userRejectedConnect = true;
    this.setState({ modals });
  }

  closeNoWeb3BrowserModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.noWeb3BrowserModalIsOpen = false;
    this.setState({ modals });
  }

  openNoWeb3BrowserModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.noWeb3BrowserModalIsOpen = true;
    this.setState({ modals });
  }

  closeNoWalletModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.noWalletModalIsOpen = false;
    this.setState({ modals });
  }

  openNoWalletModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.noWalletModalIsOpen = true;
    this.setState({ modals });
  }

  closeWrongNetworkModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.wrongNetworkModalIsOpen = false;
    this.setState({ modals });
  }

  openWrongNetworkModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.wrongNetworkModalIsOpen = true;
    this.setState({ modals });
  }

  closeLowFundsModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.lowFundsModalIsOpen = false;
    this.setState({ modals });
  }

  openLowFundsModal = e => {
    if (typeof e !== "undefined") {
      e.preventDefault();
    }

    let modals = { ...this.state.modals };
    modals.data.lowFundsModalIsOpen = true;
    this.setState({ modals });
  }

  state = {
    web3: null,
    context:null,
    account: null,
    contracts: [],
    biconomy: null,
    simpleID: null,
    web3Infura:null,
    transactions: {},
    CrispClient: null,
    tokenDecimals:null,
    accountBalance: null,
    web3Subscription: null,
    accountValidated: null,
    accountBalanceDAI: null,
    initWeb3: this.initWeb3,
    accountBalanceLow: null,
    accountInizialized:false,
    subscribedTransactions:{},
    contractsInitialized:false,
    initAccount: this.initAccount,
    accountValidationPending: null,
    initSimpleID: this.initSimpleID,
    initContract: this.initContract,
    checkPreflight: this.checkPreflight,
    validateAccount: this.validateAccount,
    rejectValidation: this.rejectValidation,
    getTokenDecimals: this.getTokenDecimals,
    getAccountBalance: this.getAccountBalance,
    initializeContracts: this.initializeContracts,
    rejectAccountConnect: this.rejectAccountConnect,
    contractMethodSendWrapper: this.contractMethodSendWrapper,
    connectAndValidateAccount: this.connectAndValidateAccount,
    enableUnderlyingWithdraw: this.props.enableUnderlyingWithdraw,
    network: {
      current: {},
      required: {},
      isCorrectNetwork: null,
      checkNetwork: this.checkNetwork
    },
    modals: {
      data: {
        connectionError: null,
        lowFundsModalIsOpen: null,
        userRejectedConnect: null,
        connectionModalIsOpen: null,
        userRejectedValidation: null,
        wrongNetworkModalIsOpen: null,
        accountConnectionPending: null,
        accountValidationPending: null,
        transactionConnectionModalIsOpen: null,
        noWalletModalIsOpen: this.noWalletModalIsOpen,
        noWeb3BrowserModalIsOpen: this.noWeb3BrowserModalIsOpen,
      },
      methods: {
        openLowFundsModal: this.openLowFundsModal,
        openNoWalletModal: this.openNoWalletModal,
        closeNoWalletModal: this.closeNoWalletModal,
        closeLowFundsModal: this.closeLowFundsModal,
        openConnectionModal: this.openConnectionModal,
        closeConnectionModal: this.closeConnectionModal,
        openWrongNetworkModal: this.openWrongNetworkModal,
        closeWrongNetworkModal: this.closeWrongNetworkModal,
        openNoWeb3BrowserModal: this.openNoWeb3BrowserModal,
        closeNoWeb3BrowserModal: this.closeNoWeb3BrowserModal,
        openConnectionErrorModal: this.openConnectionErrorModal,
        closeConnectionErrorModal: this.closeConnectionErrorModal,
        openTransactionErrorModal: this.openTransactionErrorModal,
        closeTransactionErrorModal: this.closeTransactionErrorModal,
        openConnectionPendingModal: this.openConnectionPendingModal,
        closeConnectionPendingModal: this.closeConnectionPendingModal,
        openUserRejectedValidationModal: this.openUserRejectedValidationModal,
        openUserRejectedConnectionModal: this.openUserRejectedConnectionModal,
        closeUserRejectedValidationModal: this.closeUserRejectedValidationModal,
        closeUserRejectedConnectionModal: this.closeUserRejectedConnectionModal,
      }
    },
    transaction: {
      data: {
        transactions: null
      },
      meta: {},
      methods: {}
    }
  }

  render() {
    const connectionErrorModalOpened = typeof this.state.modals.data.connectionError === 'string' && this.state.modals.data.connectionError.length>0;
    const transactionErrorModalOpened = typeof this.state.modals.data.transactionError === 'string' && this.state.modals.data.transactionError.length>0;
    return (
      <div>
        <RimbleTransactionContext.Provider value={this.state} {...this.props} />
        <ConnectionModalUtil
          modals={this.state.modals}
          network={this.state.network}
          account={this.state.account}
          isMobile={this.props.isMobile}
          initAccount={this.state.initAccount}
          setConnector={this.props.setConnector}
          validateAccount={this.state.validateAccount}
          accountValidated={this.state.accountValidated}
          accountConnectionPending={this.state.accountConnectionPending}
          accountValidationPending={this.state.accountValidationPending}
        />
        <TransactionErrorModal
          modals={this.state.modals}
          account={this.state.account}
          context={this.props.context}
          isOpen={transactionErrorModalOpened}
        />
        <ConnectionErrorModal
          modals={this.state.modals}
          account={this.state.account}
          context={this.props.context}
          isOpen={connectionErrorModalOpened}
          setConnector={this.props.setConnector}
        />
        <NetworkUtil
          web3={this.state.web3}
          network={this.state.network}
        />
      </div>
    );
  }
}

export default RimbleTransaction;
