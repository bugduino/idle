import React, { Component } from "react";
import Web3 from "web3"; // uses latest 1.x.x version
import Web3Provider from 'web3-react';
import { Web3Consumer } from 'web3-react'
import connectors from './connectors';

import theme from "../theme";
// import styles from './App.module.scss';

import { ThemeProvider, Box } from 'rimble-ui';
import RimbleWeb3 from "../utilities/RimbleWeb3";
import Header from "../utilities/components/Header";
import Landing from "../Landing/Landing";
import Web3Debugger from "../Web3Debugger/Web3Debugger";
import availableTokens from '../tokens.js';

class App extends Component {
  state = {
    selectedToken: null,
    tokenConfig: null,
    genericError: null,
    width: window.innerWidth,
    route: "default", // or 'onboarding'
    selectedTab: '1',
  };

  async selectTab(e, tabIndex) {
    this.setState(state => ({...state, selectedTab: tabIndex}));
  }

  componentWillMount() {
    let selectedToken = this.state.selectedToken;
    if (!selectedToken){
      selectedToken = localStorage ? localStorage.getItem('selectedToken') : null;
      if (!selectedToken){
        selectedToken = Object.keys(availableTokens)[0];
      }
    }
    this.setSelectedToken(selectedToken);

    window.addEventListener('resize', this.handleWindowSizeChange);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowSizeChange);
  }
  handleWindowSizeChange = () => {
    if (window.innerWidth !== this.state.width){
      this.setState({ width: window.innerWidth });
    }
  };

  // Optional parameters to pass into RimbleWeb3
  config = {
    requiredConfirmations: 1,
    accountBalanceMinimum: 0, // in ETH for gas fees
    requiredNetwork: 1 // Mainnet
    // requiredNetwork: 3 // Ropsten
  };

  showRoute(route) {
    this.setState({ route });
  };

  setSelectedToken(selectedToken){
    // console.log('setSelectedToken',selectedToken);
    if (Object.keys(availableTokens).indexOf(selectedToken) !== -1){
      const tokenConfig = availableTokens[selectedToken];
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

    return (
      <ThemeProvider theme={theme}>
        <Web3Provider
          connectors={connectors}
          libraryName={'web3.js'}
          web3Api={Web3}
        >
          <Web3Consumer>
            {context => {
              return (
                <RimbleWeb3 config={this.config} context={context} tokenConfig={this.state.tokenConfig} selectedToken={this.state.selectedToken}>
                  <RimbleWeb3.Consumer>
                    {({
                      needsPreflight,
                      web3,
                      initWeb3,
                      account,
                      contracts,
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
                        <Header
                          account={account}
                          initWeb3={initWeb3}
                          initContract={initContract}
                          contracts={contracts}
                          isMobile={isMobile}
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
                          handleMenuClick={this.selectTab.bind(this)}
                          availableTokens={availableTokens}
                          tokenConfig={this.state.tokenConfig}
                          selectedToken={this.state.selectedToken}
                          setSelectedToken={ e => { this.setSelectedToken(e) } }
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
                          <Landing
                            web3={web3}
                            contracts={contracts}
                            isMobile={isMobile}
                            account={account}
                            accountBalance={accountBalance}
                            accountBalanceToken={accountBalanceToken}
                            accountBalanceLow={accountBalanceLow}
                            updateSelectedTab={this.selectTab.bind(this)}
                            selectedTab={this.state.selectedTab}
                            selectedToken={this.state.selectedToken}
                            availableTokens={availableTokens}
                            tokenConfig={this.state.tokenConfig}
                            setSelectedToken={ e => { this.setSelectedToken(e) } }
                            network={network} />
                        ) : null}
                      </Box>
                    )}}
                  </RimbleWeb3.Consumer>
                </RimbleWeb3>
              );
            }}
          </Web3Consumer>
        </Web3Provider>
      </ThemeProvider>
    );
  }
}

export default App;
