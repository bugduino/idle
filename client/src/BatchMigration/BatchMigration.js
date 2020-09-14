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
import RoundButton from '../RoundButton/RoundButton';
import FunctionsUtil from '../utilities/FunctionsUtil';
import { Flex, Box, Text, Icon, Link } from "rimble-ui";
import AssetSelector from '../AssetSelector/AssetSelector';
import DashboardCard from '../DashboardCard/DashboardCard';
import TxProgressBar from '../TxProgressBar/TxProgressBar';
import TransactionField from '../TransactionField/TransactionField';

class BatchMigration extends Component {

  state = {
    canClaim:false,
    batchTotals:{},
    canDeposit:true,
    action:'deposit',
    batchDeposits:{},
    tokenConfig:null,
    processing:{
      claim:{
        txHash:null,
        loading:false
      },
    },
    hasDeposited:false,
    selectedToken:null,
    batchCompleted:false,
    claimSucceeded:false,
    migrationSucceeded:false,
    selectedTokenConfig:null,
    migrationContractApproved:false,
    availableDestinationTokens:null,
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
    await this.loadTokens();
  }

  async checkBatchs(){

    const migrationContractInfo = this.state.selectedTokenConfig.migrationContract;

    await Promise.all([
      this.props.initContract(migrationContractInfo.name,migrationContractInfo.address,migrationContractInfo.abi),
      this.props.initContract(this.state.selectedTokenConfig.name,this.state.selectedTokenConfig.address,this.state.selectedTokenConfig.abi)
    ]);

    const [currBatchIndex,migrationContractApproved] = await Promise.all([
      this.functionsUtil.genericContractCall(this.state.selectedTokenConfig.migrationContract.name,'currBatch'),
      this.functionsUtil.checkTokenApproved(this.state.selectedTokenConfig.name,migrationContractInfo.address,this.props.account)
    ]);

    const newState = {};
    const batchDeposits = {};
    const batchTotals = {};
    let batchCompleted = false;

    if (currBatchIndex !== null){
      for (let batchIndex = 0; batchIndex <= currBatchIndex ; batchIndex++){
        let [batchTotal,batchDeposit] = await Promise.all([
          this.functionsUtil.genericContractCall(this.state.selectedTokenConfig.migrationContract.name,'batchTotals',[batchIndex]),
          this.functionsUtil.genericContractCall(this.state.selectedTokenConfig.migrationContract.name,'batchDeposits',[this.props.account,batchIndex])
        ]);
        if (batchTotal && batchTotal !== null){
          batchTotals[batchIndex] = this.functionsUtil.fixTokenDecimals(batchTotal,this.state.selectedTokenConfig.decimals);
        }
        if (batchDeposit !== null){
          batchDeposit = this.functionsUtil.fixTokenDecimals(batchDeposit,this.state.selectedTokenConfig.decimals);
          if (batchDeposit.gt(0)){

            batchDeposits[batchIndex] = batchDeposit;
            // Check claimable
            if (batchIndex < currBatchIndex){
              batchCompleted = true;
            }
          }
        }
      }

      newState.batchDeposits = batchDeposits;
    }

    const hasDeposited = (batchDeposits && Object.keys(batchDeposits).length>0);

    const batchMigrationInfo = this.functionsUtil.getGlobalConfig(['tools','batchMigration']);
    const batchMigrationDepositEnabled = batchMigrationInfo.depositEnabled;

    newState.claimSucceeded = false;
    newState.batchTotals = batchTotals;
    newState.batchCompleted = batchCompleted;
    newState.hasDeposited = hasDeposited;
    newState.canDeposit = !hasDeposited && batchMigrationDepositEnabled;
    newState.canClaim = batchCompleted || hasDeposited;
    newState.action = hasDeposited ? 'redeem' : 'deposit';
    newState.migrationContractApproved = migrationContractApproved;

    this.setState(newState);
  }

