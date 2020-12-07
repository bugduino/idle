import theme from '../theme';
import Migrate from '../Migrate/Migrate';
import React, { Component } from 'react';
import FlexLoader from '../FlexLoader/FlexLoader';
import ConnectBox from '../ConnectBox/ConnectBox';
import CurveRedeem from '../CurveRedeem/CurveRedeem';
import RoundButton from '../RoundButton/RoundButton';
import FunctionsUtil from '../utilities/FunctionsUtil';
import BuyModal from '../utilities/components/BuyModal';
import DashboardCard from '../DashboardCard/DashboardCard';
import AssetSelector from '../AssetSelector/AssetSelector';
import TxProgressBar from '../TxProgressBar/TxProgressBar';
import ShareModal from '../utilities/components/ShareModal';
import TransactionField from '../TransactionField/TransactionField';
import FastBalanceSelector from '../FastBalanceSelector/FastBalanceSelector';
import { Flex, Text, Input, Box, Icon, Link, Checkbox, Tooltip, Image } from "rimble-ui";

class DepositRedeem extends Component {

  state = {
    txError:{},
    tokenAPY:'-',
    inputValue:{},
    processing:{},
    curveAPY:null,
    canRedeem:false,
    maxSlippage:0.2,
    canDeposit:false,
    action:'deposit',
    directMint:false,
    activeModal:null,
    showBuyFlow:false,
    unlentBalance:null,
    tokenApproved:false,
    skipMigration:false,
    showRedeemFlow:false,
    contractPaused:false,
    buttonDisabled:false,
    canRedeemCurve:false,
    showMaxSlippage:false,
    redeemGovTokens:false,
    canDepositCurve:false,
    fastBalanceSelector:{},
    actionProxyContract:{},
    migrationEnabled:false,
    componentMounted:false,
    curveTokenBalance:null,
    redeemCurveEnabled:false,
    depositCurveBalance:null,
    depositCurveEnabled:true,
    showAdvancedOptions:false,
    depositCurveSlippage:null,
    metaTransactionsEnabled:true
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
    await this.loadProxyContracts();
  }

  async componentDidMount(){

  }

  setShowRedeemFlow = (showRedeemFlow) => {
    this.setState({
      showRedeemFlow
    });
  }

  setShowBuyFlow = (showBuyFlow) => {
    this.setState({
      showBuyFlow
    });
  }

  toggleShowAdvancedOptions = showAdvancedOptions => {
    this.setState((prevState) => ({
      showAdvancedOptions:!prevState.showAdvancedOptions
    }));
  }

  toggleSkipMigration = skipMigration => {
    this.setState({
      skipMigration
    });
  }

  toggleRedeemCurve = redeemCurveEnabled => {
    this.setState({
      redeemCurveEnabled
    });
  }

  toggleDepositCurve = depositCurveEnabled => {
    this.setState({
      depositCurveEnabled
    });
  }

  toggleSkipMint = (directMint) => {
    this.setState({
      directMint
    });
  }

  toggleRedeemGovTokens = (redeemGovTokens) => {
    this.setState({
      redeemGovTokens
    });
  }

  toggleMetaTransactionsEnabled = (metaTransactionsEnabled) => {
    this.setState({
      metaTransactionsEnabled
    });
  }

  async loadProxyContracts(){
    const actions = ['deposit','redeem'];
    const newState = {
      actionProxyContract:{}
    };

    await this.functionsUtil.asyncForEach(actions,async (action) => {
      const mintProxyContractInfo = this.functionsUtil.getGlobalConfig(['contract','methods',action,'proxyContract']);
      const hasProxyContract = mintProxyContractInfo && mintProxyContractInfo.enabled;
      newState.actionProxyContract[action] = hasProxyContract ? mintProxyContractInfo : null;
      if (hasProxyContract){
        const proxyContract = await this.props.initContract(mintProxyContractInfo.name,mintProxyContractInfo.address,mintProxyContractInfo.abi);
        newState.actionProxyContract[action].contract = proxyContract.contract;
        newState.actionProxyContract[action].approved = await this.functionsUtil.checkTokenApproved(this.props.selectedToken,mintProxyContractInfo.address,this.props.account);
      }
    });

    this.setState(newState);
  }

  resetModal = () => {
    this.setState({
      activeModal: null
    });
  }

  setActiveModal = activeModal => {
    this.setState({
      activeModal
    });
  }

  async loadAPY(){
    const tokenAprs = await this.functionsUtil.getTokenAprs(this.props.tokenConfig);
    if (tokenAprs && tokenAprs.avgApy !== null){
      const tokenAPY = this.functionsUtil.BNify(tokenAprs.avgApy).toFixed(2);

      let curveAPY = null;
      if (this.state.canDepositCurve){
        curveAPY = await this.functionsUtil.getCurveAPY();
        // console.log('curveAPY',curveAPY);
        if (curveAPY){
          curveAPY = curveAPY.plus(tokenAPY);
        }
      }
      this.setState({
        tokenAPY,
        curveAPY
      });
    }
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    if (this.props.tokenBalance === null){
      return false;
    }

    const tokenChanged = prevProps.selectedToken !== this.props.selectedToken;
    const tokenBalanceChanged = prevProps.tokenBalance !== this.props.tokenBalance && this.props.tokenBalance !== null;

    if (tokenChanged || tokenBalanceChanged){
      await this.loadProxyContracts();
      this.loadTokenInfo();
      return false;
    }

    const actionChanged = this.state.action !== prevState.action;
    const fastBalanceSelectorChanged = this.state.fastBalanceSelector[this.state.action] !== prevState.fastBalanceSelector[this.state.action];

    if (actionChanged || fastBalanceSelectorChanged){
      this.setInputValue();
    }

    const redeemGovTokensChanged = prevState.redeemGovTokens !== this.state.redeemGovTokens;
    if (redeemGovTokensChanged || actionChanged){
      this.checkButtonDisabled();
    }

    const depositCurveChanged = prevState.depositCurveEnabled !== this.state.depositCurveEnabled;
    const metaTransactionsChanged = prevState.metaTransactionsEnabled !== this.state.metaTransactionsEnabled;
    if (metaTransactionsChanged || depositCurveChanged){
      const tokenApproved = await this.checkTokenApproved();
      this.setState({
        tokenApproved
      });
    }

    const inputChanged = prevState.inputValue[this.state.action] !== this.state.inputValue[this.state.action];
    if (inputChanged){
      this.calculateCurveSlippage();
    }
  }

  async calculateCurveSlippage(){
    const amount = this.state.inputValue[this.state.action] ? this.functionsUtil.BNify(this.state.inputValue[this.state.action]) : null;

    if (!amount || amount.lte(0)){
      return false;
    }

    const curvePoolContractInfo = this.functionsUtil.getGlobalConfig(['curve','poolContract']);

    const normalizedAmount = this.functionsUtil.normalizeTokenAmount(amount,curvePoolContractInfo.decimals);
    const newState = {};

    switch (this.state.action){
      case 'deposit':
        newState.depositCurveBalance = amount;
        newState.depositCurveSlippage = await this.functionsUtil.getCurveSlippage(this.props.tokenConfig.idle.token,normalizedAmount,true);
      break;
      case 'redeem':
        // newState.redeemBalance = amount;
        // newState.withdrawSlippage = await this.functionsUtil.getCurveSlippage(this.props.tokenConfig.idle.token,normalizedAmount,true);
      break;
      default:
      break;
    }
    // console.log('calculateCurveSlippage',newState);

    this.setState(newState);
  }

