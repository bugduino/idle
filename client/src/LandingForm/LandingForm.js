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
          initSimpleID,
          accountBalance,
          getAccountBalance,
          accountBalanceToken,
          contractMethodSendWrapper,
          web3,
          simpleID,
          network
        }) => (
          <Box width={'100%'} mx={"auto"}>
            <SmartContractControls
              web3={web3}
              network={network}
              account={account}
              initWeb3={initWeb3}
              simpleID={simpleID}
              contracts={contracts}
              initSimpleID={initSimpleID}
              transactions={transactions}
              initContract={initContract}
              isMobile={this.props.isMobile}
              accountBalance={accountBalance}
              connecting={this.props.connecting}
              tokenConfig={this.props.tokenConfig}
              selectedTab={this.props.selectedTab}
              getAccountBalance={getAccountBalance}
              mintCallback={this.props.mintCallback}
              openBuyModal={this.props.openBuyModal}
              selectedToken={this.props.selectedToken}
              getAllocations={this.props.getAllocations}
              setSelectedToken={this.props.setSelectedToken}
              updateSelectedTab={this.props.updateSelectedTab}
              accountBalanceToken={this.props.accountBalanceToken}
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
