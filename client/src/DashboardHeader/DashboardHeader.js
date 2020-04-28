import theme from '../theme';
import React, { Component } from 'react';
// import styles from './DashboardHeader.module.scss';
import { Flex, Text, Icon, Link } from "rimble-ui";
import FunctionsUtil from '../utilities/FunctionsUtil';
// import ButtonLoader from '../ButtonLoader/ButtonLoader';
// import DashboardCard from '../DashboardCard/DashboardCard';
import AccountModal from "../utilities/components/AccountModal";
import AccountOverview from "../utilities/components/AccountOverview";

class DashboardHeader extends Component {

  state = {
    idleTokenBalance: null,
    isModalOpen: null,
  }

  // Utils
  functionsUtil = null;

  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  async componentWillMount(){
    this.loadUtils();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
  }

  toggleModal = (modalName) => {
    this.setState(state => ({...state, isModalOpen: (state.isModalOpen===modalName ? null : modalName) }));
  }

  setConnector = async (connectorName) => {
    // Send Google Analytics event
    this.functionsUtil.sendGoogleAnalyticsEvent({
      eventCategory: 'Connect',
      eventAction: 'logout'
    });

    if (typeof this.props.setConnector === 'function'){
      this.props.setConnector(connectorName);
    }

    return await this.props.context.setConnector(connectorName);
  }

  async logout(){
    await this.setConnector('Infura');
  }

  render() {
    // const buttonSize = this.props.isMobile ? 'small' : 'medium';
    return (
      <Flex
        alignItems={'center'}
        justifyContent={'space-between'}
        borderBottom={`1px solid ${theme.colors.divider}`}
      >
        <Flex
          py={1}
          px={3}
          width={1}
          alignItems={'center'}
          flexDirection={'row'}
          justifyContent={'space-between'}
        >
          {
            this.props.account ? (
              <>
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
                <Link
                  pr={2}
                  display={'flex'}
                  onClick={ (e) => { this.logout() } }
                  style={{alignItems:'center',justifyContent:'space-between'}}
                >
                  <Icon
                    mr={2}
                    size={'1.8em'}
                    name={'ExitToApp'}
                    color={'copyColor'}
                  />
                  <Text
                    fontSize={2}
                    fontWeight={3}
                    color={'copyColor'}
                  >
                    Logout
                  </Text>
                </Link>
              </>
            ) : (
              <Link
                pr={2}
                display={'flex'}
                onClick={this.props.connectAndValidateAccount}
                style={{alignItems:'center',justifyContent:'space-between',height:'55px'}}
              >
                <Icon
                  mr={2}
                  size={'1.8em'}
                  name={'Input'}
                  color={'copyColor'}
                />
                <Text
                  fontSize={2}
                  fontWeight={3}
                  color={'copyColor'}
                >
                  Connect Wallet
                </Text>
              </Link>
            )
          }
        </Flex>
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
    );
  }
}

export default DashboardHeader;
