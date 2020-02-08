import React, { Component } from "react";
import Web3 from "web3"; // uses latest 1.x.x version
import Web3Provider from 'web3-react';
import { Web3Consumer } from 'web3-react'
import connectors from './connectors';
import jQuery from 'jquery';

import {
  HashRouter as Router,
  Switch,
  Route
  // useParams
} from "react-router-dom";

import theme from "../theme";
import Tos from "../Tos/Tos";
import Stats from '../Stats/Stats';
import Landing from "../Landing/Landing";
import CookieConsent from "react-cookie-consent";
import RimbleWeb3 from "../utilities/RimbleWeb3";
import Header from "../utilities/components/Header";
import globalConfigs from '../configs/globalConfigs';
import ScrollToTop from "../ScrollToTop/ScrollToTop";
import PageNotFound from "../PageNotFound/PageNotFound";
import Web3Debugger from "../Web3Debugger/Web3Debugger";
import availableTokens from '../configs/availableTokens';
import { ThemeProvider, Box, Text, Link, Image, Flex } from 'rimble-ui';

class App extends Component {
  state = {
    availableTokens:null,
    selectedToken: null,
    tokenConfig: null,
    genericError: null,
    width: window.innerWidth,
    route: "default", // or 'onboarding'
    unsubscribeFromHistory:null,
    selectedTab: '1',
    buyToken: null,
    buyModalOpened: false,
    connectorName:null,
    walletProvider:null,
    connecting:false,
    toastMessageProps:null
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

  async selectTab(e, tabIndex) {
    return this.setState(state => ({...state, selectedTab: tabIndex}));
  }

  async componentWillMount() {

    window.jQuery = jQuery;

    if (localStorage){
      localStorage.removeItem('context');
    }

    const requiredNetwork = globalConfigs.network.requiredNetwork;
    const availableTokensNetwork = availableTokens[requiredNetwork];

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
    return this.setState({
      // connecting:connectorName !== 'Infura',
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
                    connectors={connectors}
                    config={this.config}
                    context={context}
                    tokenConfig={this.state.tokenConfig}
                    selectedToken={this.state.selectedToken}
                    setConnector={this.setConnector.bind(this)}
                    isMobile={isMobile}
                  >
                    <RimbleWeb3.Consumer>
                      {({
                        needsPreflight,
                        web3,
                        initWeb3,
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
                        rejectAccountConnect,
                        userRejectedConnect,
                        accountValidated,
                        accountValidationPending,
                        rejectValidation,
                        userRejectedValidation,
                        validateAccount,
                        connectAndValidateAccount,
                        modals,
                        network,
                        transaction
                      }) => {
                        return (
                        <Box>
                          <Switch>
                            <Route exact path="/stats">
                              <Stats selectedToken={this.state.selectedToken} tokenConfig={this.state.tokenConfig} />
                            </Route>
                            <Route>
                              <Header
                                context={context}
                                account={account}
                                initWeb3={initWeb3}
                                initContract={initContract}
                                contracts={contracts}
                                isMobile={isMobile}
                                connecting={this.state.connecting}
                                walletProvider={this.state.walletProvider}
                                connectorName={this.state.connectorName}
                                buyModalOpened={this.state.buyModalOpened}
                                openBuyModal={this.openBuyModal.bind(this)}
                                buyToken={this.state.buyToken}
                                getAccountBalance={getAccountBalance}
                                getTokenDecimals={getTokenDecimals}
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
                                closeBuyModal={this.closeBuyModal.bind(this)}
                                handleMenuClick={this.selectTab.bind(this)}
                                availableTokens={this.state.availableTokens}
                                tokenConfig={this.state.tokenConfig}
                                selectedToken={this.state.selectedToken}
                                setSelectedToken={ e => { this.setSelectedToken(e) } }
                                setConnector={this.setConnector.bind(this)}
                                modals={modals}
                                network={network}
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
                                  <Route exact path="/">
                                    <Landing
                                      web3={web3}
                                      account={account}
                                      isMobile={isMobile}
                                      simpleID={simpleID}
                                      contracts={contracts}
                                      accountBalance={accountBalance}
                                      connecting={this.state.connecting}
                                      selectedTab={this.state.selectedTab}
                                      tokenConfig={this.state.tokenConfig}
                                      accountBalanceLow={accountBalanceLow}
                                      getAccountBalance={getAccountBalance}
                                      selectedToken={this.state.selectedToken}
                                      accountBalanceToken={accountBalanceToken}
                                      closeToastMessage={this.closeToastMessage}
                                      openBuyModal={this.openBuyModal.bind(this)}
                                      availableTokens={this.state.availableTokens}
                                      updateSelectedTab={this.selectTab.bind(this)}
                                      toastMessageProps={this.state.toastMessageProps}
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
                                            This website or its third-party tools process personal data (e.g. browsing data or IP addresses) and use cookies or other identifiers, which are necessary for its functioning and required to achieve the purposes illustrated in the cookie policy. To learn more, please refer to the <Link href={'https://www.iubenda.com/privacy-policy/61211749/cookie-policy'} target={'_blank'} hoverColor={'blue'}>cookie policy</Link>.
                                            You accept the use of cookies or other identifiers by closing or dismissing this notice, by scrolling this page, by clicking a link or button or by continuing to browse otherwise.
                                          </Text>
                                        </Flex>
                                      </CookieConsent>
                                  </Route>
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
