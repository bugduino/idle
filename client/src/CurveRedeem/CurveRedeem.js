import React, { Component } from 'react';
import FlexLoader from '../FlexLoader/FlexLoader';
import RoundButton from '../RoundButton/RoundButton';
import FunctionsUtil from '../utilities/FunctionsUtil';
import { Flex, Text, Icon, Checkbox } from "rimble-ui";
import TxProgressBar from '../TxProgressBar/TxProgressBar';
import DashboardCard from '../DashboardCard/DashboardCard';

class CurveRedeem extends Component {

  state = {
    processing:{
      txHash:null,
      loading:false
    },
    unevenAmounts:null,
    curveTokenConfig:null,
    curvePoolContract:null,
    curveSwapContract:null,
    curveTokenBalance:null,
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

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    const tokenChanged = prevProps.tokenConfig.idle.token !== this.props.tokenConfig.idle.token;
    if (tokenChanged){
      await this.initToken();
    }
  }

  initToken = async () => {
    const curveConfig = this.functionsUtil.getGlobalConfig(['curve']);
    const curveTokenConfig = curveConfig.availableTokens[this.props.tokenConfig.idle.token];

    const [curvePoolContract,curveSwapContract] = await Promise.all([
      this.functionsUtil.getCurvePoolContract(),
      this.functionsUtil.getCurveSwapContract()
    ]);

    const [
      curveTokenBalance,
      curveRedeemableIdleTokens,
    ] = await Promise.all([
      this.functionsUtil.getCurveTokenBalance(this.props.account),
      this.functionsUtil.getCurveRedeemableIdleTokens(this.props.account)
    ]);

    const normalizedCurveBalance = this.functionsUtil.normalizeTokenAmount(curveTokenBalance,curvePoolContract.decimals);
    const withdrawSlippage = await this.functionsUtil.getCurveSlippage(this.props.tokenConfig.idle.token,normalizedCurveBalance,false);

    // const max_burn_amount = this.functionsUtil.normalizeTokenAmount(curveTokenBalance,curvePoolContract.decimals).toString();
    // const amounts = this.functionsUtil.getCurveAmounts(this.props.tokenConfig.idle.token,0);
    // let redeemUnevenAmounts = await this.functionsUtil.getCurveUnevenTokenAmounts(amounts,max_burn_amount);
    
    const unevenAmounts = [];
    // redeemUnevenAmounts
    // console.log('curveTokenBalance',curveTokenBalance.toFixed(4),'withdrawSlippage',withdrawSlippage.toFixed(4));

    this.setState({
      unevenAmounts,
      withdrawSlippage,
      curveTokenConfig,
      curvePoolContract,
      curveSwapContract,
      curveTokenBalance,
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

  render() {

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
            ) : (
              <DashboardCard
                cardProps={{
                  p:3,
                  mt:3
                }}
              >
                {
                  this.state.processing.loading ? (
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
                  ) : (
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
                        {
                          this.state.redeemUnevenAmounts ? `You can redeem ${this.state.curveTokenBalance.toFixed(4)} Curve tokens in uneven amounts ${ this.state.unevenAmounts ? `: ${this.state.unevenAmounts.join(', ')}` : `` }.` : `You can redeem ${this.state.curveRedeemableIdleTokens.toFixed(4)} ${this.props.tokenConfig.idle.token} from the Curve Pool${ this.state.withdrawSlippage ? ` with ${this.state.withdrawSlippage.toFixed(2)}% slippage` : '' }.`
                        }
                      </Text>
                      <Checkbox
                        mt={2}
                        required={false}
                        label={`Redeem in uneven amounts`}
                        checked={this.state.redeemUnevenAmounts}
                        onChange={ e => this.toggleUnevenAmounts(e.target.checked) }
                      />
                      <RoundButton
                        buttonProps={{
                          mt:2,
                          width:[1,1/2]
                        }}
                        handleClick={this.redeem}
                      >
                        Redeem
                      </RoundButton>
                    </Flex>
                  )
                }
              </DashboardCard>
            )
          }
        </Flex>
      </Flex>
    );
  }
}

export default CurveRedeem;