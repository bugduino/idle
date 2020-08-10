import theme from '../theme';
import Migrate from '../Migrate/Migrate';
import React, { Component } from 'react';
import FlexLoader from '../FlexLoader/FlexLoader';
import RoundButton from '../RoundButton/RoundButton';
import FunctionsUtil from '../utilities/FunctionsUtil';
import BuyModal from '../utilities/components/BuyModal';
import DashboardCard from '../DashboardCard/DashboardCard';
import AssetSelector from '../AssetSelector/AssetSelector';
import TxProgressBar from '../TxProgressBar/TxProgressBar';
import ShareModal from '../utilities/components/ShareModal';
import TransactionField from '../TransactionField/TransactionField';
import { Flex, Text, Input, Box, Icon, Link, Checkbox } from "rimble-ui";
import FastBalanceSelector from '../FastBalanceSelector/FastBalanceSelector';

class DepositRedeem extends Component {

  state = {
    txError:{},
    tokenAPY:'-',
    inputValue:{},
    processing:{},
    canRedeem:false,
    canDeposit:false,
    action:'deposit',
    activeModal:null,
    tokenApproved:false,
    contractPaused:false,
    buttonDisabled:false,
    redeemGovTokens:false,
    fastBalanceSelector:{},
    actionProxyContract:{},
    migrationEnabled:false,
    componentMounted:false,
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
    if (tokenAprs && tokenAprs.avgApr !== null){
      const tokenAPR = tokenAprs.avgApr;
      const tokenAPY = this.functionsUtil.apr2apy(tokenAPR.div(100)).times(100).toFixed(2);
      this.setState({
        tokenAPY
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

    const metaTransactionsChanged = prevState.metaTransactionsEnabled !== this.state.metaTransactionsEnabled;
    if (metaTransactionsChanged){
      const tokenApproved = await this.checkTokenApproved();
      this.setState({
        tokenApproved
      });
    }
  }

  approveContract = async (callbackApprove,callbackReceiptApprove) => {
    const proxyContract = this.state.actionProxyContract[this.state.action];
    if (proxyContract && this.state.metaTransactionsEnabled && this.props.biconomy){
      this.functionsUtil.enableERC20(this.props.selectedToken,proxyContract.address,callbackApprove,callbackReceiptApprove);
    } else {
      this.functionsUtil.enableERC20(this.props.selectedToken,this.props.tokenConfig.idle.address,callbackApprove,callbackReceiptApprove);
    }
  }

  checkTokenApproved = async () => {
    let tokenApproved = false;
    const proxyContract = this.state.actionProxyContract[this.state.action];
    if (proxyContract && this.state.metaTransactionsEnabled && this.props.biconomy){
      tokenApproved = await this.functionsUtil.checkTokenApproved(this.props.selectedToken,proxyContract.address,this.props.account);
    } else {
      tokenApproved = await this.functionsUtil.checkTokenApproved(this.props.selectedToken,this.props.tokenConfig.idle.address,this.props.account);
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

    const newState = {...this.state};
    newState.canDeposit = this.props.tokenBalance && this.functionsUtil.BNify(this.props.tokenBalance).gt(0);
    newState.canRedeem = this.props.idleTokenBalance && this.functionsUtil.BNify(this.props.idleTokenBalance).gt(0);
    const [
      tokenApproved,
      contractPaused,
      {migrationEnabled}
    ] = await Promise.all([
      this.checkTokenApproved(),
      this.functionsUtil.checkContractPaused(),
      this.functionsUtil.checkMigration(this.props.tokenConfig,this.props.account)
    ]);

    newState.tokenApproved = tokenApproved;
    newState.contractPaused = contractPaused;
    newState.migrationEnabled = migrationEnabled;
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
      }
    };
    newState.inputValue = {
      redeem:null,
      deposit:null
    };
    newState.fastBalanceSelector = {
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

    const loading = true;

    switch (this.state.action){
      case 'deposit':

        if (this.state.buttonDisabled || !inputValue || this.functionsUtil.BNify(inputValue).lte(0)){
          return false;
        }

        if (!this.state.tokenApproved){
          return this.approveToken();
        }

        const tokensToDeposit = this.functionsUtil.normalizeTokenAmount(inputValue,this.props.tokenConfig.decimals);

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

        const depositMetaTransactionsEnabled = this.functionsUtil.getGlobalConfig(['contract','methods','deposit','metaTransactionsEnabled']);
        // const gasLimitDeposit = this.functionsUtil.BNify(1000000);

        // Use Proxy Contract if enabled
        const mintProxyContractInfo = this.state.actionProxyContract[this.state.action];
        if (depositMetaTransactionsEnabled && mintProxyContractInfo && this.props.biconomy && this.state.metaTransactionsEnabled){
          const mintProxyContract = this.state.actionProxyContract[this.state.action].contract;
          const depositParams = [tokensToDeposit, this.props.tokenConfig.idle.address];
          // console.log('mintProxyContract',mintProxyContractInfo.function,depositParams);
          if (this.state.metaTransactionsEnabled){
            const functionSignature = mintProxyContract.methods[mintProxyContractInfo.function](...depositParams).encodeABI();
            contractSendResult = await this.functionsUtil.sendBiconomyTxWithPersonalSign(mintProxyContractInfo.name, functionSignature, callbackDeposit, callbackReceiptDeposit);
          } else {
            contractSendResult = await this.props.contractMethodSendWrapper(mintProxyContractInfo.name, mintProxyContractInfo.function, depositParams, null, callbackDeposit, callbackReceiptDeposit);
          }
        // Use main contract if no proxy contract exists
        } else {

          let _skipMint = this.functionsUtil.getGlobalConfig(['contract','methods','deposit','skipMint']);
          _skipMint = typeof this.props.tokenConfig.skipMintForDeposit !== 'undefined' ? this.props.tokenConfig.skipMintForDeposit : _skipMint;

          // Mint if someone mint over X amount
          const minAmountForMint = this.functionsUtil.getGlobalConfig(['contract','methods','deposit','minAmountForMint']);
          if (minAmountForMint){
            const amountToDeposit = await this.functionsUtil.convertTokenBalance(inputValue,this.props.selectedToken,this.props.tokenConfig,false);
            if (amountToDeposit.gte(this.functionsUtil.BNify(minAmountForMint))){
              _skipMint = false;
            }
          }

          // No need for callback atm
          contractSendResult = await this.props.contractMethodSendWrapper(this.props.tokenConfig.idle.token, 'mintIdleToken', [
            tokensToDeposit, _skipMint, '0x0000000000000000000000000000000000000000'
          ], null, callbackDeposit, callbackReceiptDeposit);
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

          contractSendResult = await this.props.contractMethodSendWrapper(this.props.tokenConfig.idle.token, 'redeemIdleToken', [0], null, callbackRedeem, callbackReceiptRedeem);
          
        } else {

          if (this.state.buttonDisabled || !inputValue || this.functionsUtil.BNify(inputValue).lte(0)){
            return false;
          }

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

          contractSendResult = await this.props.contractMethodSendWrapper(this.props.tokenConfig.idle.token, 'redeemIdleToken', [idleTokenToRedeem], null, callbackRedeem, callbackReceiptRedeem);
        }
      break;
      default:
      break;
    }

    // console.log('contractSendResult',contractSendResult);

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

    return true;

    if (!this.state.action){
      return false;
    }

    if (!amount){
      amount = this.state.inputValue[this.state.action];
    }

    let buttonDisabled = amount === null || amount.lte(0);

    switch (this.state.action){
      case 'deposit':
        buttonDisabled = buttonDisabled || (amount && amount.gt(this.props.tokenBalance));
      break;
      case 'redeem':
        buttonDisabled = !this.state.redeemGovTokens && ( buttonDisabled || (amount && amount.gt(this.props.redeemableBalance)) );
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
        // if (!this.state.canDeposit){
        //   action = null;
        // }
      break;
      case 'redeem':
        if (!this.state.canRedeem){
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

  render() {

    if (!this.props.selectedToken || !this.props.tokenConfig){
      return null;
    }

    const govTokensDisabled = this.props.tokenConfig.govTokensDisabled;
    const redeemGovTokenEnabled = this.functionsUtil.getGlobalConfig(['contract','methods','redeemGovTokens','enabled']) && !govTokensDisabled;
    const redeemGovTokens = redeemGovTokenEnabled && this.state.redeemGovTokens && this.state.action === 'redeem';
    const metaTransactionsAvailable = this.props.biconomy && this.state.actionProxyContract[this.state.action];
    const useMetaTx = metaTransactionsAvailable && this.state.metaTransactionsEnabled;
    const totalBalance = this.state.action === 'deposit' ? this.props.tokenBalance : this.props.redeemableBalance;
    const showBuyFlow = this.state.tokenApproved && !this.state.contractPaused && !this.state.migrationEnabled && this.state.action === 'deposit' && this.state.componentMounted && !this.state.canDeposit;
    const migrateText = this.state.migrationEnabled && this.props.tokenConfig.migration.message !== undefined ? this.props.tokenConfig.migration.message : null;

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
            migrateText={migrateText !== null ? '' : null}
            migrateTextBefore={migrateText}
          >
            {
              !this.props.account ? (
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
                      size={'2.3em'}
                      name={'Input'}
                      color={'cellText'}
                    />
                    <Text
                      mt={2}
                      fontSize={2}
                      color={'cellText'}
                      textAlign={'center'}
                    >
                      Please connect with your wallet interact with Idle.
                    </Text>
                    <RoundButton
                      buttonProps={{
                        mt:2,
                        width:[1,1/2]
                      }}
                      handleClick={this.props.connectAndValidateAccount}
                    >
                      Connect
                    </RoundButton>
                  </Flex>
                </DashboardCard>
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
                          isDisabled={ !this.state.canRedeem }
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
                                size={'2.3em'}
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
                                size={'2.3em'}
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
                      (this.state.action === 'redeem' && redeemGovTokenEnabled) && (
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
                          <Flex
                            width={1}
                            alignItems={'center'}
                            flexDirection={'column'}
                            justifyContent={'center'}
                          >
                            <Icon
                              size={'2.3em'}
                              name={'Info'}
                              color={'cellText'}
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
                              size={'2.3em'}
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
                                  size={'2.3em'}
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
                                    useMetaTx ?
                                      `To ${this.functionsUtil.capitalize(this.state.action)} your ${this.props.selectedToken} into Idle using Meta-Transaction you need to enable our Smart-Contract first.`
                                    :
                                      `To ${this.functionsUtil.capitalize(this.state.action)} your ${this.props.selectedToken} into Idle you need to enable our Smart-Contract first.`
                                  }
                                </Text>
                                <RoundButton
                                  buttonProps={{
                                    mt:3,
                                    width:[1,1/2]
                                  }}
                                  handleClick={this.approveToken.bind(this)}
                                >
                                  Enable
                                </RoundButton>
                              </Flex>
                            )
                          }
                        </DashboardCard>
                      ) : !showBuyFlow && (
                        !this.state.processing[this.state.action].loading ? (
                          <Flex
                            mt={3}
                            flexDirection={'column'}
                          >
                            {
                              !redeemGovTokens && (
                                <Flex
                                  mb={3}
                                  width={1}
                                  flexDirection={'column'}
                                >
                                  {
                                    (totalBalance || this.props.tokenFeesPercentage) && (
                                      <Flex
                                        mb={1}
                                        width={1}
                                        alignItems={'center'}
                                        flexDirection={'row'}
                                        justifyContent={'space-between'}
                                      >
                                        {
                                          this.props.tokenFeesPercentage && (
                                            <Text
                                              fontSize={1}
                                              fontWeight={3}
                                              color={'dark-gray'}
                                              textAlign={'right'}
                                              hoverColor={'copyColor'}
                                            >
                                              Fees: {this.props.tokenFeesPercentage.times(100).toFixed(2)}% on gains
                                            </Text>
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
                                    onChange={this.changeInputValue.bind(this)}
                                    border={`1px solid ${theme.colors.divider}`}
                                    placeholder={`Insert ${this.props.selectedToken.toUpperCase()} amount`}
                                    value={this.state.inputValue[this.state.action] !== null ? this.functionsUtil.BNify(this.state.inputValue[this.state.action]).toString() : ''}
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
                            <Flex
                              justifyContent={'center'}
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
                                {this.state.action}{ redeemGovTokens ? ' Gov Tokens' : '' }
                              </RoundButton>
                            </Flex>
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
