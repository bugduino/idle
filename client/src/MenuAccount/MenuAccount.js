import React, { Component } from 'react';
import { Flex, Icon, Image, Box } from "rimble-ui";
import FunctionsUtil from '../utilities/FunctionsUtil';
// import RoundButton from '../RoundButton/RoundButton';
import ShortHash from "../utilities/components/ShortHash";
import CardIconButton from '../CardIconButton/CardIconButton';
import AccountModal from "../utilities/components/AccountModal";

class MenuAccount extends Component {

  state = {
    isModalOpen: null
  };

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

  render() {
    const walletProvider = this.functionsUtil.getStoredItem('walletProvider',false,null);
    const connectorInfo = walletProvider ? this.functionsUtil.getGlobalConfig(['connectors',walletProvider.toLowerCase()]) : null;
    const walletIcon = connectorInfo && connectorInfo.icon ? connectorInfo.icon : walletProvider ? `${walletProvider.toLowerCase()}.svg` : null;
    return (
      this.props.account ? (
        <Box width={1}>
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
          <AccountModal
            {...this.props}
            isOpen={this.state.isModalOpen==='account'}
            closeModal={e => this.toggleModal('account') }
          />
        </Box>
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
