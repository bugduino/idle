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
          web3,
          network,
          account,
          initWeb3,
          simpleID,
          contracts,
          initAccount,
          initContract,
          transactions,
          initSimpleID,
          tokenDecimals,
          accountBalance,
          getAccountBalance,
          accountBalanceToken,
          contractsInitialized,
          enableUnderlyingWithdraw,
          contractMethodSendWrapper
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
              getAprs={this.props.getAprs}
              tokenDecimals={tokenDecimals}
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
              contractsInitialized={contractsInitialized}
              setSelectedToken={this.props.setSelectedToken}
              updateSelectedTab={this.props.updateSelectedTab}
              enableUnderlyingWithdraw={enableUnderlyingWithdraw}
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
