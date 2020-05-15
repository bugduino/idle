import React, { Component } from 'react';
import FlexLoader from '../FlexLoader/FlexLoader';
import { Flex, Text, Icon } from "rimble-ui";
import RoundButton from '../RoundButton/RoundButton';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';
import TxProgressBar from '../TxProgressBar/TxProgressBar';

class Migrate extends Component {

  state = {
    loading:true,
    processing:{
      approve:{
        txHash:null,
        loading:false
      },
      migrate:{
        txHash:null,
        loading:false
      }
    },
    migrationEnabled:null,
    oldContractBalance:null,
    oldContractTokenDecimals:null,
    migrationContractApproved:null,
    oldContractBalanceFormatted:null
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
    this.checkMigration();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    const accountChanged = prevProps.account !== this.props.account;
    const tokenChanged = prevProps.selectedToken !== this.props.selectedToken;
    if (tokenChanged || accountChanged){
      this.checkMigration();
    }
  }

  checkMigrationContractApproved = async () => {

    if (this.props.tokenConfig.migration && this.props.tokenConfig.migration.migrationContract){
      const migrationContractInfo = this.props.tokenConfig.migration.migrationContract;
      const migrationContractName = migrationContractInfo.name;
      const migrationContract = this.functionsUtil.getContractByName(migrationContractName);
      if (migrationContract){
        return await this.functionsUtil.checkTokenApproved(this.props.tokenConfig.migration.oldContract.name,migrationContractInfo.address,this.props.account);
      }
    }
    return false;
  }

  checkMigration = async () => {

    if (!this.props.tokenConfig || !this.props.account){
      return false;
    }

    let loading = false;
    this.setState({
      loading
    });

    let migrationEnabled = false;
    let oldContractBalance = null;
    let oldContractTokenDecimals = null;
    let migrationContractApproved = false;
    let oldContractBalanceFormatted = null;

    // Check migration contract enabled and balance
    if (this.props.tokenConfig.migration && this.props.tokenConfig.migration.enabled){
      const oldContractName = this.props.tokenConfig.migration.oldContract.name;
      const oldContract = this.functionsUtil.getContractByName(oldContractName);
      const migrationContract = this.functionsUtil.getContractByName(this.props.tokenConfig.migration.migrationContract.name);

      if (oldContract && migrationContract){
        // Get old contract token decimals
        oldContractTokenDecimals = await this.functionsUtil.getTokenDecimals(oldContractName);

        // console.log('Migration - token decimals',oldContractTokenDecimals ? oldContractTokenDecimals.toString() : null);

        // Check migration contract approval
        migrationContractApproved = await this.checkMigrationContractApproved();

        // console.log('Migration - approved',migrationContractApproved ? migrationContractApproved.toString() : null);

        // Check old contractBalance
        oldContractBalance = await this.functionsUtil.getContractBalance(oldContractName,this.props.account);

        // console.log('Migration - oldContractBalance',oldContractBalance ? oldContractBalance.toString() : null);
        if (oldContractBalance){
          oldContractBalanceFormatted = this.functionsUtil.fixTokenDecimals(oldContractBalance,oldContractTokenDecimals);
          // Enable migration if old contract balance if greater than 0
          migrationEnabled = this.functionsUtil.BNify(oldContractBalance).gt(0);
        }
      }
    }

    // console.log('oldContractBalanceFormatted',(oldContractBalance ? oldContractBalanceFormatted.toString() : null),'migrationEnabled', migrationEnabled);
    loading = false;

    // Set migration contract balance
    return this.setState({
      loading,
      migrationEnabled,
      oldContractBalance,
      oldContractTokenDecimals,
      migrationContractApproved,
      oldContractBalanceFormatted,
    });
  }

  async disapproveMigration(e) {
    if (e){
      e.preventDefault();
    }
    const migrationContractInfo = this.props.tokenConfig.migration.migrationContract;
    const migrationContract = this.functionsUtil.getContractByName(migrationContractInfo.name);
    if (migrationContract){
      this.disableERC20(null,this.props.tokenConfig.migration.oldContract.name,migrationContractInfo.address);
    }
  }

