import theme from '../theme';
import React, { Component } from 'react';
import RoundButton from '../RoundButton/RoundButton';
import FunctionsUtil from '../utilities/FunctionsUtil';
import ShortHash from "../utilities/components/ShortHash";
import DashboardCard from '../DashboardCard/DashboardCard';
import AccountModal from "../utilities/components/AccountModal";
import { Flex, Icon, Image, Text, Button, Box } from "rimble-ui";

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
    const connectorInfo = this.functionsUtil.getGlobalConfig(['connectors',walletProvider.toLowerCase()]);
    const walletIcon = connectorInfo && connectorInfo.icon ? connectorInfo.icon : `${walletProvider.toLowerCase()}.svg`;
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
                  mr={[0,'0.5rem']}
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
          justifyContent={'flex-end'}
        >
          <DashboardCard
            cardProps={{
              py:1,
              px:3,
              width:'auto',
            }}
            isInteractive={true}
            handleClick={this.props.connectAndValidateAccount}
          >
            <Flex
              my={1}
              alignItems={'center'}
              flexDirection={'row'}
              justifyContent={'center'}
            >
              <Flex
                mr={2}
                p={'7px'}
                borderRadius={'50%'}
                alignItems={'center'}
                justifyContent={'center'}
                backgroundColor={ theme.colors.transactions.actionBg.redeem }
              >
                <Icon
                  name={'Input'}
                  size={"1.4em"}
                  align={'center'}
                  color={'redeem'}
                />
              </Flex>
              <Text
                fontSize={3}
                fontWeight={3}
              >
                Connect
              </Text>
            </Flex>
          </DashboardCard>
        </Flex>
      )
    );
  }
}

export default MenuAccount;
