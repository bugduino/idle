import styles from './SmartContractControls.module.scss';
import React from "react";
import { Form, Flex, Box, Heading, Text, Button, Link, Icon, Pill } from "rimble-ui";
import BigNumber from 'bignumber.js';
import CryptoInput from '../CryptoInput/CryptoInput.js';
import ApproveModal from "../utilities/components/ApproveModal";
import axios from 'axios';
import moment from 'moment';

import IdleDAI from "../contracts/IdleDAI.json";
import cDAI from '../abis/compound/cDAI';
import DAI from '../contracts/IERC20.json';
import iDAI from '../abis/fulcrum/iToken.json';

const env = process.env;

// mainnet
const IdleAbi = IdleDAI.abi;
const IdleAddress = '0x10cf8e1CDba9A2Bd98b87000BCAdb002b13eA525';

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
    amountLent: null,
    earning: null,
    prevTxs : {}
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
    const res = await this.genericIdleCall('rebalanceCheck');
    this.setState({
      shouldRebalance: res[0],
      needsUpdate: false
    });
  };
  getAprs = async () => {
    let aprs = await this.genericIdleCall('getAPRs');
    this.setState({
      [`compoundRate`]: aprs ? (+this.toEth(aprs[0])).toFixed(2) : '0.00',
      [`fulcrumRate`]: aprs ? (+this.toEth(aprs[1])).toFixed(2) : '0.00',
      [`maxRate`]: aprs ? (+this.toEth(Math.max(aprs[0],aprs[1]))).toFixed(2) : '0.00',
      needsUpdate: false
    });
  };
  getPriceInToken = async () => {
    const totalIdleSupply = await this.genericIdleCall('totalSupply');
    let price = await this.genericIdleCall('tokenPrice');
    this.setState({
      [`IdleDAIPrice`]: (totalIdleSupply || totalIdleSupply === 0) && totalIdleSupply.toString() === '0' ? 0 : (+this.toEth(price)),
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

      const tokenToRedeem = this.BNify(balance).times(+this.toEth(price));
      let earning = 0;

      if (this.state.amountLent){
        earning = tokenToRedeem.minus(this.BNify(this.toEth(this.state.amountLent)));
      }
      
      this.setState({
        [`balanceOf${contractName}`]: balance,
        [`DAIToRedeem`]: tokenToRedeem.toString(),
        earning: earning,
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
    return await this.genericContractCall('IdleDAI', methodName, params).catch(err => {
      console.error('Generic Idle call err:', err);
    });
  }

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
    if (this.props.account){
      this.setState({ lendAmount: e.target.value });
    } else {
      this.mint(e);
    }
  };
  toggleModal = (e) => {
    this.setState(state => ({...state, approveIsOpen: !state.approveIsOpen }));
  };

  getPrevTxs = async (executedTxs) => {

    console.log(`
      http://api.etherscan.io/api?module=account&action=tokentx&address=${this.props.account}&startblock=8119247&endblock=999999999&sort=asc&apikey=${env.REACT_APP_ETHERSCAN_KEY}
    `);
    
    const txs = await axios.get(`
      http://api.etherscan.io/api?module=account&action=tokentx&address=${this.props.account}&startblock=8119247&endblock=999999999&sort=asc&apikey=${env.REACT_APP_ETHERSCAN_KEY}
    `).catch(err => {
      console.log('Error getting prev txs');
    });
    if (!txs || !txs.data || !txs.data.result) {
      return;
    }

    const prevTxs = txs.data.result.filter(
        tx => tx.from.toLowerCase() === IdleAddress.toLowerCase() ||
              tx.to.toLowerCase() === IdleAddress.toLowerCase()
      ).map(tx => ({
        from: tx.from,
        to: tx.to,
        hash: tx.hash,
        realValue: tx.value,
        value: this.toEth(tx.value),
        tokenName: tx.tokenName,
        tokenSymbol: tx.tokenSymbol,
        timeStamp: tx.timeStamp
      }));

    let amountLent = 0;
    let transactions = {};
    prevTxs.forEach((tx,index) => {
      // Deposited
      if (tx.to.toLowerCase() === IdleAddress.toLowerCase()){
        amountLent += parseFloat(tx.realValue);
      } else {
        amountLent = 0;
      }
      transactions[tx.hash] = tx;
    });
    
    if (executedTxs){
      Object.keys(executedTxs).forEach((key,index) => {
        const tx = executedTxs[key];
        transactions[tx.hash] = tx;
      });
    }

    this.setState({
      prevTxs: transactions,
      amountLent: amountLent
    });
  };

  // Check for updates to the transactions collection
  processTransactionUpdates = prevProps => {
    let txs = this.state.prevTxs || {};
    let newTxs = {};
    let updated = false;
    let refresh = false;
    if (Object.keys(this.props.transactions).length){
      Object.keys(this.props.transactions).forEach(key => {
        let pendingTx = this.props.transactions[key];
        if ((!txs[key] || txs[key].status !== pendingTx.status)){

          // Delete transaction is succeded or error
          if (pendingTx.status === 'success' || pendingTx.status === 'error') {
            if (txs[key]){
              updated = true;
              delete txs[key];
            }

            if (pendingTx.status === 'success'){
              refresh = true;
              if (this.state.needsUpdate) {
                this.getBalanceOf('IdleDAI'); // do not wait
                this.props.getAccountBalance(); // do not wait
              }
            }
          } else {
            let tx = {
              from: '',
              to: '',
              status: 'Pending',
              hash: key,
              value: 0,
              tokenName: '',
              tokenSymbol: '',
              timeStamp: parseInt(pendingTx.lastUpdated/1000)
            };

            if (pendingTx.transactionHash) {
              tx.hash = pendingTx.transactionHash.toString();
            }

            if (!txs[key]){
              newTxs[key] = tx;
            }

            txs[key] = tx;

            updated = true;
          }
        }
      });

      if (refresh){
        this.getPrevTxs(newTxs);
      } else if (updated){
        this.setState({
          prevTxs: txs
        });
      }
    }
  };

  componentDidMount() {
    // do not wait for each one
    this.props.initContract('iDAI', iDAIAddress, iDAIAbi);
    this.props.initContract('cDAI', cDAIAddress, cDAIAbi);
    this.props.initContract('IdleDAI', IdleAddress, IdleAbi).then(async () => {
      // await this.getAprs();
      await Promise.all([
        this.getAprs(),
        this.getPriceInToken()
      ]);
    });
    this.props.initContract('DAI', DAIAddress, DAIAbi);
  }

  async componentDidUpdate(prevProps, prevState) {
    if (this.props.account && prevProps.account !== this.props.account) {
      await Promise.all([
        this.getBalanceOf('IdleDAI'),
        this.getPrevTxs()
      ]);
    }
    if (prevProps.transactions !== this.props.transactions){
      this.processTransactionUpdates(prevProps);
    }
  }

  async selectTab(e, tabIndex) {
    e.preventDefault();
    // this.setState(state => ({...state, selectedTab: tabIndex}));
    this.props.updateSelectedTab(e,tabIndex);
    if (tabIndex === '3') {
      await this.rebalanceCheck();
    }

  }

  // TODO move in a separate component
  renderPrevTxs() {
    const prevTxs = this.state.prevTxs || {};

    if (!Object.keys(prevTxs).length) {
      return null;
    }

    const txs = Object.keys(prevTxs).reverse().map((key, i) => {
      const tx = prevTxs[key];
      const date = new Date(tx.timeStamp*1000);
      const status = tx.status ? tx.status : tx.to.toLowerCase() === IdleAddress.toLowerCase() ? 'Deposited' : 'Redeemed';
      const value = parseFloat(tx.value) ? (this.props.isMobile ? parseFloat(tx.value).toFixed(4) : parseFloat(tx.value).toFixed(8)) : '-';
      const formattedDate = moment(date).fromNow();
      let color;
      let icon;
      switch (status) {
        case 'Deposited':
          color = 'dark-gray';
          icon = "FileDownload";
        break;
        case 'Redeemed':
          color = 'green';
          icon = "FileUpload";
        break;
        default:
          color = 'grey';
          icon = "Refresh";
        break;
      }
      return (
        <Link key={'tx_'+i} display={'block'} href={`https://etherscan.io/tx/${tx.hash}`} target={'_blank'}>
          <Flex alignItems={'center'} flexDirection={['row','row']} width={'100%'} p={[2,3]} borderBottom={'1px solid #D6D6D6'}>
            <Box width={[1/10]} display={['none','block']} textAlign={'right'}>
                <Icon name={icon} color={"black"} style={{float:'left'}}></Icon>
            </Box>
            <Box width={[2/10,2/10]} textAlign={'center'}>
              <Pill color={color}>
                {status}
              </Pill>
            </Box>
            <Box width={[4/10]}>
              <Text textAlign={'center'}>{value} {tx.tokenSymbol}</Text>
            </Box>
            <Box width={[3/10]} textAlign={'center'}>
              <Text textAlign={'center'}>{formattedDate}</Text>
            </Box>
          </Flex>
        </Link>
      )});

    return (
      <Flex flexDirection={'column'} width={[1,'80%']} m={'0 auto'}>
        <Text fontFamily={'sansSerif'} fontSize={[2, 3]} fontWeight={2} color={'black'} textAlign={'center'}>
          Transactions
        </Text>
        {txs}
      </Flex>
    );
  }

  render() {
    const reedemableFunds = !isNaN(this.trimEth(this.state.DAIToRedeem)) ? ( <>{this.trimEth(this.state.DAIToRedeem)} <Text.span fontSize={[1,3]}>DAI</Text.span></> ) : '-';
    const currentEarnings = !isNaN(this.trimEth(this.state.earning)) ? ( <>{this.trimEth(this.state.earning)} <Text.span fontSize={[1,3]}>DAI</Text.span></> ) : '-';
    const IdleDAIPrice = !isNaN(this.trimEth(this.state.IdleDAIPrice)) ? ( <>{this.trimEth(this.state.IdleDAIPrice)} <Text.span fontSize={[1,2]}>DAI</Text.span></> ) : '-';
    const balanceOfIdleDAI = !isNaN(this.trimEth(this.state.balanceOfIdleDAI)) ? ( <>{this.trimEth(this.state.balanceOfIdleDAI)} <Text.span fontSize={[1,2]}>idleDAI</Text.span></> ) : '-';

    return (
      <Box textAlign={'center'} alignItems={'center'}>
        <Form pb={[5, 4]} minHeight={['auto','36em']} backgroundColor={'white'} color={'blue'} boxShadow={1}>
          <Flex flexDirection={['row','row']} width={'100%'}>
            <Box className={[styles.tab,this.props.selectedTab==='1' ? styles.tabSelected : '']} width={[1/3]} textAlign={'center'}>
              <Link display={'block'} py={[3,4]} fontSize={[3,5]} fontWeight={2} onClick={e => this.selectTab(e, '1')}>
                Lend
              </Link>
            </Box>
            <Box className={[styles.tab,this.props.selectedTab==='2' ? styles.tabSelected : '']} width={[1/3]} textAlign={'center'} borderLeft={'1px solid #fff'} borderRight={'1px solid #fff'}>
              <Link display={'block'} py={[3,4]} fontSize={[3,5]} fontWeight={2} onClick={e => this.selectTab(e, '2')}>
                Funds
              </Link>
            </Box>
            <Box className={[styles.tab,this.props.selectedTab==='3' ? styles.tabSelected : '']} width={[1/3]} textAlign={'center'} borderRight={'none'}>
              <Link display={'block'} py={[3,4]} fontSize={[3,5]} fontWeight={2} onClick={e => this.selectTab(e, '3')}>
                Rebalance
              </Link>
            </Box>
          </Flex>

          <Box py={[2, 4]}>
            {this.props.selectedTab === '1' &&
              <Box textAlign={'text'}>
                <Box px={[2,0]} py={[2, 4]}>
                  <Heading.h3 py={[3, 'initial']} fontFamily={'sansSerif'} fontSize={[5, 6]} fontWeight={2} color={'blue'} textAlign={'center'}>
                    Earn {this.state.maxRate}% APR on your DAI
                  </Heading.h3>
                  <Heading.h4 my={[2,3]} color={'black'} fontWeight={1} textAlign={'center'}>
                    We offer the best available interest rate for your DAI through different lending platforms.
                  </Heading.h4>
                </Box>

                <CryptoInput
                  isMobile={this.props.isMobile}
                  account={this.props.account}
                  defaultValue={this.state.lendAmount}
                  IdleDAIPrice={this.state.IdleDAIPrice}
                  BNify={this.BNify}
                  trimEth={this.trimEth}
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

            {this.props.selectedTab === '2' &&
              <Box px={[2,0]} py={0} textAlign={'text'}>
                {this.props.account &&
                  <>
                    <Box borderBottom={'1px solid #D6D6D6'}>
                      <Flex flexDirection={['column','row']} py={[2,3]} width={[1,'70%']} m={'0 auto'}>
                        <Box width={[1,1/2]}>
                          <Text fontFamily={'sansSerif'} fontSize={[2, 3]} fontWeight={2} color={'black'} textAlign={'center'}>
                            Redeemable Funds
                          </Text>
                          <Heading.h3 fontFamily={'sansSerif'} fontSize={[5,6]} fontWeight={2} color={'black'} textAlign={'center'}>
                            { reedemableFunds }
                          </Heading.h3>
                        </Box>
                        <Box width={[1,1/2]}>
                          <Text fontFamily={'sansSerif'} fontSize={[2, 3]} fontWeight={2} color={'black'} textAlign={'center'}>
                            Current earnings
                          </Text>
                          <Heading.h3 fontFamily={'sansSerif'} fontSize={[5,6]} fontWeight={2} color={'black'} textAlign={'center'}>
                            { currentEarnings }
                          </Heading.h3>
                        </Box>
                      </Flex>
                    </Box>
                    <Box borderBottom={'1px solid #D6D6D6'}>
                      <Flex flexDirection={['column','row']} py={[2,3]} width={[1,'70%']} m={'0 auto'}>
                        <Box width={[1,1/2]}>
                          <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'black'} textAlign={'center'}>
                            Current holdings
                          </Text>
                          <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                            { balanceOfIdleDAI }
                          </Heading.h3>
                        </Box>
                        <Box width={[1,1/2]}>
                          <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'black'} textAlign={'center'}>
                            idleDAI Price
                          </Text>
                          <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                            { IdleDAIPrice }
                          </Heading.h3>
                        </Box>
                      </Flex>
                    </Box>
                    <Box my={[3,4]}>
                      {this.renderPrevTxs()}
                    </Box>
                    {!isNaN(this.trimEth(this.state.DAIToRedeem)) && this.trimEth(this.state.DAIToRedeem) > 0 &&
                      <Flex
                        textAlign='center'>
                        <Button onClick={e => this.redeem(e, 'IdleDAI')} borderRadius={4} size={this.props.isMobile ? 'medium' : 'large'} mainColor={'blue'} contrastColor={'white'} fontWeight={2} fontSize={[2,3]} mx={'auto'} px={[4,5]} mt={2}>
                          REDEEM DAI
                        </Button>
                      </Flex>
                    }
                    {(isNaN(this.trimEth(this.state.DAIToRedeem)) || parseFloat(this.state.DAIToRedeem)<=0) &&
                      <Flex
                        textAlign='center'>
                        <Button onClick={e => this.selectTab(e, '1')} borderRadius={4} size={this.props.isMobile ? 'medium' : 'large'} mainColor={'blue'} contrastColor={'white'} fontWeight={2} fontSize={[2,3]} mx={'auto'} px={[4,5]} mt={2}>
                          LEND NOW
                        </Button>
                      </Flex>
                    }
                  </>
                }
                {!this.props.account &&
                  <Flex
                    alignItems={'center'}
                    flexDirection={'column'}
                    textAlign={'center'}>
                      <Heading.h3 fontFamily={'sansSerif'} fontWeight={2} textAlign={'center'}>
                        Please connect to view your available funds.
                      </Heading.h3>
                      <Button
                        onClick={e => this.redeem(e, 'IdleDAI')}
                        size={this.props.isMobile ? 'medium' : 'large'}
                        borderRadius={4}
                        mainColor={'blue'}
                        contrastColor={'white'}
                        fontWeight={2}
                        fontSize={[2,3]}
                        mx={'auto'}
                        px={[4,5]}
                        mt={[3,4]}
                      >
                        CONNECT
                      </Button>
                  </Flex>
                }
              </Box>
            }

            {this.props.selectedTab === '3' && !!this.state.shouldRebalance &&
              <Box px={[2,0]} py={[2, 4]} textAlign={'text'}>
                <Heading.h3 fontFamily={'sansSerif'} fontWeight={2} textAlign={'center'}>
                  Rebalance the entire pool.<br />All users will bless you.
                </Heading.h3>
                <Heading.h4 my={[2,3]} px={[2,0]} color={'black'} fontWeight={1} textAlign={'center'}>
                  The whole pool is automatically rebalanced each time a user interacts with Idle.<br />
                  But you can also trigger a rebalance anytime and this will benefit all users (included you).
                </Heading.h4>
                <Flex
                  textAlign='center'
                  pt={2}>
                  <Button
                    disabled={this.state.shouldRebalance}
                    onClick={e => this.rebalance(e, 'cDAI')}
                    size={this.props.isMobile ? 'medium' : 'large'}
                    borderRadius={4}
                    className={styles.magicButton}
                    mainColor={'transparent'}
                    contrastColor={'white'} fontWeight={2} fontSize={[2,3]} mx={'auto'} px={[4,5]} mt={[2,3]}>REBALANCE NOW</Button>
                </Flex>
              </Box>
            }

            {this.props.selectedTab === '3' && !this.state.shouldRebalance &&
              <Box py={[2, 4]} textAlign={'center'}>
                <Heading.h3 fontFamily={'sansSerif'} fontWeight={2} textAlign={'center'}>
                  The pool is already balanced.
                </Heading.h3>
                <Heading.h4 my={[2,3]} px={[2,0]} color={'black'} fontWeight={1} textAlign={'center'}>
                  The current interest rate is already the best between the integrated protocols.<br />Sit back and enjoy your earnings.
                </Heading.h4>
                <Flex
                  textAlign={'center'}>
                  <Button
                    disabled={'disabled'}
                    onClick={e => {e.preventDefault()}}
                    size={this.props.isMobile ? 'medium' : 'large'}
                    borderRadius={4}
                    mainColor={'darkGray'}
                    contrastColor={'black'} fontWeight={2} fontSize={[2,3]} mx={'auto'} px={[4,5]} mt={[2,3]}
                  >
                    REBALANCE NOW
                  </Button>
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
