import styles from './SmartContractControls.module.scss';
import React from "react";
import { Form, Flex, Box, Heading, Text, Button, Link } from "rimble-ui";
import BigNumber from 'bignumber.js';
import CryptoInput from '../CryptoInput/CryptoInput.js';
import ApproveModal from "../utilities/components/ApproveModal";

import IdleDAI from "../contracts/IdleDAI.json";
import IdleHelp from "../contracts/IdleHelp.json";
import cDAI from '../abis/compound/cDAI';
import DAI from '../contracts/IERC20';
import iDAI from '../abis/fulcrum/iToken.json';

// mainnet
const IdleAbi = IdleDAI.abi;
const IdleAddress = '0x10cf8e1CDba9A2Bd98b87000BCAdb002b13eA525';
const IdleHelpAbi = IdleHelp.abi;
const IdleHelpAddress = '0x79Bc74f157B59409687BfAc2c9e45Db759FeF375';

const cDAIAbi = cDAI.abi;
const cDAIAddress = '0xf5dce57282a584d2746faf1593d3121fcac444dc';
const DAIAbi = DAI.abi;
const DAIAddress = '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359';
const iDAIAbi = iDAI.abi;
const iDAIAddress = '0x14094949152eddbfcd073717200da82fed8dc960';

class SmartContractControls extends React.Component {
  state = {
    iDAIRate: 0,
    cDAIRate: 0,
    cDAIToRedeem: 0,
    approveIsOpen: false,
    tokenName: 'DAI',
    baseTokenName: 'DAI',
    lendAmount: '',
    needsUpdate: false,
    genericError: null,
    selectedTab: '1',
  };

  // utilities
  trimEth = eth => {
    return this.BNify(eth).toFixed(6);
  };
  BNify = s => new BigNumber(String(s));
  toEth(wei) {
    return this.props.web3.utils.fromWei(
      (wei || 0).toString(),
      "ether"
    );
  }
  toWei(eth) {
    return this.props.web3.utils.toWei(
      (eth || 0).toString(),
      "ether"
    );
  }
  rebalanceCheck = async () => {
    const bestToken = await this.genericIdleCall('bestToken');
    let res = await this.genericContractCall('IdleHelp', 'rebalanceCheck', [
      cDAIAddress,
      iDAIAddress,
      bestToken,
      this.BNify('2102400'),
      this.BNify('500000000000000000')
    ]);
    console.log(res);
    debugger;
    //   this.setState({
    //     [`${contractName}Rate`]: (+value).toFixed(2),
    //     needsUpdate: false
    //   });
    // }
    // return value;
  };
  getAprs = async () => {
    let aprs = await this.genericContractCall('IdleHelp', 'getAPRs', [
      cDAIAddress,
      iDAIAddress,
      2102400
    ]);
    this.setState({
      [`compoundRate`]: (+this.toEth(aprs.cApr)).toFixed(2),
      [`fulcrumRate`]: (+this.toEth(aprs.iApr)).toFixed(2),
      needsUpdate: false
    });
  };
  getPriceInToken = async () => {
    const bestToken = await this.genericIdleCall('bestToken');
    const poolBalance = bestToken.toLowerCase() === cDAIAddress.toLowerCase() ?
      await this.genericContractCall('cDAI', 'balanceOf', [IdleAddress]) :
      await this.genericContractCall('iDAI', 'balanceOf', [IdleAddress]);
    const totalIdleSupply = await this.genericIdleCall('totalSupply');
    let price = await this.genericContractCall('IdleHelp', 'getPriceInToken', [
      cDAIAddress,
      iDAIAddress,
      bestToken,
      totalIdleSupply,
      poolBalance
    ]);
    console.log(poolBalance.toString());
    console.log('IdleDAI price', this.toEth(price).toString());

    this.setState({
      [`IdleDAIPrice`]: totalIdleSupply.toString() === '0' ? 0 : (+this.toEth(price)),
      needsUpdate: false
    });
    return price;
  };
  getBalanceOf = async contractName => {
    const price = await this.getPriceInToken();
    let balance = await this.genericContractCall(contractName, 'balanceOf', [this.props.account]);
    if (balance) {
      balance = this.props.web3.utils.fromWei(
        balance.toString(),
        "ether"
      );
      const tokenToRedeem = this.BNify(balance).times(+this.toEth(price)).toString();
      this.setState({
        [`balanceOf${contractName}`]: balance,
        [`DAIToRedeem`]: tokenToRedeem,
        needsUpdate: false
      });
    }
    return balance;
  };

