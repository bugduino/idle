import Migrate from '../Migrate/Migrate';
import React, { Component } from 'react';
import { Flex, Box, Text, Icon } from "rimble-ui";
import RoundButton from '../RoundButton/RoundButton';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';

class CurveDeposit extends Component {

  state = {
    tokenConfig:null,
    depositSlippage:null,
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

  async getMigrationParams(toMigrate){
    const migrationParams = [];
    const curveTokenConfig = this.functionsUtil.getGlobalConfig(['curve','availableTokens',this.props.tokenConfig.idle.token]);

    if (!curveTokenConfig){
      return false;
    }

    const migrationContract = this.state.tokenConfig.migration.migrationContract;
    const migrationContractParams = curveTokenConfig.migrationParams;
    if (migrationContractParams.n_coins){
      const amounts = [];
      for (var i = 0; i < migrationContractParams.n_coins; i++) {
        if (migrationContractParams.coinIndex === i){
          amounts.push(toMigrate);
        } else {
          amounts.push(0);
        }
      }

      const minMintAmount = await this.functionsUtil.genericContractCall(migrationContract.name,'calc_token_amount',[amounts,true]);

      migrationParams.push(amounts);
      migrationParams.push(minMintAmount);
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
    const idleTokenPrice = await this.functionsUtil.getIdleTokenPrice(this.props.tokenConfig);
    if (idleTokenPrice){
      redeemableBalance = redeemableBalance.times(idleTokenPrice);
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
      migrationContractApproved
    });
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
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
            this.state.tokenConfig ? (
              <Box width={1}>
                <Migrate
                  {...this.props}
                  showActions={false}
                  getTokenPrice={false}
                  isMigrationTool={true}
                  migrationIcon={'FileDownload'}
                  waitText={'Deposit estimated in'}
                  tokenConfig={this.state.tokenConfig}
                  callbackApprove={this.approveCallback.bind(this)}
                  migrationParams={this.getMigrationParams.bind(this)}
                  migrationCallback={this.migrationCallback.bind(this)}
                  migrationText={`Deposit your ${this.props.tokenConfig.idle.token} in the Curve pool to boost your APY. ${ this.state.depositSlippage && this.state.depositSlippage.gt(0) ? `Current slippage: ${this.state.depositSlippage.toFixed(2)}%` : null }` }
                  approveText={`To deposit your ${this.props.tokenConfig.idle.token} you need to approve Curve smart-contract first.`}
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
                          p:3,
                          my:3
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