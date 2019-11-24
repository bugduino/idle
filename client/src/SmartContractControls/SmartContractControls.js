import styles from './SmartContractControls.module.scss';
import React from "react";
import { Form, Flex, Box, Heading, Text, Button, Link, Icon, Pill, Loader, Flash, Image } from "rimble-ui";
import BigNumber from 'bignumber.js';
import TxProgressBar from '../TxProgressBar/TxProgressBar.js';
import CryptoInput from '../CryptoInput/CryptoInput.js';
import ApproveModal from "../utilities/components/ApproveModal";
import WelcomeModal from "../utilities/components/WelcomeModal";
import MaxCapModal from "../utilities/components/MaxCapModal";
import axios from 'axios';
import moment from 'moment';
import CountUp from 'react-countup';

const env = process.env;

// mainnet
const OldIdleAddress = '0x10cf8e1CDba9A2Bd98b87000BCAdb002b13eA525'; // v0.1 hackathon version
const cDAIAddress = '0xf5dce57282a584d2746faf1593d3121fcac444dc';
const iDAIAddress = '0x14094949152eddbfcd073717200da82fed8dc960';

const daysInYear = 365.2422;

const customLog = (...props) => { console.log(moment().format('HH:mm:ss'),...props); }
const customLogError = (...props) => { console.error(moment().format('HH:mm:ss'),...props); }

class SmartContractControls extends React.Component {
  state = {
    iDAIRate: 0,
    cDAIRate: 0,
    cDAIToRedeem: 0,
    partialRedeemEnabled: false,
    disableLendButton: false,
    disableRedeemButton: false,
    welcomeIsOpen: false,
    approveIsOpen: false,
    capReached: false,
    showFundsInfo:false,
    isApprovingToken:false,
    isApprovingDAITest: true,
    redeemProcessing: false,
    lendingProcessing: false,
    tokenBalance: this.props.accountBalanceToken,
    tokenName: 'DAI',
    baseTokenName: 'DAI',
    lendAmount: '',
    redeemAmount: '',
    updateInProgress: false,
    needsUpdate: false,
    genericError: null,
    genericErrorRedeem: null,
    buyTokenMessage:null,
    selectedTab: '1',
    amountLent: null,
    IdleDAISupply: null,
    idleDAICap: 30000,
    earning: null,
    earningIntervalId: null,
    earningPerDay: null,
    earningPerYear: null,
    tokenBalanceBNify: null,
    maxRate: '-',
    calculataingShouldRebalance: true,
    fundsTimeoutID: null,
    idleTokenBalance: null,
    executedTxs:null,
    lendingTx: null,
    redeemTx: null,
    approveTx: null,
    fundsError: false,
    prevTxs : {},
    transactions:{}
  };

  renderZeroExInstant = (e,amount) => {
    if (e){
      e.preventDefault();
    }
    if (window.zeroExInstant){
      const params = {
        orderSource: 'https://api.radarrelay.com/0x/v2/',
        affiliateInfo: {
            feeRecipient: '0xf1363d3d55d9e679cc6aa0a0496fd85bdfcf7464',
            feePercentage: 0.0075
        },
        defaultSelectedAssetData: this.props.tokenConfig.zeroExInstant.assetData,
        availableAssetDatas: [this.props.tokenConfig.zeroExInstant.assetData],
        onSuccess: async (txHash) => {
          await this.getTokenBalance();
          this.useEntireBalance(this.state.tokenBalance);
          customLog('Success! Transaction hash is: ' + txHash)
        },
        onClose: () => {
          customLog('Closed');
          return true;
        }
      };

      if (amount){
        params.defaultAssetBuyAmount = parseFloat(amount);
      }
      window.zeroExInstant.render(params, 'body');
    }
  }

  // utilities
  trimEth = (eth,decimals) => {
    decimals = !isNaN(decimals) ? decimals : 6;
    return this.BNify(eth).toFixed(decimals);
  }

  BNify = s => new BigNumber(String(s))

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
    this.setState({calculataingShouldRebalance:true});

    const res = await this.genericIdleCall('rebalanceCheck');
    if (!res || !Object.keys(res).length){
      return false;
    }

