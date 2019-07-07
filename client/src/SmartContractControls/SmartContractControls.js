import React from "react";
import { Form, Flex, Box, Heading, Text, Button, Link } from "rimble-ui";
import BigNumber from 'bignumber.js';
import cETH from '../abis/compound/cETH'; // v2 rinkeby
import cDAI from '../abis/compound/cDAI'; // v2 rinkeby
import DAI from '../abis/tokens/DAI'; // rinkeby
import styles from './SmartContractControls.module.scss';
import CryptoButton from '../CryptoButton/CryptoButton.js';
import CryptoInput from '../CryptoInput/CryptoInput.js';

// import Pragma from "../contracts/Pragma.json";
import ApproveModal from "../utilities/components/ApproveModal";

const PragmaAbi = {};
const PragmaAddress = '0xD4Ba31AABbEB14c7e59A18C5828FF3dB57896ccd';
const DAIAddress = DAI.address;
const DAIAbi = DAI.abi;
const cETHAbi = cETH.abi;
const cETHAddress = cETH.address;
const cDAIAbi = cDAI.abi;
const cDAIAddress = cDAI.address;

class SmartContractControls extends React.Component {
  state = {
    cETHRate: 0,
    cDAIRate: 0,
    cDAIToRedeem: 0,
    approveIsOpen: false,
    tokenName: '',
    baseTokenName: '',
    lendAmount: '',
    needsUpdate: false,
    genericError: null,
    selectedAsset: 'cDAI',
    sectionETH: null,
    sectionDAI: null,
    selectedTab: '1',
  };

  // utilities
  trimEth = eth => {
    return this.BNify(eth).toFixed(6);
  };
  BNify = s => new BigNumber(String(s));
  toEth(wei, decimals) {return this.BNify(wei).dividedBy(this.BNify(10 ** decimals))}
  toWei(eth, decimals) {return this.BNify(eth).times(this.BNify(10 ** decimals)).integerValue(BigNumber.ROUND_FLOOR)}

  // cETH contract functions
  getCETHSupplyRatePerBlock = async () => {
    let value = await this.genericCETHCall('supplyRatePerBlock');
    if (value) {
      const web3 = this.props.web3;
      // blocks in a year (15 sec block time)
      value = this.BNify(value).times('2102400').times('100').integerValue(BigNumber.ROUND_FLOOR)
      value = web3.utils.fromWei(
        value.toString(),
        "ether"
      );
      this.setState({ cETHSupplyRatePerBlock: value, cETHRate: (+value).toFixed(2), needsUpdate: false });
    }
    return value;
  };
  getCETHExchangeRateCurrent = async () => {
    let exchangeRateCurrentCETH = await this.genericCETHCall('exchangeRateCurrent');
    if (exchangeRateCurrentCETH) {
      exchangeRateCurrentCETH = this.props.web3.utils.fromWei(
        exchangeRateCurrentCETH.toString(),
        "ether"
      );
      this.setState({ exchangeRateCurrentCETH, needsUpdate: false });
    }
    return exchangeRateCurrentCETH;
  };
  getCETHBalanceOf = async () => {
    // TODO getCERC20BalanceOf can be used change ethToRedeem to cETHToRedeem
    let balanceOfcETH = await this.genericCETHCall('balanceOf', [this.props.account]);
    if (balanceOfcETH) {
      balanceOfcETH = this.props.web3.utils.fromWei(
        balanceOfcETH.toString(),
        "ether"
      );
      const ethToRedeem = this.BNify(balanceOfcETH).times(this.BNify(this.state.exchangeRateCurrentCETH)).toString();
      this.setState({ balanceOfcETH, ethToRedeem, needsUpdate: false });
    }
    return balanceOfcETH;
  };
  genericCETHCall = async (methodName, params = []) => {
    return await this.genericCERC20Call('cETH', methodName, params);
  }

