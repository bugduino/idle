import React, { Component } from 'react';
import FlexLoader from '../FlexLoader/FlexLoader';
import RoundButton from '../RoundButton/RoundButton';
import FunctionsUtil from '../utilities/FunctionsUtil';
import AssetSelector from '../AssetSelector/AssetSelector';
import TxProgressBar from '../TxProgressBar/TxProgressBar';
import DashboardCard from '../DashboardCard/DashboardCard';
import FastBalanceSelector from '../FastBalanceSelector/FastBalanceSelector';
import { Flex, Text, Icon, Checkbox, Box, Link, Input, Tooltip } from "rimble-ui";

class CurveRedeem extends Component {

  state = {
    processing:{
      txHash:null,
      loading:false
    },
    inputValue:null,
    tokenConfig:null,
    unevenAmounts:null,
    selectedToken:null,
    availableTokens:null,
    buttonDisabled:false,
    curveTokenConfig:null,
    curvePoolContract:null,
    curveSwapContract:null,
    curveTokenBalance:null,
    fastBalanceSelector:null,
    redeemUnevenAmounts:false,
    curveRedeemableIdleTokens:null
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
    await this.initToken();
  }

  toggleUnevenAmounts = (redeemUnevenAmounts) => {
    this.setState({
      redeemUnevenAmounts
    });
  }

  async calculateSlippage(){
    const amount = this.state.inputValue ? this.functionsUtil.BNify(this.state.inputValue) : null;

    if (!amount || amount.lte(0)){
      return false;
    }

    const normalizedAmount = this.functionsUtil.normalizeTokenAmount(amount,this.state.curvePoolContract.decimals);
    const withdrawSlippage = await this.functionsUtil.getCurveSlippage(this.state.tokenConfig.idle.token,normalizedAmount,false,this.state.redeemUnevenAmounts);

    this.setState({
      withdrawSlippage
    });
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    const tokenChanged = prevProps.tokenConfig.idle.token !== this.props.tokenConfig.idle.token;
    if (tokenChanged){
      await this.initToken();
    }

    const redeemUnevenAmountsChanged = prevState.redeemUnevenAmounts !== this.state.redeemUnevenAmounts;
    const fastBalanceSelectorChanged = this.state.fastBalanceSelector !== prevState.fastBalanceSelector;
    if (fastBalanceSelectorChanged || redeemUnevenAmountsChanged){
      this.setInputValue();
    }

    const selectedTokenChanged = prevState.selectedToken !== this.state.selectedToken;
    const inputChanged = prevState.inputValue !== this.state.inputValue;
    if (inputChanged || selectedTokenChanged){
      this.calculateSlippage();
    }
  }

  checkButtonDisabled = (amount=null) => {

    if (!amount){
      amount = this.state.inputValue;
    }

    let buttonDisabled = false;

    if (this.state.redeemUnevenAmounts){
      buttonDisabled = !amount || amount.gt(this.state.curveTokenBalance);
    } else {
      buttonDisabled = !amount || amount.gt(this.state.redeemableBalance);
    }

    this.setState({
      buttonDisabled
    });
  }

  setInputValue = () => {
    if (this.state.fastBalanceSelector === null){
      return false;
    }

    const selectedPercentage = this.functionsUtil.BNify(this.state.fastBalanceSelector).div(100);
    let inputValue = null;

    if (this.state.redeemUnevenAmounts){
      inputValue = this.state.curveTokenBalance ? this.functionsUtil.BNify(this.state.curveTokenBalance).times(selectedPercentage) : null;
    } else {
      inputValue = this.state.redeemableBalance ? this.functionsUtil.BNify(this.state.redeemableBalance).times(selectedPercentage) : null;
    }

    this.checkButtonDisabled(inputValue);

    this.setState({
      inputValue
    });
  }

  changeToken = selectedToken => {
    const tokenConfig = this.state.availableTokens[selectedToken];
    this.setState({
      tokenConfig,
      selectedToken
    });
  }