  // should be called with DAI contract as params
  getAllowance = async contractName => {
    let allowance = await this.genericContractCall(
      contractName, 'allowance', [this.props.account, IdleAddress]
    );
    if (allowance) {
      this.setState({
        [`${contractName}Allowance`]: allowance
      });
    }
    return allowance;
  };
  genericContractCall = async (contractName, methodName, params = []) => {
    let contract = this.props.contracts.find(c => c.name === contractName);
    contract = contract.contract;

    const value = await contract.methods[methodName](...params).call().catch(error => {
      console.log(`${contractName} contract method ${methodName} error: `, error);
      this.setState({ error });
    });
    return value;
  }

  // Idle
  genericIdleCall = async (methodName, params = []) => {
    return await this.genericContractCall('IdleDAI', methodName, params);
  }

  // Check for updates to the transactions collection
  processTransactionUpdates = prevProps => {
    const prevTxs = prevProps.transactions || {};
    Object.keys(this.props.transactions).forEach(async key => {
      let tx = this.props.transactions[key];
      if ((!prevTxs[key] || prevTxs[key].status !== tx.status) && tx.status === "success" && this.state.needsUpdate) {
        console.log("Getting updated balance in acc and in cTokens.");
        this.getBalanceOf('IdleDAI'); // do not wait
        this.props.getAccountBalance(); // do not wait
      }
    });
  };

  enableERC20 = (e, name) => {
    e.preventDefault();
    // No need for callback atm
    this.props.contractMethodSendWrapper(name, 'approve', [
      IdleAddress,
      this.props.web3.utils.toTwosComplement('-1') // max uint solidity
    ]);
    this.setState({
      [`isApproving${name}`]: true, // TODO when set to false?
      approveIsOpen: false
    });
  };
  mint = async (e, contractName) => {
    e.preventDefault();
    if (this.props.account && !this.state.lendAmount) {
      return this.setState({genericError: 'Insert a DAI amount to lend'});
    }

    this.setState(state => ({
      ...state,
      [`isLoading${contractName}`]: true
    }));

    const value = this.props.web3.utils.toWei(
      this.state.lendAmount || '0',
      "ether"
    );
    // check if Idle is approved for DAI
    if (this.props.account && !this.state[`isApprovingDAI`]) {
      const allowance = await this.getAllowance('DAI'); // DAI
      if (this.BNify(allowance).lt(this.BNify(value.toString()))) {
        return this.setState({approveIsOpen: true});
      }
    }

    // No need for callback atm
    this.props.contractMethodSendWrapper('IdleDAI', 'mintIdleToken', [
      value
    ]);
    this.setState({
      [`isLoading${contractName}`]: false,
      lendAmount: '',
      needsUpdate: true
    });
  };

  redeem = async (e, contractName) => {
    e.preventDefault();

    this.setState(state => ({
      ...state,
      [`isLoading${contractName}`]: true
    }));

    let IdleDAIBalance = this.toWei('0');
    if (this.props.account) {
      IdleDAIBalance = await this.genericIdleCall('balanceOf', [this.props.account]);
    }
    this.props.contractMethodSendWrapper(contractName, 'redeemIdleToken', [
      IdleDAIBalance
    ]);
    this.setState({
      [`isLoading${contractName}`]: false,
      needsUpdate: true
    });
  };

  handleChangeAmount = (e) => {
    this.setState({ lendAmount: e.target.value });
  };
  toggleModal = (e) => {
    this.setState(state => ({...state, approveIsOpen: !state.approveIsOpen }));
  };

  componentDidMount() {
    // do not wait for each one
    this.props.initContract('iDAI', iDAIAddress, iDAIAbi);
    this.props.initContract('cDAI', cDAIAddress, cDAIAbi);
    this.props.initContract('IdleDAI', IdleAddress, IdleAbi).then(async () => {
      await this.props.initContract('IdleHelp', IdleHelpAddress, IdleHelpAbi);
      await this.getAprs();
    });
    this.props.initContract('DAI', DAIAddress, DAIAbi);
  }

  async componentDidUpdate(prevProps, prevState) {
    if (this.props.account && prevProps.account !== this.props.account) {
      await Promise.all([this.getBalanceOf('IdleDAI')]);
    }
    this.processTransactionUpdates(prevProps);
  }

  selectTab(e, tabIndex) {
    e.preventDefault();
    this.setState(state => ({...state, selectedTab: tabIndex}));
  }