  approveContract = async (callbackApprove,callbackReceiptApprove) => {
    if (this.state.depositCurveEnabled){
      const curveDepositContract = this.functionsUtil.getGlobalConfig(['curve','depositContract']);
      this.functionsUtil.enableERC20(this.props.selectedToken,curveDepositContract.address,callbackApprove,callbackReceiptApprove);
    } else {
      const proxyContract = this.state.actionProxyContract[this.state.action];
      if (proxyContract && this.state.metaTransactionsEnabled && this.props.biconomy){
        this.functionsUtil.enableERC20(this.props.selectedToken,proxyContract.address,callbackApprove,callbackReceiptApprove);
      } else {
        this.functionsUtil.enableERC20(this.props.selectedToken,this.props.tokenConfig.idle.address,callbackApprove,callbackReceiptApprove);
      }
    }
  }

  checkTokenApproved = async () => {

    let tokenApproved = false;

    if (this.state.depositCurveEnabled){
      const curveDepositContract = this.functionsUtil.getGlobalConfig(['curve','depositContract']);
      tokenApproved = await this.functionsUtil.checkTokenApproved(this.props.selectedToken,curveDepositContract.address,this.props.account);
    } else {
      const proxyContract = this.state.actionProxyContract[this.state.action];
      if (proxyContract && this.state.metaTransactionsEnabled && this.props.biconomy){
        tokenApproved = await this.functionsUtil.checkTokenApproved(this.props.selectedToken,proxyContract.address,this.props.account);
      } else {
        tokenApproved = await this.functionsUtil.checkTokenApproved(this.props.selectedToken,this.props.tokenConfig.idle.address,this.props.account);
      }
    }
    return tokenApproved;
  }

  approveToken = async () => {

    // Check if the token is already approved
    const tokenApproved = await this.checkTokenApproved();

    if (tokenApproved){
      return this.setState((prevState) => ({
        tokenApproved,
        processing: {
          ...prevState.processing,
          approve:{
            txHash:null,
            loading:false
          }
        }
      }));
    }

    const callbackApprove = (tx,error)=>{
      // Send Google Analytics event
      const eventData = {
        eventCategory: 'Approve',
        eventAction: this.props.selectedToken,
        eventLabel: tx.status,
      };

      if (error){
        eventData.eventLabel = this.functionsUtil.getTransactionError(error);
      }

      // Send Google Analytics event
      if (error || eventData.status !== 'error'){
        this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
      }

      this.setState((prevState) => ({
        tokenApproved: (tx.status === 'success'), // True
        processing: {
          ...prevState.processing,
          approve:{
            txHash:null,
            loading:false
          }
        }
      }));
    };

    const callbackReceiptApprove = (tx) => {
      const txHash = tx.transactionHash;
      this.setState((prevState) => ({
        processing: {
          ...prevState.processing,
          approve:{
            ...prevState.processing['approve'],
            txHash
          }
        }
      }));
    };

    this.approveContract(callbackApprove,callbackReceiptApprove);

    this.setState((prevState) => ({
      processing: {
        ...prevState.processing,
        approve:{
          txHash:null,
          loading:true
        }
      }
    }));
  }

  loadTokenInfo = async () => {

    if (this.state.componentMounted){
      this.setState({
        componentMounted:false
      });
    }

    const curveConfig = this.functionsUtil.getGlobalConfig(['curve']);
    const curveTokenConfig = this.functionsUtil.getGlobalConfig(['curve','availableTokens',this.props.tokenConfig.idle.token]);
    const curveTokenEnabled = curveConfig.enabled && curveTokenConfig && curveTokenConfig.enabled;

    const [
      tokenApproved,
      contractPaused,
      curveSwapContract,
      curveDepositContract,
      unlentBalance,
      {migrationEnabled},
      curveTokenBalance,
    ] = await Promise.all([
      this.checkTokenApproved(),
      this.functionsUtil.checkContractPaused(),
      this.functionsUtil.getCurveSwapContract(),
      this.functionsUtil.getCurveDepositContract(),
      this.functionsUtil.getUnlentBalance(this.props.tokenConfig),
      this.functionsUtil.checkMigration(this.props.tokenConfig,this.props.account),
      curveTokenEnabled ? this.functionsUtil.getCurveTokenBalance(this.props.account) : null
    ]);

    const canDeposit = this.props.tokenBalance && this.functionsUtil.BNify(this.props.tokenBalance).gt(0);
    const canRedeem = this.props.idleTokenBalance && this.functionsUtil.BNify(this.props.idleTokenBalance).gt(0);

    const canDepositCurve = curveTokenEnabled && canDeposit;
    const depositCurveEnabled = canDepositCurve;

    const canRedeemCurve = curveTokenEnabled && curveTokenBalance && curveTokenBalance.gt(0);
    const redeemCurveEnabled = canRedeemCurve;

    const newState = {...this.state};

    // Check curve deposit enabled
    if (newState.depositCurveEnabled && !curveTokenEnabled){
      newState.depositCurveEnabled = false;
    }
    
    newState.canRedeem = canRedeem;
    newState.canDeposit = canDeposit;
    newState.unlentBalance = unlentBalance;
    newState.tokenApproved = tokenApproved;
    newState.contractPaused = contractPaused;
    newState.canRedeemCurve = canRedeemCurve;
    newState.canDepositCurve = canDepositCurve;
    newState.migrationEnabled = migrationEnabled;
    newState.curveTokenBalance = curveTokenBalance;
    newState.curveSwapContract = curveSwapContract;
    newState.redeemCurveEnabled = redeemCurveEnabled;
    newState.depositCurveEnabled = depositCurveEnabled;
    newState.curveDepositContract = curveDepositContract;

    newState.txError = {
      redeem:false,
      deposit:false
    };
    newState.processing = {
      redeem:{
        txHash:null,
        loading:false
      },
      deposit:{
        txHash:null,
        loading:false
      },
      approve:{
        txHash:null,
        loading:false
      },
      boost:{
        txHash:null,
        loading:false
      }
    };
    newState.inputValue = {
      boost:null,
      redeem:null,
      deposit:null
    };
    newState.fastBalanceSelector = {
      boost:null,
      redeem:null,
      deposit:null
    };

    newState.componentMounted = true;

    this.setState(newState,() => {
      this.checkAction();
      this.loadAPY();
    });
  }

  cancelTransaction = async () => {
    this.setState((prevState) => ({
      processing: {
        ...prevState.processing,
        approve:{
          txHash:null,
          loading:false
        },
        [this.state.action]:{
          txHash:null,
          loading:false
        }
      }
    }));
  }