  initToken = async () => {
    const curveConfig = this.functionsUtil.getGlobalConfig(['curve']);
    const curveTokenConfig = curveConfig.availableTokens[this.props.tokenConfig.idle.token];

    const [curvePoolContract,curveSwapContract] = await Promise.all([
      this.functionsUtil.getCurvePoolContract(),
      this.functionsUtil.getCurveSwapContract()
    ]);

    const [
      curveTokenPrice,
      curveTokenBalance,
      curveRedeemableIdleTokens,
    ] = await Promise.all([
      this.functionsUtil.getCurveTokenPrice(),
      this.functionsUtil.getCurveTokenBalance(this.props.account),
      this.functionsUtil.getCurveRedeemableIdleTokens(this.props.account)
    ]);

    const redeemableBalance = curveTokenBalance ? curveTokenBalance.times(curveTokenPrice) : this.functionsUtil.BNify(0);

    // const max_burn_amount = this.functionsUtil.normalizeTokenAmount(curveTokenBalance,curvePoolContract.decimals).toString();
    // const amounts = this.functionsUtil.getCurveAmounts(this.props.tokenConfig.idle.token,0);
    // let redeemUnevenAmounts = await this.functionsUtil.getCurveUnevenTokenAmounts(amounts,max_burn_amount);

    const unevenAmounts = [];

    let tokenConfig = this.state.tokenConfig;
    let selectedToken = this.state.selectedToken;
    let availableTokens = this.state.availableTokens;

    if (!availableTokens){
      availableTokens = this.functionsUtil.getCurveAvailableTokens();
      selectedToken = Object.keys(availableTokens)[0];
      tokenConfig = availableTokens[selectedToken];
    }

    this.setState({
      tokenConfig,
      selectedToken,
      unevenAmounts,
      curveTokenPrice,
      availableTokens,
      curveTokenConfig,
      curvePoolContract,
      curveSwapContract,
      curveTokenBalance,
      redeemableBalance,
      curveRedeemableIdleTokens
    });
  }

