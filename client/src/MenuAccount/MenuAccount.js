import React, { Component } from 'react';
import styles from './MenuAccount.module.scss';
import FunctionsUtil from '../utilities/FunctionsUtil';
import ShortHash from "../utilities/components/ShortHash";
import { Flex, Icon, Image, Link, Text } from "rimble-ui";
import CardIconButton from '../CardIconButton/CardIconButton';
import AccountModal from "../utilities/components/AccountModal";

class MenuAccount extends Component {

  state = {
    isModalOpen: null,
    idleTokenBalance: null
  };

  // Utils
  idleGovToken = null;
  functionsUtil = null;

  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }

    this.idleGovToken = this.functionsUtil.getIdleGovToken();
  }

  async componentWillMount(){
    this.loadUtils();
    this.loadIdleTokenBalance();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
    const accountChanged = prevProps.account !== this.props.account;
    if (accountChanged){
      this.loadIdleTokenBalance();
    }
  }

  async loadIdleTokenBalance(){
    const idleGovTokenEnabled = this.functionsUtil.getGlobalConfig(['govTokens','IDLE','enabled']);
    if (idleGovTokenEnabled){
      let idleTokenBalance = this.functionsUtil.BNify(0);
      const [
        balance,
        unclaimed
      ] = await Promise.all([
        this.idleGovToken.getBalance(this.props.account),
        this.idleGovToken.getUnclaimedTokens(this.props.account)
      ]);

      if (balance && unclaimed){
        idleTokenBalance = this.functionsUtil.BNify(balance).plus(unclaimed);
      }

      return this.setState({
        idleTokenBalance
      });
    }
    return null;
  }

  toggleModal = (modalName) => {
    this.setState(state => ({...state, isModalOpen: (state.isModalOpen===modalName ? null : modalName) }));
  }

  render() {
    const walletProvider = this.functionsUtil.getStoredItem('walletProvider',false,null);
    const connectorInfo = walletProvider ? this.functionsUtil.getGlobalConfig(['connectors',walletProvider.toLowerCase()]) : null;
    const walletIcon = connectorInfo && connectorInfo.icon ? connectorInfo.icon : walletProvider ? `${walletProvider.toLowerCase()}.svg` : null;

    return (
      this.props.account ? (
        <Flex
          width={1}
          flexDirection={['column','row']}
          alignItems={['flex-start','center']}
        >
          <Flex
            p={0}
            alignItems={'center'}
            flexDirection={'row'}
            style={{cursor:'pointer'}}
            justifyContent={'flex-start'}
            onClick={e => this.toggleModal('account')}
          >
            {
              connectorInfo ? (
                <Image
                  width={'2em'}
                  height={'2em'}
                  mr={[2,'0.5rem']}
                  display={'inline-flex'}
                  src={`images/${walletIcon}`}
                  alt={walletProvider.toLowerCase()}
                />
              ) : (
                <Icon
                  size={'2em'}
                  mr={[0,'0.5rem']}
                  color={'copyColor'}
                  name={'AccountCircle'}
                />
              )
            }
            <ShortHash
              fontSize={2}
              fontWeight={3}
              color={'copyColor'}
              hash={this.props.account}
            />
          </Flex>
          
          {
            this.state.idleTokenBalance && 
              <Flex
                ml={[0,3]}
                width={'auto'}
              >
                <Link
                  style={{
                    textDecoration:'none'
                  }}
                  className={styles.balanceButton}
                  onClick={ e => this.props.setGovModal(true) }
                >
                  <Flex
                    alignItems={'center'}
                    justifyContent={'center'}
                  >
                    <Image
                      mr={1}
                      width={'1.7em'}
                      height={'1.7em'}
                      display={'inline-flex'}
                      src={`images/tokens/IDLE.png`}
                    />
                    <Text
                      fontSize={2}
                      color={'white'}
                      fontWeight={500}
                    >
                      {this.state.idleTokenBalance.toFixed(2)} IDLE
                    </Text>
                  </Flex>
                </Link>
              </Flex>
          }
          <AccountModal
            {...this.props}
            isOpen={this.state.isModalOpen==='account'}
            closeModal={e => this.toggleModal('account') }
          />
        </Flex>
      ) : (
        <Flex
          width={1}
          justifyContent={'flex-start'}
        >
          <CardIconButton
            icon={'Power'}
            {...this.props}
            text={'Connect'}
            handleClick={this.props.connectAndValidateAccount}
          />
        </Flex>
      )
    );
  }
}

export default MenuAccount;