  executeAction = async () => {

    let contractSendResult = null;
    const redeemGovTokens = this.state.redeemGovTokens;
    const inputValue = this.state.inputValue[this.state.action];
    const selectedPercentage = this.getFastBalanceSelector();

    let loading = true;

    switch (this.state.action){
      case 'deposit':

        if (this.state.buttonDisabled || !inputValue || this.functionsUtil.BNify(inputValue).lte(0)){
          return false;
        }

        if (!this.state.tokenApproved){
          return this.approveToken();
        }

        if (localStorage){
          this.functionsUtil.setLocalStorage('redirectToFundsAfterLogged',0);
        }

        this.setState({
          lendingProcessing: this.props.account,
          lendAmount: '',
          genericError: '',
        });

        const callbackDeposit = (tx,error) => {

          if (!tx && error){
            tx = {
              status:'error'
            };
          }

          const txError = tx.status === 'error';
          const txSucceeded = tx.status === 'success';

          const eventData = {
            eventCategory: 'Deposit',
            eventAction: this.props.selectedToken,
            eventLabel: tx.status,
            eventValue: parseInt(inputValue)
          };

          if (error){
            eventData.eventLabel = this.functionsUtil.getTransactionError(error);
          }

          // Send Google Analytics event
          if (error || eventData.status !== 'error'){
            this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
          }

          this.setState((prevState) => ({
            processing: {
              ...prevState.processing,
              [this.state.action]:{
                txHash:null,
                loading:false
              }
            }
          }));

          if (txSucceeded){
            this.setState((prevState) => ({
              activeModal:'share',
              inputValue:{
                ...prevState.inputValue,
                [this.state.action]: this.functionsUtil.BNify(0)
              }
            }));
          } else if (this.state.metaTransactionsEnabled && txError){
            this.setState({
              txError:{
                [this.state.action]: true
              }
            });
          }
        };

        const callbackReceiptDeposit = (tx) => {
          const txHash = tx.transactionHash;
          this.setState((prevState) => ({
            processing: {
              ...prevState.processing,
              [this.state.action]:{
                ...prevState.processing[this.state.action],
                txHash
              }
            }
          }));
        };

        const curveConfig = this.functionsUtil.getGlobalConfig(['curve']);
        const curveTokenEnabled = curveConfig.enabled && this.functionsUtil.getGlobalConfig(['curve','availableTokens',this.props.tokenConfig.idle.token,'enabled']);

        // Handle Curve Deposit
        if (curveTokenEnabled && this.state.depositCurveEnabled){

          const curvePoolContractInfo = this.functionsUtil.getGlobalConfig(['curve','poolContract']);
          const tokensToDeposit = this.functionsUtil.normalizeTokenAmount(inputValue,curvePoolContractInfo.decimals);

          const amounts = await this.functionsUtil.getCurveAmounts(this.props.tokenConfig.idle.token,tokensToDeposit);
          let minMintAmount = await this.functionsUtil.getCurveTokenAmount(amounts);
          if (this.state.maxSlippage){
            minMintAmount = this.functionsUtil.BNify(minMintAmount);
            minMintAmount = minMintAmount.minus(minMintAmount.times(this.functionsUtil.BNify(this.state.maxSlippage).div(100)));
            minMintAmount = this.functionsUtil.integerValue(minMintAmount);
          }
          
          const depositParams = [amounts,minMintAmount];

          contractSendResult = await this.functionsUtil.contractMethodSendWrapper(this.state.curveDepositContract.name, 'add_liquidity', depositParams, callbackDeposit, callbackReceiptDeposit);
        } else {
          const tokensToDeposit = this.functionsUtil.normalizeTokenAmount(inputValue,this.props.tokenConfig.decimals);

          const depositMetaTransactionsEnabled = this.functionsUtil.getGlobalConfig(['contract','methods','deposit','metaTransactionsEnabled']);
          // const gasLimitDeposit = this.functionsUtil.BNify(1000000);
          let depositParams = [];

          // Use Proxy Contract if enabled
          const mintProxyContractInfo = this.state.actionProxyContract[this.state.action];
          if (depositMetaTransactionsEnabled && mintProxyContractInfo && this.props.biconomy && this.state.metaTransactionsEnabled){
            const mintProxyContract = this.state.actionProxyContract[this.state.action].contract;
            depositParams = [tokensToDeposit, this.props.tokenConfig.idle.address];
            // console.log('mintProxyContract',mintProxyContractInfo.function,depositParams);
            if (this.state.metaTransactionsEnabled){
              const functionSignature = mintProxyContract.methods[mintProxyContractInfo.function](...depositParams).encodeABI();
              contractSendResult = await this.functionsUtil.sendBiconomyTxWithPersonalSign(mintProxyContractInfo.name, functionSignature, callbackDeposit, callbackReceiptDeposit);
            } else {
              contractSendResult = await this.functionsUtil.contractMethodSendWrapper(mintProxyContractInfo.name, mintProxyContractInfo.function, depositParams, callbackDeposit, callbackReceiptDeposit);
            }
          // Use main contract if no proxy contract exists
          } else {
            let _skipMint = !this.state.directMint && this.functionsUtil.getGlobalConfig(['contract','methods','deposit','skipMint']);
            _skipMint = typeof this.props.tokenConfig.skipMintForDeposit !== 'undefined' ? this.props.tokenConfig.skipMintForDeposit : _skipMint;

            // Mint if someone mint over X amount
            if (_skipMint){
              let [
                maxUnlentPerc,
                totalAUM
              ] = await Promise.all([
                this.functionsUtil.genericContractCall('idleDAIYield', 'maxUnlentPerc'),
                this.functionsUtil.loadAssetField('pool',this.props.selectedToken,this.props.tokenConfig,this.props.account)
              ]);

              if (maxUnlentPerc && totalAUM){
                const depositPerc = inputValue.div(totalAUM).times(100);
                maxUnlentPerc = this.functionsUtil.BNify(maxUnlentPerc).div(1e3);
                if (depositPerc.gte(maxUnlentPerc.times(2))){
                  _skipMint = false;
                }
                // console.log(maxUnlentPerc.toFixed(5),inputValue.toFixed(5),totalAUM.toFixed(5),depositPerc.toFixed(5),depositPerc.gte(maxUnlentPerc.times(2)),_skipMint);
              }
            }

            depositParams = [tokensToDeposit, _skipMint, '0x0000000000000000000000000000000000000000'];
            contractSendResult = await this.functionsUtil.contractMethodSendWrapper(this.props.tokenConfig.idle.token, 'mintIdleToken', depositParams, callbackDeposit, callbackReceiptDeposit);
          }
        }
      break;
      case 'redeem':

        if (redeemGovTokens){
          const callbackRedeem = (tx,error) => {
            const txSucceeded = tx.status === 'success';

            // Send Google Analytics event
            const eventData = {
              eventCategory: `Redeem_gov`,
              eventAction: this.props.selectedToken,
              eventLabel: tx.status,
              eventValue: 0
            };

            if (error){
              eventData.eventLabel = this.functionsUtil.getTransactionError(error);
            }

            // Send Google Analytics event
            if (error || eventData.status !== 'error'){
              this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
            }

            this.setState((prevState) => ({
              processing: {
                ...prevState.processing,
                [this.state.action]:{
                  txHash:null,
                  loading:false
                }
              }
            }));

            if (txSucceeded){
              this.setState((prevState) => ({
                inputValue:{
                  ...prevState.inputValue,
                  [this.state.action]: this.functionsUtil.BNify(0)
                }
              }));
            }
          };

          const callbackReceiptRedeem = (tx) => {
            const txHash = tx.transactionHash;
            this.setState((prevState) => ({
              processing: {
                ...prevState.processing,
                [this.state.action]:{
                  ...prevState.processing[this.state.action],
                  txHash
                }
              }
            }));
          };

          contractSendResult = await this.functionsUtil.contractMethodSendWrapper(this.props.tokenConfig.idle.token, 'redeemIdleToken', [0], callbackRedeem, callbackReceiptRedeem);
          
        } else {

          if (this.state.buttonDisabled || !inputValue || this.functionsUtil.BNify(inputValue).lte(0)){
            return false;
          }

          const txData = {
            value:this.functionsUtil.BNify(inputValue)
          };

          let idleTokenToRedeem = null;
          if (selectedPercentage){
            idleTokenToRedeem = this.functionsUtil.BNify(this.props.idleTokenBalance).times(selectedPercentage);
          } else {
            const idleTokenPrice = await this.functionsUtil.genericContractCall(this.props.tokenConfig.idle.token, 'tokenPrice');
            idleTokenToRedeem = this.functionsUtil.BNify(this.functionsUtil.normalizeTokenAmount(inputValue,this.props.tokenConfig.decimals)).div(idleTokenPrice);
          }

          // Normalize number
          idleTokenToRedeem = this.functionsUtil.normalizeTokenAmount(idleTokenToRedeem,18);

          if (!idleTokenToRedeem){
            return false;
          }

          const callbackRedeem = (tx,error) => {
            const txSucceeded = tx.status === 'success';

            // Send Google Analytics event
            const eventData = {
              eventCategory: `Redeem_partial`,
              eventAction: this.props.selectedToken,
              eventLabel: tx.status,
              eventValue: parseInt(inputValue)
            };

            if (error){
              eventData.eventLabel = this.functionsUtil.getTransactionError(error);
            }

            // Send Google Analytics event
            if (error || eventData.status !== 'error'){
              this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
            }

            this.setState((prevState) => ({
              processing: {
                ...prevState.processing,
                [this.state.action]:{
                  txHash:null,
                  loading:false
                }
              }
            }));

            if (txSucceeded){
              this.setState((prevState) => ({
                inputValue:{
                  ...prevState.inputValue,
                  [this.state.action]: this.functionsUtil.BNify(0)
                }
              }));
            }
          };

          const callbackReceiptRedeem = (tx) => {
            const txHash = tx.transactionHash;
            this.setState((prevState) => ({
              processing: {
                ...prevState.processing,
                [this.state.action]:{
                  ...prevState.processing[this.state.action],
                  txHash
                }
              }
            }));
          };

          let redeemParams = [idleTokenToRedeem];
          // console.log(redeemParams,idleTokenToRedeem);

          contractSendResult = await this.functionsUtil.contractMethodSendWrapper(this.props.tokenConfig.idle.token, 'redeemIdleToken', redeemParams, callbackRedeem, callbackReceiptRedeem, txData);
        }
      break;
      default: // Reset loading if not handled action
        loading = false;
      break;
    }

    if (contractSendResult !== false){
      this.setState((prevState) => ({
        processing: {
          ...prevState.processing,
          [this.state.action]:{
            ...prevState.processing[this.state.action],
            loading
          }
        }
      }));
    }
  }

