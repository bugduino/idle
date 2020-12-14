import Web3 from "web3";
import jQuery from 'jquery';
import theme from "../theme";
import Tos from "../Tos/Tos";
import connectors from './connectors';
import Web3Provider from 'web3-react';
import React, { Component } from "react";
import Landing from "../Landing/Landing";
import { Web3Consumer } from 'web3-react';
import Dashboard from '../Dashboard/Dashboard';
import CookieConsent from "react-cookie-consent";
import RimbleWeb3 from "../utilities/RimbleWeb3";
import Governance from '../Governance/Governance';
import GeneralUtil from "../utilities/GeneralUtil";
import Header from "../utilities/components/Header";
import globalConfigs from '../configs/globalConfigs';
import ScrollToTop from "../ScrollToTop/ScrollToTop";
import FunctionsUtil from '../utilities/FunctionsUtil';
import PageNotFound from "../PageNotFound/PageNotFound";
import Web3Debugger from "../Web3Debugger/Web3Debugger";
import availableTokens from '../configs/availableTokens';
import TransactionToastUtil from "../utilities/TransactionToastUtil";
import { HashRouter as Router, Switch, Route } from "react-router-dom";
import { ThemeProvider, Box, Text, Link, Image, Flex } from 'rimble-ui';

class App extends Component {
  state = {
    cachedData:{},
    buyToken: null,
    selectedTab: '1',
    route: "default", // or 'onboarding'
    connecting: false,
    tokenConfig: null,
    genericError: null,
    customAddress: null,
    connectorName: null,
    selectedToken: null,
    walletProvider: null,
    availableTokens: null,
    buyModalOpened: false,
    selectedStrategy: null,
    toastMessageProps: null,
    callbackAfterLogin: null,
    width: window.innerWidth,
    availableStrategies: null,
    height: window.innerHeight,
    unsubscribeFromHistory: null,
    enableUnderlyingWithdraw: false,
  };

  // Utils
  functionsUtil = null;
  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  closeToastMessage = (e) => {
    if (e){
      e.preventDefault();
    }
    this.setState({
      toastMessageProps:null
    });
  }

  showToastMessage = (props) => {
    this.setState({
      toastMessageProps:props
    });
  }

  processCustomParam = (props,prevProps) => {
    const params = props ? props.match.params : null;
    const prevParams = prevProps ? prevProps.match.params : null;

    // Reset params
    if ( prevParams && params && prevParams.customParam !== params.customParam && (!params || !params.customParam || params.customParam === undefined)){
      this.setState({
        customAddress:null,
        enableUnderlyingWithdraw:false
      });
    } else if (params && typeof params.customParam === 'string') {
      // Check if custom address
      if (params.customParam.toLowerCase().match(/0x[\w]{40}/) && this.state.customAddress !== params.customParam){
        this.setCustomAddress(params.customParam);
      } else if (params && params.customParam === 'withdraw' && !this.state.enableUnderlyingWithdraw){
        this.setState({
          customAddress:null,
          enableUnderlyingWithdraw:true
        });
      }
    }
  }

  clearCachedData = () => {
    this.functionsUtil.setLocalStorage('cachedData',{},true);
    this.setState({
      cachedData:{}
    });
    return true;
  }

  setCachedData = (key,data,TTL=null,useLocalStorage=false) => {

    const cachedKeyFound = this.state.cachedData[key.toLowerCase()];
    const currentTime = parseInt(new Date().getTime()/1000);

    if (!cachedKeyFound || ( (!cachedKeyFound.expirationDate || cachedKeyFound.expirationDate>=currentTime) || JSON.stringify(cachedKeyFound.data) !== JSON.stringify(data)) ){
      const expirationDate = TTL ? currentTime+(TTL) : null;

      // Save cached data in local storage
      if (useLocalStorage){
        let storedCachedData = this.functionsUtil.getStoredItem('cachedData');
        if (!storedCachedData){
          storedCachedData = {};
        }
        storedCachedData = {
          ...storedCachedData,
          [key.toLowerCase()]:{
            data,
            expirationDate
          }
        };
        // console.log('STORED CACHE - INSERT KEY',key,data);
        this.functionsUtil.setLocalStorage('cachedData',storedCachedData,true);
      }

      // Set new cached data state
      this.setState((prevState) => ({
        cachedData: {
          ...prevState.cachedData,
          [key.toLowerCase()]:{
            data,
            expirationDate
          }
        }
      }));

      return true;
    }
    return false;
  }