  render() {
    return (
      <Box textAlign={'center'} alignItems={'center'}>
        <Form pb={[5, 4]} backgroundColor={'white'} color={'blue'}>
          <Flex flexDirection={['column','row']} width={'100%'}>
            <Box className={[styles.tab,this.state.selectedTab==='1' ? styles.tabSelected : '']} width={[1,1/3]} textAlign={'center'}>
              <Link display={'block'} py={[3,4]} fontSize={[3,5]} fontWeight={2} onClick={e => this.selectTab(e, '1')}>
                Lend
              </Link>
            </Box>
            <Box className={[styles.tab,this.state.selectedTab==='2' ? styles.tabSelected : '']} width={[1,1/3]} textAlign={'center'} borderLeft={['none','1px solid #fff']} borderRight={['none','1px solid #fff']}>
              <Link display={'block'} py={[3,4]} fontSize={[3,5]} fontWeight={2} onClick={e => this.selectTab(e, '2')}>
                Dashboard
              </Link>
            </Box>
            <Box className={[styles.tab,this.state.selectedTab==='3' ? styles.tabSelected : '']} width={[1,1/3]} textAlign={'center'}>
              <Link display={'block'} py={[3,4]} fontSize={[3,5]} fontWeight={2} onClick={e => this.selectTab(e, '3')}>
                Rebalance
              </Link>
            </Box>
          </Flex>

          <Box py={[2, 4]}>
            {this.state.selectedTab==='1' &&
              <Box textAlign={'text'}>
                <Box py={[2, 4]}>
                  <Heading.h3 fontFamily={'sansSerif'} fontSize={[5, 6]} fontWeight={2} color={'blue'} textAlign={'center'}>
                    Best available interest Rate:
                      Compound: {this.state.compoundRate}%
                      Fulcrum: {this.state.fulcrumRate}%
                  </Heading.h3>
                </Box>

                <CryptoInput
                  defaultValue={this.state.lendAmount}
                  color={'black'}
                  selectedAsset='DAI'
                  handleChangeAmount={this.handleChangeAmount}
                  handleClick={e => this.mint(e)} />

                {this.state.genericError && (
                  <Text textAlign='center' color={'red'} fontSize={2}>{this.state.genericError}</Text>
                )}

                <Box py={[2,3]} style={{textAlign:'center'}}>
                  <Link textAlign={'center'} color={'blue'} hoverColor={'blue'} fontSize={3} fontWeight={1} className={[styles.link]} href="#how-it-works">How does it work?</Link>
                </Box>

              </Box>
            }

            {this.state.selectedTab==='2' &&
              <Box textAlign={'text'}>
                {this.props.account &&
                  <Heading.h3 fontFamily={'sansSerif'} fontSize={[5, 6]} fontWeight={2} color={'blue'} textAlign={'center'}>
                    Redeemable funds: ~{this.trimEth(this.state.DAIToRedeem)} DAI <br />
                    IdleDAI: ~{this.trimEth(this.state.balanceOfIdleDAI)} <br />
                    {!!this.state.IdleDAIPrice && `IdleDAIPrice: ~${this.trimEth(this.state.IdleDAIPrice)} DAI`}
                  </Heading.h3>
                }
                <Flex
                  textAlign='center'
                  pt={2}>
                  <Button onClick={e => this.redeem(e, 'IdleDAI')} size={'large'} mainColor={'blue'} contrastColor={'white'} fontWeight={2} fontSize={[2,3]} mx={'auto'} px={[4,5]} mt={[3,4]}>
                    {this.props.account ? 'REDEEM' : 'CONNECT'}
                  </Button>
                </Flex>
              </Box>
            }

            {this.state.selectedTab==='3' &&
              <Box textAlign={'text'}>
                <Heading.h3 fontFamily={'sansSerif'} fontSize={[5, 6]} fontWeight={2} color={'blue'} textAlign={'center'}>
                  Rebalance the entire pool, all users will bless you.
                </Heading.h3>
                <Flex
                  textAlign='center'
                  pt={2}>
                  <Button onClick={e => this.redeem(e, 'cDAI')} size={'large'} className={styles.magicButton} mainColor={'transparent'} contrastColor={'white'} fontWeight={2} fontSize={[2,3]} mx={'auto'} px={[4,5]} mt={[3,4]}>REBALANCE NOW!</Button>
                </Flex>
              </Box>
            }

            </Box>
        </Form>

        <ApproveModal
          account={this.props.account}
          isOpen={this.state.approveIsOpen}
          closeModal={this.toggleModal}
          onClick={e => this.enableERC20(e, this.state.tokenName)}
          tokenName={this.state.tokenName}
          baseTokenName={this.state.baseTokenName}
          network={this.props.network.current} />
      </Box>
    );
  }
}

export default SmartContractControls;