    this.setState({
      calculataingShouldRebalance: false,
      shouldRebalance: res[0],
      needsUpdate: false
    });
  }

  toggleShowFundsInfo = (e) => {
    e.preventDefault();
    this.setState(state => ({
      ...state,
      showFundsInfo: !state.showFundsInfo
    }));
  }

  togglePartialRedeem = () => {
    this.setState(state => ({
      ...state,
      partialRedeemEnabled: !state.partialRedeemEnabled
    }));
  }

  getPendingTransactions = () => {
    const txs = localStorage ? JSON.parse(localStorage.getItem('transactions')) : this.props.transactions;
    if (!txs){
      return false;
    }
    const pendingTxHash = Object.keys(txs).filter((hash,i) => { return txs[hash].status==='pending' });
    const pendingTransactions = Object.keys(txs)
      .filter(key => pendingTxHash.includes(key))
      .reduce((obj, key) => {
        obj[key] = txs[key];
        return obj;
      }, {});

    // const state = {};
    Object.keys(pendingTransactions).forEach((txHash,i) => {
      const tx = pendingTransactions[txHash];
      // customLog('getPendingTransactions',tx);
      switch (tx.method){
        case 'mintIdleToken':
          window.web3.eth.getTransaction(txHash,(err,transaction) => {
            if (transaction.from.toLowerCase() === this.props.account.toLowerCase()){
              this.setState({
                lendingProcessing:true,
                lendingTx:tx
              });
              this.listenTransaction(txHash,(tx) => {
                this.setState({
                  lendingProcessing:false,
                  lendingTx:null,
                  needsUpdate:true
                });
                // this.addTransaction(tx);
              });
            } else {
              this.setState({
                lendingProcessing:false,
                lendingTx:null
              });
              // this.deleteTransaction(tx);
            }
          });
        break;
        case 'redeemIdleToken':
          window.web3.eth.getTransaction(txHash,(err,transaction) => {
            // customLog('redeemIdleToken',transaction.from,this.props.account);
            if (transaction.from.toLowerCase() === this.props.account.toLowerCase()){
              this.setState({
                redeemProcessing:true,
                redeemTx:tx
              });
              this.listenTransaction(txHash,(tx) => {
                this.setState({
                  redeemProcessing:false,
                  redeemTx:null,
                  needsUpdate:true
                });
                // this.addTransaction(tx);
              });
            } else {
              this.setState({
                redeemProcessing:false,
                redeemTx:null
              });
              // this.deleteTransaction(tx);
            }
          });
        break;
        default:
        break;
      }
    });
  }

  listenTransaction = (hash,callback) => {
    window.web3.eth.getTransactionReceipt(hash,(err,tx) => {
      customLog('getTransactionReceipt',hash,tx);
      if (tx){
        if (callback){
          return callback(tx);
        }
        return tx;
      }
      setTimeout(() => { this.listenTransaction(hash,callback) },5000);
      return err;
    });
  }

  getAprs = async () => {
    const aprs = await this.genericIdleCall('getAPRs');
    const bestToken = await this.genericIdleCall('bestToken');
    const currentProtocol = await this.getCurrentProtocol(bestToken);
    if (!aprs){
      setTimeout(() => {
        this.getAprs();
      },5000);
      return false;
    }
    const maxRate = this.toEth(Math.max(aprs[0],aprs[1]));
    const currentRate = bestToken ? (bestToken.toString().toLowerCase() === cDAIAddress ? aprs[0] : aprs[1]) : null;
    this.setState({
      [`compoundRate`]: aprs ? (+this.toEth(aprs[0])).toFixed(2) : '0.00',
      [`fulcrumRate`]: aprs ? (+this.toEth(aprs[1])).toFixed(2) : '0.00',
      [`maxRate`]: aprs ? ((+maxRate).toFixed(2)) : '0.00',
      needsUpdate: false,
      currentProtocol,
      currentRate
    });
  };
  getCurrentProtocol = async (bestToken) => {
    bestToken = bestToken ? bestToken : await this.genericIdleCall('bestToken');
    // customLog('getCurrentProtocol',bestToken);
    if (bestToken){
      return bestToken.toString().toLowerCase() === cDAIAddress ? 'Compound' : 'Fulcrum';
    }
    return false;
  }
  getPriceInToken = async (contractName) => {
    const totalIdleSupply = await this.genericContractCall(contractName, 'totalSupply');
    let price = await this.genericContractCall(contractName, 'tokenPrice');
    const navPool = this.BNify(totalIdleSupply).div(1e18).times(this.BNify(price).div(1e18));
    // customLog('getPriceInToken',totalIdleSupply.toString(),price.toString(),navPool.toString());
    this.setState({
      idleTokenPrice: (totalIdleSupply || totalIdleSupply === 0) && totalIdleSupply.toString() === '0' ? 0 : (+this.toEth(price)),
      navPool: navPool,
      needsUpdate: false
    });
    return price;
  };
  getTotalSupply = async (contractName) => {
    const totalSupply = await this.genericContractCall(contractName, 'totalSupply');
    this.setState({
      [`${contractName}Supply`]: totalSupply,
      needsUpdate: false
    });
    return totalSupply;
  };
  getOldPriceInToken = async (contractName) => {
    const totalIdleSupply = await this.genericContractCall(contractName, 'totalSupply');
    let price = await this.genericContractCall(contractName, 'tokenPrice');
    this.setState({
      [`OldIdleDAIPrice`]: (totalIdleSupply || totalIdleSupply === 0) && totalIdleSupply.toString() === '0' ? 0 : (+this.toEth(price)),
      needsUpdate: false
    });
    return price;
  };

  getTokenDecimals = async () => {
    return await this.genericContractCall(this.props.selectedToken,'decimals');
  }

  getTokenBalance = async () => {
    if (this.props.account){
      const tokenBalance = await this.genericContractCall(this.props.selectedToken,'balanceOf',[this.props.account]);
      const tokenDecimals = await this.getTokenDecimals();
      if (tokenBalance){
        customLog('getTokenBalance',tokenBalance.toString(),tokenDecimals,this.BNify(tokenBalance).div(this.BNify(`1e${tokenDecimals}`)).toString());
        return this.setState({
          tokenDecimals,
          tokenBalance: this.BNify(tokenBalance).div(this.BNify(`1e${tokenDecimals}`)).toString()
        });
      } else {
        console.error('Error on getting balance');
      }
    }
    return null;
  };
  reloadFunds = async(e) => {
    e.preventDefault();
    this.getBalanceOf(this.props.tokenConfig.idle.token);
  }
  getBalanceOf = async (contractName,count) => {
    count = count ? count : 0;

    if (count===3){
      this.setState({
        fundsError:true
      });
      return false;
    }

    let price = await this.getPriceInToken(contractName);
    let balance = await this.genericContractCall(contractName, 'balanceOf', [this.props.account]);
    if (balance) {
      balance = this.BNify(balance).div(1e18);
      price = this.BNify(price).div(1e18);
      const tokenToRedeem = balance.times(price);
      let earning = 0;

      // customLog('tokenToRedeem',tokenToRedeem.toString(),'amountLent',this.state.amountLent);

      if (this.state.amountLent && this.trimEth(this.state.amountLent.toString())>0 && this.trimEth(tokenToRedeem.toString())>0 && parseFloat(tokenToRedeem.toString())<parseFloat(this.state.amountLent.toString())){
        customLogError('Balance '+this.trimEth(tokenToRedeem.toString())+' is less than AmountLent ('+this.trimEth(this.state.amountLent.toString())+').. wait 5 seconds and try again');
        setTimeout(async () => {
          await this.getPrevTxs();
          this.getBalanceOf(contractName,count+1);
        },5000);
        return false;
      }

      if (this.BNify(tokenToRedeem).gt(this.BNify(this.state.amountLent))){
        earning = tokenToRedeem.minus(this.BNify(this.state.amountLent));
      }

      // customLog('earning',earning.toString());

      const redirectToFundsAfterLogged = localStorage ? parseInt(localStorage.getItem('redirectToFundsAfterLogged')) : true;

      // Select seconds Tab
      if (balance.gt(0) && !this.state.tokenToRedeemParsed && redirectToFundsAfterLogged){
        this.selectTab({ preventDefault:()=>{} },'2');
      }

      if (localStorage){
        localStorage.removeItem('redirectToFundsAfterLogged');
      }

      const currentApr = this.BNify(this.state.maxRate).div(100);
      const earningPerYear = tokenToRedeem.times(currentApr);
      const earningPerDay = earningPerYear.div(365);

      customLog('getBalanceOf',balance.toString(),tokenToRedeem.toString(),this.state.amountLent,earning,currentApr,earningPerYear);

      return this.setState({
        fundsError:false,
        [`balanceOf${contractName}`]: balance,
        tokenToRedeemParsed: tokenToRedeem.toString(),
        tokenBalanceBNify:balance,
        idleTokenBalance:balance.toString(),
        currentApr,
        tokenToRedeem,
        earning,
        earningPerDay,
        earningPerYear
      });
    }

    return balance;
  };

  animateCurrentEarnings = (count) => {
    count = !isNaN(count) ? count : 1;
    if (!this.state.tokenToRedeem){
      if (count<=3){
        window.setTimeout(()=>{this.animateCurrentEarnings(count+1)},500);
      }
      return false;
    }
    const currentApr = this.BNify(this.state.maxRate).div(100);
    const currentBalance = this.BNify(this.state.tokenToRedeem);
    const earningPerYear = currentBalance.times(currentApr);
    const secondsInYear = this.BNify(31536000); // Seconds in a Year
    // const blocksPerYear = this.BNify(2336000); // Blocks per year
    let minEarningPerInterval = this.BNify(0.000000001);
    // let earningPerSecond = earningPerYear.div(secondsInYear);
    let earningPerInterval = earningPerYear.div(secondsInYear);
    let interval = 10;
    if (interval<1000){
      earningPerInterval = earningPerInterval.div((1000/interval));
    }

    if (earningPerInterval<minEarningPerInterval){
      const times = minEarningPerInterval.div(earningPerInterval).toFixed(3);
      earningPerInterval = minEarningPerInterval;
      interval *= times;
    }

    interval = Math.floor(interval);

    if (this.state.earningIntervalId){
      window.clearInterval(this.state.earningIntervalId);
    }

    const earningIntervalId = window.setInterval(() => {
      if (this.state.tokenToRedeem && this.state.earning && earningPerInterval){
        const newTokenToRedeem = this.state.tokenToRedeem.plus(earningPerInterval);
        const newEarning = this.state.earning.plus(earningPerInterval);
        this.setState({
          tokenToRedeemParsed:newTokenToRedeem.toString(),
          tokenToRedeem:newTokenToRedeem,
          earning:newEarning
        });
      }
    },interval);

    this.setState({
      earningIntervalId,
      earningPerYear
    });
  };

  getOldBalanceOf = async contractName => {
    let price = await this.getOldPriceInToken(contractName);
    let balance = await this.genericContractCall(contractName, 'balanceOf', [this.props.account]);
    if (balance) {
      balance = this.BNify(balance).div(1e18);
      price = this.BNify(price).div(1e18);
      const tokenToRedeem = balance.times(price);
      let earning = 0;

      if (this.state.amountLent){
        earning = tokenToRedeem.minus(this.BNify(this.state.amountLent));
      }
      this.setState({
        [`balanceOf${contractName}`]: balance,
        [`oldDAIToRedeem`]: tokenToRedeem.toString(),
        oldEarning: earning,
        needsUpdate: false
      });
    }
    return balance;
  };

  // should be called with DAI contract as params
  getAllowance = async contractName => {
    let allowance = await this.genericContractCall(
      contractName, 'allowance', [this.props.account, this.props.tokenConfig.idle.address]
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
      customLog('Wrong contract name', contractName);
      return;
    }

    const value = await contract.methods[methodName](...params).call().catch(error => {
      customLog(`${contractName} contract method ${methodName} error: `, error);
      this.setState({ error });
    });
    return value;
  }

  // Idle
  genericIdleCall = async (methodName, params = []) => {
    return await this.genericContractCall(this.props.tokenConfig.idle.token, methodName, params).catch(err => {
      customLogError('Generic Idle call err:', err);
    });
  }

  disableERC20 = (e, name) => {
    e.preventDefault();
    // No need for callback atm
    this.props.contractMethodSendWrapper(name, 'approve', [
      this.props.tokenConfig.idle.address,
      0 // Disapprova
    ],null,(tx)=>{
      this.setState({
        isApprovingToken: false,
        approveTx:null,
        [`isApproving${name}`]: false, // TODO when set to false?
      });
    }, (tx) => {
      // this.addTransaction(tx);
      this.setState({
        approveTx: tx
      });
    });

    this.setState({
      isApprovingToken: true,
      [`isApproving${name}`]: true, // TODO when set to false?
      approveIsOpen: false
    });
  };

  checkTransactionMined = (tx) => {
    let transaction = this.props.transactions[tx.created];
    return transaction && transaction.status === 'success' && transaction.confirmationCount>1;
  }

  /*
  deleteTransaction = (tx) => {
    let transactions = this.state.transactions;
    if (transactions[tx.transactionHash]){
      delete transactions[tx.transactionHash];
      if (localStorage){
        localStorage.setItem('transactions',JSON.stringify(transactions));
      }
      return this.setState({
        transactions
      });
    }
  }

  addTransaction = (tx,update) => {
    update = update ? update : false;
    let transactions = this.state.transactions;
    if (!transactions[tx.transactionHash] || update){
      // customLog('addTransaction',tx.transactionHash,tx.status);
      transactions[tx.transactionHash] = tx;
      if (localStorage){
        localStorage.setItem('transactions',JSON.stringify(transactions));
      }
      return this.setState({
        transactions
      });
    }
    return null;
  }
  */

  enableERC20 = (e, token) => {
    e.preventDefault();
    // No need for callback atm
    this.props.contractMethodSendWrapper(token, 'approve', [
      this.props.tokenConfig.idle.address,
      this.props.web3.utils.toTwosComplement('-1') // max uint solidity
      // this.props.web3.utils.BN(0) // Disapprova
    ],null,(tx)=>{
      this.setState({
        isApprovingToken: false,
        [`isApproving${token}`]: false, // TODO when set to false?
        'needsUpdate': true,
        approveTx:null,
      });
    }, (tx) => {
      // this.addTransaction(tx);
      this.setState({
        approveTx: tx
      });
    });

    this.setState({
      isApprovingToken: true,
      [`isApproving${token}`]: true, // TODO when set to false?
      approveIsOpen: false
    });
  };

  rebalance = e => {
    e.preventDefault();

    this.setState(state => ({
      ...state,
      rebalanceProcessing: this.props.account ? true : false
    }));

    this.props.contractMethodSendWrapper(this.props.tokenConfig.idle.token, 'rebalance', [], null , (tx) => {
      const needsUpdate = tx.status === 'success' && !this.checkTransactionMined(tx);
      this.setState({
        needsUpdate: needsUpdate,
        rebalanceProcessing: false
      });
    });
  };

  checkTokenApproved = async () => {
    if (this.props.account) {
      const value = this.props.web3.utils.toWei('0','ether');
      const allowance = await this.getAllowance(this.props.selectedToken); // DAI
      const tokenApproved = this.BNify(allowance).gt(this.BNify(value.toString()));
      customLog('checkTokenApproved',value,allowance.toString(),tokenApproved);
      return this.setState({
        isTokenApproved: tokenApproved,
        [`is${this.props.selectedToken}Approved`]: tokenApproved
      });
    }
    return null;
  }

  mint = async (e, contractName) => {
    if (this.state[`isApprovingDAI`]){
      return false;
    }

    e.preventDefault();
    if (this.props.account && !this.state.lendAmount) {
      return this.setState({genericError: `Insert a ${this.props.selectedToken} amount to lend`});
    }

    const value = this.props.web3.utils.toWei(
      this.state.lendAmount || '0',
      "ether"
    );

    const IdleDAISupply = this.BNify(this.state.IdleDAISupply).div(1e18);
    const idleTokenPrice = this.BNify(this.state.idleTokenPrice);
    const toMint = this.BNify(value).div(1e18).div(idleTokenPrice);
    const newTotalSupply = toMint.plus(IdleDAISupply);
    const idleDAICap = this.BNify(this.state.idleDAICap);

    if (this.props.account && newTotalSupply.gt(idleDAICap)) {
      this.setState({capReached: true});
      return;
    }

    // check if Idle is approved for DAI
    if (this.props.account && !this.state.isTokenApproved) {
      return this.setState({approveIsOpen: true});
    }

    if (localStorage){
      localStorage.setItem('redirectToFundsAfterLogged',0);
    }

    // No need for callback atm
    this.props.contractMethodSendWrapper(this.props.tokenConfig.idle.token, 'mintIdleToken', [
      value
    ], null, (tx) => {
      const txSucceeded = tx.status === 'success';
      const needsUpdate = txSucceeded && !this.checkTransactionMined(tx);
      customLog('mintIdleToken_callback needsUpdate:',tx.status,this.checkTransactionMined(tx),needsUpdate);
      if (txSucceeded){
        this.selectTab({ preventDefault:()=>{} },'2');
      }
      this.setState({
        lendingProcessing: false,
        [`isLoading${contractName}`]: false,
        lendingTx:null,
        needsUpdate
      });
    }, (tx) => {
      // this.addTransaction(tx);
      this.setState({
        lendingTx: tx
      });
    });

    this.setState({
      [`isLoading${contractName}`]: false,
      lendingProcessing: this.props.account,
      lendAmount: '',
      genericError: '',
    });
  };

  redeem = async (e, contractName) => {
    e.preventDefault();

    this.setState(state => ({
      ...state,
      [`isLoading${contractName}`]: true,
      redeemProcessing: true
    }));

    // let IdleDAIBalance = this.toWei('0');
    // if (this.props.account) {
    //   IdleDAIBalance = await this.genericContractCall(contractName, 'balanceOf', [this.props.account]);
    // }

    let idleTokenToRedeem = this.props.web3.utils.toWei(
      this.state.redeemAmount || '0',
      "ether"
    );

    customLog('redeem',idleTokenToRedeem);

    this.props.contractMethodSendWrapper(contractName, 'redeemIdleToken', [
      idleTokenToRedeem
    ], null, (tx) => {
      const needsUpdate = tx.status === 'success' && !this.checkTransactionMined(tx);
      customLog('redeemIdleToken_mined_callback needsUpdate:',tx.status,this.checkTransactionMined(tx),needsUpdate);
      this.setState({
        [`isLoading${contractName}`]: false,
        redeemProcessing: false,
        redeemTx:null,
        needsUpdate
      });
    }, (tx) => {
      customLog('redeemIdleToken_receipt_callback',tx.transactionHash,tx.status);
      // this.addTransaction(tx);
      this.setState({
        redeemTx: tx
      });
    });
  };

  useEntireBalanceRedeem = (balance) => {
    // this.setState({ redeemAmount: balance.toString() });
    this.handleChangeAmountRedeem({
      target:{
        value: balance.toString()
      }
    });
  }

  useEntireBalance = (balance) => {
    // this.setState({ lendAmount: balance.toString() });
    this.handleChangeAmount({
      target:{
        value: balance.toString()
      }
    });
  }

  handleChangeAmountRedeem = (e) => {
    if (this.props.account){
      let amount = e.target.value;
      // customLog('handleChangeAmountRedeem',amount,this.state.tokenBalanceBNify);
      this.setState({ redeemAmount: amount });

      let disableRedeemButton = false;
      let genericErrorRedeem = '';

      if (this.props.account) {
        if (this.BNify(amount).gt(this.BNify(this.state.tokenBalanceBNify))){
          disableRedeemButton = true;
          genericErrorRedeem = 'The inserted amount exceeds your redeemable balance';
        } else if (this.BNify(amount).lte(0)) {
          disableRedeemButton = true;
          genericErrorRedeem = 'Please insert a positive amount';
        }
      }

      return this.setState({
        disableRedeemButton,
        genericErrorRedeem
      });
    } else {
      this.redeem(e);
    }
  };

  handleChangeAmount = (e) => {
    if (this.props.account){
      let amount = e.target.value;
      this.setState({ lendAmount: amount });

      let disableLendButton = false;
      let genericError = '';
      let buyTokenMessage = null;

      if (this.props.account) {
        if (this.BNify(amount).gt(this.BNify(this.props.tokenBalance))){
          disableLendButton = true;
          buyTokenMessage = `The inserted amount exceeds your balance. Click here to buy more ${this.props.selectedToken}`;
          // genericError = `The inserted amount exceeds your ${this.props.selectedToken} balance`;
        } else if (this.BNify(amount).lte(0)) {
          disableLendButton = true;
          genericError = `Please insert a positive amount of ${this.props.selectedToken}`;
        }
      }

      return this.setState({
        buyTokenMessage,
        disableLendButton,
        genericError
      });
    } else {
      this.mint(e);
    }
  };
  toggleModal = (e) => {
    this.setState(state => ({...state, approveIsOpen: !state.approveIsOpen }));
  };
  toggleMaxCapModal = (e) => {
    this.setState(state => ({...state, capReached: !state.capReached }));
  };
  toggleWelcomeModal = (e) => {
    this.setState(state => ({...state, welcomeIsOpen: !state.welcomeIsOpen }));
  };

  getPrevTxs = async () => {
    // customLog('Call getPrevTxs');
    const txs = await axios.get(`
      https://api.etherscan.io/api?module=account&action=tokentx&address=${this.props.account}&startblock=8119247&endblock=999999999&sort=asc&apikey=${env.REACT_APP_ETHERSCAN_KEY}
    `).catch(err => {
      customLog('Error getting prev txs');
    });
    if (!txs || !txs.data || !txs.data.result) {
      return;
    }

    const results = txs.data.result;
    const prevTxs = results.filter(
        tx => {
          return (tx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase()) ||
              (tx.from.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase()) ||
              (tx.from.toLowerCase() === iDAIAddress.toLowerCase() && tx.to.toLowerCase() === this.props.account.toLowerCase()) ||
              (tx.from.toLowerCase() === cDAIAddress.toLowerCase() && tx.to.toLowerCase() === this.props.account.toLowerCase())
          }
      ).filter(tx => {
        const internalTxs = results.filter(r => r.hash === tx.hash);
        // remove txs from old contract
        return !internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === OldIdleAddress.toLowerCase()).length;
      }).map(tx => ({...tx, value: this.toEth(tx.value)}));

    let amountLent = 0;
    let transactions = {};



    prevTxs.forEach((tx,index) => {
      // Deposited
      if (tx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase()){
        amountLent += parseFloat(tx.value);
        // console.log('Deposited '+parseFloat(tx.value),'AmountLent',amountLent);
      } else if (tx.to.toLowerCase() === this.props.account.toLowerCase()){
        amountLent -= parseFloat(tx.value);
        amountLent = Math.max(0,amountLent);
        // console.log('Redeemed '+parseFloat(tx.value),'AmountLent',amountLent);
      }
      transactions[tx.hash] = tx;
    });

    // Add missing executed transactions
    if (this.state.executedTxs){

      console.log('getPrevTxs adding executedTxs',this.state.executedTxs);

      const asyncForEach = async(array, callback) => {
        for (let index = 0; index < array.length; index++) {
          await callback(array[index], index, array);
        }
      }

      await asyncForEach(Object.keys(this.state.executedTxs),async (key,i) => {
        const tx = this.state.executedTxs[key];

        if (transactions[tx.transactionHash]){
          return;
        }

        const realTx = await (new Promise( async (resolve, reject) => {
          window.web3.eth.getTransaction(tx.transactionHash,(err,tx)=>{
            if (err){
              return reject(err);
            }
              return resolve(tx);
            });
        }));
        realTx.contractAddress = this.props.tokenConfig.address;
        realTx.timeStamp = parseInt(tx.created/1000);

        switch (tx.method){
          case 'mintIdleToken':
            realTx.status = 'Deposited';
            realTx.value = tx.params ? this.toEth(tx.params[0]).toString() : 0;
          break;
          case 'redeemIdleToken':
            realTx.status = 'Redeemed';
            realTx.value = tx.params ? (+this.toEth(tx.params[0])*parseFloat(this.state.idleTokenPrice)).toString() : 0;
          break;
          default:
          break;
        }
        realTx.tokenSymbol = this.props.selectedToken;
        realTx.tx = tx;

        // Deposited
        if (realTx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase()){
          amountLent += parseFloat(realTx.value);
        } else if (realTx.to.toLowerCase() === this.props.account.toLowerCase()){
          amountLent -= parseFloat(realTx.value);
          amountLent = Math.max(0,amountLent);
        }

        transactions[realTx.hash] = realTx;

        console.log('getPrevTxs inserted executed tx',transactions[realTx.hash]);
      });
    }

    let earning = this.state.earning;
    if (this.state.tokenToRedeem){
      earning = this.state.tokenToRedeem.minus(this.BNify(amountLent));
    }

    amountLent = Math.max(0,amountLent);

    return this.setState({
      prevTxs: transactions,
      amountLent,
      earning
    });
  };

  // Check for updates to the transactions collection
  processTransactionUpdates = prevTxs => {
    const transactions = this.state.prevTxs || {};
    let update_txs = false;
    let refresh = false;
    const executedTxs = {};
    if (Object.keys(this.props.transactions).length){
      Object.keys(this.props.transactions).forEach(key => {
        let newTx = this.props.transactions[key];
        // Check if it is a new transaction OR status changed 
        if ((!prevTxs[key] || prevTxs[key].status !== newTx.status)){

          // Delete pending transaction if succeded or error
          if (newTx.status === 'success' || newTx.status === 'error') {
              refresh = true;
              if (newTx.status === 'success'){
                executedTxs[newTx.transactionHash] = newTx;
              }
          // Transaction is pending add it in the list
          } else {
            let tx = {
              from: '',
              to: '',
              contractAddress:this.props.tokenConfig.address,
              status: 'Pending',
              hash: key,
              value: 0,
              tokenName: '',
              tokenSymbol: '',
              timeStamp: parseInt(newTx.lastUpdated/1000)
            };

            if (newTx.transactionHash) {
              tx.hash = newTx.transactionHash.toString();
            }

            transactions[key] = tx;

            update_txs = true;
          }
        }
      });

      // console.log('processTransactionUpdates',refresh,update_txs,prevTxs);

      if (refresh){
        this.setState({
          executedTxs,
          prevTxs: transactions,
          'needsUpdate':true
        });
      } else if (update_txs){
        this.setState({
          prevTxs: transactions,
          'needsUpdate':false
        });
      }
    }
  };

  // Clear all the timeouts
  async componentWillUnmount(){
    var id = window.setTimeout(function() {}, 0);

    while (id--) {
        window.clearTimeout(id); // will do nothing if no timeout with id is present
    }
  }

  async componentDidMount() {

    customLog('SmartContractControls componentDidMount',this.state.accountBalanceToken);

    const script = document.createElement("script");
    script.src = "https://instant.0x.org/instant.js";
    script.async = true;
    document.body.appendChild(script);

    customLog('Smart contract didMount')
    // do not wait for each one just for the first who will guarantee web3 initialization
    const web3 = await this.props.initWeb3();
    if (!web3) {
      return customLog('No Web3 SmartContractControls')
    }

    customLog('Web3 SmartContractControls initialized')

    this.props.initContract('OldIdleDAI', OldIdleAddress, this.props.tokenConfig.idle.abi);
    this.props.initContract(this.props.tokenConfig.idle.token, this.props.tokenConfig.idle.address, this.props.tokenConfig.idle.abi).then(async () => {
      await Promise.all([
        this.getAprs(),
        this.getPriceInToken(this.props.tokenConfig.idle.token)
      ]);
    });

    /*
    // PUT TEMP FUNCTIONS HERE
    window.tempFunc = (tx) => {}
    */

    this.props.initContract(this.props.selectedToken, this.props.tokenConfig.address, this.props.tokenConfig.abi);
  }

  async componentDidUpdate(prevProps, prevState) {
    const accountChanged = prevProps.account !== this.props.account;
    const selectedTokenChanged = prevProps.selectedToken !== this.props.selectedToken;

    if (selectedTokenChanged){
      await this.componentDidMount();
    }

    if (this.props.account && (accountChanged || this.state.needsUpdate || selectedTokenChanged)) {

      // Reset funds and force loader
      this.setState({
        'tokenBalance':null,
        tokenToRedeemParsed:null,
        amountLent:null,
        earning:null,
        updateInProgress: true,
        needsUpdate: false
      });

      // this.getPendingTransactions();

      customLog('componentDidUpdate needsUpdate');

      await Promise.all([
        this.getTokenBalance(),
        this.checkTokenApproved(), // Check if the token is already approved
        this.getPrevTxs(),
        this.getOldBalanceOf('OldIdleDAI'),
        this.getTotalSupply(this.props.tokenConfig.idle.token)
      ]);

      // Keep this call seprated from others cause it needs getPrevTxs results
      await this.getBalanceOf(this.props.tokenConfig.idle.token);

      if (this.props.selectedTab === '3') {
        await this.rebalanceCheck();
      }

      /*
      // Check if first time entered
      let welcomeIsOpen = prevProps.account !== this.props.account;
      if (localStorage){
        welcomeIsOpen = welcomeIsOpen && !localStorage.getItem('firstLogin');
        localStorage.setItem('firstLogin',new Date().getTime().toString());
      } else {
        welcomeIsOpen = false;
      }
      */

      this.setState({
        updateInProgress: false
      });
    }

    if (this.props.selectedTab !== '2' && this.state.fundsTimeoutID){
      customLog("Clear funds timeout "+this.state.fundsTimeoutID);
      clearTimeout(this.state.fundsTimeoutID);
      this.setState({fundsTimeoutID:null});
    }

    // TO CHECK!!
    if (prevProps.transactions !== this.props.transactions){
      // Store transactions into Local Storage
      if (localStorage){
        localStorage.setItem('transactions',JSON.stringify(this.props.transactions));
      }
      console.log('Transactions changed from',prevProps.transactions,'to',this.props.transactions);
      this.processTransactionUpdates(prevProps.transactions);
    }
  }

  async selectTab(e, tabIndex) {
    e.preventDefault();
    this.props.updateSelectedTab(e,tabIndex);

    if (tabIndex === '3') {
      await this.rebalanceCheck();
    }

    if (tabIndex !== '2') {
      if (this.state.earningIntervalId){
        window.clearInterval(this.state.earningIntervalId);
      }
    } else {
      
    }

  }

  async getTransaction(hash) {
    return new Promise( async (resolve, reject) => {
      window.web3.eth.getTransaction(hash,(err,transaction) => {
        if (transaction){
          return resolve(transaction);
        }
        return reject(false);
      });
    });
  }

  async loadTxs_async(txsHashes) {
    const asyncForEach = async(array, callback) => {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
      }
    }

    var transactions = {};
    await asyncForEach(txsHashes,async (txHash,i) => {
      await window.web3.eth.getTransaction(txHash,(err,tx)=>{
        transactions[tx.hash] = tx;
      });
    });

    return transactions;
  }

  // TODO move in a separate component
  renderPrevTxs(prevTxs) {
    prevTxs = prevTxs ? prevTxs : (this.state.prevTxs || {});

    if (!Object.keys(prevTxs).length) {
      return null;
    }

    const txsIndexes = Object.keys(prevTxs);
    const txsToShow = 10;
    // let totalInterestsAccrued = 0;
    let depositedSinceLastRedeem = 0;
    let totalRedeemed = 0;

    let txs = txsIndexes.map((key, i) => {

      const tx = prevTxs[key];

      // Skip other tokens
      // customLog('renderPrevTxs',tx.tokenSymbol,this.props.selectedToken,tx.to.toLowerCase(),this.props.tokenConfig.idle.address.toLowerCase());
      if (tx.contractAddress !== this.props.tokenConfig.address){
        return false;
      }

      const date = new Date(tx.timeStamp*1000);
      const status = tx.status ? tx.status : tx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase() ? 'Deposited' : 'Redeemed';
      const parsedValue = parseFloat(tx.value);
      const value = parsedValue ? (this.props.isMobile ? parsedValue.toFixed(4) : parsedValue.toFixed(8)) : '-';
      const momentDate = moment(date);
      const formattedDate = momentDate.fromNow();
      const formattedDateAlt = momentDate.format('YYYY-MM-DD HH:mm:ss');
      let color;
      let icon;
      let interest = null;
      switch (status) {
        case 'Deposited':
          color = 'blue';
          icon = "ArrowDownward";
          depositedSinceLastRedeem+=parsedValue;
          // totalRedeemed = 0;
        break;
        case 'Redeemed':
          color = 'green';
          icon = "ArrowUpward";
          totalRedeemed += Math.abs(parsedValue);

          // customLog(formattedDateAlt,totalRedeemed,depositedSinceLastRedeem,totalRedeemed-depositedSinceLastRedeem);
          if (totalRedeemed<depositedSinceLastRedeem){
            interest = null;
          } else {
            interest = totalRedeemed-depositedSinceLastRedeem;
            interest = interest>0 ? '+'+(this.props.isMobile ? parseFloat(interest).toFixed(4) : parseFloat(interest).toFixed(8))+' DAI' : null;
            depositedSinceLastRedeem -= totalRedeemed;
            depositedSinceLastRedeem = Math.max(0,depositedSinceLastRedeem);
            totalRedeemed = 0;
          }

          // if (interest){
          //   totalInterestsAccrued += interest;
          // }
        break;
        default:
          color = 'grey';
          icon = "Refresh";
        break;
      }

      if (i>=txsIndexes.length-txsToShow){
        return (
          <Link key={'tx_'+i} display={'block'} href={`https://etherscan.io/tx/${tx.hash}`} target={'_blank'}>
            <Flex alignItems={'center'} flexDirection={['row','row']} width={'100%'} p={[2,3]} borderBottom={'1px solid #D6D6D6'}>
              <Box width={[1/12]} textAlign={'right'}>
                  <Icon name={icon} color={color} style={{float:'left'}}></Icon>
              </Box>
              <Box width={[2/12,2/12]} display={['none','block']} textAlign={'center'}>
                <Pill color={color}>
                  {status}
                </Pill>
              </Box>
              <Box width={[3/12]}>
                <Text textAlign={'center'} fontSize={[2,2]} fontWeight={2}>{value} {tx.tokenSymbol}</Text>
              </Box>
              <Box width={[3/12]}>
                <Text textAlign={'center'} display={['none','block']} fontSize={[2,2]} fontWeight={2}>
                  {interest ? <Pill color={'green'}>{interest}</Pill> : '-'}
                </Text>
              </Box>
              <Box width={[3/12,3/12]} textAlign={'center'}>
                <Text alt={formattedDateAlt} textAlign={'center'} fontSize={[2,2]} fontWeight={2}>{formattedDate}</Text>
              </Box>
            </Flex>
          </Link>
        );
      }

      return null;
    });

    txs = txs
            .reverse()
            .filter(function( element ) {
               return element !== undefined;
            });


    return (
      <Flex flexDirection={'column'} width={[1,'90%']} m={'0 auto'}>
        <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'dark-gray'}>
          Last transactions
        </Heading.h3>
        {
          txs && txs.length ? txs : (
            <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontWeight={2} fontSize={[2]} color={'dark-gray'}>
              There are no transactions for {this.props.selectedToken}
            </Heading.h3>
          )
        }
      </Flex>
    );
  }

  getFormattedBalance(balance,label,decimals,maxLen,highlightedDecimals){
    const defaultValue = '-';
    decimals = !isNaN(decimals) ? decimals : 6;
    maxLen = !isNaN(maxLen) ? maxLen : 10;
    highlightedDecimals = !isNaN(highlightedDecimals) ? highlightedDecimals : 0;
    balance = this.BNify(balance).toFixed(decimals);

    const numLen = balance.toString().replace('.','').length;
    if (numLen>maxLen){
      decimals = Math.max(0,decimals-(numLen-maxLen));
      balance = this.BNify(balance).toFixed(decimals);
    }

    const intPart = Math.floor(balance);
    let decPart = (balance%1).toString().substr(2,decimals);
    decPart = (decPart+("0".repeat(decimals))).substr(0,decimals);

    if (highlightedDecimals){
      const highlightedDec = decPart.substr(0,highlightedDecimals);
      decPart = decPart.substr(highlightedDecimals);
      const highlightedIntPart = (<Text.span fontSize={'100%'} color={'blue'} fontWeight={'inerith'}>{intPart}.{highlightedDec}</Text.span>);
      return !isNaN(this.trimEth(balance)) ? ( <>{highlightedIntPart}<small style={{fontSize:'70%'}}>{decPart}</small> <Text.span fontSize={[1,2]}>{label}</Text.span></> ) : defaultValue;
    } else {
      return !isNaN(this.trimEth(balance)) ? ( <>{intPart}<small>.{decPart}</small> <Text.span fontSize={[1,2]}>{label}</Text.span></> ) : defaultValue;
    }
  }

  formatCountUp = (n) => {
    return n.toFixed(6);
  }

  render() {
    let hasBalance = !isNaN(this.trimEth(this.state.tokenToRedeemParsed)) && this.trimEth(this.state.tokenToRedeemParsed) > 0;
    const navPool = this.getFormattedBalance(this.state.navPool,this.props.selectedToken);
    const reedemableFunds = this.getFormattedBalance(this.state.tokenToRedeemParsed,this.props.selectedToken,9,12);
    const currentEarnings = this.getFormattedBalance(this.state.earning,this.props.selectedToken,9,12);
    const idleTokenPrice = this.getFormattedBalance(this.state.idleTokenPrice,this.props.selectedToken);
    const OldIdleDAIPrice = this.getFormattedBalance(this.state.OldIdleDAIPrice,this.props.selectedToken);
    const depositedFunds = this.getFormattedBalance(this.state.amountLent,this.props.selectedToken);
    const earningPerc = !isNaN(this.trimEth(this.state.tokenToRedeemParsed)) && this.trimEth(this.state.tokenToRedeemParsed)>0 ? this.getFormattedBalance(this.BNify(this.state.tokenToRedeemParsed).div(this.BNify(this.state.amountLent)).minus(1).times(100),'%',4) : '0%';
    const balanceOfIdleDAI = this.getFormattedBalance(this.state.tokenBalanceBNify,this.props.tokenConfig.idle.token);
    const balanceOfOldIdleDAI = this.getFormattedBalance(this.state.balanceOfOldIdleDAI,this.props.tokenConfig.idle.token);
    const hasOldBalance = !isNaN(this.trimEth(this.state.oldDAIToRedeem)) && this.trimEth(this.state.oldDAIToRedeem) > 0;

    let earningPerDay = this.getFormattedBalance((this.state.earningPerYear/daysInYear),this.props.selectedToken,4);
    const earningPerWeek = this.getFormattedBalance((this.state.earningPerYear/daysInYear*7),this.props.selectedToken,4);
    const earningPerMonth = this.getFormattedBalance((this.state.earningPerYear/12),this.props.selectedToken,4);
    const earningPerYear = this.getFormattedBalance((this.state.earningPerYear),this.props.selectedToken,4);

    const currentNavPool = !isNaN(this.trimEth(this.state.navPool)) ? parseFloat(this.trimEth(this.state.navPool,9)) : null;
    let navPoolEarningPerYear = currentNavPool ? parseFloat(this.trimEth(this.BNify(this.state.navPool).times(this.BNify(this.state.maxRate/100)),9)) : null;
    const navPoolAtEndOfYear = currentNavPool ? parseFloat(this.trimEth(this.BNify(this.state.navPool).plus(this.BNify(navPoolEarningPerYear)),9)) : null;
    const navPoolEarningPerDay = navPoolEarningPerYear ? (navPoolEarningPerYear/daysInYear) : null;
    const navPoolEarningPerWeek = navPoolEarningPerDay ? (navPoolEarningPerDay*7) : null;
    const navPoolEarningPerMonth = navPoolEarningPerWeek ? (navPoolEarningPerWeek*4.35) : null;
    navPoolEarningPerYear = navPoolEarningPerYear ? navPoolEarningPerYear : null;

    const currentReedemableFunds = !isNaN(this.trimEth(this.state.tokenToRedeemParsed)) && !isNaN(this.trimEth(this.state.earningPerYear)) ? parseFloat(this.trimEth(this.state.tokenToRedeemParsed,9)) : 0;
    const reedemableFundsAtEndOfYear = !isNaN(this.trimEth(this.state.tokenToRedeemParsed)) && !isNaN(this.trimEth(this.state.earningPerYear)) ? parseFloat(this.trimEth(this.BNify(this.state.tokenToRedeemParsed).plus(this.BNify(this.state.earningPerYear)),9)) : 0;
    const currentEarning = !isNaN(this.trimEth(this.state.earning)) ? parseFloat(this.trimEth(this.state.earning,9)) : 0;
    const earningAtEndOfYear = !isNaN(this.trimEth(this.state.earning)) ? parseFloat(this.trimEth(this.BNify(this.state.earning).plus(this.BNify(this.state.earningPerYear)),9)) : 0;

    const fundsAreReady = !this.state.fundsError && !this.state.updateInProgress && !isNaN(this.trimEth(this.state.tokenToRedeemParsed)) && !isNaN(this.trimEth(this.state.earning)) && !isNaN(this.trimEth(this.state.amountLent));

    const tokenNotApproved = (this.props.account && this.state.isTokenApproved===false && !this.state.isApprovingToken);
    const walletIsEmpty = this.props.account && !tokenNotApproved && !this.state.isApprovingToken && this.state.tokenBalance !== null && !isNaN(this.state.tokenBalance) && !parseFloat(this.state.tokenBalance);

    return (
      <Box textAlign={'center'} alignItems={'center'} width={'100%'}>
        <Form minHeight={['auto','20em']} backgroundColor={'white'} color={'blue'} boxShadow={'0 0 25px 5px rgba(102, 139, 255, 0.7)'} borderRadius={'15px'} style={{position:'relative'}}>
          <Flex justifyContent={'center'} position={'relative'} zIndex={'999'} backgroundColor={'#fff'} borderRadius={'15px 15px 0 0'}>
            <Flex flexDirection={['row','row']} width={['100%','80%']} pt={[2,3]}>
              <Box className={[styles.tab,this.props.selectedTab==='1' ? styles.tabSelected : '']} width={[1/3]} textAlign={'center'}>
                <Link display={'block'} pt={[2,3]} pb={2} fontSize={[2,3]} fontWeight={2} onClick={e => this.selectTab(e, '1')}>
                  Lend
                </Link>
              </Box>
              <Box className={[styles.tab,this.props.selectedTab==='2' ? styles.tabSelected : '']} width={[1/3]} textAlign={'center'} borderLeft={'1px solid #fff'} borderRight={'1px solid #fff'}>
                <Link display={'block'} pt={[2,3]} pb={2} fontSize={[2,3]} fontWeight={2} onClick={e => this.selectTab(e, '2')}>
                  Funds
                </Link>
              </Box>
              <Box className={[styles.tab,this.props.selectedTab==='3' ? styles.tabSelected : '']} width={[1/3]} textAlign={'center'} borderRight={'none'}>
                <Link display={'block'} pt={[2,3]} pb={2} fontSize={[2,3]} fontWeight={2} onClick={e => this.selectTab(e, '3')}>
                  Rebalance
                </Link>
              </Box>
            </Flex>
          </Flex>

          <Box boxShadow={'inset 0px 7px 4px -4px rgba(0,0,0,0.1)'} py={[2, 3]}>
            {this.props.selectedTab === '1' &&
              <Box textAlign={'text'} py={3}>
                {
                  false &&
                  <Button
                    className={styles.gradientButton}
                    onClick={e => this.disableERC20(e, this.props.selectedToken)}
                    size={this.props.isMobile ? 'medium' : 'medium'}
                    borderRadius={4}
                    mainColor={'blue'}
                    contrastColor={'white'}
                    fontWeight={3}
                    fontSize={[2,2]}
                    mx={'auto'}
                    px={[4,5]}
                    mt={[3,4]}
                  >
                    DISABLE DAI
                  </Button>
                }

                {
                  walletIsEmpty &&
                  <Box pt={['50px','73px']} style={{position:'absolute',top:'0',width:'100%',height:'100%',zIndex:'99'}}>
                    <Box style={{backgroundColor:'rgba(0,0,0,0.83)',position:'absolute',top:'0',width:'100%',height:'100%',zIndex:'0',borderRadius:'15px'}}></Box>
                    <Flex style={{position:'relative',zIndex:'99',height:'100%'}} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
                      <Flex flexDirection={'column'} alignItems={'center'} p={[2,4]}>
                        <Flex width={1} justifyContent={'center'} flexDirection={'row'}>
                          <Image src={`images/tokens/${this.props.selectedToken}.svg`} height={'38px'} />
                          <Icon
                            name={'KeyboardArrowRight'}
                            color={'white'}
                            size={'38'}
                          />
                          <Icon
                            name={'AccountBalanceWallet'}
                            color={'white'}
                            size={'38'}
                          />
                        </Flex>
                        <Heading.h4 my={[3,'15px']} color={'white'} fontSize={[2,3]} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                          You don't have any {this.props.selectedToken} in your wallet. Click the button below to buy some.
                        </Heading.h4>
                        <Button
                          onClick={e => { this.renderZeroExInstant(e) }}
                          borderRadius={4}
                          size={'medium'}
                        >
                          BUY {this.props.selectedToken}
                        </Button>
                      </Flex>
                    </Flex>
                  </Box>
                }

                {
                  tokenNotApproved &&
                  <Box pt={['50px','73px']} style={{position:'absolute',top:'0',width:'100%',height:'100%',zIndex:'99'}}>
                    <Box style={{backgroundColor:'rgba(0,0,0,0.83)',position:'absolute',top:'0',width:'100%',height:'100%',zIndex:'0',borderRadius:'15px'}}></Box>
                    <Flex style={{position:'relative',zIndex:'99',height:'100%'}} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
                      <Flex flexDirection={'column'} alignItems={'center'} p={[2,4]}>
                        <Flex width={1} justifyContent={'center'} flexDirection={'row'}>
                          <Image src={`images/tokens/${this.props.selectedToken}.svg`} height={'38px'} />
                          <Icon
                            name={'KeyboardArrowRight'}
                            color={'white'}
                            size={'38'}
                          />
                          <Icon
                            name={'LockOpen'}
                            color={'white'}
                            size={'38'}
                          />
                        </Flex>
                        <Heading.h4 my={[3,'15px']} color={'white'} fontSize={[2,3]} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                          By clicking on ENABLE you are allowing Idle smart contract to actually move {this.props.selectedToken} on your behalf so we can forward them on various lending protocols.
                        </Heading.h4>
                        <Button
                          onClick={e => this.enableERC20(e, this.props.selectedToken)}
                          borderRadius={4}
                          size={'medium'}
                        >
                          ENABLE {this.props.selectedToken}
                        </Button>
                      </Flex>
                    </Flex>
                  </Box>
                }

                <Heading.h3 pb={[2, 0]} mb={[2,3]} fontFamily={'sansSerif'} fontSize={[2, 3]} fontWeight={2} color={'dark-gray'} textAlign={'center'}>
                  Earn <Text.span fontWeight={'bold'} fontSize={[3,4]}>{this.state.maxRate}% APR</Text.span> on your <Text.span fontWeight={'bold'} fontSize={[3,4]}>{this.props.selectedToken}</Text.span>
                </Heading.h3>

                {hasOldBalance ?
                  <Flash variant="warning" width={1}>
                    We have released a new version of the contract, with a small bug fix, please redeem
                    your assets in the old contract, by heading to 'Funds' tab and clicking on `Redeem DAI`
                    Once you have done that you will be able to mint and redeem with the new contract.
                    Sorry for the inconvenience.
                  </Flash> : 
                  (
                    <>
                      { !this.state.isApprovingToken && !this.state.lendingProcessing &&
                        <CryptoInput
                          renderZeroExInstant={this.renderZeroExInstant}
                          genericError={this.state.genericError}
                          buyTokenMessage={this.state.buyTokenMessage}
                          disableLendButton={this.state.disableLendButton}
                          isMobile={this.props.isMobile}
                          account={this.props.account}
                          balance={this.state.tokenBalance}
                          tokenDecimals={this.state.tokenDecimals}
                          defaultValue={this.state.lendAmount}
                          //idleTokenPrice={hasOldBalance ? this.state.OldIdleDAIPrice : this.state.idleTokenPrice}
                          BNify={this.BNify}
                          action={'Lend'}
                          trimEth={this.trimEth}
                          color={'black'}
                          selectedAsset={this.props.selectedToken}
                          useEntireBalance={this.useEntireBalance}
                          handleChangeAmount={this.handleChangeAmount}
                          showTokenApproved={false}
                          isAssetApproved={this.state.isDAIApproved}
                          showApproveModal={this.toggleModal}
                          showLendButton={!walletIsEmpty && !tokenNotApproved}
                          handleClick={e => this.mint(e)} />
                      }

                      { this.state.lendingProcessing &&
                        <>
                          {
                            this.state.lendingTx ? (
                              <TxProgressBar waitText={'Lending in'} endMessage={'Finalizing lend request...'} hash={this.state.lendingTx.transactionHash} />
                            ) : (
                              <Flex
                                justifyContent={'center'}
                                alignItems={'center'}
                                textAlign={'center'}>
                                <Loader size="40px" /> <Text ml={2}>Sending lend request...</Text>
                              </Flex>
                            )
                          }
                        </>
                      }
                    </>
                  )
                }

                {this.state.isApprovingToken && (
                  <>
                    {
                      this.state.approveTx ? (
                        <TxProgressBar waitText={'Approving in'} endMessage={'Finalizing approve request...'} hash={this.state.approveTx.transactionHash} />
                      ) : (
                        <Flex
                          justifyContent={'center'}
                          alignItems={'center'}
                          textAlign={'center'}>
                          <Loader size="40px" /> <Text ml={2}>Sending approve request...</Text>
                        </Flex>
                      )
                    }
                  </>
                )}

                <Flex justifyContent={'center'} mt={[0,3]}>
                  <Heading.h5 mt={2} color={'darkGray'} fontWeight={1} fontSize={1} textAlign={'center'}>
                    *This is beta software. Use at your own risk.
                  </Heading.h5>
                </Flex>

              </Box>
            }

            {this.props.selectedTab === '2' &&
              <Box px={[2,0]} py={[3,0]} textAlign={'text'}>
                {this.props.account &&
                  <>
                    {
                      fundsAreReady ? (
                        <>
                          <Box>
                            {!!hasOldBalance &&
                              <Flash variant="warning" width={1}>
                                We have released a new version of the contract, with a small bug fix, please redeem
                                your assets in the old contract, by heading to 'Funds' tab and clicking on `Redeem DAI`
                                Once you have done that you will be able to mint and redeem with the new contract.
                                Sorry for the inconvenience.
                              </Flash>
                            }
                            <Flex flexDirection={['column','row']} py={[2,3]} width={[1,'70%']} m={'0 auto'}>
                              <Box width={[1,1/2]}>
                                <Heading.h3 fontWeight={2} textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'blue'}>
                                  Redeemable Funds
                                </Heading.h3>
                                <Heading.h3 fontFamily={'sansSerif'} fontSize={[4,5]} mb={[2,0]} fontWeight={2} color={'black'} textAlign={'center'}>
                                  {
                                    hasBalance ? (
                                      <CountUp
                                        start={currentReedemableFunds}
                                        end={reedemableFundsAtEndOfYear}
                                        duration={31536000}
                                        delay={0}
                                        separator=" "
                                        decimals={9}
                                        decimal="."
                                        // formattingFn={(n)=>{ return this.formatCountUp(n); }}
                                      >
                                        {({ countUpRef, start }) => (
                                          <><span ref={countUpRef} /> <span style={{fontSize:'16px',fontWeight:'400',lineHeight:'1.5',color:'#3F3D4B'}}>{this.props.selectedToken}</span></>
                                        )}
                                      </CountUp>
                                    ) : reedemableFunds
                                  }
                                </Heading.h3>
                              </Box>
                              <Box width={[1,1/2]}>
                                <Heading.h3 fontWeight={2} textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'blue'}>
                                  Current earnings
                                </Heading.h3>
                                <Heading.h3 fontFamily={'sansSerif'} fontSize={[4,5]} fontWeight={2} color={'black'} textAlign={'center'}>
                                  {
                                    hasBalance ? (
                                      <CountUp
                                        start={currentEarning}
                                        end={earningAtEndOfYear}
                                        duration={31536000}
                                        delay={0}
                                        separator=" "
                                        decimals={9}
                                        decimal="."
                                        // formattingFn={(n)=>{ return this.formatCountUp(n); }}
                                      >
                                        {({ countUpRef, start }) => (
                                          <><span ref={countUpRef} /> <span style={{fontSize:'16px',fontWeight:'400',lineHeight:'1.5',color:'#3F3D4B'}}>{this.props.selectedToken}</span></>
                                        )}
                                      </CountUp>
                                    ) : currentEarnings
                                  }
                                </Heading.h3>
                              </Box>
                            </Flex>
                        </Box>
                        <Box pb={[3,4]} borderBottom={'1px solid #D6D6D6'}>
                          {hasBalance && !hasOldBalance && !this.state.redeemProcessing &&
                            <Flex
                              textAlign='center'
                              flexDirection={'column'}
                              alignItems={'center'}>
                                <Heading.h3 fontWeight={2} textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'blue'}>
                                  Redeem your {this.props.selectedToken}
                                </Heading.h3>
                              {
                                (this.state.partialRedeemEnabled || true) &&
                                  <CryptoInput
                                    genericError={this.state.genericErrorRedeem}
                                    icon={'images/idle-dai.png'}
                                    buttonLabel={`REDEEM ${this.props.tokenConfig.idle.token}`}
                                    placeholder={`Enter ${this.props.tokenConfig.idle.token} amount`}
                                    disableLendButton={this.state.disableRedeemButton}
                                    isMobile={this.props.isMobile}
                                    account={this.props.account}
                                    action={'Redeem'}
                                    defaultValue={this.state.redeemAmount}
                                    idleTokenPrice={hasOldBalance ? (1/this.state.OldIdleDAIPrice) : (1/this.state.idleTokenPrice)}
                                    convertedLabel={this.props.selectedToken}
                                    balanceLabel={this.props.tokenConfig.idle.token}
                                    BNify={this.BNify}
                                    trimEth={this.trimEth}
                                    color={'black'}
                                    balance={this.state.idleTokenBalance}
                                    selectedAsset={this.props.selectedToken}
                                    useEntireBalance={this.useEntireBalanceRedeem}
                                    handleChangeAmount={this.handleChangeAmountRedeem}
                                    handleClick={e => this.redeem(e, this.props.tokenConfig.idle.token)} />
                              }

                              {
                                false && !this.state.partialRedeemEnabled &&
                                  <Button
                                    className={styles.gradientButton}
                                    onClick={e => this.redeem(e, this.props.tokenConfig.idle.token)}
                                    borderRadius={4}
                                    size={this.props.isMobile ? 'medium' : 'medium'}
                                    mainColor={'blue'}
                                    contrastColor={'white'}
                                    fontWeight={3}
                                    fontSize={[2,2]}
                                    mx={'auto'}
                                    px={[4,5]}
                                    mt={2}
                                  >
                                    REDEEM ALL
                                  </Button>
                              }
                            </Flex>
                          }
                          {hasOldBalance && !this.state.redeemProcessing &&
                            <Flex
                              textAlign='center'>
                              <Button
                                className={styles.gradientButton}
                                onClick={e => this.redeem(e, 'OldIdleDAI')}
                                borderRadius={4}
                                size={this.props.isMobile ? 'medium' : 'medium'}
                                mainColor={'blue'}
                                contrastColor={'white'}
                                fontWeight={3}
                                fontSize={[2,2]}
                                mx={'auto'}
                                px={[4,5]}
                                mt={2}
                              >
                                REDEEM {this.props.selectedToken} (old contract)
                              </Button>
                            </Flex>
                          }
                          {!hasBalance && !hasOldBalance &&
                            <Flex
                              textAlign='center'>
                              <Button
                                className={styles.gradientButton}
                                onClick={e => this.selectTab(e, '1')}
                                borderRadius={4}
                                size={this.props.isMobile ? 'medium' : 'medium'}
                                mainColor={'blue'}
                                contrastColor={'white'}
                                fontWeight={3}
                                fontSize={[2,2]}
                                mx={'auto'}
                                px={[4,5]}
                                mt={2}
                              >
                                LEND NOW
                              </Button>
                            </Flex>
                          }
                          { this.state.redeemProcessing &&
                            <>
                              {
                                this.state.redeemTx ? (
                                  <TxProgressBar waitText={'Redeeming in'} endMessage={'Finalizing redeem request...'} hash={this.state.redeemTx.transactionHash} />
                                ) : (
                                  <Flex
                                    justifyContent={'center'}
                                    alignItems={'center'}
                                    textAlign={'center'}>
                                    <Loader size="40px" /> <Text ml={2}>Sending redeem request...</Text>
                                  </Flex>
                                )
                              }
                            </>
                          }
                        </Box>
                        { true &&
                          <Flex flexDirection={'column'} pt={[3,3]} pb={[0,2]} alignItems={'center'}>
                            <Link
                              color={'primary'}
                              hoverColor={'primary'}
                              href="#"
                              onClick={e => this.toggleShowFundsInfo(e) }
                            >
                              <Flex flexDirection={'column'} pb={0} alignItems={'center'}>
                                { this.state.showFundsInfo ? 'Hide info & transactions' : 'Show info & transactions' }
                              </Flex>
                            </Link>
                          </Flex>
                        }
                      </>
                      ) : (!this.state.updateInProgress && this.state.fundsError) ? (
                          <Flex
                            alignItems={'center'}
                            flexDirection={'column'}
                            textAlign={'center'}
                            py={[1,3]}>
                              <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontWeight={2} fontSize={[2,3]} color={'dark-gray'}>
                                We were not able to load your funds...
                              </Heading.h3>
                              <Button
                                className={styles.gradientButton}
                                onClick={e => this.reloadFunds(e) }
                                size={this.props.isMobile ? 'medium' : 'medium'}
                                borderRadius={4}
                                mainColor={'blue'}
                                contrastColor={'white'}
                                fontWeight={3}
                                fontSize={[2,2]}
                                mx={'auto'}
                                px={[4,5]}
                                mt={[3,4]}
                              >
                                TRY AGAIN
                              </Button>
                          </Flex>
                        ) : (
                          <Flex
                            py={[2,3]}
                            justifyContent={'center'}
                            alignItems={'center'}
                            textAlign={'center'}>
                            <Loader size="40px" /> <Text ml={2}>Processing funds...</Text>
                          </Flex>
                        ) 
                    }
                    {
                      hasBalance && this.state.showFundsInfo &&
                        <>
                          {
                          !isNaN(this.trimEth(this.state.earningPerYear)) ? (
                          <>
                            <Box my={[3,4]} pb={[3,4]} borderBottom={'1px solid #D6D6D6'}>
                              <Flex flexDirection={'column'} width={[1,'90%']} m={'0 auto'}>
                                <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'dark-gray'}>
                                  Funds overview
                                </Heading.h3>
                                <Flex flexDirection={['column','row']} width={'100%'}>
                                  <Flex flexDirection={'row'} py={[2,3]} width={[1,'1/2']} m={'0 auto'}>
                                    <Box width={1/2}>
                                      <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        Deposited funds
                                      </Text>
                                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        { depositedFunds }
                                      </Heading.h3>
                                    </Box>
                                    <Box width={1/2}>
                                      <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        Earning
                                      </Text>
                                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        { earningPerc }
                                      </Heading.h3>
                                    </Box>
                                  </Flex>
                                  <Flex flexDirection={'row'} py={[2,3]} width={[1,'1/2']} m={'0 auto'}>
                                    <Box width={1/2}>
                                      <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        Current holdings
                                      </Text>
                                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        { hasOldBalance ? balanceOfOldIdleDAI : balanceOfIdleDAI }
                                      </Heading.h3>
                                    </Box>
                                    <Box width={1/2}>
                                      <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        {this.props.tokenConfig.idle.token} price
                                      </Text>
                                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        { hasOldBalance ? OldIdleDAIPrice : idleTokenPrice }
                                      </Heading.h3>
                                    </Box>
                                  </Flex>
                                </Flex>
                              </Flex>
                            </Box>
                            <Box my={[3,4]} pb={[3,4]} borderBottom={'1px solid #D6D6D6'}>
                              <Flex flexDirection={'column'} width={[1,'90%']} m={'0 auto'}>
                                <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'dark-gray'}>
                                  Estimated earnings
                                </Heading.h3>
                                <Flex flexDirection={['column','row']} width={'100%'}>
                                  <Flex flexDirection={'row'} py={[2,3]} width={[1,'1/2']} m={'0 auto'}>
                                    <Box width={1/2}>
                                      <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        Daily
                                      </Text>
                                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        {earningPerDay}
                                      </Heading.h3>
                                    </Box>
                                    <Box width={1/2}>
                                      <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        Weekly
                                      </Text>
                                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        {earningPerWeek}
                                      </Heading.h3>
                                    </Box>
                                  </Flex>
                                  <Flex flexDirection={'row'} py={[2,3]} width={[1,'1/2']} m={'0 auto'}>
                                    <Box width={1/2}>
                                      <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        Monthly
                                      </Text>
                                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        {earningPerMonth}
                                      </Heading.h3>
                                    </Box>
                                    <Box width={1/2}>
                                      <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        Yearly
                                      </Text>
                                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                                        {earningPerYear}
                                      </Heading.h3>
                                    </Box>
                                  </Flex>
                                </Flex>
                              </Flex>
                            </Box>
                          </>
                          ) : (
                            <Flex
                              py={[2,3]}
                              justifyContent={'center'}
                              alignItems={'center'}
                              textAlign={'center'}>
                              <Loader size="40px" /> <Text ml={2}>Processing funds info...</Text>
                            </Flex>
                          )
                        }
                        </>
                    }
                    {
                      this.state.showFundsInfo &&
                        <Box my={[3,4]} pb={[3,4]}>
                          {
                            this.state.prevTxs ? (
                              this.renderPrevTxs()
                            ) : (
                              <Flex
                                justifyContent={'center'}
                                alignItems={'center'}
                                textAlign={'center'}>
                                <Loader size="40px" /> <Text ml={2}>Processing transactions...</Text>
                              </Flex>
                            )
                          }
                        </Box>
                    }
                  </>
                }

                {!this.props.account &&
                  <Flex
                    alignItems={'center'}
                    flexDirection={'column'}
                    textAlign={'center'}
                    py={[1,3]}>
                      <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontWeight={2} fontSize={[2,3]} color={'dark-gray'}>
                        Please connect to view your available funds.
                      </Heading.h3>
                      <Button
                        className={styles.gradientButton}
                        onClick={e => this.redeem(e, this.props.tokenConfig.idle.token)}
                        size={this.props.isMobile ? 'medium' : 'medium'}
                        borderRadius={4}
                        mainColor={'blue'}
                        contrastColor={'white'}
                        fontWeight={3}
                        fontSize={[2,2]}
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

            { this.props.selectedTab === '3' && 
              <>
                <Box width={'100%'} borderBottom={'1px solid #D6D6D6'}>
                  <Flex flexDirection={['column','row']} py={[2,3]} width={[1,'80%']} m={'0 auto'}>
                    <Box width={[1,1/3]}>
                      <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                        Allocated funds
                      </Text>
                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'} style={{whiteSpace:'nowrap'}}>
                        {navPool ? 
                          <CountUp
                            start={currentNavPool}
                            end={navPoolAtEndOfYear}
                            duration={315569260}
                            delay={0}
                            separator=" "
                            decimals={6}
                            decimal="."
                            formattingFn={(n)=>{ return this.formatCountUp(n); }}
                          >
                            {({ countUpRef, start }) => (
                              <><span ref={countUpRef} /> <span style={{fontSize:'16px',fontWeight:'400',lineHeight:'1.5',color:'#3F3D4B'}}>{this.props.selectedToken}</span></>
                            )}
                          </CountUp>
                          : '-'
                        }
                      </Heading.h3>
                    </Box>
                    <Box width={[1,1/3]}>
                      <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                        Current protocol
                      </Text>
                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'} style={{whiteSpace:'nowrap'}}>
                        { this.state.currentProtocol ? this.state.currentProtocol : '-' }
                      </Heading.h3>
                    </Box>
                    <Box width={[1,1/3]}>
                      <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                        Current APR
                      </Text>
                      <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'} style={{whiteSpace:'nowrap'}}>
                        { this.state.maxRate ? `${this.state.maxRate}%` : '-' }
                      </Heading.h3>
                    </Box>
                  </Flex>
                </Box>
                <Box borderBottom={'1px solid #D6D6D6'}>
                  <Flex flexDirection={'column'} width={[1,'90%']} m={'0 auto'}>
                    {
                    /*
                    <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mt={[2,3]} mb={[2,2]} color={'dark-gray'}>
                      Overall returns
                    </Heading.h3>
                    */
                    }
                    <Flex flexDirection={['column','row']} width={'100%'}>
                      <Flex flexDirection={'row'} py={[2,3]} width={[1,'1/2']} m={'0 auto'}>
                        <Box width={1/2}>
                          <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                            Daily
                          </Text>
                          <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                            {this.getFormattedBalance(navPoolEarningPerDay,this.props.selectedToken,4)}
                          </Heading.h3>
                        </Box>
                        <Box width={1/2}>
                          <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                            Weekly
                          </Text>
                          <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                            {this.getFormattedBalance(navPoolEarningPerWeek,this.props.selectedToken,4)}
                          </Heading.h3>
                        </Box>
                      </Flex>
                      <Flex flexDirection={'row'} py={[2,3]} width={[1,'1/2']} m={'0 auto'}>
                        <Box width={1/2}>
                          <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                            Monthly
                          </Text>
                          <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                            {this.getFormattedBalance(navPoolEarningPerMonth,this.props.selectedToken,4)}
                          </Heading.h3>
                        </Box>
                        <Box width={1/2}>
                          <Text fontFamily={'sansSerif'} fontSize={[1, 2]} fontWeight={2} color={'blue'} textAlign={'center'}>
                            Yearly
                          </Text>
                          <Heading.h3 fontFamily={'sansSerif'} fontSize={[3,4]} fontWeight={2} color={'black'} textAlign={'center'}>
                            {this.getFormattedBalance(navPoolEarningPerYear,this.props.selectedToken,4)}
                          </Heading.h3>
                        </Box>
                      </Flex>
                    </Flex>
                  </Flex>
                </Box>
                { !!this.state.calculataingShouldRebalance && 
                  <Box px={[2,0]} textAlign={'text'} py={[3,2]}>
                    <Flex
                      justifyContent={'center'}
                      alignItems={'center'}
                      textAlign={'center'}
                      pt={3}>
                          <Loader size="40px" /> <Text ml={2}>Checking rebalance status...</Text>
                    </Flex>
                  </Box>
                }
              </>
            }

            { this.props.selectedTab === '3' && !this.state.calculataingShouldRebalance && !!this.state.shouldRebalance && 
              <Box px={[2,0]} py={[3,2]}>
                {!!hasOldBalance &&
                  <Flash variant="warning" width={1}>
                    We have released a new version of the contract, with a small bug fix, please redeem
                    your assets in the old contract, by heading to 'Funds' tab and clicking on `Redeem DAI`
                    Once you have done that you will be able to mint and redeem with the new contract.
                    Sorry for the inconvenience.
                  </Flash>
                }
                {this.state.rebalanceProcessing ? (
                    <>
                      <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} pt={[0,3]} pb={[2,2]} color={'blue'}>
                        Thanks for rebalancing!
                      </Heading.h3>
                      <Loader size="40px" /> <Text ml={2}>Processing rebalance request...</Text>
                    </>
                  ) : (
                    <>
                      <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} pt={[0,3]} pb={[2,2]} color={'blue'}>
                        Rebalance the entire pool. All users will bless you.
                      </Heading.h3>
                      <Heading.h4 color={'dark-gray'} fontSize={[2,2]} px={[3,0]} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                        The whole pool is automatically rebalanced each time a user interacts with Idle.<br />
                        But you can also trigger a rebalance anytime and this will benefit all users (included you).
                      </Heading.h4>
                      <Flex
                        justifyContent={'center'}
                        alignItems={'center'}
                        textAlign={'center'}
                        pt={2}>
                        <Button
                          className={styles.gradientButton}
                          onClick={this.rebalance}
                          size={this.props.isMobile ? 'medium' : 'medium'}
                          borderRadius={4}
                          contrastColor={'white'}
                          fontWeight={3}
                          fontSize={[2,2]}
                          mx={'auto'}
                          px={[4,5]}
                          mt={[2,3]}
                        >
                          REBALANCE NOW
                        </Button>
                      </Flex>
                    </>
                  )
                }
              </Box>
            }

            {
              this.props.selectedTab === '3' && !this.state.calculataingShouldRebalance && !this.state.shouldRebalance &&
              <Box px={[2,0]} textAlign={'center'} py={[3,2]}>
                <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} pt={[0,3]} pb={[2,2]} color={'blue'}>
                  The pool is already balanced.
                </Heading.h3>
                <Heading.h4 color={'dark-gray'} fontSize={[2,2]} px={[3,0]} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                  The current interest rate is already the best between the integrated protocols.<br />Sit back and enjoy your earnings.
                </Heading.h4>
              </Box>
            }

            </Box>
        </Form>

        <WelcomeModal
          account={this.props.account}
          isOpen={this.state.welcomeIsOpen}
          closeModal={this.toggleWelcomeModal}
          tokenName={this.props.selectedToken}
          baseTokenName={this.props.selectedToken}
          network={this.props.network.current} />

        <ApproveModal
          account={this.props.account}
          isOpen={this.state.approveIsOpen}
          closeModal={this.toggleModal}
          onClick={e => this.enableERC20(e, this.props.selectedToken)}
          tokenName={this.props.selectedToken}
          baseTokenName={this.props.selectedToken}
          network={this.props.network.current} />

        <MaxCapModal
          account={this.props.account}
          isOpen={this.state.capReached}
          maxCap={this.BNify(this.state.idleDAICap)}
          currSupply={this.BNify(this.state.IdleDAISupply)}
          closeModal={this.toggleMaxCapModal}
          network={this.props.network.current} />
      </Box>
    );
  }
}

export default SmartContractControls;
