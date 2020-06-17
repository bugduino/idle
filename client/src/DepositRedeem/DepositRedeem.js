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
    tokenAPY:'-',
    inputValue:{},
    processing:{},
    canRedeem:false,
    canDeposit:false,
    action:'deposit',
    activeModal:null,
    tokenApproved:false,
    buttonDisabled:false,
    fastBalanceSelector:{},
    actionProxyContract:{},
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
      this.loadProxyContracts();
      this.loadTokenInfo();
      return false;
    }

    const actionChanged = this.state.action !== prevState.action;
    const fastBalanceSelectorChanged = this.state.fastBalanceSelector[this.state.action] !== prevState.fastBalanceSelector[this.state.action];

    if (actionChanged || fastBalanceSelectorChanged){
      this.setInputValue();
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
    if (proxyContract && this.state.metaTransactionsEnabled){
      this.functionsUtil.enableERC20(this.props.selectedToken,proxyContract.address,callbackApprove,callbackReceiptApprove);
    } else {
      this.functionsUtil.enableERC20(this.props.selectedToken,this.props.tokenConfig.idle.address,callbackApprove,callbackReceiptApprove);
    }
  }

  checkTokenApproved = async () => {
    let tokenApproved = false;
    const proxyContract = this.state.actionProxyContract[this.state.action];
    if (proxyContract && this.state.metaTransactionsEnabled){
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
    newState.tokenApproved = await this.checkTokenApproved();
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

  executeAction = async () => {

    const inputValue = this.state.inputValue[this.state.action];
    const selectedPercentage = this.getFastBalanceSelector();

    if (this.state.buttonDisabled || !inputValue || this.functionsUtil.BNify(inputValue).lte(0)){
      return false;
    }

    const loading = true;

    switch (this.state.action){
      case 'deposit':

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

        const gasLimitDeposit = this.functionsUtil.BNify(1000000);
        const mintProxyContractInfo = this.state.actionProxyContract[this.state.action];
        if (mintProxyContractInfo && this.props.biconomy && this.state.metaTransactionsEnabled){
          const depositParams = [tokensToDeposit, this.props.tokenConfig.idle.address];
          const mintProxyContract = this.state.actionProxyContract[this.state.action].contract;
          // console.log('mintProxyContract',mintProxyContractInfo.function,depositParams);
          const functionSignature = mintProxyContract.methods[mintProxyContractInfo.function](...depositParams).encodeABI();
          this.functionsUtil.sendBiconomyTxWithPersonalSign(mintProxyContractInfo.name, functionSignature, callbackDeposit, callbackReceiptDeposit);
        } else {
          const _skipWholeRebalance = this.functionsUtil.getGlobalConfig(['contract','methods','deposit','skipRebalance']);

          // No need for callback atm
          this.props.contractMethodSendWrapper(this.props.tokenConfig.idle.token, 'mintIdleToken', [
            tokensToDeposit, _skipWholeRebalance
          ], null, callbackDeposit, callbackReceiptDeposit, gasLimitDeposit);
        }
      break;
      case 'redeem':
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

        // Get amounts for best allocations
        const _skipRebalance = this.functionsUtil.getGlobalConfig(['contract','methods','redeem','skipRebalance']);
        let paramsForRedeem = null;

        if (this.props.account){
          const callParams = { from: this.props.account, gas: this.props.web3.utils.toBN(5000000) };
          paramsForRedeem = await this.functionsUtil.genericIdleCall('getParamsForRedeemIdleToken',[idleTokenToRedeem, _skipRebalance],callParams);
        }

        const _clientProtocolAmountsRedeem = paramsForRedeem && paramsForRedeem.length ? paramsForRedeem[1] : [];
        const gasLimitRedeem = _clientProtocolAmountsRedeem.length && _clientProtocolAmountsRedeem.indexOf('0') === -1 ? this.functionsUtil.BNify(1500000) : this.functionsUtil.BNify(1000000);

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

        this.props.contractMethodSendWrapper(this.props.tokenConfig.idle.token, 'redeemIdleToken', [
          idleTokenToRedeem, _skipRebalance, _clientProtocolAmountsRedeem
        ], null, callbackRedeem, callbackReceiptRedeem, gasLimitRedeem);
      break;
      default:
      break;
    }

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
    let buttonDisabled = true;
    if (amount !== null){
      buttonDisabled = amount.lte(0);
      switch (this.state.action){
        case 'deposit':
          buttonDisabled = buttonDisabled || amount.gt(this.props.tokenBalance);
        break;
        case 'redeem':
          buttonDisabled = buttonDisabled || amount.gt(this.props.redeemableBalance);
        break;
        default:
        break;
      }
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

    const tokenApproved = this.state.tokenApproved;
    const metaTransactionsAvailable = this.props.biconomy && this.state.actionProxyContract[this.state.action];
    const useMetaTx = metaTransactionsAvailable && this.state.metaTransactionsEnabled;
    const totalBalance = this.state.action === 'deposit' ? this.props.tokenBalance : this.props.redeemableBalance;
    const showBuyFlow = tokenApproved && this.state.action === 'deposit' && this.state.componentMounted && !this.state.canDeposit;

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
                      metaTransactionsAvailable && 
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
                      !tokenApproved && this.state.action === 'deposit' ? (
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
                                <TxProgressBar web3={this.props.web3} waitText={`Approve estimated in`} endMessage={`Finalizing approve request...`} hash={this.state.processing['approve'].txHash} />
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
                      ) :
                      !showBuyFlow && (
                        !this.state.processing[this.state.action].loading ? (
                          <Flex
                            mt={3}
                            flexDirection={'column'}
                          >
                            {
                              totalBalance && 
                                <Link
                                  mb={1}
                                  fontSize={1}
                                  fontWeight={3}
                                  color={'dark-gray'}
                                  textAlign={'right'}
                                  hoverColor={'copyColor'}
                                  onClick={ (e) => this.setFastBalanceSelector(100) }
                                >
                                  {totalBalance.toFixed(6)} {this.props.selectedToken}
                                </Link>
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
                            <Flex
                              mt={3}
                              justifyContent={'center'}
                            >
                              <RoundButton
                                buttonProps={{
                                  width:[1,1/2],
                                  disabled:this.state.buttonDisabled,
                                  style:{
                                    textTransform:'capitalize'
                                  }
                                }}
                                handleClick={this.state.buttonDisabled ? null : this.executeAction.bind(this) }
                              >
                                {this.state.action}
                              </RoundButton>
                            </Flex>
                          </Flex>
                        ) : (
                          <Flex
                            mt={4}
                            flexDirection={'column'}
                          >
                            <TxProgressBar web3={this.props.web3} waitText={`${this.functionsUtil.capitalize(this.state.action)} estimated in`} endMessage={`Finalizing ${this.state.action} request...`} hash={this.state.processing[this.state.action].txHash} />
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
              width={[1,0.5]}
              alignItems={'stretch'}
              flexDirection={'column'}
              justifyContent={'center'}
              mt={metaTransactionsAvailable ? 0 : 3}
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
