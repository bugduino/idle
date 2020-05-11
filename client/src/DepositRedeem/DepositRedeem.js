import theme from '../theme';
import React, { Component } from 'react';
import FlexLoader from '../FlexLoader/FlexLoader';
import RoundButton from '../RoundButton/RoundButton';
import FunctionsUtil from '../utilities/FunctionsUtil';
import BuyModal from '../utilities/components/BuyModal';
import { Flex, Text, Input, Box, Icon } from "rimble-ui";
import DashboardCard from '../DashboardCard/DashboardCard';
import AssetSelector from '../AssetSelector/AssetSelector';
import TxProgressBar from '../TxProgressBar/TxProgressBar';
import TransactionField from '../TransactionField/TransactionField';

class DepositRedeem extends Component {

  state = {
    canRedeem:false,
    canDeposit:false,
    inputValue:{},
    processing:{},
    action:'deposit',
    buttonDisabled:false,
    fastBalanceSelector:{},
    componentMounted:false
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

  async componentDidMount(){

  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    if (this.props.tokenBalance === null){
      return false;
    }

    const tokenBalanceChanged = prevProps.tokenBalance !== this.props.tokenBalance && this.props.tokenBalance !== null;

    const tokenChanged = prevProps.selectedToken !== this.props.selectedToken;

    if (tokenChanged || tokenBalanceChanged){

      this.loadTokenInfo();
      return false;
    }

    const actionChanged = this.state.action !== prevState.action;
    const fastBalanceSelectorChanged = this.state.fastBalanceSelector[this.state.action] !== prevState.fastBalanceSelector[this.state.action];

    if (actionChanged || fastBalanceSelectorChanged){
      this.setInputValue();
    }
  }

  approveToken = async () => {

    // Check if the token is already approved
    const tokenApproved = await this.functionsUtil.checkTokenApproved(this.props.selectedToken,this.props.tokenConfig.idle.address,this.props.account);

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

    this.functionsUtil.enableERC20(this.props.selectedToken,this.props.tokenConfig.idle.address,callbackApprove,callbackReceiptApprove);

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
    newState.tokenApproved = await this.functionsUtil.checkTokenApproved(this.props.selectedToken,this.props.tokenConfig.idle.address,this.props.account);
    // console.log('loadTokenInfo',this.props.selectedToken,this.props.tokenConfig.idle,newState.tokenApproved);
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
    });
  }

  executeAction = async () => {

    const inputValue = this.state.inputValue[this.state.action];

    if (this.state.buttonDisabled || !inputValue || this.functionsUtil.BNify(inputValue).lte(0)){
      return false;
    }

    const loading = true;

    switch (this.state.action){
      case 'deposit':
        const tokensToDeposit = this.functionsUtil.normalizeTokenAmount(inputValue,this.props.tokenConfig.decimals).toString();

        // console.log(inputValue.toString(),tokensToDeposit.toString());

        if (localStorage){
          this.functionsUtil.setLocalStorage('redirectToFundsAfterLogged',0);
        }

        this.setState({
          lendingProcessing: this.props.account,
          lendAmount: '',
          genericError: '',
        });

        let paramsForMint = null;

        // Get amounts for best allocations
        if (this.props.account){
          const callParams = { from: this.props.account, gas: this.props.web3.utils.toBN(5000000) };
          paramsForMint = await this.functionsUtil.genericIdleCall('getParamsForMintIdleToken',[tokensToDeposit],callParams);
        }

        const _clientProtocolAmountsDeposit = paramsForMint ? paramsForMint[1] : [];
        const gasLimitDeposit = _clientProtocolAmountsDeposit.length && _clientProtocolAmountsDeposit.indexOf('0') === -1 ? this.functionsUtil.BNify(1500000) : this.functionsUtil.BNify(1000000);

        const callbackDeposit = (tx,error) => {
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

        // No need for callback atm
        this.props.contractMethodSendWrapper(this.props.tokenConfig.idle.token, 'mintIdleToken', [
          tokensToDeposit, _clientProtocolAmountsDeposit
        ], null, callbackDeposit, callbackReceiptDeposit, gasLimitDeposit);
      break;
      case 'redeem':
        const idleTokenToRedeem = this.functionsUtil.normalizeTokenAmount(inputValue,18).toString();

        // Get amounts for best allocations
        const _skipRebalance = this.functionsUtil.getGlobalConfig(['contract','methods','redeem','skipRebalance']);
        let paramsForRedeem = null;

        if (this.props.account){
          const callParams = { from: this.props.account, gas: this.props.web3.utils.toBN(5000000) };
          paramsForRedeem = await this.functionsUtil.genericIdleCall('getParamsForRedeemIdleToken',[idleTokenToRedeem, _skipRebalance],callParams);
        }

        const _clientProtocolAmountsRedeem = paramsForRedeem ? paramsForRedeem[1] : [];
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
      case 'deposit':
        if (!this.state.canDeposit){
          if (this.state.canRedeem){
            action = 'redeem';
          } else {
            // action = null;
          }
        }
      break;
      case 'redeem':
        if (!this.state.canRedeem){
          // if (this.state.canDeposit){
            action = 'deposit';
          // } else {
          //   action = null;
          // }
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
          buttonDisabled = buttonDisabled || amount.gt(this.props.idleTokenBalance);
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
        amount = this.props.idleTokenBalance ? this.functionsUtil.BNify(this.props.idleTokenBalance).times(selectedPercentage) : null;
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

    const FastBalanceSelectorComponent = props => {
      const isActive = this.state.fastBalanceSelector[this.state.action] === parseInt(props.percentage);
      return (
        <DashboardCard
          cardProps={{
            p:2,
            width:0.23,
            onMouseDown:props.onMouseDown
          }}
          isActive={isActive}
          isInteractive={true}
        >
          <Text 
            fontSize={2}
            fontWeight={3}
            textAlign={'center'}
            color={isActive ? 'copyColor' : 'legend'}
          >
            {props.percentage}%
          </Text>
        </DashboardCard>
      );
    }

    const tokenApproved = this.state.tokenApproved;
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
          <Flex
            flexDirection={'column'}
          >
            <Text mb={1}>
              Select your asset:
            </Text>
            <AssetSelector
              {...this.props}
            />
          </Flex>
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
                    mt={3}
                    fontSize={2}
                    color={'cellText'}
                    textAlign={'center'}
                  >
                    Please connect with your wallet interact with Idle.
                  </Text>
                  <RoundButton
                    buttonProps={{
                      mt:3,
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
              !tokenApproved ? (
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
                          To Deposit/Redeem your {this.props.selectedToken} into Idle you need to enable our Smart-Contract first.
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
              this.state.action ? (
                <Box width={1}>
                  <Flex
                    mt={3}
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
                    !showBuyFlow && (
                      !this.state.processing[this.state.action].loading ? (
                        <Flex
                          mt={3}
                          flexDirection={'column'}
                        >
                          <Input
                            min={0}
                            type={"number"}
                            required={true}
                            height={'3.4em'}
                            borderRadius={2}
                            fontWeight={500}
                            onChange={this.changeInputValue.bind(this)}
                            boxShadow={'none !important'}
                            border={`1px solid ${theme.colors.divider}`}
                            placeholder={`Insert ${this.props.selectedToken.toUpperCase()} amount`}
                            value={this.state.inputValue[this.state.action] !== null ? this.functionsUtil.BNify(this.state.inputValue[this.state.action]).toString() : ''}
                          />
                          <Flex
                            mt={3}
                            alignItems={'center'}
                            flexDirection={'row'}
                            justifyContent={'space-between'}
                          >
                            <FastBalanceSelectorComponent
                              percentage={25}
                              onMouseDown={()=>this.setFastBalanceSelector(25)}
                            />
                            <FastBalanceSelectorComponent
                              percentage={50}
                              onMouseDown={()=>this.setFastBalanceSelector(50)}
                            />
                            <FastBalanceSelectorComponent
                              percentage={75}
                              onMouseDown={()=>this.setFastBalanceSelector(75)}
                            />
                            <FastBalanceSelectorComponent
                              percentage={100}
                              onMouseDown={()=>this.setFastBalanceSelector(100)}
                            />
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
                          <TxProgressBar web3={this.props.web3} waitText={`${this.state.action} estimated in`} endMessage={`Finalizing ${this.state.action} request...`} hash={this.state.processing[this.state.action].txHash} />
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
                availableMethods={['bank','card']}
                buyToken={this.props.selectedToken}
              />
            </Flex>
        }
      </Flex>
    );
  }
}

export default DepositRedeem;