  async approveMigration(e) {
    if (e){
      e.preventDefault();
    }
    const migrationContractInfo = this.props.tokenConfig.migration.migrationContract;
    const migrationContract = this.functionsUtil.getContractByName(migrationContractInfo.name);
    if (migrationContract){

      // Check if the migration contract is approved
      const migrationContractApproved = await this.checkMigrationContractApproved();

      if (!migrationContractApproved){
        const callbackApprove = (tx,error) => {
          // Send Google Analytics event
          const eventData = {
            eventCategory: 'Migrate',
            eventAction: 'approve',
            eventLabel: tx.status
          };

          if (error){
            eventData.eventLabel = this.functionsUtil.getTransactionError(error);
          }

          // Send Google Analytics event
          if (error || eventData.status !== 'error'){
            this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
          }

          this.setState((prevState) => ({
            migrationContractApproved: (tx.status === 'success'), // True
            processing: {
              ...prevState.processing,
              approve:{
                txHash:null,
                loading:false
              }
            }
          }));

          this.checkMigration();
        };

        const callbackReceiptApprove = (tx) => {
          const txHash = tx.transactionHash;
          this.setState((prevState) => ({
            processing: {
              ...prevState.processing,
              approve:{
                ...prevState.processing.approve,
                txHash
              }
            }
          }));
        };

        this.functionsUtil.enableERC20(this.props.tokenConfig.migration.oldContract.name,migrationContractInfo.address,callbackApprove,callbackReceiptApprove);

        this.setState((prevState) => ({
          processing: {
            ...prevState.processing,
            approve:{
              txHash:null,
              loading:true
            }
          },
          migrationContractApproved:false
        }));
      } else {
        this.setState({
          migrationContractApproved:true
        });
      }
    }
  }

  async migrate(e,migrationMethod,params) {
    e.preventDefault();

    const migrationContractInfo = this.props.tokenConfig.migration.migrationContract;
    const migrationContract = this.functionsUtil.getContractByName(migrationContractInfo.name);
    if (migrationContract){

      // Check if the migration contract is approved
      const migrationContractApproved = await this.checkMigrationContractApproved();

      if (!migrationContractApproved){
        return this.approveMigration();
      } else {

        const callbackMigrate = (tx,error) => {

          // Send Google Analytics event
          const eventData = {
            eventCategory: 'Migrate',
            eventAction: migrationMethod,
            eventLabel: tx.status,
            eventValue: parseInt(oldContractBalanceFormatted)
          };

          let txDenied = false;

          if (error){
            eventData.eventLabel = this.functionsUtil.getTransactionError(error);
          }

          // Send Google Analytics event
          if (error || eventData.status !== 'error'){
            this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
          }

          if (tx.status === 'success'){
            // Toast message
            window.toastProvider.addMessage(`Migration completed`, {
              secondaryMessage: `Your funds has been migrated`,
              colorTheme: 'light',
              actionHref: "",
              actionText: "",
              variant: "success",
            });

          } else if (!txDenied){ // Show migration error toast only for real error
            window.toastProvider.addMessage(`Migration error`, {
              secondaryMessage: `The migration has failed, try again...`,
              colorTheme: 'light',
              actionHref: "",
              actionText: "",
              variant: "failure",
            });
          }

          this.setState((prevState) => ({
            processing: {
              ...prevState.processing,
              migrate:{
                txHash:null,
                loading:false
              }
            }
          }));

          this.checkMigration();
        }

        const callbackReceiptMigrate = (tx) => {
          const txHash = tx.transactionHash;
          this.setState((prevState) => ({
            processing: {
              ...prevState.processing,
              migrate:{
                ...prevState.processing.migrate,
                txHash
              }
            }
          }));
        };

        // Call migration contract function to migrate funds
        const oldContractBalanceFormatted = this.state.oldContractBalanceFormatted;
        // const oldContractBalance = this.state.oldContractBalance;
        // const toMigrate = this.functionsUtil.BNify(oldContractBalance).toString();
        const toMigrate =  this.functionsUtil.normalizeTokenAmount('1',this.state.oldContractTokenDecimals).toString(); // TEST AMOUNT

        const migrationParams = [toMigrate,this.props.tokenConfig.migration.oldContract.address,this.props.tokenConfig.idle.address,this.props.tokenConfig.address];

        /*
        let _clientProtocolAmounts = [];
        const value = this.functionsUtil.normalizeTokenAmount(this.state.oldContractBalanceFormatted,this.state.oldContractTokenDecimals).toString();
        if (this.props.account){
          // Get amounts for best allocations
          const callParams = { from: this.props.account, gas: this.props.web3.utils.toBN(5000000) };
          const paramsForMint = await this.functionsUtil.genericIdleCall('getParamsForMintIdleToken',[value],callParams);
          if (paramsForMint){
            _clientProtocolAmounts = paramsForMint[1];
          }
          this.functionsUtil.customLog('getParamsForMintIdleToken',value,paramsForMint);
        }
        migrationParams.push(_clientProtocolAmounts);
        */


        console.log(migrationContractInfo.name, migrationMethod, migrationParams);

        // Send migration tx
        this.functionsUtil.contractMethodSendWrapper(migrationContractInfo.name, migrationMethod, migrationParams, callbackMigrate, callbackReceiptMigrate);

        this.setState((prevState) => ({
          processing: {
            ...prevState.processing,
            migrate:{
              txHash:null,
              loading:true
            }
          }
        }));
      }
    }

    return false;
  }

