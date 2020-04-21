import theme from '../theme';
import Select from 'react-select';
import React, { Component } from 'react';
import FlexLoader from '../FlexLoader/FlexLoader';
import AssetField from '../AssetField/AssetField';
import { Flex, Text, Input, Box } from "rimble-ui";
import RoundButton from '../RoundButton/RoundButton';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';
import TxProgressBar from '../TxProgressBar/TxProgressBar';
import TransactionField from '../TransactionField/TransactionField';

class DepositRedeem extends Component {

  state = {
    canRedeem:{},
    canDeposit:{},
    inputValue:{},
    tokenBalance:{},
    processing:{},
    action:'deposit',
    idleTokenBalance:{},
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

    const newState = {...this.state};
    await this.functionsUtil.asyncForEach(Object.keys(this.props.availableTokens),async (token) => {
      const tokenConfig = this.props.availableTokens[token];
      newState.tokenBalance[token] = await this.functionsUtil.getTokenBalance(token,this.props.account);
      newState.idleTokenBalance[token] = await this.functionsUtil.getTokenBalance(tokenConfig.idle.token,this.props.account);
      newState.canDeposit[token] = newState.tokenBalance[token] && this.functionsUtil.BNify(newState.tokenBalance[token]).gt(0);
      newState.canRedeem[token] = newState.idleTokenBalance[token] && this.functionsUtil.BNify(newState.idleTokenBalance[token]).gt(0);
      newState.processing[token] = {
        'redeem':{
          txHash:null,
          sending:false
        },
        'deposit':{
          txHash:null,
          sending:false
        }
      };
      newState.inputValue[token] = {
        'redeem':null,
        'deposit':null
      };
      newState.fastBalanceSelector[token] = {
        'redeem':null,
        'deposit':null
      };
    });

    newState.componentMounted = true;

    await this.setState(newState);

    this.checkAction();
    this.checkButtonDisabled();
  }

  async componentDidMount(){
    
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    if (!this.state.componentMounted){
      return false;
    }

    const tokenChanged = prevProps.selectedToken!==this.props.selectedToken;
    if (tokenChanged){
      this.checkAction();
      this.checkButtonDisabled();
      return false;
    }

    const actionChanged = this.state.action !== prevState.action;
    const fastBalanceSelectorChanged = this.state.fastBalanceSelector[this.props.selectedToken][this.state.action] !== prevState.fastBalanceSelector[this.props.selectedToken][this.state.action];

    if (actionChanged || fastBalanceSelectorChanged){
      this.setInputValue();
    }
  }