  async loadTokens(){
    const selectedToken = this.props.urlParams.param2 && this.props.toolProps.availableTokens[this.props.urlParams.param2] ? this.props.urlParams.param2 : Object.keys(this.props.toolProps.availableTokens)[0];

    await this.functionsUtil.asyncForEach(Object.keys(this.props.toolProps.availableTokens),async (token) => {
      const tokenConfig = this.props.toolProps.availableTokens[token];
      const tokenContract = this.functionsUtil.getContractByName(tokenConfig.token);
      if (!tokenContract && tokenConfig.abi){
        await this.props.initContract(tokenConfig.token,tokenConfig.address,tokenConfig.abi);
      }
    });

    this.selectFromToken(selectedToken);
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    const tokenFromChanged = prevProps.urlParams.param2 !== this.props.urlParams.param2;
    if (tokenFromChanged){
      await this.loadTokens();
    }

    const selectedTokenChanged = prevState.selectedToken !== this.state.selectedToken;
    if (selectedTokenChanged){
      this.checkBatchs();
    }
  }

  selectFromToken = async (selectedToken) => {

    const selectedTokenConfig = this.props.toolProps.availableTokens[selectedToken];
    const strategyAvailableTokens =  this.props.availableStrategies[selectedTokenConfig.strategy];

    const baseTokenConfig = strategyAvailableTokens[selectedTokenConfig.baseToken];

    const tokenConfig = {
      token:selectedTokenConfig.baseToken,
      address:selectedTokenConfig.address,
      decimals:selectedTokenConfig.decimals
    };

    // Add Idle Token config
    tokenConfig.idle = baseTokenConfig.idle;

    // Add migration info
    const oldContract = {
      abi:selectedTokenConfig.abi,
      name:selectedTokenConfig.name,
      token:selectedTokenConfig.token,
      address:selectedTokenConfig.address
    };
    
    const migrationContract = selectedTokenConfig.migrationContract;

    // Add migration function
    if (baseTokenConfig.migrateFunction){
      migrationContract.functions[0].name = baseTokenConfig.migrateFunction;
    }

    tokenConfig.migration = {
      enabled:true,
      oldContract,
      migrationContract,
      migrationSucceeded:false
    };

    await this.props.setStrategyToken(selectedTokenConfig.strategy,baseTokenConfig.baseToken);

    this.setState({
      tokenConfig,
      selectedToken,
      selectedTokenConfig
    });
  }

  claim = async () => {
    if (!this.state.batchCompleted){
      return null;
    }

    const loading = true;
    const claimableValue = 0;
    const batchId = Object.keys(this.state.batchDeposits)[0];

    const callbackClaim = (tx,error) => {
      const txSucceeded = tx.status === 'success';

      // Send Google Analytics event
      const eventData = {
        eventCategory: `BatchMigration`,
        eventAction: 'Claim',
        eventLabel: this.props.selectedToken,
        eventValue: parseInt(claimableValue)
      };

      if (error){
        eventData.eventLabel = this.functionsUtil.getTransactionError(error);
      }

      // Send Google Analytics event
      if (error || eventData.status !== 'error'){
        this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
      }

      this.setState((prevState) => ({
        claimSucceeded:txSucceeded,
        processing: {
          ...prevState.processing,
          claim:{
            txHash:null,
            loading:false
          }
        }
      }));
    };

    const callbackReceiptClaim = (tx) => {
      const txHash = tx.transactionHash;
      this.setState((prevState) => ({
        processing: {
          ...prevState.processing,
          claim:{
            ...prevState.processing.claim,
            txHash
          }
        }
      }));
    };

    this.props.contractMethodSendWrapper(this.state.selectedTokenConfig.migrationContract.name, 'withdraw', [batchId], null, callbackClaim, callbackReceiptClaim);

    this.setState((prevState) => ({
      processing: {
        ...prevState.processing,
        claim:{
          ...prevState.processing.claim,
          loading
        }
      }
    }));
  }

  setAction = (action) => {
    if (action !== null && ['deposit','redeem'].includes(action.toLowerCase())){
      this.setState({
        action
      });
    }
  }

  migrationCallback = () => {
    this.checkBatchs();
    this.setState({
      migrationSucceeded:true
    });
  }