  setCallbackAfterLogin = (callbackAfterLogin) => {
    this.setState({
      callbackAfterLogin
    });
  }

  setCustomAddress = (customAddress) => {
    // Reset customAddress if not well formatted
    if (customAddress && !customAddress.toLowerCase().match(/0x[\w]{40}/)){
      customAddress = null;
    }

    if (customAddress !== this.state.customAddress){
      this.setState({
        customAddress,
        enableUnderlyingWithdraw:false
      });
    }
  }

  async selectTab(e, tabIndex) {
    return this.setState(state => ({...state, selectedTab: tabIndex}));
  }

  async loadAvailableTokens() {
    const newState = {};
    const availableStrategies = {};
    const requiredNetwork = globalConfigs.network.requiredNetwork;

    // Load available strategies
    Object.keys(availableTokens[requiredNetwork]).forEach((strategy) => {
      availableStrategies[strategy] = availableTokens[requiredNetwork][strategy];
    });

    newState.availableStrategies = availableStrategies;

    // Load strategy
    const selectedStrategy = this.state.selectedStrategy;
    if (selectedStrategy && this.state.availableStrategies[selectedStrategy]){
      newState.availableTokens = this.state.availableStrategies[selectedStrategy];

      // Load token
      const selectedToken = this.state.selectedToken;
      if (selectedToken && newState.availableTokens[selectedToken]){
        newState.tokenConfig = newState.availableTokens[selectedToken];
      }
    }

    // console.log('loadAvailableTokens',newState);

    await this.setState(newState);
  }

  async setStrategyToken(selectedStrategy,selectedToken){

    const callback = () => {
      this.loadAvailableTokens();
    }

    const newState = {
      tokenConfig:!selectedToken ? null : this.state.tokenConfig,
      availableTokens:!selectedToken ? null : this.state.availableTokens,
      selectedToken:!selectedToken ? selectedToken :this.state.selectedToken,
      selectedStrategy:!selectedStrategy ? selectedStrategy :this.state.selectedStrategy,
    };

    if (selectedStrategy && this.state.availableStrategies && selectedStrategy !== this.state.selectedStrategy && Object.keys(this.state.availableStrategies).includes(selectedStrategy.toLowerCase())){
      newState.selectedStrategy = selectedStrategy.toLowerCase();
    }

    if (selectedToken && selectedToken !== this.state.selectedToken) {
      if ( this.state.availableTokens && Object.keys(this.state.availableTokens).includes(selectedToken.toUpperCase()) ){
        newState.selectedToken = selectedToken.toUpperCase();
        newState.tokenConfig = this.state.availableTokens[selectedToken];
      } else if (this.state.availableStrategies && Object.keys(this.state.availableStrategies[selectedStrategy]).includes(selectedToken.toUpperCase())) {
        newState.selectedToken = selectedToken.toUpperCase();
        newState.tokenConfig = this.state.availableStrategies[selectedStrategy][newState.selectedToken];
        newState.availableTokens = this.state.availableStrategies[selectedStrategy];
      }
    }

    // console.log('setStrategyToken',newState);

    await this.setState(newState,callback);
  }

  async setStrategy(selectedStrategy) {

    const callback = () => {
      this.loadAvailableTokens();
    }

    if (selectedStrategy && selectedStrategy !== this.state.selectedStrategy && Object.keys(this.state.availableStrategies).includes(selectedStrategy.toLowerCase())){
      selectedStrategy = selectedStrategy.toLowerCase();
      await this.setState({
        selectedStrategy
      },callback);
    } else if (!selectedStrategy) {
      await this.setState({
        selectedStrategy
      },callback);
    }
  }

