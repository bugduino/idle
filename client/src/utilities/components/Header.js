import React from "react";
import { Box, Flex, Button, Image } from "rimble-ui";
import AccountOverview from "./AccountOverview";
import AccountModal from "./AccountModal";
import styles from './Header.module.scss';
import BigNumber from 'bignumber.js';

import IdleDAI from "../../contracts/IdleDAI.json";
const IdleAbi = IdleDAI.abi;
const IdleAddress = '0xAcf651Aad1CBB0fd2c7973E2510d6F63b7e440c9';

class Header extends React.Component {
  state = {
    idleTokenBalance: null,
    isOpen: false
  }

  toggleModal = () => {
    this.setState(state => ({...state, isOpen: !state.isOpen}));
  }

  genericContractCall = async (contractName, methodName, params = []) => {
    let contract = this.props.contracts.find(c => c.name === contractName);
    contract = contract && contract.contract;
    if (!contract) {
      console.log('Wrong contract name', contractName);
      return;
    }

    const value = await contract.methods[methodName](...params).call().catch(error => {
      console.log(`${contractName} contract method ${methodName} error: `, error);
      this.setState({ error });
    });
    return value;
  }

  // Idle
  genericIdleCall = async (methodName, params = []) => {
    return await this.genericContractCall('idleDAI', methodName, params).catch(err => {
      console.error('Generic Idle call err:', err);
    });
  }

  getIdleTokenBalance = async () => {
    // console.log('Header.js getIdleTokenBalance',this.props.account);
    return await this.genericIdleCall('balanceOf', [this.props.account]);
  }

  async componentDidMount() {
    // do not wait for each one just for the first who will guarantee web3 initialization
    const web3 = await this.props.initWeb3();
    if (!web3) {
      return console.log('No Web3 SmartContractControls')
    }

    await this.props.initContract('idleDAI', IdleAddress, IdleAbi);
  }

  BNify = s => new BigNumber(String(s));

  async componentDidUpdate(prevProps, prevState) {
    if (this.props.account && (prevProps.account !== this.props.account)) {
      let idleTokenBalance = await this.getIdleTokenBalance();
      if (idleTokenBalance){
        idleTokenBalance = this.BNify(idleTokenBalance).div(1e18);
        // console.log('Header.js componentDidUpdate',idleTokenBalance.toString());
        this.setState({
          idleTokenBalance
        });
      }
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
        <Flex bg={"transparent"} pt={[3,4]} alignItems={'flex-end'}>
          <Box ml={[3, 5]} width={[1, 3/12]}>
            <Image src="images/logo.png"
              height={['35px','40px']}
              position={'relative'} />
          </Box>
          <Box display={['inline-block', 'none']}>
            {this.props.account ? (
              <AccountOverview
                account={this.props.account}
                hasQRCode={false}
                isMobile={this.props.isMobile}
                accountBalanceLow={this.props.accountBalanceLow}
                accountBalance={this.props.accountBalance}
                accountBalanceDAI={this.props.accountBalanceDAI}
                toggleModal={this.toggleModal}
              />
            ) : (
              <Button
                className={styles.gradientButton}
                borderRadius={4}
                my={2}
                mr={[3, 4]}
                onClick={this.props.connectAndValidateAccount}
                size={this.props.isMobile ? 'small' : 'medium'}
              >
                CONNECT
              </Button>
            )}
          </Box>
          <Box display={['none','block']} width={[8/12]} justifyContent="flex-end">
            <Flex alignItems={"center"} justifyContent="flex-end">
              {this.props.account ? (
                <AccountOverview
                  account={this.props.account}
                  hasQRCode={false}
                  isMobile={this.props.isMobile}
                  accountBalanceLow={this.props.accountBalanceLow}
                  accountBalance={this.props.accountBalance}
                  accountBalanceDAI={this.props.accountBalanceDAI}
                  toggleModal={this.toggleModal}
                />
              ) : (
                <Button
                  className={styles.gradientButton}
                  borderRadius={4}
                  my={2}
                  mr={[3, 4]}
                  onClick={this.props.connectAndValidateAccount}
                  size={this.props.isMobile ? 'small' : 'medium'}
                >
                  CONNECT
                </Button>
              )}
            </Flex>
          </Box>
        </Flex>
        <AccountModal
          account={this.props.account}
          accountBalance={this.props.accountBalance}
          accountBalanceDAI={this.props.accountBalanceDAI}
          idleTokenBalance={this.state.idleTokenBalance}
          isOpen={this.state.isOpen}
          isMobile={this.props.isMobile}
          closeModal={this.toggleModal}
          network={this.props.network.current} />
      </Box>
    );
  }
}

export default Header;
