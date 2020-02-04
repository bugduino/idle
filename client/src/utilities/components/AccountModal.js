import React from "react";
import {
  Heading,
  Text,
  Modal,
  Box,
  Flex,
  Image,
  EthAddress
} from "rimble-ui";
import ButtonLoader from '../../ButtonLoader/ButtonLoader.js';
import ModalCard from './ModalCard';
import styles from '../../CryptoInput/CryptoInput.module.scss';
import FunctionsUtil from '../../utilities/FunctionsUtil';

class AccountModal extends React.Component {

  state = {
    logout: false,
    balances: []
  }

  loadBalances(){
    const balances = [
      {
        'icon':'images/tokens/ETH.svg',
        'amount':this.props.accountBalance
      },
      {
        'icon':'images/tokens/'+this.props.selectedToken+'.svg',
        'amount':this.props.accountBalanceToken
      },
      {
        'icon':`images/tokens/idle${this.props.selectedToken}.png`,
        'amount':this.props.idleTokenBalance
      }
    ];

    this.setState({balances});
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

  componentWillMount() {
    this.loadUtils();
  }

  componentDidMount() {
    this.loadUtils();
    this.loadBalances();
  }

  componentDidUpdate(prevProps) {
    this.loadUtils();
    if (prevProps !== this.props){
      this.loadBalances();
    }
  }

  setConnector = async connectorName => {
    if (localStorage) {
      localStorage.setItem('walletProvider', '');
      localStorage.setItem('connectorName', connectorName);
    }

    // Send Google Analytics event
    this.functionsUtil.sendGoogleAnalyticsEvent({
      eventCategory: 'Connect',
      eventAction: 'logout'
    });

    this.setState({
      logout:true
    });

    if (typeof this.props.setConnector === 'function'){
      this.props.setConnector(connectorName);
    }
    return await this.props.context.setConnector(connectorName);
  }

  render(){
    if (this.props.account){
      const renderBalances = this.state.balances.map( (balance,i) => {
        return (
          <Flex
            key={'balance_'+i}
            width={['100%','auto']}
            maxWidth={['90%','14em']}
            borderRadius={'2rem'}
            alignItems={'center'}
            boxShadow={0}
            p={1}
            my={[1,2]}
            mx={'auto'}
            >
              <Flex justifyContent={['flex-end','flex-start']} width={[2/5,2/10]}>
                <Image src={balance.icon} height={'32px'} ml={['0.5em','10px']} />
              </Flex>
              <Box width={[3/5,8/10]} pl={['0.6em','20px']}>
                <Text
                  border='0'
                  borderColor='transparent'
                  boxShadow='none !important'
                  fontSize={[2, 3]}
                  width={'100%'}
                  bg={'transparent'}
                  color={'dark-gray'}
                  className={[styles.mainInput]}
                >
                  {!isNaN(this.functionsUtil.trimEth(balance.amount)) ? this.functionsUtil.trimEth(balance.amount) : this.functionsUtil.trimEth(0)}
                </Text>
              </Box>
          </Flex>
        );
      });

      return (
        <Modal isOpen={this.props.isOpen}>
          <ModalCard closeFunc={this.props.closeModal}>
            <ModalCard.Header title={'Account overview'}></ModalCard.Header>
            <ModalCard.Body>
              <Flex
                width={["auto", "40em"]}
                flexDirection={'column'}
                alignItems={'center'}
                justifyContent={'center'}>
                <Flex
                  flexDirection={'column'}
                  alignItems={'center'}
                  justifyContent={'center'}
                  my={[2,3]}>
                  <Box style={{'wordBreak': 'break-word'}}>
                    <EthAddress address={this.props.account} />
                  </Box>
                </Flex>
                <Flex alignItems={'center'} flexDirection={'column'} width={'100%'}>
                  <Heading.h4 textAlign={'center'}>Balance</Heading.h4>
                  {renderBalances}
                </Flex>
              </Flex>
            </ModalCard.Body>

            <ModalCard.Footer>
              {(this.props.context.active || (this.props.context.error && this.props.context.connectorName)) && (
                <ButtonLoader
                  buttonProps={{className:styles.gradientButton,borderRadius:'2rem',mt:[4,8],minWidth:['95px','145px'],size:['auto','medium']}}
                  handleClick={async () => await this.setConnector('Infura')}
                  buttonText={'Logout wallet'}
                  isLoading={this.state.logout}
                >
                </ButtonLoader>
              )}
            </ModalCard.Footer>
          </ModalCard>
        </Modal>
      );
    }
    return null;
  }
}

export default AccountModal;
