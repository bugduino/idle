import React, { Component } from 'react';
// import styles from './LandingForm.module.scss';
import { Box } from "rimble-ui";

import RimbleWeb3 from "../utilities/RimbleWeb3";
import TransactionToastUtil from "../utilities/TransactionToastUtil";

import SmartContractControls from "../SmartContractControls/SmartContractControls";

class LandingForm extends Component {
  render() {
    return (
      <RimbleWeb3.Consumer>
        {({
          contracts,
          account,
          transactions,
          initContract,
          initAccount,
          initWeb3,
          getAccountBalance,
          contractMethodSendWrapper,
          web3,
          network
        }) => (
          <Box width={'100%'} mx={"auto"}>
            <SmartContractControls
              web3={web3}
              selectedToken={this.props.selectedToken}
              tokenConfig={this.props.tokenConfig}
              setSelectedToken={this.props.setSelectedToken}
              accountBalanceToken={this.props.accountBalanceToken}
              isMobile={this.props.isMobile}
              updateSelectedTab={this.props.updateSelectedTab}
              selectedTab={this.props.selectedTab}
              network={network}
              contracts={contracts}
              account={account}
              transactions={transactions}
              initContract={initContract}
              initWeb3={initWeb3}
              getAccountBalance={getAccountBalance}
              contractMethodSendWrapper={contractMethodSendWrapper}
            />
            <TransactionToastUtil transactions={transactions} />
          </Box>
        )}
      </RimbleWeb3.Consumer>
    );
  }
}

export default LandingForm;
