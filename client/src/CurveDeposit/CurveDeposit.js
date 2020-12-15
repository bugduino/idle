import Migrate from '../Migrate/Migrate';
import React, { Component } from 'react';
import RoundButton from '../RoundButton/RoundButton';
import FunctionsUtil from '../utilities/FunctionsUtil';
import { Flex, Box, Text, Icon, Tooltip } from "rimble-ui";
import DashboardCard from '../DashboardCard/DashboardCard';
import FastBalanceSelector from '../FastBalanceSelector/FastBalanceSelector';

class CurveDeposit extends Component {

  state = {
    maxSlippage:0.2,
    tokenConfig:null,
    depositSlippage:null,
    redeemableBalance:null,
    curveTokensBalance:null,
    migrationSucceeded:false,
    migrationContractApproved:false,
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

  setMaxSlippage = (maxSlippage) => {
    this.setState({
      maxSlippage
    });
  }

  async getMigrationParams(toMigrate){
    const migrationParams = [];
    const curveTokenConfig = this.functionsUtil.getGlobalConfig(['curve','availableTokens',this.props.tokenConfig.idle.token]);

    if (!curveTokenConfig){
      return false;
    }
    
    const migrationContractParams = curveTokenConfig.migrationParams;
    if (migrationContractParams.n_coins){
      const amounts = await this.functionsUtil.getCurveAmounts(this.state.tokenConfig.idle.token,toMigrate,true);
      let minMintAmount = await this.functionsUtil.getCurveTokenAmount(amounts);
      if (this.state.maxSlippage){
        minMintAmount = this.functionsUtil.BNify(minMintAmount);
        minMintAmount = minMintAmount.minus(minMintAmount.times(this.functionsUtil.BNify(this.state.maxSlippage).div(100)));
        minMintAmount = this.functionsUtil.integerValue(minMintAmount);
      }

      migrationParams.push(amounts);
      migrationParams.push(minMintAmount);

      // console.log(this.state.tokenConfig.idle.token,toMigrate,migrationParams);
    }

    return migrationParams;
  }

  async initToken(){

    let migrationContractApproved = false;

    // Init and check migration contract
    const migrationContract = await this.functionsUtil.getCurveSwapContract();
    if (migrationContract){
      // Check migration contract
      migrationContractApproved = await this.functionsUtil.checkTokenApproved(this.props.tokenConfig.idle.token,migrationContract.address,this.props.account);
    }

    let redeemableBalance = this.functionsUtil.BNify(this.props.idleTokenBalance);
    if (redeemableBalance){
      const idleTokenPrice = await this.functionsUtil.getIdleTokenPrice(this.props.tokenConfig);
      if (idleTokenPrice){
        redeemableBalance = redeemableBalance.times(idleTokenPrice);
      }
    } else {
      redeemableBalance = this.functionsUtil.BNify(0);
    }

    const normalizeIdleTokenBalance = this.functionsUtil.normalizeTokenAmount(redeemableBalance,18);
    const depositSlippage = await this.functionsUtil.getCurveSlippage(this.props.tokenConfig.idle.token,normalizeIdleTokenBalance);

    // Copy token config
    const tokenConfig = Object.assign({},this.props.tokenConfig);

    // Add migration info
    const oldContract = {
      abi:this.props.tokenConfig.idle.abi,
      name:this.props.tokenConfig.idle.token,
      token:this.props.tokenConfig.idle.token,
      address:this.props.tokenConfig.idle.address
    };

    tokenConfig.migration = {
      enabled:true,
      oldContract,
      migrationContract,
    };

    this.setState({
      tokenConfig,
      depositSlippage,
      redeemableBalance,
      migrationContractApproved
    });
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    const accountChanged = prevProps.account !== this.props.account;
    const idleTokenBalanceChanged = prevProps.idleTokenBalance !== this.props.idleTokenBalance;
    if (accountChanged || idleTokenBalanceChanged){
      await this.initToken();
    }
  }

  approveCallback = () => {
    this.initToken();
  }

  migrationCallback = () => {
    this.setState({
      migrationSucceeded:true
    });
  }

  render() {

    if (!this.state.tokenConfig){
      return null;
    }

    const curveConfig = this.functionsUtil.getGlobalConfig(['curve']);
    const hasCurveTokens = this.state.curveTokensBalance && this.state.curveTokensBalance.gt(0);

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
              this.props.idleTokenBalance && this.props.idleTokenBalance.gt(0) && (
                <Box
                  width={1}
                >
                  <DashboardCard
                    cardProps={{
                      p:3,
                      px:[2,4]
                    }}
                  >
                    <Flex
                      alignItems={'center'}
                      flexDirection={'column'}
                    > 
                      <Flex
                        width={1}
                        alignItems={'center'}
                        flexDirection={'row'}
                      >
                        <Icon
                          size={'1.5em'}
                          name={ this.state.migrationContractApproved ? 'CheckBox' : 'LooksOne'}
                          color={ this.state.migrationContractApproved ? this.props.theme.colors.transactions.status.completed : 'cellText'}
                        />
                        <Text
                          ml={2}
                          fontSize={2}
                          color={'cellText'}
                          textAlign={'left'}
                        >
                          Approve the Curve contract
                        </Text>
                      </Flex>
                      <Flex
                        mt={2}
                        width={1}
                        alignItems={'center'}
                        flexDirection={'row'}
                      >
                        <Icon
                          size={'1.5em'}
                          name={ hasCurveTokens ? 'CheckBox' : 'LooksTwo'}
                          color={ hasCurveTokens ? this.props.theme.colors.transactions.status.completed : 'cellText'}
                        />
                        <Text
                          ml={2}
                          fontSize={2}
                          color={'cellText'}
                          textAlign={'left'}
                        >
                          Deposit your {this.props.tokenConfig.idle.token}
                        </Text>
                      </Flex>
                    </Flex>
                  </DashboardCard>
                  {
                    this.state.migrationContractApproved && (
                      <Box
                        mt={2}
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
                </Box>
              )
            }
          {
            this.state.tokenConfig && this.state.redeemableBalance ? (
              <Box width={1}>
                <Migrate
                  {...this.props}
                  showActions={false}
                  getTokenPrice={false}
                  migrationTextProps={{
                    fontWeight:500
                  }}
                  migrationImage={{
                    mb:1,
                    height:'1.8em',
                    src:curveConfig.params.image
                  }}
                  isMigrationTool={true}
                  waitText={'Deposit estimated in'}
                  tokenConfig={this.state.tokenConfig}
                  callbackApprove={this.approveCallback.bind(this)}
                  migrationParams={this.getMigrationParams.bind(this)}
                  migrationCallback={this.migrationCallback.bind(this)}
                  approveText={`To deposit your ${this.props.tokenConfig.idle.token} you need to approve Curve smart-contract first.`}
                  migrationText={`You can deposit ${this.state.redeemableBalance.toFixed(4)} ${this.props.tokenConfig.idle.token} in the Curve Pool ${ this.state.depositSlippage ? (this.state.depositSlippage.gte(0) ? ` with <span style="color:${this.props.theme.colors.transactions.status.failed}">${this.state.depositSlippage.times(100).toFixed(2)}% of slippage</span>` : ` with <span style="color:${this.props.theme.colors.transactions.status.completed}">${Math.abs(parseFloat(this.state.depositSlippage.times(100).toFixed(2)))}% of bonus</span>`) : '' }.`}
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
                    ) : (
                      <DashboardCard
                        cardProps={{
                          p:3
                        }}
                      >
                        {
                          this.state.migrationSucceeded ? (
                            <Flex
                              alignItems={'center'}
                              flexDirection={'column'}
                            >
                              <Icon
                                size={'2.3em'}
                                name={'DoneAll'}
                                color={this.props.theme.colors.transactions.status.completed}
                              />
                              <Text
                                mt={2}
                                fontSize={2}
                                color={'cellText'}
                                textAlign={'center'}
                              >
                                You have successfully deposited your {this.props.tokenConfig.idle.token} in the Curve Pool!
                              </Text>
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
                                You don't have any {this.props.tokenConfig.idle.token} in your wallet.
                              </Text>
                            </Flex>
                          )
                        }
                      </DashboardCard>
                    )
                  }
                </Migrate>
              </Box>
            ) : null
          }
        </Flex>
      </Flex>
    );
  }
}

export default CurveDeposit;