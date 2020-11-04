import Title from '../Title/Title';
import React, { Component } from 'react';
import Breadcrumb from '../Breadcrumb/Breadcrumb';
import { Box, Flex, Text, Icon } from "rimble-ui";
import CurveRedeem from '../CurveRedeem/CurveRedeem';
import FunctionsUtil from '../utilities/FunctionsUtil';
import BuyModal from '../utilities/components/BuyModal';
import CurveDeposit from '../CurveDeposit/CurveDeposit';
import AssetSelector from '../AssetSelector/AssetSelector';
import DashboardCard from '../DashboardCard/DashboardCard';
import TransactionField from '../TransactionField/TransactionField';
import TransactionsList from '../TransactionsList/TransactionsList';
import FundsOverviewCurve from '../FundsOverviewCurve/FundsOverviewCurve';

class AssetPage extends Component {

  state = {
    inputValue:{},
    processing:{},
    tokenFees:null,
    canRedeem:null,
    canDeposit:null,
    action:'deposit',
    activeModal:null,
    tokenConfig:null,
    tokenBalance:null,
    tokenApproved:null,
    selectedToken:null,
    availableTokens:{},
    redeemBalance:null,
    depositBalance:null,
    buttonDisabled:false,
    curveTokenPrice:null,
    depositSlippage:null,
    idleTokenBalance:null,
    withdrawSlippage:null,
    govTokensBalance:null,
    curveZapContract:null,
    curveTokenConfig:null,
    curveTokensAmounts:{},
    govTokensDisabled:null,
    componentMounted:false,
    curvePoolContract:null,
    curveSwapContract:null,
    curveTokenBalance:null,
    redeemableBalance:null,
    fastBalanceSelector:{},
    curveAvailableTokens:{},
    tokenFeesPercentage:null,
    redeemUnevenAmounts:false,
    curveDepositContract:null
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

  toggleUnevenAmounts = (redeemUnevenAmounts) => {
    this.setState({
      redeemUnevenAmounts
    });
  }

  changeFromToken = (selectedToken) => {
    const curveConfig = this.functionsUtil.getGlobalConfig(['curve']);
    this.props.goToSection(`${curveConfig.params.route}/${selectedToken}`);
  }

  getSelectedToken(){
    const curveAvailableTokens = this.functionsUtil.getGlobalConfig(['curve','availableTokens']);
    return this.props.urlParams.param1 && curveAvailableTokens[this.props.urlParams.param1] ? this.props.urlParams.param1 : Object.keys(curveAvailableTokens)[0];
  }

  setSelectedToken = async (selectedToken) => {
    const availableTokens = this.functionsUtil.getCurveAvailableTokens();
    const curveAvailableTokens = this.functionsUtil.getGlobalConfig(['curve','availableTokens']);
    const curveTokenConfig = curveAvailableTokens[selectedToken];
    const tokenConfig = availableTokens[curveTokenConfig.baseToken];
    this.setState({
      tokenConfig,
      selectedToken,
      availableTokens,
      curveTokenConfig
    });
  }

  loadTokensInfo = async () => {

    const curveAvailableTokens = this.functionsUtil.getGlobalConfig(['curve','availableTokens']);
    this.setState({
      curveAvailableTokens
    });

    const selectedToken = this.getSelectedToken();
    // Check if token is set the query params
    if (selectedToken && selectedToken !== this.props.urlParams.param1){
      this.changeFromToken(selectedToken);
      return await this.setSelectedToken(selectedToken);
    } else if (selectedToken !== this.state.selectedToken){
      await this.setSelectedToken(selectedToken);
    }

    const newState = {...this.state};

    const availableTokens = this.functionsUtil.getCurveAvailableTokens();

    if (newState.selectedToken !== selectedToken){
      newState.selectedToken = selectedToken;
    }

    const curveTokenConfig = curveAvailableTokens[selectedToken];
    const tokenConfig = availableTokens[curveTokenConfig.baseToken];

    const [
      curveZapContract,
      curvePoolContract,
      curveSwapContract,
      curveDepositContract
    ] = await Promise.all([
      this.functionsUtil.getCurveZapContract(),
      this.functionsUtil.getCurvePoolContract(),
      this.functionsUtil.getCurveSwapContract(),
      this.functionsUtil.getCurveDepositContract()
    ]);

    newState.curveZapContract = curveZapContract;
    newState.curvePoolContract = curvePoolContract;
    newState.curveSwapContract = curveSwapContract;
    newState.curveDepositContract = curveDepositContract;

    newState.availableTokens = availableTokens;


    // console.log('curveTokenPrice',newState.curveTokenPrice.toFixed(6),'curveTokenBalance',newState.curveTokenBalance.toFixed(6),'redeemableBalance',newState.redeemableBalance.toFixed(20),'tokenBalance',newState.tokenBalance.toFixed(20));
    const govTokenAvailableTokens = {};
    govTokenAvailableTokens[selectedToken] = tokenConfig;

    newState.tokenConfig = tokenConfig;
    newState.curveTokenConfig = curveTokenConfig;

    if (this.props.account){
      [
        newState.curveTokenPrice,
        newState.curveTokenBalance,
        newState.tokenFeesPercentage,
        newState.tokenFees,
        newState.tokenBalance,
        newState.idleTokenBalance,
        newState.tokenApproved,
      ] = await Promise.all([
        this.functionsUtil.getCurveTokenPrice(),
        this.functionsUtil.getCurveTokenBalance(),
        this.functionsUtil.getTokenFees(tokenConfig),
        this.functionsUtil.getUserTokenFees(tokenConfig,this.props.account),
        this.functionsUtil.getTokenBalance(selectedToken,this.props.account),
        this.functionsUtil.getTokenBalance(tokenConfig.idle.token,this.props.account),
        this.functionsUtil.checkTokenApproved(selectedToken,curveDepositContract.address,this.props.account),
      ]);


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
      newState.depositBalance = newState.tokenBalance;
      newState.redeemBalance = newState.redeemableBalance;
      newState.govTokensDisabled = tokenConfig.govTokensDisabled;
      newState.canRedeem = newState.curveTokenBalance && newState.curveTokenBalance.gt(0);
      newState.canDeposit = newState.idleTokenBalance && newState.idleTokenBalance.gt(0);
      newState.redeemableBalance = newState.curveTokenBalance ? newState.curveTokenBalance.times(newState.curveTokenPrice) : this.functionsUtil.BNify(0);
    }

    this.setState(newState);
  }

  async componentWillMount(){
    this.loadUtils();
    await this.loadTokensInfo();
  }

  async calculateSlippage(){
    const amount = this.state.inputValue[this.state.action] ? this.functionsUtil.BNify(this.state.inputValue[this.state.action]) : null;

    if (!amount || amount.lte(0)){
      return false;
    }

    const normalizedAmount = this.functionsUtil.normalizeTokenAmount(amount,this.state.curvePoolContract.decimals);
    const newState = {};

    switch (this.state.action){
      case 'deposit':
        newState.depositBalance = amount;
        newState.depositSlippage = await this.functionsUtil.getCurveSlippage(this.state.tokenConfig.idle.token,normalizedAmount,true);
      break;
      case 'redeem':
        newState.redeemBalance = amount;
        newState.withdrawSlippage = await this.functionsUtil.getCurveSlippage(this.state.tokenConfig.idle.token,normalizedAmount,true);
      break;
      default:
      break;
    }
    // console.log('calculateSlippage',newState);

    this.setState(newState);
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();
    const accountChanged = prevProps.account !== this.props.account;
    const tokenChanged = prevProps.urlParams.param1 !== this.props.urlParams.param1;
    const transactionsChanged = prevProps.transactions && this.props.transactions && Object.values(prevProps.transactions).filter(tx => (tx.status==='success')).length !== Object.values(this.props.transactions).filter(tx => (tx.status==='success')).length;

    if (accountChanged || transactionsChanged || tokenChanged){
      await this.loadTokensInfo();
    }

    const actionChanged = this.state.action !== prevState.action;
    const redeemUnevenAmountsChanged = this.state.redeemUnevenAmounts !== prevState.redeemUnevenAmounts;
    const fastBalanceSelectorChanged = this.state.fastBalanceSelector[this.state.action] !== prevState.fastBalanceSelector[this.state.action];
    if (actionChanged || fastBalanceSelectorChanged || redeemUnevenAmountsChanged){
      this.setInputValue();
    }

    if (actionChanged){
      this.updateAssetSelector();
    }

    const inputChanged = prevState.inputValue[this.state.action] !== this.state.inputValue[this.state.action];
    if (inputChanged){
      this.calculateSlippage();
    }
  }

  updateAssetSelector = async () => {
    const newState = {};
    switch (this.state.action){
      case 'deposit':
        this.loadTokensInfo();
      break;
      case 'redeem':
        const tokenConfig = this.functionsUtil.getGlobalConfig(['curve','poolContract']);
        newState.curveAvailableTokens = {};
        newState.curveTokenConfig = tokenConfig;
        newState.selectedToken = tokenConfig.token;
        newState.curveAvailableTokens[tokenConfig.token] = tokenConfig;
      break;
      default:
      break;
    }

    this.setState(newState);
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

  setInputValue = () => {
    if (!this.state.action || this.state.fastBalanceSelector[this.state.action] === null){
      return false;
    }

    const selectedPercentage = this.functionsUtil.BNify(this.state.fastBalanceSelector[this.state.action]).div(100);
    let amount = null;

    switch(this.state.action){
      case 'deposit':
        amount = this.state.tokenBalance ? this.functionsUtil.BNify(this.state.tokenBalance).times(selectedPercentage) : null;
      break;
      case 'redeem':
        if (this.state.redeemUnevenAmounts){
          amount = this.state.curveTokenBalance ? this.functionsUtil.BNify(this.state.curveTokenBalance).times(selectedPercentage) : null;
        } else {
          amount = this.state.redeemableBalance ? this.functionsUtil.BNify(this.state.redeemableBalance).times(selectedPercentage) : null;
        }
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
        buttonDisabled = buttonDisabled || (amount && amount.gt(this.state.tokenBalance));
      break;
      case 'redeem':
        if (this.state.redeemUnevenAmounts){
          buttonDisabled = !this.state.canRedeem || (buttonDisabled || (amount && amount.gt(this.state.curveTokenBalance)) );
        } else {
          buttonDisabled = !this.state.canRedeem || (buttonDisabled || (amount && amount.gt(this.state.redeemableBalance)) );
        }
      break;
      default:
      break;
    }

    this.setState({
      buttonDisabled
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

  approveToken = async () => {

    // Check if the token is already approved
    const tokenApproved = this.state.tokenApproved;

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
        eventAction: this.state.selectedToken,
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

    this.functionsUtil.enableERC20(this.state.selectedToken,this.state.curveDepositContract.address,callbackApprove,callbackReceiptApprove);

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

  executeAction = async () => {

    let contractSendResult = null;
    const inputValue = this.state.inputValue[this.state.action];
    const selectedPercentage = this.getFastBalanceSelector();

    let loading = true;

    switch (this.state.action){
      // Handle deposit in curve
      case 'deposit':

        if (this.state.buttonDisabled || !inputValue || this.functionsUtil.BNify(inputValue).lte(0)){
          return false;
        }

        const tokensToDeposit = this.functionsUtil.normalizeTokenAmount(inputValue,this.state.curvePoolContract.decimals);

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
            eventAction: this.state.selectedToken,
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

        const amounts = await this.functionsUtil.getCurveAmounts(this.state.tokenConfig.idle.token,tokensToDeposit);
        const minMintAmount = await this.functionsUtil.genericContractCall(this.state.curveSwapContract.name,'calc_token_amount',[amounts,true]);
        const depositParams = [amounts,minMintAmount];

        // No need for callback atm
        contractSendResult = await this.props.contractMethodSendWrapper(this.state.curveDepositContract.name, 'add_liquidity', depositParams, null, callbackDeposit, callbackReceiptDeposit);
      break;
      case 'redeem':

        if (this.state.buttonDisabled || !inputValue || this.functionsUtil.BNify(inputValue).lte(0)){
          return false;
        }

        let curveTokensToRedeem = null;
        if (selectedPercentage){
          curveTokensToRedeem = this.functionsUtil.BNify(this.state.curveTokenBalance).times(selectedPercentage);
        } else {
          curveTokensToRedeem = this.functionsUtil.BNify(this.functionsUtil.normalizeTokenAmount(inputValue,this.state.curvePoolContract.decimals));
          if (!this.state.redeemUnevenAmounts){
            const curveTokenPrice = await this.functionsUtil.getCurveTokenPrice();
            curveTokensToRedeem = curveTokensToRedeem.div(curveTokenPrice);
          }
        }

        if (!curveTokensToRedeem){
          return false;
        }

        const callbackRedeem = (tx,error) => {
          const txSucceeded = tx.status === 'success';

          // Send Google Analytics event
          const eventData = {
            eventLabel: tx.status,
            eventCategory: `CurveRedeem`,
            eventAction: this.state.selectedToken,
            eventValue: curveTokensToRedeem.toFixed()
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

        const _amount = this.functionsUtil.normalizeTokenAmount(curveTokensToRedeem,this.state.curvePoolContract.decimals).toString();
        let min_amounts = await this.functionsUtil.getCurveAmounts(this.state.tokenConfig.idle.token,0);

        const contractName = this.state.curveDepositContract.name;
        if (this.state.redeemUnevenAmounts){
          console.log('remove_liquidity_imbalance',this.functionsUtil.BNify(inputValue).toString(),_amount.toString(),min_amounts);
          this.props.contractMethodSendWrapper(contractName, 'remove_liquidity_imbalance', [min_amounts, _amount], null, callbackRedeem, callbackReceiptRedeem);
        } else {
          min_amounts = await this.functionsUtil.getCurveAmounts(this.state.tokenConfig.idle.token,_amount);
          console.log('remove_liquidity',this.functionsUtil.BNify(inputValue).toString(),_amount.toString(),min_amounts);
          this.props.contractMethodSendWrapper(contractName, 'remove_liquidity', [_amount, min_amounts], null, callbackRedeem, callbackReceiptRedeem);
        }
      break;
      default: // Reset loading if not handled action
        loading = false;
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

  setAction = (action) => {
    switch (action.toLowerCase()){
      case 'deposit':
        
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

  render(){

    const userHasFunds = this.props.account && this.state.curveTokenBalance && this.functionsUtil.BNify(this.state.curveTokenBalance).gt(0);
    const canPerformAction = true;

    return (
      <Box
        width={1}
      >
        <Flex
          width={1}
          mb={[3,4]}
          alignItems={'center'}
          flexDirection={'row'}
          justifyContent={'flex-start'}
        >
          <Flex
            width={0.5}
          >
            {
              <Breadcrumb
                isMobile={this.props.isMobile}
                path={['Boost',this.state.selectedToken]}
                handleClick={ e => this.props.goToSection('best') }
                text={this.functionsUtil.getGlobalConfig(['strategies','best','title'])}
              />
            }
          </Flex>
        </Flex>
        <Title
          mb={[3,4]}
        >
          Curve Pool
        </Title>
        <Flex
          width={1}
        >
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
                <Text
                  mb={1}
                >
                  Select your asset:
                </Text>
                <AssetSelector
                  {...this.props}
                  id={'token-from'}
                  onChange={this.changeFromToken}
                  selectedToken={this.state.selectedToken}
                  tokenConfig={this.state.curveTokenConfig}
                  showBalance={this.state.action === 'deposit'}
                  availableTokens={this.state.curveAvailableTokens}
                />
              </Box>
              <Box
                width={1}
              >
                {
                  canPerformAction ? (
                    <Flex
                      mt={2}
                      flexDirection={'column'}
                    >
                      <Text
                        mb={2}
                      >
                        Choose the action:
                      </Text>
                      <Flex
                        alignItems={'center'}
                        flexDirection={'row'}
                        justifyContent={'space-between'}
                      >
                        <DashboardCard
                          cardProps={{
                            p:[2,3],
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
                                  mr:[1,3]
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
                            p:[2,3],
                            width:0.48,
                            onMouseDown:() => {
                              this.setAction('redeem');
                            }
                          }}
                          isInteractive={true}
                          isDisabled={ !this.state.canRedeem }
                          isActive={ this.state.action === 'redeem' }
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
                                  mr:[1,3]
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
                  ) : (
                    <Flex
                      alignItems={'center'}
                      flexDirection={'column'}
                    >
                      <Icon
                        size={'2.3em'}
                        name={'MoneyOff'}
                        color={'cellText'}
                      />
                      <Text
                        mt={2}
                        fontSize={2}
                        color={'cellText'}
                        textAlign={'center'}
                      >
                        You don't have any {this.state.tokenConfig.idle.token} in your wallet.
                      </Text>
                    </Flex>
                  )
                }
              </Box>
            </Flex>
            <Flex
              width={1}
              mt={ this.props.account ? 3 : 0 }
            >
            {
              this.state.action === 'deposit' ? (
                <CurveDeposit
                  {...this.props}
                  {...this.state}
                />
              ) : this.state.action === 'redeem' && (
                <CurveRedeem
                  {...this.props}
                  {...this.state}
                />
              )
            }
            </Flex>
          </Flex>
        </Flex>
        {
          userHasFunds &&
            <Flex
              mb={[0,4]}
              width={1}
              flexDirection={'column'}
              id={'funds-overview-container'}
            >
              <Title my={[3,4]}>Funds Overview</Title>
              <FundsOverviewCurve
                {...this.props}
                tokenFees={this.state.tokenFees}
                tokenConfig={this.state.tokenConfig}
                selectedToken={this.state.selectedToken}
                availableTokens={this.state.availableTokens}
                enabledTokens={Object.keys(this.state.availableTokens)}
              />
            </Flex>
        }
        {
          /*
          this.props.account && !this.state.govTokensDisabled[this.state.selectedToken] && Object.keys(availableGovTokens).length>0 && 
            <Flex
              width={1}
              id="earnings-estimation"
              flexDirection={'column'}
            >
              <Title my={[3,4]}>Yield Farming</Title>
              <AssetsList
                enabledTokens={Object.keys(availableGovTokens)}
                handleClick={(props) => {}}
                cols={[
                  {
                    title:'TOKEN',
                    props:{
                      width:[0.33,0.22]
                    },
                    fields:[
                      {
                        name:'icon',
                        props:{
                          mr:2,
                          height:['1.4em','2.3em']
                        }
                      },
                      {
                        name:'tokenName'
                      }
                    ]
                  },
                  {
                    title:'BALANCE',
                    props:{
                      width:[0.33, 0.26],
                    },
                    fields:[
                      {
                        name:'tokenBalance',
                        props:{
                          decimals: this.props.isMobile ? 6 : 8
                        }
                      }
                    ]
                  },
                  {
                    title:'REDEEMABLE',
                    props:{
                      width:[0.33,0.26],
                      justifyContent:['center','flex-start']
                    },
                    fields:[
                      {
                        name:'redeemableBalance',
                        props:{
                          decimals: this.props.isMobile ? 6 : 8
                        }
                      },
                      {
                        name:'tooltip',
                        props:{
                          placement:'bottom',
                          message:'The shown balance may be lower than the real one.',
                        }
                      }
                    ]
                  },
                  {
                    title:'TOKEN PRICE',
                    mobile:false,
                    props:{
                      width: 0.26,
                    },
                    parentProps:{
                      width:1,
                      pr:[2,4]
                    },
                    fields:[
                      {
                        name:'tokenPrice',
                        props:{
                          unit:'$',
                          unitPos:'left',
                          unitProps:{
                            mr:1,
                            fontWeight:3,
                            fontSize:[0,2],
                            color:'cellText'
                          }
                        }
                      }
                    ]
                  },
                ]}
                {...this.props}
                availableTokens={availableGovTokens}
              />
            </Flex>
          */
        }
        {
          /*
          this.props.account && 
            <Flex
              mb={[3,4]}
              width={1}
              flexDirection={'column'}
              id={'estimated-earnings-container'}
            >
              <Title my={[3,4]}>Estimated earnings</Title>
              <EstimatedEarnings
                {...this.props}
              />
            </Flex>
          */
        }
        {
        this.props.account && 
          <Flex
            mb={[3,4]}
            width={1}
            flexDirection={'column'}
            id={'transactions-container'}
          >
            <Title my={[3,4]}>Transactions</Title>
            <TransactionsList
              {...this.props}
              availableTokens={this.state.availableTokens}
              enabledTokens={Object.keys(this.state.availableTokens)}
              enabledActions={['CurveIn','CurveOut','CurveZapIn','CurveZapOut','CurveTransferIn','CurveTransferOut','CurveDepositIn','CurveDepositOut']}
              cols={[
                {
                  title: this.props.isMobile ? '' : 'HASH',
                  props:{
                    width:[0.15,0.24]
                  },
                  fields:[
                    {
                      name:'icon',
                      props:{
                        mr:[0,2]
                      }
                    },
                    {
                      name:'hash',
                      mobile:false
                    }
                  ]
                },
                {
                  title:'ACTION',
                  mobile:false,
                  props:{
                    width:0.15,
                  },
                  fields:[
                    {
                      name:'action'
                    }
                  ]
                },
                {
                  title:'DATE',
                  props:{
                    width:[0.32,0.23],
                  },
                  fields:[
                    {
                      name:'date'
                    }
                  ]
                },
                {
                  title:'STATUS',
                  props:{
                    width:[0.18,0.22],
                    justifyContent:['center','flex-start']
                  },
                  fields:[
                    {
                      name:'statusIcon',
                      props:{
                        mr:[0,2]
                      }
                    },
                    {
                      mobile:false,
                      name:'status'
                    }
                  ]
                },
                {
                  title:'AMOUNT',
                  props:{
                    width:0.19,
                  },
                  fields:[
                    {
                      name:'amount'
                    },
                  ]
                },
                {
                  title:'ASSET',
                  props:{
                    width:[0.15,0.20],
                    justifyContent:['center','flex-start']
                  },
                  fields:[
                    {
                      name:'tokenIcon',
                      props:{
                        mr:[0,2],
                        height:['1.4em','1.6em']
                      }
                    },
                    {
                      mobile:false,
                      name:'tokenName'
                    },
                  ]
                },
              ]}
            />
          </Flex>
        }

        <BuyModal
          {...this.props}
          closeModal={this.resetModal}
          buyToken={this.state.selectedToken}
          isOpen={this.state.activeModal === 'buy'}
        />
      </Box>
    );
  }
}

export default AssetPage;