  async executeAction(){

    const inputValue = this.state.inputValue[this.props.selectedToken][this.state.action];
    if (this.state.buttonDisabled || !inputValue || this.functionsUtil.BNify(inputValue).lte(0)){
      return false;
    }

    const loading = true;
    const tokenConfig = this.props.availableTokens[this.props.selectedToken];

    switch (this.state.action){
      case 'deposit':

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

        const _clientProtocolAmounts = paramsForRedeem ? paramsForRedeem[1] : [];
        const gasLimit = _clientProtocolAmounts.length && _clientProtocolAmounts.indexOf('0') === -1 ? this.functionsUtil.BNify(1500000) : this.functionsUtil.BNify(1000000);

        const callback = (tx,error) => {
          const txSucceeded = tx.status === 'success';
          const needsUpdate = txSucceeded && !this.functionsUtil.checkTransactionAlreadyMined(tx);

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
              [this.props.selectedToken]:{
                ...prevState.processing[this.props.selectedToken],
                [this.state.action]:{
                  txHash:null,
                  loading:false
                }
              }
            }
          }));

          if (txSucceeded){
            this.setState((prevState) => ({
              inputValue:{
                ...prevState.inputValue,
                [this.props.selectedToken]:{
                  ...prevState.inputValue[this.props.selectedToken],
                  [this.state.action]: this.functionsUtil.BNify(0)
                }
              }
            }));
          }
        };

        const callback_receipt = (tx) => {
          const txHash = tx.transactionHash;
          this.setState((prevState) => ({
            processing: {
              ...prevState.processing,
              [this.props.selectedToken]:{
                ...prevState.processing[this.props.selectedToken],
                [this.state.action]:{
                  ...prevState.processing[this.props.selectedToken][this.state.action],
                  txHash
                }
              }
            }
          }));
        };

        this.props.contractMethodSendWrapper(tokenConfig.idle.token, 'redeemIdleToken', [
          idleTokenToRedeem, _skipRebalance, _clientProtocolAmounts
        ], null, callback, callback_receipt, gasLimit);
      break;
    }

    this.setState((prevState) => ({
      processing: {
        ...prevState.processing,
        [this.props.selectedToken]:{
          ...prevState.processing[this.props.selectedToken],
          [this.state.action]:{
            ...prevState.processing[this.props.selectedToken][this.state.action],
            loading
          }
        }
      }
    }));
  }

  checkAction(){
    let action = this.state.action;

    switch(action){
      case 'deposit':
        if (!this.state.canDeposit[this.props.selectedToken]){
          if (this.state.canRedeem[this.props.selectedToken]){
            action = 'redeem';
          } else {
            action = null;
          }
        }
      break;
      case 'redeem':
        if (!this.state.canRedeem[this.props.selectedToken]){
          if (this.state.canDeposit[this.props.selectedToken]){
            action = 'deposit';
          } else {
            action = null;
          }
        }
      break;
    }

    if (action !== this.state.action){
      this.setState({
        action
      });
    }
  }

  checkButtonDisabled(amount=null){
    if (!amount){
      amount = this.state.inputValue[this.props.selectedToken][this.state.action];
    }
    let buttonDisabled = true;
    if (amount !== null){
      buttonDisabled = amount.lte(0);
      switch (this.state.action){
        case 'deposit':
          buttonDisabled = buttonDisabled || amount.gt(this.state.tokenBalance[this.props.selectedToken]);
        break;
        case 'redeem':
          buttonDisabled = buttonDisabled || amount.gt(this.state.idleTokenBalance[this.props.selectedToken]);
        break;
      }
    }
    this.setState({
      buttonDisabled
    });
  }

  setInputValue(){
    if (this.state.fastBalanceSelector[this.props.selectedToken][this.state.action] === null){
      return false;
    }

    const selectedPercentage = this.functionsUtil.BNify(this.state.fastBalanceSelector[this.props.selectedToken][this.state.action]).div(100);
    let amount = null;

    switch(this.state.action){
      case 'deposit':
        amount = this.state.tokenBalance[this.props.selectedToken] ? this.functionsUtil.BNify(this.state.tokenBalance[this.props.selectedToken]).times(selectedPercentage) : null;
      break;
      case 'redeem':
        amount = this.state.idleTokenBalance[this.props.selectedToken] ? this.functionsUtil.BNify(this.state.idleTokenBalance[this.props.selectedToken]).times(selectedPercentage) : null;
      break;
    }

    this.checkButtonDisabled(amount);

    this.setState((prevState) => ({
      inputValue:{
        ...prevState.inputValue,
        [this.props.selectedToken]:{
          ...prevState.inputValue[this.props.selectedToken],
          [this.state.action]: amount
        }
      }
    }));
  }

  setFastBalanceSelector(percentage){
    this.setState((prevState) => ({
      fastBalanceSelector:{
        ...prevState.fastBalanceSelector,
        [this.props.selectedToken]: {
          ...prevState.fastBalanceSelector[this.props.selectedToken],
          [this.state.action]: percentage
        }
      }
    }));
  }

  changeInputValue(e){
    const amount = e.target.value.length && !isNaN(e.target.value) ? this.functionsUtil.BNify(e.target.value) : this.functionsUtil.BNify(0);
    this.checkButtonDisabled(amount);
    this.setState((prevState) => ({
      fastBalanceSelector:{
        ...prevState.fastBalanceSelector,
        [this.props.selectedToken]: {
          ...prevState.fastBalanceSelector[this.props.selectedToken],
          [this.state.action]: null
        }
      },
      inputValue:{
        ...prevState.inputValue,
        [this.props.selectedToken]:{
          ...prevState.inputValue[this.props.selectedToken],
          [this.state.action]: amount
        }
      }
    }));
  }

  setAction(action){
    switch (action.toLowerCase()){
      case 'deposit':
        if (!this.state.canDeposit[this.props.selectedToken]){
          action = null;
        }
      break;
      case 'redeem':
        if (!this.state.canRedeem[this.props.selectedToken]){
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

    const options = [
      { value: 'DAI', label: 'DAI' },
      { value: 'USDC', label: 'USDC' },
    ];

    const defaultValue = options.find(v => (v.value === this.props.selectedToken.toUpperCase()));

    const ControlComponent = props => {
      const cardProps = Object.assign(props.innerProps,{p:2,style:{cursor:'pointer'}});
      if (props.menuIsOpen){
        cardProps.boxShadow = 4;
      }
      return (
        <DashboardCard
          cardProps={cardProps}
        >
          <Flex
            width={1}
            flexDirection={'row'}
          >
            {props.children}
          </Flex>
        </DashboardCard>
      );
    };

    const CustomIndicatorSeparator = props => null;

    const CustomPlaceholder = props => {
      return null;
    }

    const CustomMenuList = props => {
      return (
        <Flex
          p={0}
          width={1}
          {...props.innerProps}
        >
          {props.children}
        </Flex>
      );
    }

    const CustomMenu = props => {
      const cardProps = Object.assign(props.innerProps,{
        mt:2,
        zIndex:1,
        boxShadow:null,
        position:'absolute'
      });
      return (
        <DashboardCard
          cardProps={cardProps}
        >
          {props.children}
        </DashboardCard>
      );
    }

    const CustomValueContainer = props => {
      return (
        <Flex
          {...props.innerProps}
        >
          <Flex
            p={0}
            width={1}
            {...props.innerProps}
            alignItems={'center'}
            flexDirection={'row'}
            style={{cursor:'pointer'}}
            justifyContent={'flex-start'}
          >
            <AssetField token={props.selectProps.value.value} fieldInfo={{
                name:'icon',
                props:{
                  mr:2,
                  height:'2em'
                }
              }}
            />
            <AssetField
              token={props.selectProps.value.value}
              fieldInfo={{
                name:'tokenName',
                props:{
                  fontSize:[1,2],
                  fontWeight:500,
                  color:'copyColor'
                }
              }}
            />
          </Flex>
        </Flex>
      );
    }

    const CustomOption = (props) => {
      const {
        children,
        className,
        cx,
        getStyles,
        isDisabled,
        isFocused,
        isSelected,
        innerRef,
        innerProps,
      } = props;

      // Don't show selected value
      if (props.selectProps.value.value === props.value){
        return null;
      }

      return (
        <Flex
          px={3}
          py={2}
          width={1}
          {...props.innerProps}
          alignItems={'center'}
          flexDirection={'row'}
          style={{cursor:'pointer'}}
          justifyContent={'flex-start'}
          backgroundColor={ props.isFocused ? '#fbfbfb' : '#ffffff' }
        >
          <AssetField token={props.value} fieldInfo={{
              name:'icon',
              props:{
                mr:2,
                height:'2em'
              }
            }}
          />
          <AssetField
            token={props.value}
            fieldInfo={{
              name:'tokenName',
              props:{
                fontSize:[1,2],
                fontWeight:500,
                color:'copyColor'
              }
            }}
          />
        </Flex>
      );
    }

    const FastBalanceSelectorComponent = props => {
      const isActive = this.state.fastBalanceSelector[this.props.selectedToken][this.state.action] === parseInt(props.percentage);
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

    return (
      <Flex
        width={1}
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
          <Select
            name={"assets"}
            options={options}
            isSearchable={false}
            defaultValue={defaultValue}
            onChange={(v) => this.props.changeToken(v.value) }
            components={{ Control: ControlComponent, Option: CustomOption, IndicatorSeparator: CustomIndicatorSeparator, SingleValue: CustomValueContainer, Menu: CustomMenu }}
          />
        </Flex>
        {
          this.state.componentMounted ? (
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
                      width:[1,.48],
                      onMouseDown:() => {
                        this.setAction('deposit');
                      }
                    }}
                    isInteractive={true}
                    isActive={ this.state.action === 'deposit' }
                    isDisabled={ !this.state.canDeposit[this.props.selectedToken] }
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
                      width:[1,.48],
                      onMouseDown:() => {
                        this.setAction('redeem');
                      }
                    }}
                    isInteractive={true}
                    isActive={ this.state.action === 'redeem' }
                    isDisabled={ !this.state.canRedeem[this.props.selectedToken] }
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
                !this.state.processing[this.props.selectedToken][this.state.action].loading ? (
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
                      value={this.state.inputValue[this.props.selectedToken][this.state.action] !== null ? this.functionsUtil.BNify(this.state.inputValue[this.props.selectedToken][this.state.action]).toString() : ''}
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
                    <TxProgressBar web3={this.props.web3} waitText={`${this.state.action} estimated in`} endMessage={`Finalizing ${this.state.action} request...`} hash={this.state.processing[this.props.selectedToken][this.state.action].txHash} />
                  </Flex>
                )
              }
            </Box>
          ) : (
            <Flex
              mt={2}
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
                text={'Loading balance...'}
              />
            </Flex>
          )
        }
      </Flex>
    );
  }
}

export default DepositRedeem;
