import React from "react";
import FunctionsUtil from '../FunctionsUtil';
import { Box, Flex, Image, Link } from "rimble-ui";
import ConnectionErrorModal from './ConnectionErrorModal';

import {
  Link as RouterLink
} from "react-router-dom";

class Header extends React.Component {
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

  toggleModal = (modalName) => {
    this.setState(state => ({...state, isModalOpen: (state.isModalOpen===modalName ? null : modalName) }));
  }

  closeBuyModal = (e) => {
    if (e){
      e.preventDefault();
    }
    this.toggleModal('buy');
    this.props.closeBuyModal(e);
  }

  async componentWillMount() {
    this.loadUtils();
  }

  async componentDidMount() {

    this.loadUtils();
  }

  async componentDidUpdate(prevProps, prevState) {

    this.loadUtils();

    if (typeof this.props.modals.data.connectionError === 'string' && this.props.modals.data.connectionError.length>0){
      if (this.state.isModalOpen !== 'error'){
        this.setState({
          isModalOpen:'error'
        });
      }
    } else if (this.state.isModalOpen === 'error'){
      this.toggleModal('error');
    }

    if (this.props.network && !this.props.network.isCorrectNetwork){
      return false;
    }
  }

  render() {
    return (
      <Box style={{
        'position': 'absolute',
        'left': '0',
        'right': '0',
        'zIndex': 99
        }}
      >
        <Flex
          pt={[3,4]}
          ml={['1%',0]}
          bg={"transparent"}
          width={['98%','100%']}
          alignItems={['center','flex-start']}
        >
          <Flex ml={[3, 5]} width={[1, 3/12]}>
            <RouterLink to="/">
              <Image src="images/logo.svg"
                height={['35px','48px']}
                position={'relative'} />
            </RouterLink>
          </Flex>
          <Flex
            width={[1,8/12]}
            alignItems={"center"}
            flexDirection={'row'}
            justifyContent={"flex-end"}
          >
            <Link
              href={'/#contacts'}
              textAlign={['center','left']}
              fontFamily={'sansSerif'}
              fontSize={3}
              color={'white'}
              hoverColor={'white'}
            >Contact Us</Link>
            <Link
              ml={3}
              href={'/#faq'}
              textAlign={['center','left']}
              fontFamily={'sansSerif'}
              fontSize={3}
              color={'white'}
              hoverColor={'white'}
            >FAQs</Link>
          </Flex>
        </Flex>
        <ConnectionErrorModal
          modals={this.props.modals}
          context={this.props.context}
          setConnector={this.props.setConnector}
          isOpen={this.state.isModalOpen==='error'}
        >
        </ConnectionErrorModal>
        {
          /*
        }
        <BuyModal
          account={this.props.account}
          tokenConfig={this.props.tokenConfig}
          walletProvider={this.props.walletProvider}
          connectorName={this.props.connectorName}
          getAccountBalance={this.props.getAccountBalance}
          getTokenDecimals={this.props.getTokenDecimals}
          selectedToken={this.props.selectedToken}
          accountBalance={this.props.accountBalance}
          accountBalanceToken={this.props.accountBalanceToken}
          buyToken={this.props.buyToken}
          idleTokenBalance={this.state.idleTokenBalance}
          isOpen={this.props.buyModalOpened}
          isMobile={this.props.isMobile}
          closeModal={ e => this.closeBuyModal(e) }
          network={this.props.network.current} />
        <AccountModal
          context={this.props.context}
          account={this.props.account}
          selectedToken={this.props.selectedToken}
          accountBalance={this.props.accountBalance}
          accountBalanceToken={this.props.accountBalanceToken}
          idleTokenBalance={this.state.idleTokenBalance}
          isOpen={this.state.isModalOpen==='account'}
          isMobile={this.props.isMobile}
          setConnector={this.props.setConnector}
          closeModal={e => this.toggleModal('account') }
          network={this.props.network.current} />
        */
        }
      </Box>
    );
  }
}

export default Header;