  setMaxSlippage = (maxSlippage) => {
    this.setState({
      maxSlippage
    });
  }

  showMaxSlippage = () => {
    this.setState({
      showMaxSlippage:true
    });
  }

  checkAction = () => {
    let action = this.state.action;

    switch(action){
      case 'redeem':
        if (!this.state.canRedeem){
          action = 'deposit';
        }
      break;
      default:
      break;
    }

    if (action !== this.state.action){
      this.setState({
        action
      },() => {
        this.checkButtonDisabled();
      });
    } else {
      this.checkButtonDisabled();
    }
  }

  checkButtonDisabled = (amount=null) => {

    if (!this.state.action){
      return false;
    }

    if (!amount){
      amount = this.state.inputValue[this.state.action];
    }

    let buttonDisabled = false;

    switch (this.state.action){
      case 'deposit':
        buttonDisabled = buttonDisabled || (amount && amount.gt(this.props.tokenBalance));
      break;
      case 'redeem':
        buttonDisabled = !this.state.canRedeemCurve && !this.state.redeemGovTokens && ( buttonDisabled || (amount && amount.gt(this.props.redeemableBalance)) );
      break;
      default:
      break;
    }

    this.setState({
      buttonDisabled
    });
  }

  setInputValue = () => {
    if (!this.state.action || this.state.fastBalanceSelector[this.state.action] === null){
      return false;
    }

    const selectedPercentage = this.functionsUtil.BNify(this.state.fastBalanceSelector[this.state.action]).div(100);
    let amount = null;

    switch(this.state.action){
      case 'deposit':
        amount = this.props.tokenBalance ? this.functionsUtil.BNify(this.props.tokenBalance).times(selectedPercentage) : null;
      break;
      case 'redeem':
        amount = this.props.redeemableBalance ? this.functionsUtil.BNify(this.props.redeemableBalance).times(selectedPercentage) : null;
      break;
      default:
      break;
    }

    this.checkButtonDisabled(amount);

    this.setState((prevState) => ({
      inputValue:{
        ...prevState.inputValue,
        [this.state.action]: amount
      }
    }));
  }

  getFastBalanceSelector = () => {
    if (this.state.fastBalanceSelector[this.state.action] === null){
      return false;
    }

    return this.functionsUtil.BNify(this.state.fastBalanceSelector[this.state.action]).div(100);
  }

  setFastBalanceSelector = (percentage) => {
    if (!this.state.action){
      return false;
    }
    this.setState((prevState) => ({
      fastBalanceSelector:{
        ...prevState.fastBalanceSelector,
        [this.state.action]: percentage
      }
    }));
  }

  changeInputValue = (e) => {
    if (!this.state.action){
      return false;
    }
    const amount = e.target.value.length && !isNaN(e.target.value) ? this.functionsUtil.BNify(e.target.value) : this.functionsUtil.BNify(0);
    this.checkButtonDisabled(amount);
    this.setState((prevState) => ({
      fastBalanceSelector:{
        ...prevState.fastBalanceSelector,
        [this.state.action]: null
      },
      inputValue:{
        ...prevState.inputValue,
        [this.state.action]: amount
      }
    }));
  }

  setAction = (action) => {
    switch (action.toLowerCase()){
      case 'deposit':
        
      break;
      case 'redeem':
        if (!this.state.canRedeem && !this.state.canRedeemCurve){
          action = null;
        }
      break;
      default:
        action = null;
      break;
    }

    if (action !== null){
      this.setState({
        action
      });
    }
  }