  async setToken(selectedToken) {

    const callback = () => {
      this.loadAvailableTokens();
    }

    if (selectedToken && selectedToken !== this.state.selectedToken && Object.keys(this.state.availableTokens).includes(selectedToken.toUpperCase())){
      selectedToken = selectedToken.toUpperCase();
      const newState = {
        selectedToken
      };
      newState.tokenConfig = this.state.availableTokens[selectedToken];
      await this.setState(newState,callback);
    } else if(!selectedToken) {
      await this.setState({
        selectedToken,
        tokenConfig:null
      },callback);
    }
  }

  async componentWillMount() {

    this.loadUtils();

    window.BNify = this.functionsUtil.BNify;

    // Suppress warnings and errors in production
    const isProduction = window.location.origin.toLowerCase().includes(globalConfigs.baseURL.toLowerCase());
    if (isProduction){
      window.console.error = () => {};
      window.console.warn = () => {};
    }

    window.jQuery = jQuery;

    if (window.localStorage){
      this.functionsUtil.removeStoredItem('context');

      // Clear all localStorage data except walletProvider and connectorName if version has changed
      const version = this.functionsUtil.getStoredItem('version',false);
      if (version !== globalConfigs.version){
        this.functionsUtil.clearStoredData(['walletProvider','connectorName']);
        this.functionsUtil.setLocalStorage('version',globalConfigs.version);
      }
    }

    window.closeIframe = (w) => {
      const iFrames = document.getElementsByTagName('iframe');
      for (let i=0;i<iFrames.length;i++){
        const iframe = iFrames[i];
        if (iframe.contentWindow === w){
          window.jQuery(iframe).parents('.iframe-container')[0].remove();
        }
      }
    }

    window.addEventListener('resize', this.handleWindowSizeChange);

    this.loadAvailableTokens();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowSizeChange);
  }

  componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    const tokenChanged = prevState.selectedToken !== this.state.selectedToken;
    const strategyChanged = prevState.selectedStrategy !== this.state.selectedStrategy;

    if (tokenChanged || strategyChanged){
      this.loadAvailableTokens();
    }
  }

  componentDidMount() {
    // Close iFrame
    if (window.self !== window.top && window.top.location.href.indexOf(globalConfigs.baseURL) !== -1 && typeof window.parent.closeIframe === 'function' ){
      window.parent.closeIframe(window.self);
    }

    window.showToastMessage = this.showToastMessage;
    window.closeToastMessage = this.closeToastMessage;

    if (localStorage){
      const connectorName = localStorage.getItem('connectorName') ? localStorage.getItem('connectorName') : 'Infura';
      const walletProvider = localStorage.getItem('walletProvider') ? localStorage.getItem('walletProvider') : 'Infura';

      this.setConnector(connectorName,walletProvider);
    }
  }

  handleWindowSizeChange = () => {
    const newState = {
      width:this.state.width,
      height:this.state.height,
    };

    const widthChanged = window.innerWidth !== this.state.width;
    const heightChanged = window.innerHeight !== this.state.height;

    if (widthChanged || heightChanged){
      if (widthChanged){
        newState.width = window.innerWidth;
      }
      if (heightChanged){
        newState.height = window.innerHeight;
      }
      return this.setState(newState);
    }

    return null;
  };

  // Optional parameters to pass into RimbleWeb3
  config = globalConfigs.network;

  showRoute(route) {
    return this.setState({ route });
  }

  closeBuyModal(e) {
    if (e){
      e.preventDefault();
    }
    return this.setState({
      buyToken:null,
      buyModalOpened:false
    });
  }

  openBuyModal(e,buyToken) {
    e.preventDefault();

    return this.setState({
      buyToken,
      buyModalOpened:true
    });
  }

  async logout(){
    this.functionsUtil.clearStoredData();
  }

  setConnector(connectorName,walletProvider){

    let connectorInfo = globalConfigs.connectors[connectorName.toLowerCase()];
    if (!connectorInfo && walletProvider){
      connectorInfo = globalConfigs.connectors[walletProvider.toLowerCase()];
    }

    if ( (connectorInfo && !connectorInfo.enabled) || (connectorName !== 'Injected' && !Object.keys(globalConfigs.connectors).includes(connectorName.toLowerCase())) || (walletProvider && !Object.keys(globalConfigs.connectors).includes(walletProvider.toLowerCase()))) {
      connectorName = 'Infura';
      walletProvider = 'Infura';
    } else if ( connectorName === 'Injected' ){
      const hasMetamask = GeneralUtil.hasMetaMask();
      const hasDapper = GeneralUtil.hasDapper()

      // Check if injected connector is valid
      switch (walletProvider){
        case 'Metamask':
          if (!hasMetamask && hasDapper){
            walletProvider = 'Dapper';
          }
        break;
        case 'Dapper':
          if (!hasDapper && hasMetamask){
            walletProvider = 'Metamask';
          }
        break;
        default:
        break;
      }
    }

    this.functionsUtil.setLocalStorage('connectorName', connectorName);
    this.functionsUtil.setLocalStorage('walletProvider', walletProvider);

    return this.setState({
      connectorName,
      walletProvider
    });
  }

  render() {
    const isMobile = this.state.width <= 768;
    const governanceEnabled = this.functionsUtil.getGlobalConfig(['governance','enabled']);

    // console.log(this.state.selectedToken,this.state.tokenConfig);

    return (
      <Router>
        <ScrollToTop />
        <ThemeProvider theme={theme}>
          <Web3Provider
            connectors={connectors}
            libraryName={'web3.js'}
            web3Api={Web3}
          >
            <Web3Consumer>
              {context => {
                return (
                  <RimbleWeb3
                    context={context}
                    isMobile={isMobile}
                    config={this.config}
                    connectors={connectors}
                    cachedData={this.state.cachedData}
                    tokenConfig={this.state.tokenConfig}
                    customAddress={this.state.customAddress}
                    selectedToken={this.state.selectedToken}
                    connectorName={this.state.connectorName}
                    walletProvider={this.state.walletProvider}
                    setConnector={this.setConnector.bind(this)}
                    availableTokens={this.state.availableTokens}
                    setCachedData={this.setCachedData.bind(this)}
                    clearCachedData={this.clearCachedData.bind(this)}
                    callbackAfterLogin={this.state.callbackAfterLogin}
                    availableStrategies={this.state.availableStrategies}
                    setCallbackAfterLogin={this.setCallbackAfterLogin.bind(this)}
                    enableUnderlyingWithdraw={this.state.enableUnderlyingWithdraw}
                  >
                    <RimbleWeb3.Consumer>
                      {({
                        web3,
                        modals,
                        network,
                        account,
                        initWeb3,
                        simpleID,
                        biconomy,
                        contracts,
                        transaction,
                        initAccount,
                        initContract,
                        transactions,
                        initSimpleID,
                        tokenDecimals,
                        accountBalance,
                        needsPreflight,
                        validateAccount,
                        rejectValidation,
                        accountValidated,
                        getTokenDecimals,
                        getAccountBalance,
                        accountBalanceLow,
                        accountInizialized,
                        accountBalanceToken,
                        userRejectedConnect,
                        initializeContracts,
                        rejectAccountConnect,
                        contractsInitialized,
                        userRejectedValidation,
                        accountValidationPending,
                        connectAndValidateAccount,
                        contractMethodSendWrapper
                      }) => {
                        return (
                        <Box>
                          <Switch>
                            <Route
                              path="/dashboard/:section?/:param1?/:param2?"
                              render={
                                (props) => <Dashboard
                                              {...props}
                                              web3={web3}
                                              theme={theme}
                                              modals={modals}
                                              network={network}
                                              context={context}
                                              account={account}
                                              isDashboard={true}
                                              initWeb3={initWeb3}
                                              biconomy={biconomy}
                                              isMobile={isMobile}
                                              simpleID={simpleID}
                                              contracts={contracts}
                                              initAccount={initAccount}
                                              initSimpleID={initSimpleID}
                                              initContract={initContract}
                                              transactions={transactions}
                                              buyToken={this.state.buyToken}
                                              logout={this.logout.bind(this)}
                                              accountBalance={accountBalance}
                                              validateAccount={validateAccount}
                                              connecting={this.state.connecting}
                                              cachedData={this.state.cachedData}
                                              setToken={this.setToken.bind(this)}
                                              accountValidated={accountValidated}
                                              getTokenDecimals={getTokenDecimals}
                                              rejectValidation={rejectValidation}
                                              tokenConfig={this.state.tokenConfig}
                                              getAccountBalance={getAccountBalance}
                                              accountBalanceLow={accountBalanceLow}
                                              accountInizialized={accountInizialized}
                                              selectedToken={this.state.selectedToken}
                                              connectorName={this.state.connectorName}
                                              setStrategy={this.setStrategy.bind(this)}
                                              userRejectedConnect={userRejectedConnect}
                                              accountBalanceToken={accountBalanceToken}
                                              initializeContracts={initializeContracts}
                                              walletProvider={this.state.walletProvider}
                                              buyModalOpened={this.state.buyModalOpened}
                                              contractsInitialized={contractsInitialized}
                                              openBuyModal={this.openBuyModal.bind(this)}
                                              rejectAccountConnect={rejectAccountConnect}
                                              handleMenuClick={this.selectTab.bind(this)}
                                              setConnector={this.setConnector.bind(this)}
                                              availableTokens={this.state.availableTokens}
                                              closeBuyModal={this.closeBuyModal.bind(this)}
                                              setCachedData={this.setCachedData.bind(this)}
                                              selectedStrategy={this.state.selectedStrategy}
                                              userRejectedValidation={userRejectedValidation}
                                              clearCachedData={this.clearCachedData.bind(this)}
                                              setStrategyToken={this.setStrategyToken.bind(this)}
                                              accountValidationPending={accountValidationPending}
                                              availableStrategies={this.state.availableStrategies}
                                              connectAndValidateAccount={connectAndValidateAccount}
                                              contractMethodSendWrapper={contractMethodSendWrapper}
                                              setCallbackAfterLogin={this.setCallbackAfterLogin.bind(this)}
                                            />
                              }
                            >
                            </Route>
                            {
                              governanceEnabled && 
                                <Route
                                  path="/governance/:section?/:item_id?"
                                  render={
                                    (props) => <Governance
                                                  {...props}
                                                  web3={web3}
                                                  theme={theme}
                                                  modals={modals}
                                                  network={network}
                                                  context={context}
                                                  account={account}
                                                  initWeb3={initWeb3}
                                                  biconomy={biconomy}
                                                  isMobile={isMobile}
                                                  simpleID={simpleID}
                                                  isGovernance={true}
                                                  contracts={contracts}
                                                  initAccount={initAccount}
                                                  initSimpleID={initSimpleID}
                                                  initContract={initContract}
                                                  transactions={transactions}
                                                  buyToken={this.state.buyToken}
                                                  logout={this.logout.bind(this)}
                                                  accountBalance={accountBalance}
                                                  validateAccount={validateAccount}
                                                  connecting={this.state.connecting}
                                                  cachedData={this.state.cachedData}
                                                  setToken={this.setToken.bind(this)}
                                                  accountValidated={accountValidated}
                                                  getTokenDecimals={getTokenDecimals}
                                                  rejectValidation={rejectValidation}
                                                  tokenConfig={this.state.tokenConfig}
                                                  getAccountBalance={getAccountBalance}
                                                  accountBalanceLow={accountBalanceLow}
                                                  accountInizialized={accountInizialized}
                                                  selectedToken={this.state.selectedToken}
                                                  connectorName={this.state.connectorName}
                                                  setStrategy={this.setStrategy.bind(this)}
                                                  userRejectedConnect={userRejectedConnect}
                                                  accountBalanceToken={accountBalanceToken}
                                                  initializeContracts={initializeContracts}
                                                  walletProvider={this.state.walletProvider}
                                                  buyModalOpened={this.state.buyModalOpened}
                                                  contractsInitialized={contractsInitialized}
                                                  openBuyModal={this.openBuyModal.bind(this)}
                                                  rejectAccountConnect={rejectAccountConnect}
                                                  handleMenuClick={this.selectTab.bind(this)}
                                                  setConnector={this.setConnector.bind(this)}
                                                  availableTokens={this.state.availableTokens}
                                                  closeBuyModal={this.closeBuyModal.bind(this)}
                                                  setCachedData={this.setCachedData.bind(this)}
                                                  selectedStrategy={this.state.selectedStrategy}
                                                  userRejectedValidation={userRejectedValidation}
                                                  clearCachedData={this.clearCachedData.bind(this)}
                                                  setStrategyToken={this.setStrategyToken.bind(this)}
                                                  accountValidationPending={accountValidationPending}
                                                  availableStrategies={this.state.availableStrategies}
                                                  connectAndValidateAccount={connectAndValidateAccount}
                                                  contractMethodSendWrapper={contractMethodSendWrapper}
                                                  setCallbackAfterLogin={this.setCallbackAfterLogin.bind(this)}
                                                />
                                  }
                                >
                                </Route>
                            }
                            <Route>
                              <Header
                                modals={modals}
                                network={network}
                                context={context}
                                account={account}
                                initWeb3={initWeb3}
                                isMobile={isMobile}
                                contracts={contracts}
                                initAccount={initAccount}
                                initContract={initContract}
                                buyToken={this.state.buyToken}
                                accountBalance={accountBalance}
                                logout={this.logout.bind(this)}
                                validateAccount={validateAccount}
                                connecting={this.state.connecting}
                                accountValidated={accountValidated}
                                getTokenDecimals={getTokenDecimals}
                                rejectValidation={rejectValidation}
                                tokenConfig={this.state.tokenConfig}
                                getAccountBalance={getAccountBalance}
                                accountBalanceLow={accountBalanceLow}
                                selectedToken={this.state.selectedToken}
                                connectorName={this.state.connectorName}
                                userRejectedConnect={userRejectedConnect}
                                accountBalanceToken={accountBalanceToken}
                                walletProvider={this.state.walletProvider}
                                buyModalOpened={this.state.buyModalOpened}
                                contractsInitialized={contractsInitialized}
                                openBuyModal={this.openBuyModal.bind(this)}
                                rejectAccountConnect={rejectAccountConnect}
                                handleMenuClick={this.selectTab.bind(this)}
                                setConnector={this.setConnector.bind(this)}
                                availableTokens={this.state.availableTokens}
                                closeBuyModal={this.closeBuyModal.bind(this)}
                                userRejectedValidation={userRejectedValidation}
                                accountValidationPending={accountValidationPending}
                                connectAndValidateAccount={connectAndValidateAccount}
                                setToken={ e => { this.setToken(e) } }
                              />

                              {this.state.route === "onboarding" ? (
                                <Web3Debugger
                                  web3={web3}
                                  account={account}
                                  accountBalance={accountBalance}
                                  accountBalanceToken={accountBalanceToken}
                                  accountBalanceLow={accountBalanceLow}
                                  initAccount={initAccount}
                                  rejectAccountConnect={rejectAccountConnect}
                                  userRejectedConnect={userRejectedConnect}
                                  accountValidated={accountValidated}
                                  accountValidationPending={accountValidationPending}
                                  rejectValidation={rejectValidation}
                                  userRejectedValidation={userRejectedValidation}
                                  validateAccount={validateAccount}
                                  connectAndValidateAccount={connectAndValidateAccount}
                                  modals={modals}
                                  network={network}
                                  transaction={transaction}
                                />
                              ) : null}

                              {this.state.route === "default" ? (
                                <Switch>
                                  <Route exact path="/"
                                    render={ (props) =>
                                      <>
                                        <Landing
                                          {...props}
                                          web3={web3}
                                          theme={theme}
                                          network={network}
                                          account={account}
                                          isMobile={isMobile}
                                          simpleID={simpleID}
                                          contracts={contracts}
                                          innerWidth={this.state.width}
                                          logout={this.logout.bind(this)}
                                          innerHeight={this.state.height}
                                          accountBalance={accountBalance}
                                          connecting={this.state.connecting}
                                          selectedTab={this.state.selectedTab}
                                          tokenConfig={this.state.tokenConfig}
                                          accountBalanceLow={accountBalanceLow}
                                          getAccountBalance={getAccountBalance}
                                          customAddress={this.state.customAddress}
                                          selectedToken={this.state.selectedToken}
                                          accountBalanceToken={accountBalanceToken}
                                          closeToastMessage={this.closeToastMessage}
                                          contractsInitialized={contractsInitialized}
                                          openBuyModal={this.openBuyModal.bind(this)}
                                          processCustomParam={this.processCustomParam}
                                          availableTokens={this.state.availableTokens}
                                          updateSelectedTab={this.selectTab.bind(this)}
                                          toastMessageProps={this.state.toastMessageProps}
                                          availableStrategies={this.state.availableStrategies}
                                          connectAndValidateAccount={connectAndValidateAccount}
                                          setToken={ e => { this.setToken(e) } }
                                        />
                                        <CookieConsent
                                          expires={365}
                                          buttonText={"Ok"}
                                          location={"bottom"}
                                          acceptOnScroll={true}
                                          cookieName={"cookieAccepted"}
                                          acceptOnScrollPercentage={5}
                                          style={{background: "rgba(255,255,255,0.95)",zIndex:'9999999'}}
                                          buttonStyle={{display: isMobile ? "block" : "none", backgroundColor:'#0036ff', color: 'white', marginTop: isMobile ? "0px" : "15px"}}
                                        >
                                          <Flex flexDirection={'row'} alignItems={['flex-start','center']} justifyContent={'flex-start'} maxHeight={['150px','initial']} style={ isMobile ? {overflowY:'scroll'} : null }>
                                            <Image display={['none','block']} src={'images/cookie.svg'} width={'42px'} height={'42px'} />
                                            <Text pl={[0,3]} color={'dark-gray'} fontSize={1} textAlign={'justify'}>
                                              This website or its third-party tools process personal data (e.g. browsing data or IP addresses) and use cookies or other identifiers, which are necessary for its functioning and required to achieve the purposes illustrated in the cookie policy. To learn more, please refer to the <Link href={'https://www.iubenda.com/privacy-policy/61211749/cookie-policy'} target={'_blank'} rel="nofollow noopener noreferrer" hoverColor={'blue'}>cookie policy</Link>.
                                              You accept the use of cookies or other identifiers by closing or dismissing this notice, by scrolling this page, by clicking a link or button or by continuing to browse otherwise.
                                            </Text>
                                          </Flex>
                                        </CookieConsent>
                                      </>
                                    }
                                  ></Route>
                                  <Route exact path="/terms-of-service">
                                    <Tos />
                                  </Route>
                                  <Route>
                                    <PageNotFound />
                                  </Route>
                                </Switch>
                              ) : null}
                            </Route>
                          </Switch>
                          <TransactionToastUtil transactions={transactions} />
                        </Box>
                      )}}
                    </RimbleWeb3.Consumer>
                  </RimbleWeb3>
                );
              }}
            </Web3Consumer>
          </Web3Provider>
        </ThemeProvider>
      </Router>
    );
  }
}

export default App;
