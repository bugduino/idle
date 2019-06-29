import React, { Component } from "react";
import Web3 from "web3"; // uses latest 1.x.x version
import Web3Provider from 'web3-react';
import { Web3Consumer } from 'web3-react'
import connectors from './connectors';

import theme from "../theme";
// import styles from './App.module.scss';

import { ToastMessage, ThemeProvider, Box } from 'rimble-ui';
import RimbleWeb3 from "../utilities/RimbleWeb3";
import Header from "../utilities/components/Header";
import Landing from "../Landing/Landing";
import Web3Debugger from "../Web3Debugger/Web3Debugger";

class App extends Component {
  state = {
    genericError: null,
    width: window.innerWidth,
    route: "default" // or 'onboarding'
  };

  componentWillMount() {
    window.addEventListener('resize', this.handleWindowSizeChange);
  }
  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowSizeChange);
  }
  handleWindowSizeChange = () => {
    this.setState({ width: window.innerWidth });
  };

  // Optional parameters to pass into RimbleWeb3
  config = {
    requiredConfirmations: 1, // in ETH for gas fees
    accountBalanceMinimum: 0.0001, // in ETH for gas fees
    requiredNetwork: 4 // Rinkeby
  };

  showRoute(route) {
    this.setState({ route });
  };

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
                <RimbleWeb3 config={this.config} context={context}>

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