  render() {

    if (!this.state.selectedToken){
      return null;
    }

    const batchMigrationInfo = this.functionsUtil.getGlobalConfig(['tools','batchMigration']);
    const batchMigrationDepositEnabled = batchMigrationInfo.depositEnabled;

    const batchId = this.state.batchDeposits && Object.keys(this.state.batchDeposits).length>0 ? Object.keys(this.state.batchDeposits)[0] : null;
    const batchDeposit = this.state.batchDeposits && Object.values(this.state.batchDeposits).length>0 ? Object.values(this.state.batchDeposits)[0] : null;

    return (
      <Flex
        width={1}
        mt={[2,3]}
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
              Select asset to migrate:
            </Text>
            <AssetSelector
              {...this.props}
              id={'token-from'}
              showBalance={true}
              isSearchable={false}
              onChange={this.selectFromToken}
              selectedToken={this.state.selectedToken}
              availableTokens={this.props.toolProps.availableTokens}
            />
          </Box>
          {
            (this.state.canDeposit || this.state.canClaim) && 
              <DashboardCard
                cardProps={{
                  p:3,
                  px:4,
                  mt:3,
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
                      Approve the batch migration contract
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
                      name={ this.state.hasDeposited ? 'CheckBox' : 'LooksTwo'}
                      color={ this.state.hasDeposited ? this.props.theme.colors.transactions.status.completed : 'cellText'}
                    />
                    <Text
                      ml={2}
                      fontSize={2}
                      color={'cellText'}
                      textAlign={'left'}
                    >
                      Deposit your {this.state.selectedTokenConfig.token}
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
                      name={ this.state.batchCompleted ? 'CheckBox' : 'Looks3'}
                      color={ this.state.batchCompleted ? this.props.theme.colors.transactions.status.completed : 'cellText'}
                    />
                    <Text
                      ml={2}
                      fontSize={2}
                      color={'cellText'}
                      textAlign={'left'}
                    >
                      Wait for the batch to be migrated
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
                      name={ this.state.claimSucceeded ? 'CheckBox' : 'Looks4'}
                      color={ this.state.claimSucceeded ? this.props.theme.colors.transactions.status.completed : 'cellText'}
                    />
                    <Text
                      ml={2}
                      fontSize={2}
                      color={'cellText'}
                      textAlign={'left'}
                    >
                      Claim your {this.state.selectedToken}V4
                    </Text>
                  </Flex>
                </Flex>
              </DashboardCard>
          }
          {
            this.state.selectedToken ? (
              <Box width={1}>
                {
                  this.state.migrationContractApproved && (this.state.canDeposit || this.state.canClaim) && 
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
                              return this.state.canDeposit ? this.setAction('deposit') : null;
                            }
                          }}
                          isInteractive={true}
                          isDisabled={ !this.state.canDeposit }
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
                              return this.state.canClaim ? this.setAction('redeem') : null;
                            }
                          }}
                          isInteractive={true}
                          isDisabled={ !this.state.canClaim }
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
                                  mr:3
                                }
                              }}
                            />
                            <Text
                              fontSize={3}
                              fontWeight={3}
                            >
                              Claim
                            </Text>
                          </Flex>
                        </DashboardCard>
                      </Flex>
                    </Flex>
                }
                {
                  this.state.action === 'deposit' ? 
                    batchMigrationDepositEnabled ? (
                      <Migrate
                        {...this.props}
                        showActions={false}
                        migrationParams={[]}
                        getTokenPrice={false}
                        isMigrationTool={true}
                        migrationIcon={'FileDownload'}
                        waitText={'Deposit estimated in'}
                        tokenConfig={this.state.tokenConfig}
                        selectedToken={this.state.selectedToken}
                        callbackApprove={this.checkBatchs.bind(this)}
                        selectedStrategy={this.props.selectedStrategy}
                        migrationCallback={this.migrationCallback.bind(this)}
                        migrationText={`Deposit your ${this.state.selectedTokenConfig.token} and wait until it is converted to the new ${this.state.tokenConfig.idle.token}.`}
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
                                batchId ? (
                                  <Flex
                                    alignItems={'center'}
                                    flexDirection={'column'}
                                  >
                                    <Icon
                                      size={'2.3em'}
                                      color={'cellText'}
                                      name={'HourglassEmpty'}
                                    />
                                    <Text
                                      mt={2}
                                      fontSize={2}
                                      color={'cellText'}
                                      textAlign={'center'}
                                    >
                                      {
                                        this.state.batchCompleted ? (
                                          <Text.span
                                            color={'cellText'}
                                          >The batch has been migrated, click on the "Claim" button to withdraw your tokens.</Text.span>
                                        ) : (
                                          <Text.span
                                            color={'cellText'}
                                          >
                                            You have successfully deposited {batchDeposit.toFixed(4)} {this.state.selectedTokenConfig.token}, please wait until the batch is migrated to claim your tokens.
                                            {
                                              typeof this.state.batchTotals[batchId] !== 'undefined' && 
                                              <Text.span
                                                color={'cellText'}
                                              >
                                                <br />Batch pool: {this.state.batchTotals[batchId].toFixed(4)} {this.state.selectedTokenConfig.token}
                                              </Text.span>
                                            }
                                          </Text.span>
                                        )
                                      }
                                    </Text>
                                  </Flex>
                                ) : this.state.migrationSucceeded ? (
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
                                      You have successfully deposited your {this.state.selectedTokenConfig.token} into the batch!
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
                                      You don't have any {this.state.selectedTokenConfig.token} in your wallet.
                                    </Text>
                                  </Flex>
                                )
                              }
                            </DashboardCard>
                          )
                        }
                      </Migrate>
                    ) : (
                      <DashboardCard
                        cardProps={{
                          p:3,
                          my:3
                        }}
                      >
                        <Flex
                          alignItems={'center'}
                          flexDirection={'column'}
                        >
                          <Text
                            fontSize={2}
                            color={'cellText'}
                            textAlign={'center'}
                          >
                            Batch migration is disabled for this asset.
                          </Text>
                        </Flex>
                      </DashboardCard>
                    )
                  : (
                    <DashboardCard
                      cardProps={{
                        p:3,
                        my:3
                      }}
                    >
                      {
                        this.state.processing.claim.loading ? (
                          <Flex
                            flexDirection={'column'}
                          >
                            <TxProgressBar web3={this.props.web3} waitText={`Claim estimated in`} endMessage={`Finalizing approve request...`} hash={this.state.processing.claim.txHash} />
                          </Flex>
                        ) : this.state.claimSucceeded ? (
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
                              You have successfully withdrawn your {this.state.selectedToken} V4!
                            </Text>
                            <Link
                              mt={2}
                              textAlign={'center'}
                              hoverColor={'primary'}
                              onClick={ e => this.props.goToSection(this.state.selectedTokenConfig.strategy+'/'+this.state.selectedTokenConfig.baseToken) }
                            >
                              Go to the Dashboard
                            </Link>
                          </Flex>
                        ) : this.state.batchCompleted ? (
                          <Flex
                            alignItems={'center'}
                            flexDirection={'column'}
                          >
                            <Icon
                              size={'2.3em'}
                              color={'cellText'}
                              name={'FileUpload'}
                            />
                            <Text
                              mt={1}
                              fontSize={2}
                              color={'cellText'}
                              textAlign={'center'}
                            >
                              The batch has been migrated!<br />You can now claim your {this.state.tokenConfig.idle.token} V4.
                            </Text>
                            <Flex
                              width={1}
                              alignItems={'center'}
                              flexDirection={'column'}
                              justifyContent={'space-between'}
                            >
                              <RoundButton
                                buttonProps={{
                                  mt:3,
                                  width:[1,0.5],
                                  mainColor:this.props.theme.colors.redeem
                                }}
                                handleClick={ e => this.claim() }
                              >
                                Claim
                              </RoundButton>
                            </Flex>
                          </Flex>
                        ) : (
                          <Flex
                            alignItems={'center'}
                            flexDirection={'column'}
                          >
                            <Icon
                              size={'2.3em'}
                              color={'cellText'}
                              name={'HourglassEmpty'}
                            />
                            <Text
                              mt={2}
                              fontSize={2}
                              color={'cellText'}
                              textAlign={'center'}
                            >
                              <Text.span
                                color={'cellText'}
                              >
                                You have successfully deposited {batchDeposit.toFixed(4)} {this.state.selectedTokenConfig.token}, please wait until the batch is migrated to claim your V4 tokens.
                                {
                                  typeof this.state.batchTotals[batchId] !== 'undefined' && 
                                  <Text.span
                                    color={'cellText'}
                                  >
                                    <br />Batch pool: {this.state.batchTotals[batchId].toFixed(4)} {this.state.selectedTokenConfig.token}
                                  </Text.span>
                                }
                              </Text.span>
                            </Text>
                          </Flex>
                        )
                      }
                    </DashboardCard>
                  )
                }
              </Box>
            ) : null
          }
        </Flex>
      </Flex>
    );
  }
}

export default BatchMigration;