  render(){

    if (!this.props.selectedToken || !this.props.tokenConfig){
      return null;
    }

    const govTokensDisabled = this.props.tokenConfig.govTokensDisabled;
    const govTokensEnabled = this.functionsUtil.getGlobalConfig(['strategies',this.props.selectedStrategy,'govTokensEnabled']);
    const skipMintForDepositEnabled = typeof this.props.tokenConfig.skipMintForDeposit !== 'undefined' ? this.props.tokenConfig.skipMintForDeposit : true;
    const skipMintCheckboxEnabled = this.functionsUtil.getGlobalConfig(['contract','methods','deposit','skipMintCheckboxEnabled']) && skipMintForDepositEnabled;

    const redeemGovTokenEnabled = this.functionsUtil.getGlobalConfig(['contract','methods','redeemGovTokens','enabled']) && !govTokensDisabled && govTokensEnabled;
    const redeemGovTokens = redeemGovTokenEnabled && this.state.redeemGovTokens && this.state.action === 'redeem';

    const metaTransactionsAvailable = this.props.biconomy && this.state.actionProxyContract[this.state.action];
    const useMetaTx = metaTransactionsAvailable && this.state.metaTransactionsEnabled;
    const totalBalance = this.state.action === 'deposit' ? this.props.tokenBalance : this.props.redeemableBalance;
    const migrateText = this.state.migrationEnabled && this.props.tokenConfig.migration.message !== undefined ? this.props.tokenConfig.migration.message : null;

    const curveConfig = this.functionsUtil.getGlobalConfig(['curve']);
    const curveTokenEnabled = curveConfig.enabled && this.functionsUtil.getGlobalConfig(['curve','availableTokens',this.props.tokenConfig.idle.token,'enabled']);

    const depositCurve = curveTokenEnabled && this.state.depositCurveEnabled && this.state.action === 'deposit';

    const showDepositOptions = this.state.action === 'deposit' && !this.state.contractPaused && (curveTokenEnabled || this.state.tokenApproved);

    const canPerformAction = /*!depositCurve && !this.state.redeemCurveEnabled && */((this.state.action === 'deposit' && this.state.canDeposit) || (this.state.action === 'redeem' && this.state.canRedeem) || redeemGovTokens);
    const showDepositCurve = showDepositOptions && curveTokenEnabled && this.state.componentMounted && (!this.state.migrationEnabled || this.state.skipMigration) && this.state.canDepositCurve && this.state.action === 'deposit';
    const showRedeemCurve = curveTokenEnabled && this.state.componentMounted && (!this.state.migrationEnabled || this.state.skipMigration) && this.state.canRedeemCurve && this.state.action === 'redeem';

    const showActionFlow = !redeemGovTokens && canPerformAction;
    const showBuyFlow = this.state.componentMounted && (!showDepositCurve || this.state.showBuyFlow) && !this.state.depositCurveEnabled && this.state.tokenApproved && !this.state.contractPaused && (!this.state.migrationEnabled || this.state.skipMigration) && this.state.action === 'deposit' && !this.state.canDeposit;
    const showRedeemFlow = this.state.canRedeem && (!this.state.redeemCurveEnabled || this.state.showRedeemFlow);

    const showCurveSlippage = depositCurve && this.state.depositCurveSlippage && this.state.depositCurveBalance && !this.state.buttonDisabled;

    const showRebalanceOption = showDepositOptions && this.state.canDeposit && skipMintCheckboxEnabled && this.state.action === 'deposit';
    const showAdvancedDepositOptions = showDepositCurve || showRebalanceOption;

    return (
      <Flex
        width={1}
        alignItems={'center'}
        flexDirection={'column'}
        justifyContent={'center'}
      >
        <Flex
          width={[1,0.36]}
          alignItems={'stretch'}
          flexDirection={'column'}
          justifyContent={'center'}
        >
          <Box
            width={1}
          >
            <Text mb={1}>
              Select your asset:
            </Text>
            <AssetSelector
              {...this.props}
            />
          </Box>
          <Migrate
            {...this.props}
            migrateTextBefore={migrateText}
            migrateText={migrateText !== null ? '' : null}
            toggleSkipMigration={this.toggleSkipMigration.bind(this)}
          >
            {
              !this.props.account ? (
                <ConnectBox
                  {...this.props}
                />
              ) :
              this.state.componentMounted ? (
                this.state.action ? (
                  <Box width={1}>
                    <Flex
                      mt={2}
                      flexDirection={'column'}
                    >
                      <Text mb={2}>
                        Choose the action:
                      </Text>
                      <Flex
                        alignItems={'center'}
                        flexDirection={'row'}
                        justifyContent={'space-between'}
                      >
                        <DashboardCard
                          cardProps={{
                            p:3,
                            width:0.48,
                            onMouseDown:() => {
                              this.setAction('deposit');
                            }
                          }}
                          isInteractive={true}
                          isActive={ this.state.action === 'deposit' }
                        >
                          <Flex
                            my={1}
                            alignItems={'center'}
                            flexDirection={'row'}
                            justifyContent={'center'}
                          >
                            <TransactionField
                              transaction={{
                                action:'deposit'
                              }}
                              fieldInfo={{
                                name:'icon',
                                props:{
                                  mr:3
                                }
                              }}
                            />
                            <Text
                              fontSize={3}
                              fontWeight={3}
                            >
                              Deposit
                            </Text>
                          </Flex>
                        </DashboardCard>
                        <DashboardCard
                          cardProps={{
                            p:3,
                            width:0.48,
                            onMouseDown:() => {
                              this.setAction('redeem');
                            }
                          }}
                          isInteractive={true}
                          isActive={ this.state.action === 'redeem' }
                          isDisabled={ !this.state.canRedeem && !this.state.canRedeemCurve }
                        >
                          <Flex
                            my={1}
                            alignItems={'center'}
                            flexDirection={'row'}
                            justifyContent={'center'}
                          >
                            <TransactionField
                              transaction={{
                                action:'redeem'
                              }}
                              fieldInfo={{
                                name:'icon',
                                props:{
                                  mr:3
                                }
                              }}
                            />
                            <Text
                              fontSize={3}
                              fontWeight={3}
                            >
                              Redeem
                            </Text>
                          </Flex>
                        </DashboardCard>
                      </Flex>
                    </Flex>
                    {
                      showAdvancedDepositOptions ? (
                        <DashboardCard
                          cardProps={{
                            pt:2,
                            px:2,
                            mt:3,
                            display:'flex',
                            alignItems:'center',
                            flexDirection:'column',
                            justifyContent:'center',
                            pb:this.state.showAdvancedOptions ? 3 : 2,
                          }}
                        >
                          <Flex
                            width={1}
                            alignItems={'center'}
                            flexDirection={'row'}
                            justifyContent={'center'}
                          >
                            <Link
                              ml={1}
                              mainColor={'primary'}
                              hoverColor={'primary'}
                              onClick={this.toggleShowAdvancedOptions}
                            >
                              { this.state.showAdvancedOptions ? 'Hide' : 'Show' } advanced options
                            </Link>
                            <Icon
                              size={'1.8em'}
                              color={'cellText'}
                              name={this.state.showAdvancedOptions ? 'ArrowDropUp' : 'ArrowDropDown'}
                            />
                          </Flex>
                          {
                            this.state.showAdvancedOptions &&
                              <Flex
                                mt={1}
                                flexDirection={'column'}
                              >
                                {
                                  showDepositCurve && 
                                    <Flex
                                      alignItems={'center'}
                                      justifyContent={'row'}
                                    >
                                      <Checkbox
                                        required={false}
                                        disabled={this.state.directMint}
                                        label={`Deposit in the Curve Pool`}
                                        checked={this.state.depositCurveEnabled}
                                        onChange={ e => this.toggleDepositCurve(e.target.checked) }
                                      />
                                      <Link
                                        mainColor={'primary'}
                                        hoverColor={'primary'}
                                        onClick={ e => this.props.openTooltipModal('How Curve works',this.functionsUtil.getGlobalConfig(['messages','curveInstructions'])) }
                                      >
                                        (read more)
                                      </Link>
                                    </Flex>
                                }
                                {
                                  showRebalanceOption && 
                                    <Flex
                                      alignItems={'center'}
                                      justifyContent={'row'}
                                    >
                                      <Checkbox
                                        required={false}
                                        label={`Rebalance the pool`}
                                        checked={this.state.directMint}
                                        disabled={this.state.depositCurveEnabled}
                                        onChange={ e => this.toggleSkipMint(e.target.checked) }
                                      />
                                      <Tooltip
                                        placement={'bottom'}
                                        message={this.functionsUtil.getGlobalConfig(['messages','directMint'])}
                                      >
                                        <Icon
                                          size={'1em'}
                                          color={'cellTitle'}
                                          name={"InfoOutline"}
                                        />
                                      </Tooltip>
                                    </Flex>
                                }
                              </Flex>
                          }
                        </DashboardCard>
                      ) : (
                        <Flex
                          width={1}
                          flexDirection={'column'}
                        >
                          {
                            showDepositCurve && (
                              <Flex
                                width={1}
                                flexDirection={'column'}
                                justifyContent={'center'}
                              >
                                <DashboardCard
                                  isRainbow={true}
                                  cardProps={{
                                    py:3,
                                    px:2,
                                    mt:3,
                                    display:'flex',
                                    alignItems:'center',
                                    flexDirection:'column',
                                    justifyContent:'center',
                                  }}
                                >
                                  <Flex
                                    width={1}
                                    alignItems={'center'}
                                    flexDirection={'column'}
                                    justifyContent={'center'}
                                  >
                                    <Image
                                      height={'1.8em'}
                                      src={curveConfig.params.image}
                                    />
                                    <Text
                                      mt={2}
                                      px={2}
                                      fontSize={1}
                                      color={'dark-gray'}
                                      textAlign={'center'}
                                    >
                                      Deposit your tokens in the Curve Pool and boost your APY up to {this.state.curveAPY ? this.state.curveAPY.toFixed(2) : '-'}%.
                                      <Link
                                        ml={1}
                                        mainColor={'primary'}
                                        hoverColor={'primary'}
                                        onClick={ e => this.props.openTooltipModal('How Curve works',this.functionsUtil.getGlobalConfig(['messages','curveInstructions'])) }
                                      >
                                        Read More
                                      </Link>
                                    </Text>
                                    <Checkbox
                                      mt={2}
                                      required={false}
                                      label={`Deposit in Curve`}
                                      checked={this.state.depositCurveEnabled}
                                      onChange={ e => this.toggleDepositCurve(e.target.checked) }
                                    />
                                  </Flex>
                                </DashboardCard>
                                {
                                  (!this.state.showBuyFlow && !this.state.depositCurveEnabled && !this.state.canDeposit) &&
                                    <Link
                                      textAlign={'center'}
                                      hoverColor={'primary'}
                                      onClick={ e => this.setShowBuyFlow(true) }
                                    >
                                      I just want to deposit more {this.props.selectedToken}
                                    </Link>
                                }
                              </Flex>
                            )
                          }
                          {
                            showRebalanceOption && (
                              <DashboardCard
                                cardProps={{
                                  py:3,
                                  px:2,
                                  mt:3,
                                  display:'flex',
                                  alignItems:'center',
                                  flexDirection:'column',
                                  justifyContent:'center',
                                }}
                              >
                                <Flex
                                  width={1}
                                  alignItems={'center'}
                                  flexDirection={'column'}
                                  justifyContent={'center'}
                                >
                                  <Icon
                                    size={'1.8em'}
                                    color={'cellText'}
                                    name={'InfoOutline'}
                                  />
                                  <Text
                                    mt={1}
                                    px={2}
                                    fontSize={1}
                                    color={'cellText'}
                                    textAlign={'center'}
                                  >
                                    By checking this flag you can rebalance the pool and help all users gain an additional APR
                                  </Text>
                                </Flex>
                                <Checkbox
                                  mt={2}
                                  required={false}
                                  label={`Rebalance the pool`}
                                  checked={this.state.directMint}
                                  onChange={ e => this.toggleSkipMint(e.target.checked) }
                                />
                              </DashboardCard>
                            )
                          }
                        </Flex>
                      )
                    }
                    {
                      (metaTransactionsAvailable && !showBuyFlow && !this.state.contractPaused) && 
                      <DashboardCard
                        cardProps={{
                          py:3,
                          px:2,
                          my:3,
                          display:'flex',
                          alignItems:'center',
                          flexDirection:'column',
                          justifyContent:'center',
                        }}
                      >
                        {
                          this.state.metaTransactionsEnabled && this.state.txError[this.state.action] && this.state.actionProxyContract[this.state.action].approved ? (
                            <Flex
                              width={1}
                              alignItems={'center'}
                              flexDirection={'column'}
                              justifyContent={'center'}
                            >
                              <Icon
                                size={'1.8em'}
                                name={'Warning'}
                                color={'cellText'}
                              />
                              <Text
                                mt={1}
                                fontSize={1}
                                color={'cellText'}
                                textAlign={'center'}
                              >
                                Seems like you are having some trouble with Meta-Transactions... Disable them by unchecking the box below and try again!
                              </Text>
                            </Flex>
                          ) : this.functionsUtil.getWalletProvider() === 'WalletConnect' && this.state.metaTransactionsEnabled ? (
                            <Flex
                              width={1}
                              alignItems={'center'}
                              flexDirection={'column'}
                              justifyContent={'center'}
                            >
                              <Icon
                                size={'1.8em'}
                                name={'Warning'}
                                color={'cellText'}
                              />
                              <Text
                                mt={1}
                                fontSize={1}
                                color={'cellText'}
                                textAlign={'center'}
                              >
                                Please disable Meta-Transactions if you are using Argent Wallet to avoid failed transactions!
                              </Text>
                            </Flex>
                          ) : (
                            <Text
                              mt={1}
                              fontSize={1}
                              color={'cellText'}
                              textAlign={'center'}
                            >
                              Meta-Transactions are {this.state.metaTransactionsEnabled ? 'available' : 'disabled'} for {this.state.action}s!<br />
                              {
                                this.state.metaTransactionsEnabled && !this.state.actionProxyContract[this.state.action].approved && `Please either enable the Smart-Contract to enjoy gas-less ${this.state.action} or just disable meta-tx.`
                              }
                            </Text>
                          )
                        }
                        <Checkbox
                          mt={2}
                          required={false}
                          checked={this.state.metaTransactionsEnabled}
                          onChange={ e => this.toggleMetaTransactionsEnabled(e.target.checked) }
                          label={`${this.functionsUtil.capitalize(this.state.action)} with Meta-Transaction`}
                        />
                      </DashboardCard>
                    }
                    {
                      showRedeemCurve && this.state.canRedeem && (
                        <Flex
                          width={1}
                          flexDirection={'column'}
                          justifyContent={'center'}
                        >
                          <DashboardCard
                            isRainbow={true}
                            cardProps={{
                              py:3,
                              px:2,
                              mt:3,
                              display:'flex',
                              alignItems:'center',
                              flexDirection:'column',
                              justifyContent:'center',
                            }}
                          >
                            <Flex
                              width={1}
                              alignItems={'center'}
                              flexDirection={'column'}
                              justifyContent={'center'}
                            >
                              <Image
                                height={'1.8em'}
                                src={curveConfig.params.image}
                              />
                              <Text
                                mt={2}
                                px={2}
                                fontSize={1}
                                color={'dark-gray'}
                                textAlign={'center'}
                              >
                                Redeem your tokens from the Curve Pool.
                                <Link
                                  ml={1}
                                  mainColor={'primary'}
                                  hoverColor={'primary'}
                                  onClick={ e => this.props.openTooltipModal('How Curve works',this.functionsUtil.getGlobalConfig(['messages','curveInstructions'])) }
                                >
                                  Read More
                                </Link>
                              </Text>
                              {
                                this.state.canRedeem &&
                                  <Checkbox
                                    mt={2}
                                    required={false}
                                    label={`Redeem from Curve`}
                                    checked={this.state.redeemCurveEnabled}
                                    onChange={ e => this.toggleRedeemCurve(e.target.checked) }
                                  />
                              }
                            </Flex>
                          </DashboardCard>
                          {
                            this.canRedeem &&
                              <Link
                                textAlign={'center'}
                                hoverColor={'primary'}
                                onClick={ e => this.setShowRedeemFlow(true) }
                              >
                                I just want to redeem my {this.props.selectedToken}
                              </Link>
                          }
                        </Flex>
                      )
                    }
                    {
                      (this.state.action === 'redeem' && this.state.unlentBalance && showRedeemFlow) &&
                        <DashboardCard
                          cardProps={{
                            py:2,
                            px:2,
                            mt:3,
                            display:'flex',
                            alignItems:'center',
                            flexDirection:'column',
                            justifyContent:'center',
                          }}
                        >
                          <Flex
                            width={1}
                            alignItems={'center'}
                            flexDirection={'column'}
                            justifyContent={'center'}
                          >
                            <Icon
                              size={'1.8em'}
                              color={'cellText'}
                              name={'LocalGasStation'}
                            />
                            <Text
                              px={2}
                              fontSize={1}
                              color={'cellText'}
                              textAlign={'center'}
                            >
                              Available balance for Cheap Redeem
                            </Text>
                            <Flex
                              alignItems={'center'}
                              flexDirection={'row'}
                            >
                              <Text
                                fontSize={1}
                                fontWeight={3}
                                color={'dark-gray'}
                                textAlign={'center'}
                                hoverColor={'copyColor'}
                              >
                                {this.state.unlentBalance.toFixed(4)} {this.props.selectedToken}
                              </Text>
                              <Tooltip
                                placement={'top'}
                                message={this.functionsUtil.getGlobalConfig(['messages','cheapRedeem'])}
                              >
                                <Icon
                                  ml={1}
                                  size={'1em'}
                                  color={'cellTitle'}
                                  name={"InfoOutline"}
                                />
                              </Tooltip>
                            </Flex>
                          </Flex>
                        </DashboardCard>
                    }
                    {
                      (this.state.action === 'redeem' && redeemGovTokenEnabled && showRedeemFlow) && (
                        <DashboardCard
                          cardProps={{
                            py:3,
                            px:2,
                            mt:3,
                            display:'flex',
                            alignItems:'center',
                            flexDirection:'column',
                            justifyContent:'center',
                          }}
                        >
                          <Flex
                            width={1}
                            alignItems={'center'}
                            flexDirection={'column'}
                            justifyContent={'center'}
                          >
                            <Icon
                              size={'1.8em'}
                              color={'cellText'}
                              name={'InfoOutline'}
                            />
                            <Text
                              mt={1}
                              px={2}
                              fontSize={1}
                              color={'cellText'}
                              textAlign={'center'}
                            >
                              By redeeming your {this.props.selectedToken} you will automatically get also the proportional amount of governance tokens accrued{ this.props.govTokensBalance && this.props.govTokensBalance.gt(0) ? ` (~ $${this.props.govTokensBalance.toFixed(2)})` : null }.
                            </Text>
                          </Flex>
                          <Checkbox
                            mt={2}
                            required={false}
                            checked={this.state.redeemGovTokens}
                            label={`Redeem governance tokens only`}
                            onChange={ e => this.toggleRedeemGovTokens(e.target.checked) }
                          />
                        </DashboardCard>
                      )
                    }
                    {
                      (this.state.contractPaused && this.state.action === 'deposit') ? (
                        <DashboardCard
                          cardProps={{
                            p:3,
                            mt:3
                          }}
                        >
                          <Flex
                            alignItems={'center'}
                            flexDirection={'column'}
                          >
                            <Icon
                              size={'1.8em'}
                              name={'Warning'}
                              color={'cellText'}
                            />
                            <Text
                              mt={1}
                              fontSize={2}
                              color={'cellText'}
                              textAlign={'center'}
                            >
                              Deposits for {this.props.selectedToken} are temporarily unavailable due to Smart-Contract maintenance. Redeems are always available.
                            </Text>
                          </Flex>
                        </DashboardCard>
                      ) : (!this.state.tokenApproved && this.state.action === 'deposit') ? (
                        <DashboardCard
                          cardProps={{
                            p:3,
                            mt:3
                          }}
                        >
                          {
                            this.state.processing['approve'] && this.state.processing['approve'].loading ? (
                              <Flex
                                flexDirection={'column'}
                              >
                                <TxProgressBar
                                  web3={this.props.web3}
                                  waitText={`Approve estimated in`}
                                  endMessage={`Finalizing approve request...`}
                                  hash={this.state.processing['approve'].txHash}
                                  cancelTransaction={this.cancelTransaction.bind(this)}
                                />
                              </Flex>
                            ) : (
                              <Flex
                                alignItems={'center'}
                                flexDirection={'column'}
                              >
                                <Icon
                                  size={'1.8em'}
                                  name={'LockOpen'}
                                  color={'cellText'}
                                />
                                <Text
                                  mt={3}
                                  fontSize={2}
                                  color={'cellText'}
                                  textAlign={'center'}
                                >
                                  {
                                    this.state.depositCurveEnabled ? 
                                      `To ${this.functionsUtil.capitalize(this.state.action)} your ${this.props.selectedToken} in the Curve Pool you need to approve the Smart-Contract first.`
                                    : useMetaTx ?
                                      `To ${this.functionsUtil.capitalize(this.state.action)} your ${this.props.selectedToken} into Idle using Meta-Transaction you need to approve our Smart-Contract first.`
                                    :
                                      `To ${this.functionsUtil.capitalize(this.state.action)} your ${this.props.selectedToken} into Idle you need to approve our Smart-Contract first.`
                                  }
                                </Text>
                                <RoundButton
                                  buttonProps={{
                                    mt:3,
                                    width:[1,1/2]
                                  }}
                                  handleClick={this.approveToken.bind(this)}
                                >
                                  Approve
                                </RoundButton>
                              </Flex>
                            )
                          }
                        </DashboardCard>
                      ) : (!showBuyFlow && canPerformAction) && (
                        !this.state.processing[this.state.action].loading ? (
                          <Flex
                            mt={2}
                            flexDirection={'column'}
                          >
                            {
                              showActionFlow && (
                                <Flex
                                  mb={3}
                                  width={1}
                                  flexDirection={'column'}
                                >
                                  {
                                    /*
                                    showCurveSlippage &&
                                      <DashboardCard
                                        cardProps={{
                                          p:3,
                                          mb:2
                                        }}
                                      >
                                        <Flex
                                          alignItems={'center'}
                                          flexDirection={'column'}
                                        >
                                          <Icon
                                            size={'1.8em'}
                                            color={'cellText'}
                                            name={'FileUpload'}
                                          />
                                          <Text
                                            mt={2}
                                            fontSize={2}
                                            color={'cellText'}
                                            textAlign={'center'}
                                          >
                                            You can deposit {this.state.depositCurveBalance.toFixed(4)} {this.props.selectedToken} in the Curve Pool{ this.state.depositCurveSlippage ? (this.state.depositCurveSlippage.gt(0) ? ` with ${this.state.depositCurveSlippage.times(100).toFixed(2)}% of slippage` : ` with ${Math.abs(parseFloat(this.state.depositCurveSlippage.times(100).toFixed(2)))}% of bonus`) : '' }.
                                          </Text>
                                        </Flex>
                                      </DashboardCard>
                                    */
                                  }
                                  {
                                    (totalBalance || this.props.tokenFeesPercentage) && (
                                      <Box
                                        mb={1}
                                        width={1}
                                      >
                                        {
                                          this.state.showMaxSlippage && showCurveSlippage && (
                                            <Box
                                              mb={2}
                                              width={1}
                                            >
                                              <Flex
                                                alignItems={'center'}
                                                flexDirection={'row'}
                                              >
                                                <Text>
                                                  Choose max slippage:
                                                </Text>
                                                <Tooltip
                                                  placement={'top'}
                                                  message={`Max additional slippage on top of the one shown below`}
                                                >
                                                  <Icon
                                                    ml={1}
                                                    size={'1em'}
                                                    color={'cellTitle'}
                                                    name={"InfoOutline"}
                                                  />
                                                </Tooltip>
                                              </Flex>
                                              <Flex
                                                mt={2}
                                                alignItems={'center'}
                                                flexDirection={'row'}
                                                justifyContent={'space-between'}
                                              >
                                                {
                                                  [0.2,0.5,1,5].map( slippage => (
                                                    <FastBalanceSelector
                                                      cardProps={{
                                                        p:1
                                                      }}
                                                      textProps={{
                                                        fontSize:1
                                                      }}
                                                      percentage={slippage}
                                                      key={`selector_${slippage}`}
                                                      onMouseDown={()=>this.setMaxSlippage(slippage)}
                                                      isActive={this.state.maxSlippage === parseFloat(slippage)}
                                                    />
                                                  ))
                                                }
                                              </Flex>
                                            </Box>
                                          )
                                        }
                                        <Flex
                                          width={1}
                                          alignItems={'center'}
                                          flexDirection={'row'}
                                          justifyContent={'space-between'}
                                        >
                                        {
                                          showCurveSlippage ? (
                                            <Flex
                                              width={1}
                                              maxWidth={'50%'}
                                              alignItems={'center'}
                                              flexDirection={'row'}
                                            >
                                              <Text
                                                fontSize={1}
                                                fontWeight={3}
                                                textAlign={'right'}
                                                style={{
                                                  whiteSpace:'nowrap'
                                                }}
                                                color={ this.state.depositCurveSlippage.gt(0) ? this.props.theme.colors.transactions.status.failed : this.props.theme.colors.transactions.status.completed }
                                              >
                                                {
                                                  parseFloat(this.state.depositCurveSlippage.times(100).toFixed(2)) === 0 ?
                                                    'No Slippage'
                                                  : `${ this.state.depositCurveSlippage.gt(0) ? 'Slippage: ' : 'Bonus: ' } ${this.state.depositCurveSlippage.times(100).abs().toFixed(2)}%`
                                                }
                                              </Text>
                                              <Tooltip
                                                placement={'top'}
                                                message={this.functionsUtil.getGlobalConfig(['messages','curveBonusSlippage'])}
                                              >
                                                <Icon
                                                  ml={1}
                                                  size={'1em'}
                                                  color={'cellTitle'}
                                                  name={"InfoOutline"}
                                                />
                                              </Tooltip>
                                              <Link
                                                ml={1}
                                                color={'copyColor'}
                                                hoverColor={'primary'}
                                                onClick={this.showMaxSlippage}
                                              >
                                                change
                                              </Link>
                                            </Flex>
                                          ) : this.props.tokenFeesPercentage && (
                                            <Flex
                                              alignItems={'center'}
                                              flexDirection={'row'}
                                            >
                                              <Text
                                                fontSize={1}
                                                fontWeight={3}
                                                color={'dark-gray'}
                                                textAlign={'right'}
                                                hoverColor={'copyColor'}
                                              >
                                                Performance fee: {this.props.tokenFeesPercentage.times(100).toFixed(2)}%
                                              </Text>
                                              <Tooltip
                                                placement={'top'}
                                                message={this.functionsUtil.getGlobalConfig(['messages','performanceFee'])}
                                              >
                                                <Icon
                                                  ml={1}
                                                  size={'1em'}
                                                  color={'cellTitle'}
                                                  name={"InfoOutline"}
                                                />
                                              </Tooltip>
                                            </Flex>
                                          )
                                        }
                                        {
                                          totalBalance && (
                                            <Link
                                              fontSize={1}
                                              fontWeight={3}
                                              color={'dark-gray'}
                                              textAlign={'right'}
                                              hoverColor={'copyColor'}
                                              onClick={ (e) => this.setFastBalanceSelector(100) }
                                            >
                                              {totalBalance.toFixed(6)} {this.props.selectedToken}
                                            </Link>
                                          )
                                        }
                                        </Flex>
                                      </Box>
                                    )
                                  }
                                  <Input
                                    min={0}
                                    type={"number"}
                                    required={true}
                                    height={'3.4em'}
                                    borderRadius={2}
                                    fontWeight={500}
                                    boxShadow={'none !important'}
                                    placeholder={`Insert amount`}
                                    onChange={this.changeInputValue.bind(this)}
                                    border={`1px solid ${theme.colors.divider}`}
                                    value={this.state.inputValue[this.state.action] !== null ? this.functionsUtil.BNify(this.state.inputValue[this.state.action]).toFixed() : ''}
                                  />
                                  <Flex
                                    mt={2}
                                    alignItems={'center'}
                                    flexDirection={'row'}
                                    justifyContent={'space-between'}
                                  >
                                    {
                                      [25,50,75,100].map( percentage => (
                                        <FastBalanceSelector
                                          percentage={percentage}
                                          key={`selector_${percentage}`}
                                          onMouseDown={()=>this.setFastBalanceSelector(percentage)}
                                          isActive={this.state.fastBalanceSelector[this.state.action] === parseInt(percentage)}
                                        />
                                      ))
                                    }
                                  </Flex>
                                </Flex>
                              )
                            }
                            {
                              canPerformAction && 
                                <Flex
                                  justifyContent={'center'}
                                  mt={ redeemGovTokens ? 2 : 0 }
                                >
                                  <RoundButton
                                    buttonProps={{
                                      width:'auto',
                                      minWidth:[1,1/2],
                                      style:{
                                        textTransform:'capitalize'
                                      },
                                      disabled:this.state.buttonDisabled
                                    }}
                                    handleClick={this.state.buttonDisabled ? null : this.executeAction.bind(this) }
                                  >
                                    {this.state.action}{ redeemGovTokens ? ' Gov Tokens' : '' /*(depositCurve ? ' in Curve' : '')*/ }
                                  </RoundButton>
                                </Flex>
                            }
                          </Flex>
                        ) : (
                          <Flex
                            mt={4}
                            flexDirection={'column'}
                          >
                            <TxProgressBar
                              web3={this.props.web3}
                              cancelTransaction={this.cancelTransaction.bind(this)}
                              hash={this.state.processing[this.state.action].txHash}
                              endMessage={`Finalizing ${this.state.action} request...`}
                              waitText={`${this.functionsUtil.capitalize(this.state.action)} estimated in`}
                            />
                          </Flex>
                        )
                      )
                    }
                  </Box>
                ) : null
              ) : (
                <Flex
                  mt={4}
                  flexDirection={'column'}
                >
                  <FlexLoader
                    flexProps={{
                      flexDirection:'row'
                    }}
                    loaderProps={{
                      size:'30px'
                    }}
                    textProps={{
                      ml:2
                    }}
                    text={'Loading asset info...'}
                  />
                </Flex>
              )
            }
          </Migrate>
        </Flex>
        {
          /*
          showDepositCurve && this.state.depositCurveEnabled ? (
            <CurveDeposit
              {...this.props}
            />
          ) :
          */
          showRedeemCurve && this.state.redeemCurveEnabled && (
            <Box
              mt={3}
              width={1}
            >
              <CurveRedeem
                {...this.props}
              />
            </Box>
          )
        }
        {
          showBuyFlow &&
            <Flex
              mt={3}
              width={[1,0.5]}
              alignItems={'stretch'}
              flexDirection={'column'}
              justifyContent={'center'}
            >
              <BuyModal
                {...this.props}
                showInline={true}
                availableMethods={[]}
                buyToken={this.props.selectedToken}
              />
            </Flex>
        }

        <ShareModal
          confettiEnabled={true}
          icon={`images/medal.svg`}
          title={`Congratulations!`}
          account={this.props.account}
          closeModal={this.resetModal}
          tokenName={this.props.selectedToken}
          isOpen={this.state.activeModal === 'share'}
          text={`You have successfully deposited in Idle!<br />Enjoy <strong>${this.state.tokenAPY}% APY</strong> on your <strong>${this.props.selectedToken}</strong>!`}
          tweet={`I'm earning ${this.state.tokenAPY}% APY on my ${this.props.selectedToken} with @idlefinance! Go to ${this.functionsUtil.getGlobalConfig(['baseURL'])} and start earning now from your idle tokens!`}
        />

      </Flex>
    );
  }
}

export default DepositRedeem;