  // cERC20
  getCERC20SupplyRatePerBlock = async (contractName) => {
    let value = await this.genericCERC20Call(contractName, 'supplyRatePerBlock');
    if (value) {
      const web3 = this.props.web3;
      // blocks in a year (15 sec block time)
      value = this.BNify(value).times('2102400').times('100').integerValue(BigNumber.ROUND_FLOOR)
      // TODO add decimals if using other coins besides DAI and ETH
      value = web3.utils.fromWei(
        value.toString(),
        "ether"
      );
      this.setState({
        [`${contractName}Rate`]: (+value).toFixed(2),
        needsUpdate: false
      });
    }
    return value;
  };
  getCERC20ExchangeRateCurrent = async (contractName) => {
    let rate = await this.genericCERC20Call(contractName, 'exchangeRateCurrent');
    if (rate) {
      // TODO add decimals if using other coins besides DAI and ETH
      rate = this.props.web3.utils.fromWei(
        rate.toString(),
        "ether"
      );
      this.setState({
        [`exchangeRateCurrent${contractName}`]: rate,
        needsUpdate: false
      });
    }
    return rate;
  };
  getCERC20BalanceOf = async (contractName) => {
    let balance = await this.genericCERC20Call(contractName, 'balanceOf', [this.props.account]);
    if (balance) {
      // TODO add decimals if using other coins besides DAI and ETH eg cDAI cETH
      balance = this.props.web3.utils.fromWei(
        balance.toString(),
        "ether"
      );
      const tokenToRedeem = this.BNify(balance).times(this.BNify(this.state[`exchangeRateCurrent${contractName}`])).toString();
      this.setState({
        [`balanceOf${contractName}`]: balance,
        [`${contractName}ToRedeem`]: tokenToRedeem,
        needsUpdate: false
      });
    }
    return balance;
  };
  getCERC20Allowance = async contractName => {
    let allowance = await this.genericCERC20Call(
      contractName, 'allowance', [this.props.account, PragmaAddress]
    );
    if (allowance) {
      this.setState({
        [`${contractName}Allowance`]: allowance
      });
    }
    return allowance;
  };
  genericCERC20Call = async (contractName, methodName, params = []) => {
    let contract = this.props.contracts.find(c => c.name === contractName);
    contract = contract.contract;

    const value = await contract.methods[methodName](...params).call().catch(error => {
      console.log(`${contractName} contract method ${methodName} error: `, error);
      this.setState({ error });
    });
    return value;
  }

  // Pragma
  genericPragmaCall = async (methodName, params = []) => {
    return await this.genericCERC20Call('Pragma', methodName, params);
  }

  // Check for updates to the transactions collection
  processTransactionUpdates = prevProps => {
    const prevTxs = prevProps.transactions || {};
    Object.keys(this.props.transactions).forEach(async key => {
      let tx = this.props.transactions[key];
      if ((!prevTxs[key] || prevTxs[key].status !== tx.status) && tx.status === "success" && this.state.needsUpdate) {
        console.log("Getting updated balance in acc and in cTokens.");
        this.getCETHBalanceOf(); // do not wait
        this.getCERC20BalanceOf('cDAI'); // do not wait
        this.props.getAccountBalance(); // do not wait
      }
    });
  };

