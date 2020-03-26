import Web3 from "web3";
import {
  HashRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import jQuery from 'jquery';
import theme from "../theme";
import Tos from "../Tos/Tos";
import Stats from '../Stats/Stats';
import connectors from './connectors';
import Web3Provider from 'web3-react';
import React, { Component } from "react";
import Landing from "../Landing/Landing";
import { Web3Consumer } from 'web3-react';
import Dashboard from '../Dashboard/Dashboard';
import CookieConsent from "react-cookie-consent";
import RimbleWeb3 from "../utilities/RimbleWeb3";
import GeneralUtil from "../utilities/GeneralUtil";
import Header from "../utilities/components/Header";
import globalConfigs from '../configs/globalConfigs';
import ScrollToTop from "../ScrollToTop/ScrollToTop";
import PageNotFound from "../PageNotFound/PageNotFound";
import Web3Debugger from "../Web3Debugger/Web3Debugger";
import availableTokens from '../configs/availableTokens';
import { ThemeProvider, Box, Text, Link, Image, Flex } from 'rimble-ui';

class App extends Component {
  state = {
    buyToken: null,
    selectedTab: '1',
    connecting:false,
    route: "default", // or 'onboarding'
    connectorName:null,
    tokenConfig: null,
    genericError: null,
    customAddress:null,
    walletProvider:null,
    selectedToken: null,
    availableTokens:null,
    buyModalOpened: false,
    toastMessageProps:null,
    callbackAfterLogin:null,
    width: window.innerWidth,
    unsubscribeFromHistory:null,
    enableUnderlyingWithdraw:false
  };

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

  async componentWillMount() {

    window.jQuery = jQuery;

    if (localStorage){
      localStorage.removeItem('context');

      const version = localStorage.getItem('version');
      if (version !== globalConfigs.version){
        localStorage.removeItem('transactions');
        localStorage.removeItem('cachedRequests');
        localStorage.setItem('version',globalConfigs.version);
      }

    }

    const requiredNetwork = globalConfigs.network.requiredNetwork;
    const availableTokensNetwork = {};

    Object.keys(availableTokens[requiredNetwork]).forEach((token) => {
      const tokenInfo = availableTokens[requiredNetwork][token];
      if (tokenInfo.enabled){
        availableTokensNetwork[token] = tokenInfo;
      }
    });

    await this.setState({ availableTokens: availableTokensNetwork });

    let selectedToken = this.state.selectedToken;
    if (!selectedToken){
      selectedToken = localStorage ? localStorage.getItem('selectedToken') : null;

      // Check if the stored token
      if (selectedToken && availableTokens[selectedToken] && !availableTokens[selectedToken].enabled){
        selectedToken = null;
        localStorage.removeItem('selectedToken');
      }

      if (!selectedToken){
        selectedToken = Object.keys(this.state.availableTokens)[0];
      }
    }
    this.setSelectedToken(selectedToken);

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
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowSizeChange);
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
    if (window.innerWidth !== this.state.width){
      return this.setState({ width: window.innerWidth });
    }
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

    if (localStorage){
      localStorage.setItem('connectorName', connectorName);
      localStorage.setItem('walletProvider', walletProvider);
    }
    return this.setState({
      connectorName,
      walletProvider
    });
  }

  setSelectedToken(selectedToken){
    if (Object.keys(this.state.availableTokens).indexOf(selectedToken) !== -1){
      const tokenConfig = this.state.availableTokens[selectedToken];
      if (selectedToken !== this.state.selectedToken || tokenConfig !== this.state.tokenConfig){
        if (localStorage){
          localStorage.setItem('selectedToken',selectedToken);
        }

        return this.setState({
          tokenConfig,
          selectedToken
        });
      }
    }
  }

  render() {
    const isMobile = this.state.width <= 768;

    if (!this.state.tokenConfig || !this.state.selectedToken){
      return false;
    }

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
                    tokenConfig={this.state.tokenConfig}
                    customAddress={this.state.customAddress}
                    selectedToken={this.state.selectedToken}
                    connectorName={this.state.connectorName}
                    walletProvider={this.state.walletProvider}
                    setConnector={this.setConnector.bind(this)}
                    callbackAfterLogin={this.state.callbackAfterLogin}
                    setCallbackAfterLogin={this.setCallbackAfterLogin.bind(this)}
                    enableUnderlyingWithdraw={this.state.enableUnderlyingWithdraw}
                  >
                    <RimbleWeb3.Consumer>
                      {({
                        web3,
                        modals,
                        network,
                        initWeb3,
                        transaction,
                        needsPreflight,
                        simpleID,
                        initSimpleID,
                        account,
                        contracts,
                        getAccountBalance,
                        getTokenDecimals,
                        accountBalance,
                        accountBalanceToken,
                        accountBalanceLow,
                        initAccount,
                        initContract,
                        tokenDecimals,
                        rejectAccountConnect,
                        contractsInitialized,
                        userRejectedConnect,
                        accountValidated,
                        accountValidationPending,
                        rejectValidation,
                        userRejectedValidation,
                        validateAccount,
                        connectAndValidateAccount
                      }) => {
                        return (
                        <Box>
                          <Switch>
                            <Route
                              path="/stats/:customToken?"
                              render={(props) => <Stats {...props}
                                                    web3={web3}
                                                    initWeb3={initWeb3}
                                                    isMobile={isMobile}
                                                    contracts={contracts}
                                                    tokenConfig={this.state.tokenConfig}
                                                    selectedToken={this.state.selectedToken}
                                                    contractsInitialized={contractsInitialized}
                                                    availableTokens={this.state.availableTokens}
                                                    setSelectedToken={ e => { this.setSelectedToken(e) } }
                                                  />}
                            >
                            </Route>
                            <Route
                              path="/dashboard/:strategy?/:asset?"
                              render={(props) => <Dashboard
                                                    {...props}
                                                    web3={web3}
                                                    account={account}
                                                    initWeb3={initWeb3}
                                                    isMobile={isMobile}
                                                    contracts={contracts}
                                                    tokenConfig={this.state.tokenConfig}
                                                    selectedToken={this.state.selectedToken}
                                                    contractsInitialized={contractsInitialized}
                                                    availableTokens={this.state.availableTokens}
                                                    connectAndValidateAccount={connectAndValidateAccount}
                                                    setSelectedToken={ e => { this.setSelectedToken(e) } }
                                                />
                                              }
                            >
                            </Route>
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
                                setSelectedToken={ e => { this.setSelectedToken(e) } }
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
                                  <Route path="/:customParam?"
                                    render={ (props) =>
                                      <>
                                        <Landing
                                          {...props}
                                          web3={web3}
                                          account={account}
                                          isMobile={isMobile}
                                          simpleID={simpleID}
                                          contracts={contracts}
                                          innerWidth={this.state.width}
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
                                          connectAndValidateAccount={connectAndValidateAccount}
                                          setSelectedToken={ e => { this.setSelectedToken(e) } }
                                          network={network} />

                                        <CookieConsent
                                          acceptOnScroll={true}
                                          acceptOnScrollPercentage={5}
                                          location="bottom"
                                          buttonText="Ok"
                                          cookieName="cookieAccepted"
                                          style={{background: "rgba(255,255,255,0.95)",zIndex:'9999999', marginBottom: isMobile ? "0px" : "15px"}}
                                          buttonStyle={{display: isMobile ? "block" : "none", backgroundColor:'#0036ff', color: 'white', marginTop: isMobile ? "0px" : "15px"}}
                                          expires={365}
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
                                  <Route path="/terms-of-service">
                                    <Tos />
                                  </Route>
                                  <Route>
                                    <PageNotFound />
                                  </Route>
                                </Switch>
                              ) : null}
                            </Route>
                          </Switch>
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
