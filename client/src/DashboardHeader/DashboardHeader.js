import { Flex } from "rimble-ui";
import React, { Component } from 'react';
import styles from './DashboardHeader.module.scss';
import ButtonLoader from '../ButtonLoader/ButtonLoader';
import DashboardCard from '../DashboardCard/DashboardCard';
import AccountModal from "../utilities/components/AccountModal";
import AccountOverview from "../utilities/components/AccountOverview";

class DashboardHeader extends Component {

  state = {
    idleTokenBalance: null,
    isModalOpen: null,
  }

  toggleModal = (modalName) => {
    this.setState(state => ({...state, isModalOpen: (state.isModalOpen===modalName ? null : modalName) }));
  }

  render() {
    const buttonSize = this.props.isMobile ? 'small' : 'medium';
    return (
      <DashboardCard>
        <Flex
          p={2}
          width={1}
        >
          {
            this.props.account ? (
              <AccountOverview
                account={this.props.account}
                hasQRCode={false}
                isMobile={this.props.isMobile}
                selectedToken={this.props.selectedToken}
                accountBalance={this.props.accountBalance}
                toggleModal={e => this.toggleModal('account') }
                accountBalanceLow={this.props.accountBalanceLow}
                accountBalanceToken={this.props.accountBalanceToken}
              />
            ) : (
              <ButtonLoader
                buttonText={'CONNECT'}
                isLoading={false}
                handleClick={this.props.connectAndValidateAccount}
                buttonProps={{className:styles.gradientButton,borderRadius:'2rem',my:8,ml:16,minWidth:['95px','145px'],size:buttonSize}}
              >
              </ButtonLoader>
            )
          }
          <AccountModal
            context={this.props.context}
            account={this.props.account}
            isMobile={this.props.isMobile}
            network={this.props.network.current}
            setConnector={this.props.setConnector}
            selectedToken={this.props.selectedToken}
            accountBalance={this.props.accountBalance}
            isOpen={this.state.isModalOpen==='account'}
            closeModal={e => this.toggleModal('account') }
            idleTokenBalance={this.state.idleTokenBalance}
            accountBalanceToken={this.props.accountBalanceToken}
          />
        </Flex>
      </DashboardCard>
    );
  }
}

export default DashboardHeader;