  mintCETH = e => {
    e.preventDefault();
    if (this.props.account && !this.state.lendAmount) {
      return this.setState({genericError: 'Insert an ETH amount to lend'});
    }
    const value = this.props.web3.utils.toWei(
      this.state.lendAmount || '0',
      "ether"
    );
    // No need for callback atm
    this.props.contractMethodSendWrapper('Pragma', 'ethMint', [], value);
    this.setState({
      lendAmount: '',
      needsUpdate: true
    });
  };
  redeemCETH = async e => {
    e.preventDefault();
    const contractName = 'cETH';
    this.setState(state => ({
      ...state,
      tokenName: contractName,
      baseTokenName: 'ETH',
      [`isLoading${contractName}`]: true
    }));

    if (this.props.account && !this.state[`isApproving${contractName}`]) {
      const allowance = await this.getCERC20Allowance(contractName); // cETH
      if (this.BNify(allowance).lte(this.BNify('0'))) {
      // if (this.BNify(allowance).lt(this.BNify(value.toString()))) {
        return this.setState({approveIsOpen: true});
      }
    }

    this.props.contractMethodSendWrapper('Pragma', 'genericRedeem', [
      '0x0000000000000000000000000000000000000000', // not used for ETH
      cETHAddress, // cETH
    ]);
    this.setState({
      [`isLoading${contractName}`]: false,
      needsUpdate: true
    });
  };
  enableERC20 = (e, name) => {
    e.preventDefault();
    // No need for callback atm
    this.props.contractMethodSendWrapper(name, 'approve', [
      PragmaAddress,
      this.props.web3.utils.toTwosComplement('-1') // max uint solidity
    ]);
    this.setState({
      [`isApproving${name}`]: true, // TODO when set to false?
      tokenName: '',
      baseTokenName: '',
      approveIsOpen: false
    });
  };
  mintCERC20 = async (e, contractName) => {
    e.preventDefault();
    const baseTokenName = contractName.split('c')[1];
    if (this.props.account && !this.state.lendAmount) {
      return this.setState({genericError: 'Insert a DAI amount to lend'});
    }

    this.setState(state => ({
      ...state,
      tokenName: baseTokenName,
      baseTokenName: contractName,
      [`isLoading${contractName}`]: true
    }));

    const value = this.props.web3.utils.toWei(
      this.state.lendAmount || '0',
      "ether"
    );
    // check if pragma is approved for DAI
    if (this.props.account && !this.state[`isApproving${baseTokenName}`]) {
      const allowance = await this.getCERC20Allowance(baseTokenName); // DAI
      if (this.BNify(allowance).lt(this.BNify(value.toString()))) {
        return this.setState({approveIsOpen: true});
      }
    }

    // No need for callback atm
    this.props.contractMethodSendWrapper('Pragma', 'genericMint', [
      DAIAddress, // DAI
      cDAIAddress, // cDAI
      value
    ]);
    this.setState({
      [`isLoading${contractName}`]: false,
      lendAmount: '',
      needsUpdate: true
    });
  };
  redeemCERC20 = async (e, contractName) => {
    e.preventDefault();

    this.setState(state => ({
      ...state,
      tokenName: contractName,
      baseTokenName: contractName.split('c')[1],
      [`isLoading${contractName}`]: true
    }));

    // check if pragma is approved for cDAI
    if (this.props.account && !this.state[`isApproving${contractName}`]) {
      const allowance = await this.getCERC20Allowance(contractName); // DAI
      if (this.BNify(allowance).lte(this.BNify('0'))) {
      // if (this.BNify(allowance).lt(this.BNify(value.toString()))) {
        return this.setState({approveIsOpen: true});
      }
    }
    this.props.contractMethodSendWrapper('Pragma', 'genericRedeem', [
      DAIAddress, // DAI
      cDAIAddress, // cDAI
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
    this.props.initContract('Pragma', PragmaAddress, PragmaAbi).then(async () => {
      // let balance = await this.genericPragmaCall('cETH', []).catch(err => {
      //   console.log(err);
      //   debugger;
      // });
      // debugger;
      // Can finally interact with contract
      // Do not wait for the moment, need to add loading states for each
      // this.getCETHSupplyRatePerBlock();
      // this.getCETHExchangeRateCurrent();
      // if (this.props.account) {
      //   this.getCETHBalanceOf();
      // }
    });
    this.props.initContract('DAI', DAIAddress, DAIAbi);
    this.props.initContract('cETH', cETHAddress, cETHAbi).then(async () => {
      // let rate = await this.generi('exchangeRateStored', []).catch(err => {
      //   console.log(err);
      //   debugger;
      // });
      // console.log(this.toEth(this.BNify('1e17').times('1e18').div(rate), 8).toString());
      // debugger;
      // Can finally interact with contract
      // Do not wait for the moment, need to add loading states for each
      this.getCETHSupplyRatePerBlock();
      this.getCETHExchangeRateCurrent();
      if (this.props.account) {
        this.getCETHBalanceOf();
      }
    });
    this.props.initContract('cDAI', cDAIAddress, cDAIAbi).then(async () => {
      // Can finally interact with contract
      // Do not wait for the moment, need to add loading states for each
      this.getCERC20SupplyRatePerBlock('cDAI');
      this.getCERC20ExchangeRateCurrent('cDAI');
      if (this.props.account) {
        this.getCERC20BalanceOf('cDAI');
      }
    });
  }

  async componentDidUpdate(prevProps, prevState) {
    if (this.props.account && prevProps.account !== this.props.account) {
      await Promise.all([this.getCETHBalanceOf(), this.getCERC20BalanceOf('cDAI')]);
    }
    this.processTransactionUpdates(prevProps);
  }

  selectAsset(e, asset) {
    e.preventDefault();
    this.setState(state => ({...state, selectedAsset: asset}));
  }

  selectETHSection(e, section) {
    e.preventDefault();
    this.setState(state => ({...state, sectionETH: section}));
  }

  selectDAISection(e, section) {
    e.preventDefault();
    this.setState(state => ({...state, sectionDAI: section}));
  }

  selectTab(e, tabIndex) {
    e.preventDefault();
    this.setState(state => ({...state, selectedTab: tabIndex}));
  }

  mint(e) {
    const selectedAsset = this.state.selectedAsset;
    if (selectedAsset === 'cETH') {
      return this.mintCETH(e);
    }

    return this.mintCERC20(e, selectedAsset);
  }

  render() {
    const isDAISelected = this.state.selectedAsset === 'cDAI';
    const isETHSelected = this.state.selectedAsset === 'cETH';
    const isETHLend = this.state.balanceOfcETH && this.state.balanceOfcETH !== '0';
    const isDAILend = this.state.balanceOfcDAI && this.state.balanceOfcDAI !== '0';
    // const ethColor = theme.colors[isETHSelected ? 'primary' : 'primary-light'];
    // const daiColor = theme.colors[isDAISelected ? 'primary' : 'primary-light'];
            // <Link
            //   display={'inline-flex'}
            //   mt={[0]} fontSize={[1, 2]} color={'white'} textAlign={'center'}>Others</Link>
          // <Box textAlign={'center'}>
          //   <Text.p mb={[0]} fontSize={[1, 2]} color={'blue'} textAlign={'center'}>Select the Crypto</Text.p>
          //   <CryptoButton
          //     id={'eth'}
          //     isSelected={isETHSelected}
          //     handleClick={e => this.selectAsset(e, 'cETH')}
          //     label={'eth'} />
          //   <CryptoButton
          //     id={'dai'}
          //     isSelected={isDAISelected}
          //     handleClick={e => this.selectAsset(e, 'cDAI')}
          //     label={'dai'} />
          // </Box>
    return (
      <Box textAlign={'center'} alignItems={'center'}>
        <Form pb={[5, 4]} backgroundColor={'white'} color={'blue'}>
          <Flex flexDirection={['column','row']} width={'100%'}>
            <Box className={[styles.tab,this.state.selectedTab=='1' ? styles.tabSelected : '']} width={[1,1/3]} textAlign={'center'}>
              <Link display={'block'} py={[3,4]} fontSize={[3,5]} fontWeight={2} onClick={e => this.selectTab(e, '1')}>
                Lend
              </Link>
            </Box>
            <Box className={[styles.tab,this.state.selectedTab=='2' ? styles.tabSelected : '']} width={[1,1/3]} textAlign={'center'} borderLeft={['none','1px solid #fff']} borderRight={['none','1px solid #fff']}>
              <Link display={'block'} py={[3,4]} fontSize={[3,5]} fontWeight={2} onClick={e => this.selectTab(e, '2')}>
                Dashboard
              </Link>
            </Box>
            <Box className={[styles.tab,this.state.selectedTab=='3' ? styles.tabSelected : '']} width={[1,1/3]} textAlign={'center'}>
              <Link display={'block'} py={[3,4]} fontSize={[3,5]} fontWeight={2} onClick={e => this.selectTab(e, '3')}>
                Rebalance
              </Link>
            </Box>
          </Flex>

          <Box py={[2, 4]}>
            {this.state.selectedTab=='1' &&
              <Box textAlign={'text'}>
                <Box py={[2, 4]}>
                  <Heading.h3 fontFamily={'sansSerif'} fontSize={[5, 6]} fontWeight={2} color={'blue'} textAlign={'center'}>
                    Best available interest Rate: {this.state.cDAIRate}%
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

            {this.state.selectedTab=='2' &&
              <Box textAlign={'text'}>
                <Heading.h3 fontFamily={'sansSerif'} fontSize={[5, 6]} fontWeight={2} color={'blue'} textAlign={'center'}>
                  Redeemable funds: ~{this.trimEth(this.state.cDAIToRedeem)} DAI
                </Heading.h3>
                <Flex
                  textAlign='center'
                  pt={2}>
                  <Button onClick={e => this.redeemCERC20(e, 'cDAI')} size={'large'} mainColor={'blue'} contrastColor={'white'} fontWeight={2} fontSize={[2,3]} mx={'auto'} px={[4,5]} mt={[3,4]}>REDEEM</Button>
                </Flex>
              </Box>
            }

            {this.state.selectedTab=='3' &&
              <Box textAlign={'text'}>
                <Heading.h3 fontFamily={'sansSerif'} fontSize={[5, 6]} fontWeight={2} color={'blue'} textAlign={'center'}>
                  Rebalance the entire pool, all users will bless you.
                </Heading.h3>
                <Flex
                  textAlign='center'
                  pt={2}>
                  <Button onClick={e => this.redeemCERC20(e, 'cDAI')} size={'large'} className={styles.magicButton} mainColor={'transparent'} contrastColor={'white'} fontWeight={2} fontSize={[2,3]} mx={'auto'} px={[4,5]} mt={[3,4]}>REBALANCE NOW!</Button>
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