  redeem = async () => {

    if (!this.state.curveTokenBalance){
      return false;
    }

    const callbackRedeem = (tx,error) => {
      const txSucceeded = tx.status === 'success';

      // Send Google Analytics event
      const eventData = {
        eventLabel: tx.status,
        eventCategory: `CurveRedeem`,
        eventAction: this.props.selectedToken,
        eventValue: this.state.curveTokenBalance.toFixed()
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
          txHash:null,
          loading:false
        }
      }));

      if (typeof this.props.callbackRedeem === 'function' && txSucceeded){
        this.props.callbackRedeem(tx);
      }
    };

    const callbackReceiptRedeem = (tx) => {
      const txHash = tx.transactionHash;
      this.setState((prevState) => ({
        processing: {
          ...prevState.processing,
          txHash
        }
      }));
    };

    const contractName = this.state.curveSwapContract.name;
    const _amount = this.functionsUtil.normalizeTokenAmount(this.state.curveTokenBalance,this.state.curvePoolContract.decimals).toString();
    const min_amounts = this.functionsUtil.getCurveAmounts(this.props.tokenConfig.idle.token,_amount);

    if (this.state.redeemUnevenAmounts){
      this.props.contractMethodSendWrapper(contractName, 'remove_liquidity_imbalance', [min_amounts, _amount], null, callbackRedeem, callbackReceiptRedeem);
    } else {
      this.props.contractMethodSendWrapper(contractName, 'remove_liquidity', [_amount, min_amounts], null, callbackRedeem, callbackReceiptRedeem);
    }

    this.setState((prevState) => ({
      processing: {
        ...prevState.processing,
        loading:true
      }
    }));
  }

  changeInputValue = (e) => {
    const inputValue = e.target.value.length && !isNaN(e.target.value) ? this.functionsUtil.BNify(e.target.value) : this.functionsUtil.BNify(0);
    this.checkButtonDisabled(inputValue);

    const fastBalanceSelector = null;

    this.setState((prevState) => ({
      inputValue,
      fastBalanceSelector,
    }));
  }

  getFastBalanceSelector = () => {
    if (this.state.fastBalanceSelector === null){
      return false;
    }
    return this.functionsUtil.BNify(this.state.fastBalanceSelector).div(100);
  }

  setFastBalanceSelector = (fastBalanceSelector) => {
    this.setState((prevState) => ({
      fastBalanceSelector
    }));
  }

  render() {

    const curveTokenName = this.functionsUtil.getGlobalConfig(['curve','poolContract','token']);

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
          {
            !this.state.curveTokenBalance ? (
              <DashboardCard
                cardProps={{
                  p:3,
                  mt:3,
                  minHeight:'195px',
                  style:{
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center'
                  }
                }}
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
                  text={'Checking Curve Pool...'}
                />
              </DashboardCard>
            ) : this.state.processing.loading ? (
              <DashboardCard
                cardProps={{
                  p:3,
                  mt:3
                }}
              >
                <Flex
                  flexDirection={'column'}
                >
                  <TxProgressBar
                    web3={this.props.web3}
                    hash={this.state.processing.txHash}
                    endMessage={`Finalizing redeem request...`}
                    waitText={ this.props.waitText ? this.props.waitText : 'Redeem estimated in'}
                  />
                </Flex>
              </DashboardCard>
            ) : (
              <Flex
                width={1}
                flexDirection={'column'}
              >
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
                      mt={1}
                      fontSize={2}
                      color={'cellText'}
                      textAlign={'center'}
                    >
                      You can decide to withdraw from the Curve Pool in a specific token or in uneven amounts.
                    </Text>
                    <Checkbox
                      mt={2}
                      required={false}
                      label={`Redeem in uneven amounts`}
                      checked={this.state.redeemUnevenAmounts}
                      onChange={ e => this.toggleUnevenAmounts(e.target.checked) }
                    />
                  </Flex>
                </DashboardCard>
                {
                  !this.state.redeemUnevenAmounts && 
                    <Box
                      mb={3}
                      width={1}
                    >
                      <Text
                        mb={1}
                      >
                        Select destination token:
                      </Text>
                      <AssetSelector
                        {...this.props}
                        id={'token-from'}
                        showBalance={false}
                        onChange={this.changeToken}
                        tokenConfig={this.state.tokenConfig}
                        selectedToken={this.state.selectedToken}
                        availableTokens={this.state.availableTokens}
                      />
                    </Box>
                }
                {
                  /*
                  this.state.inputValue && this.state.inputValue.gt(0) && 
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
                        <Text
                          mt={2}
                          fontSize={2}
                          color={'cellText'}
                          textAlign={'center'}
                        >
                          {
                            this.state.redeemUnevenAmounts ? `You can redeem ${this.state.curveTokenBalance.toFixed(4)} Curve tokens in uneven amounts ${ this.state.withdrawSlippage ? (this.state.withdrawSlippage.gte(0) ? ` with ${this.state.withdrawSlippage.times(100).toFixed(2)}% of slippage` : ` with ${Math.abs(parseFloat(this.state.withdrawSlippage.times(100).toFixed(2)))}% of bonus` ) : '' }.` : `You can redeem ~${this.state.inputValue.toFixed(4)} ${this.state.selectedToken} from the Curve Pool${ this.state.withdrawSlippage ? (this.state.withdrawSlippage.gte(0) ? ` with ${this.state.withdrawSlippage.times(100).toFixed(2)}% of slippage` : ` with ${Math.abs(parseFloat(this.state.withdrawSlippage.times(100).toFixed(2)))}% of bonus` ) : '' }.`
                          }
                        </Text>
                      </Flex>
                    </DashboardCard>
                  */
                }
                <Flex
                  mb={3}
                  width={1}
                  flexDirection={'column'}
                >
                  <Flex
                    mb={1}
                    alignItems={'center'}
                    flexDirection={'row'}
                    justifyContent={'flex-end'}
                  >
                    {
                      this.state.inputValue && this.state.inputValue.gt(0) && this.state.withdrawSlippage && (
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
                            color={ this.state.withdrawSlippage.gt(0) ? this.props.theme.colors.transactions.status.failed : this.props.theme.colors.transactions.status.completed }
                          >
                            {this.state.withdrawSlippage.gt(0) ? 'Slippage: ' : 'Bonus: '}{this.state.withdrawSlippage.times(100).toFixed(2)}%
                          </Text>
                          <Tooltip
                            placement={'top'}
                            message={`Bonus or Slippage for withdraw`}
                          >
                            <Icon
                              ml={1}
                              name={"Info"}
                              size={'1em'}
                              color={'cellTitle'}
                            />
                          </Tooltip>
                        </Flex>
                      )
                    }
                    <Flex
                      width={1}
                      maxWidth={'50%'}
                      alignItems={'center'}
                      flexDirection={'row'}
                      justifyContent={'flex-end'}
                    >
                      <Link
                        fontSize={1}
                        fontWeight={3}
                        color={'dark-gray'}
                        textAlign={'right'}
                        hoverColor={'copyColor'}
                        onClick={ (e) => this.setFastBalanceSelector(100) }
                        style={{
                          maxWidth:'100%',
                          overflow:'hidden',
                          whiteSpace:'nowrap',
                          textOverflow:'ellipsis'
                        }}
                      >
                        {
                          this.state.redeemUnevenAmounts ? `${this.state.curveTokenBalance.toFixed(6)} ${curveTokenName}` : `${this.state.redeemableBalance.toFixed(6)} ${this.state.selectedToken}`
                        }
                      </Link>
                    </Flex>
                  </Flex>
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
                    border={`1px solid ${this.props.theme.colors.divider}`}
                    value={this.state.inputValue !== null ? this.functionsUtil.BNify(this.state.inputValue).toFixed() : ''}
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
                          isActive={this.state.fastBalanceSelector === parseInt(percentage)}
                        />
                      ))
                    }
                  </Flex>
                </Flex>
                <Flex
                  justifyContent={'center'}
                >
                  <RoundButton
                    buttonProps={{
                      mt:2,
                      width:[1,1/2]
                    }}
                    handleClick={this.redeem}
                    disabled={this.state.buttonDisabled}
                  >
                    Redeem
                  </RoundButton>
                </Flex>
              </Flex>
            )
          }
        </Flex>
      </Flex>
    );
  }
}

export default CurveRedeem;