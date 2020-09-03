/*
// batchDeposits[user][batchId] = amount
mapping (address => mapping (uint256 => uint256)) public batchDeposits;
mapping (uint256 => uint256) batchTotals; // in idleToken
mapping (uint256 => uint256) batchRedeemedTotals; // in newIdleToken

uint256 public currBatch;
address public idleToken;
address public newIdleToken;
address public underlying;

function deposit() external
function withdraw(uint256 batchId) external
*/

import Migrate from '../Migrate/Migrate';
import React, { Component } from 'react';
import { Flex, Box, Text, Icon } from "rimble-ui";
import RoundButton from '../RoundButton/RoundButton';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';

class CurveDeposit extends Component {

  state = {
    processing:{
      claim:{
        txHash:null,
        loading:false
      },
    },
    tokenConfig:null,
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

  async initToken(){

    const curveConfig = this.functionsUtil.getGlobalConfig(['curve']);
    const curveTokenConfig = curveConfig.availableTokens[this.props.tokenConfig.idle.token];

    let migrationContractApproved = false;

    // Init migration contract
    if (curveTokenConfig.migrationContract){
      const migrationContract = this.functionsUtil.getContractByName(curveTokenConfig.migrationContract.name);
      if (!migrationContract && curveTokenConfig.migrationContract.abi){
        await this.props.initContract(curveTokenConfig.migrationContract.name,curveTokenConfig.migrationContract.address,curveTokenConfig.migrationContract.abi);
      }

      // Check migration contract
      migrationContractApproved = await this.functionsUtil.checkTokenApproved(this.props.tokenConfig.idle.token,curveTokenConfig.migrationContract.address,this.props.account);
    }

    // Copy token config
    const tokenConfig = Object.assign({},this.props.tokenConfig);

    // Add migration info
    const oldContract = {
      abi:this.props.tokenConfig.idle.abi,
      name:this.props.tokenConfig.idle.token,
      token:this.props.tokenConfig.idle.token,
      address:this.props.tokenConfig.idle.address
    };
    
    const migrationContract = curveTokenConfig.migrationContract;

    tokenConfig.migration = {
      enabled:true,
      oldContract,
      migrationContract,
    };

    this.setState({
      tokenConfig,
      migrationContractApproved
    });
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
  }

  setAction = (action) => {
    if (action !== null && ['deposit','redeem'].includes(action.toLowerCase())){
      this.setState({
        action
      });
    }
  }

  approveCallback = () => {
    this.initToken();
  }

  migrationCallback = () => {
    this.setState({
      migrationSucceeded:true
    },() => {
      this.checkBatchs();
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
              px:4
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
                  migrationParams={[]}
                  getTokenPrice={false}
                  isMigrationTool={true}
                  migrationIcon={'FileDownload'}
                  waitText={'Deposit estimated in'}
                  tokenConfig={this.state.tokenConfig}
                  callbackApprove={this.approveCallback.bind(this)}
                  migrationCallback={this.migrationCallback.bind(this)}
                  approveText={`To deposit your ${this.props.tokenConfig.idle.token} you need to approve Curve smart-contract first.`}
                  migrationText={`Deposit your ${this.props.tokenConfig.idle.token} in the Curve pool to boost your APY`}
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