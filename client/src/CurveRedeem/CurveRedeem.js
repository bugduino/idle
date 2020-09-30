import React, { Component } from 'react';
import AssetField from '../AssetField/AssetField';
import FlexLoader from '../FlexLoader/FlexLoader';
import SmartNumber from '../SmartNumber/SmartNumber';
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
    maxSlippage:0.2,
    tokenConfig:null,
    unevenAmounts:null,
    selectedToken:null,
    availableTokens:null,
    buttonDisabled:false,
    showMaxSlippage:false,
    curveTokenConfig:null,
    curvePoolContract:null,
    curveSwapContract:null,
    curveTokenBalance:null,
    curveTokensAmounts:null,
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

  showMaxSlippage = () => {
    this.setState({
      showMaxSlippage:true
    });
  }

  toggleUnevenAmounts = (redeemUnevenAmounts) => {
    this.setState({
      redeemUnevenAmounts
    });
  }

  async calculateSlippage(max_slippage=null){
    const inputValue = this.state.inputValue ? this.functionsUtil.BNify(this.state.inputValue) : null;

    if (!inputValue || inputValue.lte(0)){
      return false;
    }

    const normalizedAmount = this.functionsUtil.normalizeTokenAmount(inputValue,this.state.curvePoolContract.decimals);
    const [curveTokensAmounts,curveIdleTokensAmounts] = await Promise.all([
      this.functionsUtil.getCurveTokensAmounts(this.props.account,normalizedAmount,true),
      this.functionsUtil.getCurveIdleTokensAmounts(this.props.account,normalizedAmount)
    ])

    const amounts = this.state.redeemUnevenAmounts ? curveIdleTokensAmounts : null;

    let withdrawSlippage = await this.functionsUtil.getCurveSlippage(this.state.tokenConfig.idle.token,normalizedAmount,false,amounts);
    if (withdrawSlippage){
      withdrawSlippage = withdrawSlippage.times(100);
    }

    this.setState({
      withdrawSlippage,
      curveTokensAmounts,
      curveIdleTokensAmounts
    });

    // Add max slippage but don't save in state
    if (withdrawSlippage && max_slippage){
      withdrawSlippage = withdrawSlippage.plus(max_slippage);
    }

    return withdrawSlippage;
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

    const inputChanged = prevState.inputValue !== this.state.inputValue;
    const selectedTokenChanged = prevState.selectedToken !== this.state.selectedToken;
    const maxSlippageChanged = parseFloat(prevState.maxSlippage) !== parseFloat(this.state.maxSlippage);
    if (inputChanged || selectedTokenChanged || maxSlippageChanged){
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

    let tokenConfig = this.props.tokenConfig ? this.props.tokenConfig : this.state.tokenConfig;
    let selectedToken = this.props.selectedToken ? this.props.selectedToken : this.state.selectedToken;
    let availableTokens = this.state.availableTokens;

    if (!availableTokens){
      availableTokens = this.functionsUtil.getCurveAvailableTokens();
      if (!selectedToken){
        selectedToken = Object.keys(availableTokens)[0];
        tokenConfig = availableTokens[selectedToken];
      }
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
    const withdrawSlippage = await this.calculateSlippage(this.state.maxSlippage);
    const max_slippage = this.functionsUtil.BNify(this.state.maxSlippage).div(100);
    const inputValue = this.state.inputValue ? this.functionsUtil.BNify(this.state.inputValue) : null;
    const _amount = this.functionsUtil.normalizeTokenAmount(inputValue,this.state.curvePoolContract.decimals);
    const curveTokenBalance = this.functionsUtil.normalizeTokenAmount(this.state.curveTokenBalance,this.state.curvePoolContract.decimals);

    if (this.state.redeemUnevenAmounts){
      const min_amounts = await this.functionsUtil.getCurveIdleTokensAmounts(this.props.account,_amount,max_slippage);
      console.log('remove_liquidity',_amount.toString(),min_amounts);
      this.props.contractMethodSendWrapper(contractName, 'remove_liquidity', [_amount, min_amounts], null, callbackRedeem, callbackReceiptRedeem);
    } else {
      const coin_index = this.state.curveTokenConfig.migrationParams.coinIndex;
      const amounts = await this.functionsUtil.getCurveAmounts(this.props.tokenConfig.idle.token,_amount,false);
      const min_amount = this.functionsUtil.normalizeTokenAmount(inputValue.minus(inputValue.times(withdrawSlippage.div(100))),this.state.curveTokenConfig.decimals);
      let _token_amount = await this.functionsUtil.getCurveTokenAmount(amounts,false);
      _token_amount = this.functionsUtil.BNify(_token_amount).isGreaterThan(curveTokenBalance) ? curveTokenBalance : this.functionsUtil.BNify(_token_amount);

      console.log('remove_liquidity_one_coin',_amount,amounts,coin_index,_token_amount.toFixed(),min_amount);

      // debugger;
      this.props.contractMethodSendWrapper(contractName, 'remove_liquidity_one_coin', [_token_amount, coin_index, min_amount], null, callbackRedeem, callbackReceiptRedeem);
    }

    this.setState((prevState) => ({
      processing: {
        ...prevState.processing,
        loading:true
      }
    }));
  }

  cancelTransaction = async () => {
    this.setState({
      processing: {
        txHash:null,
        loading:false
      }
    });
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

  setMaxSlippage = (maxSlippage) => {
    this.setState({
      maxSlippage
    });
  }

  setFastBalanceSelector = (fastBalanceSelector) => {
    this.setState({
      fastBalanceSelector
    });
  }

  render() {

    const showSlippage = !this.state.buttonDisabled && this.state.withdrawSlippage;
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
                    cancelTransaction={this.cancelTransaction.bind(this)}
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
                      Withdraw from the Curve Pool in a specific token or in uneven amounts of tokens (with no slippage).
                    </Text>
                    <Flex
                      mt={2}
                      alignItems={'center'}
                      flexDirection={'row'}
                    >
                      <Checkbox
                        required={false}
                        label={`Redeem with no slippage`}
                        checked={this.state.redeemUnevenAmounts}
                        onChange={ e => this.toggleUnevenAmounts(e.target.checked) }
                      />
                      <Tooltip
                        placement={'top'}
                        message={`You will receive an uneven amounts of ${Object.keys(this.state.availableTokens).join(', ')} proportional to the token availailability in the Curve pool.`}
                      >
                        <Icon
                          size={'1em'}
                          color={'cellTitle'}
                          name={"InfoOutline"}
                        />
                      </Tooltip>
                    </Flex>
                  </Flex>
                </DashboardCard>
                {
                  !this.state.redeemUnevenAmounts && (!this.props.selectedToken || (this.state.showMaxSlippage && showSlippage)) ? (
                    <Box
                      mb={3}
                      width={1}
                    >
                      {
                        !this.props.selectedToken && 
                          <Box
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
                        this.state.showMaxSlippage && showSlippage && (
                          <Box
                            width={1}
                            mt={ !this.props.selectedToken ? 2 : 0 }
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
                    </Box>
                  ) : this.state.redeemUnevenAmounts && this.state.curveTokensAmounts && !this.state.buttonDisabled && (
                    <DashboardCard
                      cardProps={{
                        mt:1,
                        mb:2,
                        py:2,
                        px:1
                      }}
                    >
                      <Flex
                        alignItems={'center'}
                        flexDirection={'column'}
                      >
                        <Text
                          mt={1}
                          fontSize={2}
                          color={'cellText'}
                          textAlign={'center'}
                        >
                          You will receive:
                        </Text>
                        <Flex
                          mt={2}
                          width={1}
                          boxShadow={0}
                          style={{
                            flexWrap:'wrap'
                          }}
                          alignItems={'center'}
                          justifyContent={'center'}
                          >
                            {
                              Object.keys(this.state.curveTokensAmounts).map( token => {
                                const balance = this.state.curveTokensAmounts[token];
                                return (
                                  <Flex
                                    mb={1}
                                    mx={1}
                                    minWidth={'21%'}
                                    flexDirection={'row'}
                                    key={`tokenBalance_${token}`}
                                    justifyContent={'flex-start'}
                                  >
                                    <AssetField
                                      token={token}
                                      tokenConfig={{
                                        token:token
                                      }}
                                      fieldInfo={{
                                        name:'icon',
                                        props:{
                                          mr:1,
                                          width:['1.4em','1.6em'],
                                          height:['1.4em','1.6em']
                                        }
                                      }}
                                    />
                                    <SmartNumber
                                      fontSize={[0,1]}
                                      fontWeight={500}
                                      maxPrecision={4}
                                      color={'cellText'}
                                      number={balance.toString()}
                                    />
                                  </Flex>
                                );
                            })
                          }
                        </Flex>
                      </Flex>
                    </DashboardCard>
                  )
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
                      showSlippage && (
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
                            color={ this.state.withdrawSlippage.gt(0) ? this.props.theme.colors.transactions.status.failed : this.props.theme.colors.transactions.status.completed }
                          >
                            {
                              parseFloat(this.state.withdrawSlippage.toFixed(2)) === 0 ?
                                'No Slippage'
                              : `${ this.state.withdrawSlippage.gt(0) ? 'Slippage: ' : 'Bonus: ' } ${this.state.withdrawSlippage.abs().toFixed(2)}%`
                            }
                          </Text>
                          <Tooltip
                            placement={'top'}
                            message={ this.state.redeemUnevenAmounts ? `You will receive an uneven amounts of ${Object.keys(this.state.availableTokens).join(', ')} proportional to the token availailability in the Curve pool.` : this.state.withdrawSlippage.gt(0) ? 'Slippage comes from depositing too many coins not in balance, and current coin prices are additionally accounted for' : 'Bonus comes as an advantage from current coin prices which usually appears for coins which are high in balance'}
                          >
                            <Icon
                              ml={1}
                              size={'1em'}
                              color={'cellTitle'}
                              name={"InfoOutline"}
                            />
                          </Tooltip>
                          {
                            !this.state.redeemUnevenAmounts &&
                              <Link
                                ml={1}
                                color={'copyColor'}
                                hoverColor={'primary'}
                                onClick={this.showMaxSlippage}
                              >
                                change
                              </Link>
                          }
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
                          this.state.redeemUnevenAmounts ? `${this.state.curveTokenBalance.toFixed(this.props.isMobile ? 2 : 4)} ${curveTokenName}` : `${this.state.redeemableBalance.toFixed(this.props.isMobile ? 2 : 4)} ${this.state.selectedToken}`
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
                      width:[1,1/2],
                      disabled:this.state.buttonDisabled
                    }}
                    handleClick={this.redeem}
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