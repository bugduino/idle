import Web3 from "web3";
import React from 'react';
import BigNumber from 'bignumber.js';
import SimpleID from 'simpleid-js-sdk';
import NetworkUtil from "./NetworkUtil";
import * as Sentry from '@sentry/browser';
import FunctionsUtil from './FunctionsUtil';
import globalConfigs from '../configs/globalConfigs';
import ConnectionModalUtil from "./ConnectionModalsUtil";
import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";
import { TerminalHttpProvider, SourceType } from '@terminal-packages/sdk';

require('dotenv').config();
const INFURA_KEY = process.env["REACT_APP_INFURA_KEY"];

const RimbleTransactionContext = React.createContext({
  contracts: [],
  account: {},
  accountBalance: {},
  accountBalanceToken: {},
  accountBalanceLow: {},
  tokenConfig: {},
  web3: {},
  initWeb3: () => {},
  simpleID: {},
  initSimpleID: () => {},
  transactions: {},
  checkPreflight: () => {},
  initContract: () => {},
  initAccount: () => {},
  initializeContracts: () => {},
  getAccountBalance: () => {},
  getTokenDecimals: () => {},
  rejectAccountConnect: () => {},
  accountValidated: {},
  accountValidationPending: {},
  rejectValidation: () => {},
  validateAccount: () => {},
  accountInizialized: false,
  contractsInitialized: false,
  enableUnderlyingWithdraw: false,
  connectAndValidateAccount: () => {},
  network: {
    required: {},
    current: {},
    isCorrectNetwork: null,
    checkNetwork: () => {}
  },
  modals: {
    data: {
      noWeb3BrowserModalIsOpen: {},
      noWalletModalIsOpen: {},
      connectionModalIsOpen: {},
      accountConnectionPending: {},
      userRejectedConnect: {},
      accountValidationPending: {},
      userRejectedValidation: {},
      wrongNetworkModalIsOpen: {},
      transactionConnectionModalIsOpen: {},
      lowFundsModalIsOpen: {},
      connectionError: {}
    },
    methods: {
      openNoWeb3BrowserModal: () => {},
      closeNoWeb3BrowserModal: () => {},
      closeConnectionPendingModal: () => {},
      openConnectionPendingModal: () => {},
      closeUserRejectedConnectionModal: () => {},
      openUserRejectedConnectionModal: () => {},
      closeUserRejectedValidationModal: () => {},
      openUserRejectedValidationModal: () => {},
      closeConnectionErrorModal: () => {},
      openConnectionErrorModal: () => {},
      closeWrongNetworkModal: () => {},
      openWrongNetworkModal: () => {},
      closeLowFundsModal: () => {},
      openLowFundsModal: () => {}
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

class RimbleTransaction extends React.Component {
  static Consumer = RimbleTransactionContext.Consumer;

  // Utils
  functionsUtil = null;

  loadUtils = () => {
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

  componentDidMount = async () => {
    this.loadUtils();
    this.initSimpleID();

    // console.log('RimbleWeb3 componentDidMount');
    this.initWeb3();

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

    // window.initWeb3 = this.initWeb3;
  }

  componentDidUpdate = async (prevProps, prevState) => {

    if (prevProps.connectorName !== this.props.connectorName && this.props.connectorName){
      this.initWeb3();
    } else if (prevProps.context !== this.props.context){
      if (this.props.context.error instanceof Error && this.props.context.error.message.length){
        this.state.modals.methods.openConnectionErrorModal(null,this.props.context.error.message);
      // WalletConnect double trigger initWeb3
      } else if (this.props.context.active && this.props.context.connectorName==='WalletConnect' && this.props.connectorName==='WalletConnect') {
        this.initWeb3();
      }
    } else if ( prevProps.customAddress !== this.props.customAddress){
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

    // console.log(prevProps.enableUnderlyingWithdraw,this.props.enableUnderlyingWithdraw,this.state.enableUnderlyingWithdraw);
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

    this.loadUtils();
  }

  // Initialize a web3 provider
  initWeb3 = async () => {

    this.loadUtils();

    // Suppress console warning
    if (window.ethereum && window.ethereum.autoRefreshOnNetworkChange) {
      window.ethereum.autoRefreshOnNetworkChange = false;
    }

    const context = this.props.context;

    let web3 = context.library;

    // 0x Instant Wallet Provider Injection
    if (!window.RimbleWeb3_context || context.connectorName !== window.RimbleWeb3_context.connectorName){
      window.RimbleWeb3_context = context;
    }

    const connectorName = this.props.connectorName;
    const last_context = localStorage ? JSON.parse(localStorage.getItem('context')) : null;

    this.functionsUtil.customLog('initWeb3 context',connectorName,setConnectorName);

    // console.log(context.active,context.connectorName,connectorName,setConnectorName);

    if (!context.active || (connectorName !== 'Infura' && connectorName !== setConnectorName)) {
      // Select preferred web3 provider
      if (connectorName && connectorName !== 'Infura' && connectorName !== setConnectorName){
        // console.log('initWeb3 set connector',connectorName);
        setConnectorName = connectorName;
        await context.setConnector(connectorName);
        // await context.setFirstValidConnector([connectorName, 'Infura']);
        return web3;
      } else if (setConnectorName){
        // Catch WalletConnect unexpected disconnect and fallback to Infura
        if (connectorName === 'WalletConnect' && connectorName === setConnectorName && last_context && last_context.active && last_context.connectorName==='WalletConnect' && !context.connectorName){
          this.functionsUtil.customLog('WalletConnect disconnected! Set Infura connector');
          this.props.setConnector('Infura',null);
          if (localStorage){
            localStorage.removeItem('walletProvider');
            localStorage.removeItem('connectorName');
            this.functionsUtil.setLocalStorage('context',JSON.stringify({active:context.active,connectorName:context.connectorName}));
          }
          setConnectorName = null;
          await context.setConnector('Infura');
        }

        this.functionsUtil.customLog('initWeb3 skip due to setConnectorName ('+setConnectorName+') already set');
        return web3;
      }
    } else if (context.connectorName === "WalletConnect") {
      if (!context.account) {

        // WalletConnect already opened
        if (document.getElementById('walletconnect-wrapper')){
          return web3;
        }

        WalletConnectQRCodeModal.open(
          context.connector.walletConnector.uri,
          await (async () => {
                  document.getElementById('walletconnect-wrapper').remove();
                  this.props.setConnector('Infura',null);
                  await context.setConnector('Infura');
                  setConnectorName = null;
                })
        );
      } else {
        try {
          WalletConnectQRCodeModal.close();
        } catch {}
      }
    // Reset web3 if Infura
    } else if (context.active && (connectorName === 'Infura' || context.connectorName === "Infura")){
      setConnectorName = null;
      web3 = null;
    }

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
        // console.log(web3Provider);
        web3 = new Web3(web3Provider);
      // Infura
      } else if (web3Host) {
        web3 = new Web3(new Web3.providers.HttpProvider(web3Host));
        this.props.setConnector('Infura',null);
      }
    }

    // window.web3Injected = web3;
    // console.log('web3Provider',web3Provider,web3);

    // alert(web3.version);

    const web3Callback = async () => {
      // After setting the web3 provider, check network
      await this.checkNetwork();
      if (this.state.network.isCorrectNetwork){

        if (!this.state.contractsInitialized){
          await this.initializeContracts();
        }

        if (context.account) {
          await this.initAccount(context.account);
        } else {
          this.setState({
            account: null,
            accountInizialized: true
          });
        }
        
        if (typeof this.props.callbackAfterLogin === 'function'){
          this.props.callbackAfterLogin();
          this.props.setCallbackAfterLogin(null);
        }
      }
    }

    if (web3 !== this.state.web3){
      this.setState({ web3 }, web3Callback);
    } else if (context.account){
      web3Callback();
    }

    return web3;
  }

  initContract = async (name, address, abi) => {
    this.functionsUtil.customLog(`Init contract: ${name}`);
    return await this.createContract(name, address, abi);
  }

  createContract = async (name, address, abi) => {
    this.functionsUtil.customLog(`creating contract ${name} - addr: ${address}`);
    // Create contract on initialized web3 provider with given abi and address
    try {
      const contract = new this.state.web3.eth.Contract(abi, address);
      this.setState(state => ({
        ...state,
        contracts: [...state.contracts, {name, contract}]
      }));
      return {name, contract};
    } catch (error) {
      this.functionsUtil.customLogError("Could not create contract.",name,address,error);
    }
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

  initAccount = async (account = false) => {

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

      // console.log('initAccount',account);

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
          await this.functionsUtil.simpleIDPassUserInfo({
            address: account,
            walletProvider
          },simpleID);

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

        // console.log('initAccount',account);

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

      // console.error(error);

      // User denied account access...
      this.functionsUtil.customLog("User cancelled connect request. Error:", error);

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

      const res = await Promise.all([
        this.state.web3.eth.getBalance(this.state.account), // Get ETH balance
        this.getTokenBalance(this.state.account), // Get token balance
        this.getTokenDecimals()
      ]);

      let accountBalance = res[0];
      if (accountBalance) {
        accountBalance = this.state.web3.utils.fromWei(
          accountBalance,
          "ether"
        );
        accountBalance = this.functionsUtil.BNify(accountBalance).toString();
        this.setState({ accountBalance });
        this.functionsUtil.customLog("account balance: ", accountBalance);
      }

      const tokenDecimals = res[2].toString();
      let accountBalanceToken = res[1];

      // console.log('accountBalance',res,(accountBalanceToken ? accountBalanceToken.toString() : null),tokenDecimals,increaseAmount);

      if (accountBalanceToken) {

        accountBalanceToken = this.functionsUtil.BNify(accountBalanceToken);

        // Increase balance amount if passed and balance didn't change
        if (increaseAmount && this.state.accountBalanceToken && this.functionsUtil.normalizeTokenAmount(this.state.accountBalanceToken,tokenDecimals).toString() === accountBalanceToken.toString()){
          accountBalanceToken = accountBalanceToken.plus(increaseAmount);
        }
        
        accountBalanceToken = this.functionsUtil.fixTokenDecimals(accountBalanceToken,tokenDecimals).toString();

        // console.log('increaseAmount',(increaseAmount ? increaseAmount.toString() : '0'),(this.state.accountBalanceToken ? this.state.accountBalanceToken.toString() : '0'),(accountBalanceToken ? accountBalanceToken.toString() : 'ERROR'));
        // console.log(`account balance ${this.props.selectedToken}: `, accountBalanceToken);

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

    if (!this.props.availableStrategies){
      return false;
    }

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

          if (tokenConfig.migration.migrationContract){
            const migrationContract = tokenConfig.migration.migrationContract;
            this.functionsUtil.customLog('initializeContracts, init '+migrationContract.name+' contract',migrationContract);
            await this.initContract(migrationContract.name, migrationContract.address, migrationContract.abi);
          }
        }
      })
    });

    return this.setState({
      contractsInitialized:true
    });
  }

  getContractByName = async (contractName) => {
    let contract = this.state.contracts.find(c => c.name === contractName);
    if (!contract) {
      const TOKEN = this.props.tokenConfig.abi;
      contract = await this.initContract(contractName, TOKEN.address, TOKEN.abi);
    }
    return contract.contract;
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

  contractMethodSendWrapper = async (contractName, contractMethod, params = [], value = null, callback = null, callback_receipt = null, gasLimit = null) => {
    // Is it on the correct network?
    if (!this.state.network.isCorrectNetwork) {
      // wrong network modal
      this.state.modals.methods.openWrongNetworkModal();
      return;
    }

    // Is a wallet connected and verified?
    if (!this.state.account) {
    // if (!this.state.account || !this.state.accountValidated) {
      this.openConnectionModal();
      return;
    }

    // Are there a minimum amount of funds?
    if (this.state.accountBalanceLow) {
      this.openLowFundsModal();
      return;
    }

    // Is the contract loaded?

    // Create new tx and add to collection
    // Maybe this needs to get moved out of the wrapper?
    let transaction = this.createTransaction();
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
      return this.functionsUtil.customLog(`No contract with name ${contractName}`);
    }

    contract = contract.contract;

    let manualConfirmationTimeoutId = null;

    try {
      this.functionsUtil.customLog('contractMethodSendWrapper',contractName,contract._address,account,contractMethod,params,(value ? { from: account, value } : { from: account }));

      // estimate gas price
      let gas = await contract.methods[contractMethod](...params)
        .estimateGas(value ? { from: account, value } : { from: account })
        .catch(e => console.error(e));

      if (gas) {
        gas = this.functionsUtil.BNify(gas);
        gas = gas.plus(gas.times(this.functionsUtil.BNify('0.3'))); // Increase 30% of enstimation

        // Check if gas is under the gasLimit param
        if (gasLimit && gas.lt(this.functionsUtil.BNify(gasLimit))){
          gas = this.functionsUtil.BNify(gasLimit);
        }
        // Convert gasLimit toBN with web3 utils
        gas = this.state.web3.utils.toBN(gas.integerValue(BigNumber.ROUND_FLOOR));
      }

      const confirmationCallback = (confirmationNumber, receipt) => {

        if (manualConfirmationTimeoutId){
          window.clearTimeout(manualConfirmationTimeoutId);
        }

        // this.functionsUtil.customLog('txOnConfirmation', receipt);
        // Update confirmation count on each subsequent confirmation that's received
        transaction.confirmationCount += 1;

        const call_callback = !globalConfigs.network.isForked && typeof callback === 'function' && transaction.confirmationCount===1;

        // if (call_callback){
        //   alert('confirmationCallback')
        // }

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

        this.functionsUtil.customLog('txOnReceipt', receipt);

        if (manualConfirmationTimeoutId){
          window.clearTimeout(manualConfirmationTimeoutId);
        }

        // Received receipt, met total number of confirmations
        transaction.recentEvent = "receipt";

        // If the network is forked use the receipt for confirmation
        if (globalConfigs.network.isForked){
          transaction.status = "success";
          callback(transaction);
        } else {
          this.updateTransaction(transaction);

          // Transaction mined, wait for manual confirmation
          if (receipt.status){
            manualConfirmationTimeoutId = window.setTimeout( () => manualConfirmation(receipt.transactionHash,4000), 2000);
          }
        }
      };

      contract.methods[contractMethod](...params)
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

          const isDeniedTx = error && error.message ? error.message.includes('User denied transaction signature') : false;
          
          // Set error on transaction
          transaction.status = "error";
          transaction.recentEvent = "error";
          this.updateTransaction(transaction);

          // Show ToastProvider
          if (!isDeniedTx){
            window.toastProvider.addMessage("Something went wrong", {
              secondaryMessage: "Please retry",
              colorTheme: 'light',
              actionHref: "",
              actionText: "",
              variant: "failure",
              icon: 'Block'
            });

            const isError = error instanceof Error;
            if (this.functionsUtil.checkUrlOrigin() && isError){
              Sentry.captureException(error);
            }
          }

          if (callback) {
            callback(transaction,error);
          }
        });
    } catch (error) {
      transaction.status = "error";
      this.updateTransaction(transaction);
      // TODO: should this be a custom error? What is the error here?
      // TODO: determine how to handle error messages globally
      window.toastProvider.addMessage("Something went really wrong, we are sorry", {
        colorTheme: 'light',
        secondaryMessage: "Try refreshing the page :(",
        actionHref: "",
        actionText: "",
        variant: "failure",
        icon: 'Block'
      });

      const isDeniedTx = error && error.message ? error.message.includes('User denied transaction signature') : false;

      const isError = error instanceof Error;
      if ( this.functionsUtil.checkUrlOrigin() && isError && !isDeniedTx){
        Sentry.captureException(error);
      }
    }
  }

  // Create tx
  createTransaction = () => {
    let transaction = {};
    transaction.created = Date.now();
    transaction.lastUpdated = Date.now();
    transaction.status = "initialized";
    transaction.confirmationCount = 0;
    transaction.token = this.props.selectedToken;

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

    // Save transactions in localStorage only if pending or succeeded
    if (['pending','success','confirmed'].includes(transaction.status)){
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
    simpleID: null,
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
        <NetworkUtil
          web3={this.state.web3}
          network={this.state.network}
        />
      </div>
    );
  }
}

export default RimbleTransaction;