  render() {
    return (
      this.state.loading && this.props.account ? (
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
            text={'Checking migration...'}
          />
        </DashboardCard>
      ) : (
        this.state.migrationEnabled ? (
          <DashboardCard
            cardProps={{
              p:3,
              mt:3
            }}
          >
            {
              this.state.migrationContractApproved ? (
                this.state.processing.migrate.loading ? (
                  <Flex
                    flexDirection={'column'}
                  >
                    <TxProgressBar web3={this.props.web3} waitText={`Migration estimated in`} endMessage={`Finalizing migration request...`} hash={this.state.processing.migrate.txHash} />
                  </Flex>
                ) : (
                  <Flex
                    alignItems={'center'}
                    flexDirection={'column'}
                  >
                    <Icon
                      size={'2.3em'}
                      name={'Repeat'}
                      color={'cellText'}
                    />
                    <Text
                      mt={3}
                      fontSize={2}
                      color={'cellText'}
                      textAlign={'center'}
                    >
                      You are one step from the migration of your old idleTokens! Please press the button below to continue.
                    </Text>
                    {
                      this.props.tokenConfig.migration.migrationContract.functions.map((functionInfo,i) => {
                        const functionName = functionInfo.name;
                        return (
                          <RoundButton
                            buttonProps={{
                              mt:3,
                              width:[1,1/2]
                            }}
                            key={`migrate_${i}`}
                            handleClick={ e => this.migrate(e,functionName) }
                          >
                            { functionInfo.label }
                          </RoundButton>
                        )
                      })
                    }
                  </Flex>
                )
              ) : (
                this.state.processing.approve.loading ? (
                  <Flex
                    flexDirection={'column'}
                  >
                    <TxProgressBar web3={this.props.web3} waitText={`Approve estimated in`} endMessage={`Finalizing approve request...`} hash={this.state.processing.approve.txHash} />
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
                      To Migrate your old idleTokens you need to enable our Smart-Contract first.
                    </Text>
                    <RoundButton
                      buttonProps={{
                        mt:3,
                        width:[1,1/2]
                      }}
                      handleClick={this.approveMigration.bind(this)}
                    >
                      Enable
                    </RoundButton>
                  </Flex>
                )
              )
            }
          </DashboardCard>
        ) : this.props.children
      )
    )
  }
}

export default Migrate;