import React, { Component } from 'react';
import FlexLoader from '../FlexLoader/FlexLoader';
import RoundButton from '../RoundButton/RoundButton';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';
import TxProgressBar from '../TxProgressBar/TxProgressBar';
import { Box, Flex, Text, Icon, Checkbox, Input } from "rimble-ui";
import TransactionField from '../TransactionField/TransactionField';
import FastBalanceSelector from '../FastBalanceSelector/FastBalanceSelector';

class Migrate extends Component {

  state = {
    loading:true,
    action:'migrate',
    processing:{
      approve:{
        txHash:null,
        loading:false
      },
      migrate:{
        txHash:null,
        loading:false
      },
      redeem:{
        txHash:null,
        loading:false
      }
    },
    inputValue:{},
    oldTokenName:null,
    oldIdleTokens:null,
    buttonDisabled:false,
    migrationEnabled:null,
    fastBalanceSelector:{},
    oldContractBalance:null,
    metaTransactionsEnabled:true,
    oldContractTokenDecimals:null,
    migrationContractApproved:null,
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

  setAction = (action) => {
    if (action !== null){
      this.setState({
        action
      });
    }
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

  checkButtonDisabled = (amount=null) => {
    if (!this.state.action){
      return false;
    }
    if (!amount){
      amount = this.state.inputValue[this.state.action];
    }
    let buttonDisabled = true;
    if (amount){
      buttonDisabled = amount.lte(0);
      switch (this.state.action){
        case 'redeem':
          buttonDisabled = buttonDisabled || amount.gt(this.state.oldIdleTokens);
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

    let amount = null;
    const selectedPercentage = this.functionsUtil.BNify(this.state.fastBalanceSelector[this.state.action]).div(100);

    switch(this.state.action){
      case 'redeem':
        amount = this.state.oldIdleTokens ? this.functionsUtil.BNify(this.state.oldIdleTokens).times(selectedPercentage) : null;
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

  executeAction = async () => {

    const inputValue = this.state.inputValue[this.state.action];

    if (this.state.buttonDisabled || !inputValue || this.functionsUtil.BNify(inputValue).lte(0)){
      return false;
    }

    const loading = true;

    switch (this.state.action){
      case 'redeem':
        const oldContractName = this.props.tokenConfig.migration.oldContract.name;

        const idleTokenToRedeem = this.functionsUtil.normalizeTokenAmount(inputValue,18).toFixed();

        // Get amounts for best allocations
        const _skipRebalance = true;
        let paramsForRedeem = null;

        if (this.props.account){
          const callParams = { from: this.props.account, gas: this.props.web3.utils.toBN(5000000) };
          paramsForRedeem = await this.functionsUtil.genericContractCall(oldContractName,'getParamsForRedeemIdleToken',[idleTokenToRedeem, _skipRebalance],callParams);
        }

        const _clientProtocolAmountsRedeem = paramsForRedeem ? paramsForRedeem[1] : [];
        const gasLimitRedeem = _clientProtocolAmountsRedeem.length && _clientProtocolAmountsRedeem.indexOf('0') === -1 ? this.functionsUtil.BNify(1500000) : this.functionsUtil.BNify(1000000);

        const callbackRedeem = (tx,error) => {
          const txSucceeded = tx.status === 'success';

          // Send Google Analytics event
          const eventData = {
            eventCategory: `Redeem_old`,
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

        this.props.contractMethodSendWrapper(oldContractName, 'redeemIdleToken', [
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

  componentWillMount(){
    this.loadUtils();
    this.checkMigration();
  }

  componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    const accountChanged = prevProps.account !== this.props.account;
    const biconomyChanged = prevProps.biconomy !== this.props.biconomy;
    const tokenChanged = prevProps.selectedToken !== this.props.selectedToken;

    if (tokenChanged || accountChanged || biconomyChanged){
      this.checkMigration();
    }

    const actionChanged = this.state.action !== prevState.action;
    const fastBalanceSelectorChanged = this.state.fastBalanceSelector[this.state.action] !== prevState.fastBalanceSelector[this.state.action];
    if (actionChanged || fastBalanceSelectorChanged){
      this.setInputValue();
    }
  }

  toggleMetaTransactionsEnabled = (metaTransactionsEnabled) => {
    this.setState({
      metaTransactionsEnabled
    });
  }

  checkMigrationContractApproved = async () => {
    if (this.props.tokenConfig.migration && this.props.tokenConfig.migration.migrationContract){
      const migrationContractInfo = this.props.tokenConfig.migration.migrationContract;
      const migrationContractName = migrationContractInfo.name;
      const migrationContract = this.functionsUtil.getContractByName(migrationContractName);
      if (migrationContract){
        const oldContractName = this.props.tokenConfig.migration.oldContract.name;
        // console.log('checkTokenApproved',oldContractName,migrationContractInfo.address,this.props.account);
        return await this.functionsUtil.checkTokenApproved(oldContractName,migrationContractInfo.address,this.props.account);
      }
    }
    return false;
  }

  checkMigration = async () => {

    if (!this.props.tokenConfig || !this.props.account){
      return false;
    }

    let loading = true;
    this.setState({
      loading
    });

    let oldTokenPrice = null;
    let oldIdleTokens = null;
    let migrationEnabled = false;
    let oldContractBalance = null;
    let oldTokenName = 'idleTokens';
    let oldIdleTokensConverted = null;
    let oldContractTokenDecimals = null;
    let migrationContractApproved = false;

    // Check migration contract enabled and balance
    if (this.props.tokenConfig.migration && this.props.tokenConfig.migration.enabled){
      const oldContractName = this.props.tokenConfig.migration.oldContract.name;
      const oldContract = this.functionsUtil.getContractByName(oldContractName);
      const migrationContract = this.functionsUtil.getContractByName(this.props.tokenConfig.migration.migrationContract.name);

      if (oldContract && migrationContract){

        oldTokenName = this.props.tokenConfig.migration.oldContract.token;

        [
          oldContractTokenDecimals,
          migrationContractApproved,
          oldContractBalance,
          oldTokenPrice,
        ] = await Promise.all([
          // Get old contract token decimals
          this.functionsUtil.getTokenDecimals(oldContractName),
          // Check migration contract approval
          this.checkMigrationContractApproved(),
          // Check old contractBalance
          this.functionsUtil.getContractBalance(oldContractName,this.props.account),
          // Get token price
          this.functionsUtil.genericContractCall(oldContractName,'tokenPrice')
        ]);

        // console.log('Migration - oldContractBalance',oldContractBalance ? oldContractBalance.toString() : null);
        if (oldContractBalance){
          // Convert old idleTokens
          oldTokenPrice = this.functionsUtil.fixTokenDecimals(oldTokenPrice,oldContractTokenDecimals);
          oldIdleTokens = this.functionsUtil.fixTokenDecimals(oldContractBalance,oldContractTokenDecimals);
          oldIdleTokensConverted = this.functionsUtil.BNify(oldIdleTokens).times(this.functionsUtil.BNify(oldTokenPrice));
          // Enable migration if old contract balance if greater than 0
          migrationEnabled = this.functionsUtil.BNify(oldContractBalance).gt(0);
        }
      }
    }

    // console.log('oldIdleTokens',(oldContractBalance ? oldIdleTokens.toString() : null),'migrationEnabled', migrationEnabled);
    loading = false;

    // Set migration contract balance
    return this.setState({
      loading,
      oldTokenName,
      oldIdleTokens,
      migrationEnabled,
      oldContractBalance,
      oldIdleTokensConverted,
      oldContractTokenDecimals,
      migrationContractApproved,
    });
  }

  disapproveMigration = async (e) => {
    if (e){
      e.preventDefault();
    }
    const migrationContractInfo = this.props.tokenConfig.migration.migrationContract;
    const migrationContract = this.functionsUtil.getContractByName(migrationContractInfo.name);
    if (migrationContract){
      this.disableERC20(null,this.props.tokenConfig.migration.oldContract.name,migrationContractInfo.address);
    }
  }

  approveMigration = async (e) => {
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

  migrate = async (e,migrationMethod,params,useMetaTx=true) => {
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

          console.log('callbackMigrate1',tx,error);

          // Send Google Analytics event
          const eventData = {
            eventCategory: 'Migrate',
            eventAction: migrationMethod,
            eventLabel: tx ? tx.status : null,
            eventValue: parseInt(oldIdleTokens)
          };

          if (!error && tx && tx.status === 'error'){
            error = {
              message:'Unknown error'
            };
          }

          if (error){
            eventData.eventLabel = this.functionsUtil.getTransactionError(error);
          }

          console.log('callbackMigrate2',eventData);

          // Send Google Analytics event
          if (error || eventData.status !== 'error'){
            this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
          }

          if (tx && tx.status === 'success'){
            // Toast message
            window.toastProvider.addMessage(`Migration completed`, {
              secondaryMessage: `Your funds has been migrated`,
              colorTheme: 'light',
              actionHref: "",
              actionText: "",
              variant: "success",
            });

          } else { // Show migration error toast only for real error
            window.toastProvider.addMessage(`Migration error`, {
              secondaryMessage: `The migration has failed, try again...`,
              colorTheme: 'light',
              actionHref: "",
              actionText: "",
              variant: "failure",
            });
          }

          this.setState((prevState) => ({
            migrationEnabled:tx.status === 'success' ? false : true,
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
        const oldIdleTokens = this.state.oldIdleTokens;
        const oldContractBalance = this.state.oldContractBalance;
        const toMigrate = this.functionsUtil.BNify(oldContractBalance).toFixed();
        // const toMigrate =  this.functionsUtil.normalizeTokenAmount('1',this.state.oldContractTokenDecimals).toString(); // TEST AMOUNT

        const migrationParams = [toMigrate,this.props.tokenConfig.migration.oldContract.address,this.props.tokenConfig.idle.address,this.props.tokenConfig.address];

        /*
        let _clientProtocolAmounts = [];
        const value = this.functionsUtil.normalizeTokenAmount(this.state.oldIdleTokens,this.state.oldContractTokenDecimals).toString();
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

        // console.log('Migration params',migrationContractInfo.name, migrationMethod, migrationParams);

        // Check if Biconomy is enabled
        if (this.props.biconomy && this.state.metaTransactionsEnabled){
          const functionSignature = migrationContract.methods[migrationMethod](...migrationParams).encodeABI();
          this.functionsUtil.sendBiconomyTxWithPersonalSign(migrationContractInfo.name, functionSignature, callbackMigrate, callbackReceiptMigrate);
          // this.functionsUtil.sendBiconomyTx(migrationContractInfo.name, migrationContractInfo.address, functionSignature, callbackMigrate, callbackReceiptMigrate);
        } else {
          // Send migration tx
          this.functionsUtil.contractMethodSendWrapper(migrationContractInfo.name, migrationMethod, migrationParams, callbackMigrate, callbackReceiptMigrate);
        }

        // Send migration tx
        // this.functionsUtil.contractMethodSendWrapper(migrationContractInfo.name, migrationMethod, migrationParams, callbackMigrate, callbackReceiptMigrate, 10000000);

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
          <Box width={1}>
            <Flex
              mt={3}
              flexDirection={'column'}
            >
              <DashboardCard
                cardProps={{
                  p:3,
                }}
              >
                <Flex
                  alignItems={'center'}
                  flexDirection={'column'}
                >
                  <Icon
                    size={'2.3em'}
                    name={'Warning'}
                    color={'cellText'}
                  />
                  <Text
                    mt={3}
                    fontSize={2}
                    color={'cellText'}
                    textAlign={'center'}
                  >
                    You still have <strong>{this.state.oldIdleTokens.toFixed(4)} {this.state.oldTokenName}</strong> worth <strong>{this.state.oldIdleTokensConverted.toFixed(4)} {this.props.selectedToken}</strong>.<br />Please use the section below to migrate or redeem your old tokens.
                  </Text>
                </Flex>
              </DashboardCard>
            </Flex>
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
                      this.setAction('migrate');
                    }
                  }}
                  isInteractive={true}
                  isActive={ this.state.action === 'migrate' }
                >
                  <Flex
                    my={1}
                    alignItems={'center'}
                    flexDirection={'row'}
                    justifyContent={'center'}
                  >
                    <TransactionField
                      transaction={{
                        action:'migrate'
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
                      Migrate
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
              this.state.action === 'migrate' ? (
                <Flex
                  mt={3}
                  flexDirection={'column'}
                >
                  <DashboardCard
                    cardProps={{
                      p:3,
                    }}
                  >
                    {
                      this.state.migrationContractApproved ? (
                        this.state.processing.migrate.loading ? (
                          <Flex
                            flexDirection={'column'}
                          >
                            <TxProgressBar
                              web3={this.props.web3}
                              waitText={`Migration estimated in`}
                              hash={this.state.processing.migrate.txHash}
                              endMessage={`Finalizing migration request...`}
                              sendingMessage={ this.props.biconomy && this.state.metaTransactionsEnabled ? 'Sending meta-transaction...' : 'Sending transaction...' }
                            />
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
                              You are one step from the migration of your old {this.state.oldTokenName}!
                            </Text>
                            <Flex
                              alignItems={'center'}
                              flexDirection={'column'}
                              justifyContent={'space-between'}
                            >
                            {
                              <Flex
                                py={3}
                                px={2}
                                mt={2}
                                width={1}
                                borderRadius={2}
                                alignItems={'center'}
                                flexDirection={'column'}
                                justifyContent={'center'}
                                backgroundColor={'dashboardBg'}
                                border={`1px solid ${this.props.theme.colors.boxBorder}`}
                              >
                                {
                                /*
                                <Icon
                                  size={'2em'}
                                  name={ this.props.biconomy ? 'MoneyOff' : 'Warning'}
                                  color={'cellText'}
                                />
                                */
                                }
                                <Text
                                  mt={1}
                                  fontSize={1}
                                  color={'cellText'}
                                  textAlign={'center'}
                                >
                                  {
                                    this.props.biconomy ?
                                      `Meta-Transactions allow you to migrate without spending a dime! But, if you are stuck, please disable it and try again.`
                                    :
                                      'Your wallet does not support Meta-transactions, you are still able to migrate with a normal transaction.'
                                  }
                                </Text>
                                {
                                this.props.biconomy &&
                                  <Checkbox
                                    mt={2}
                                    required={false}
                                    label={"Migrate with Meta-Transaction"}
                                    checked={this.state.metaTransactionsEnabled}
                                    onChange={ e => this.toggleMetaTransactionsEnabled(e.target.checked) }
                                  />
                                }
                              </Flex>
                            }
                            {
                              this.props.tokenConfig.migration.migrationContract.functions.map((functionInfo,i) => {
                                const functionName = functionInfo.name;
                                return (
                                  <RoundButton
                                    buttonProps={{
                                      mt:3,
                                      width:[1,0.7],
                                      mainColor:this.props.theme.colors.migrate
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
                              To Migrate your old {this.state.oldTokenName} you need to enable our Smart-Contract first.
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
                </Flex>
              ) : (
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
                      boxShadow={'none !important'}
                      onChange={this.changeInputValue.bind(this)}
                      border={`1px solid ${this.props.theme.colors.divider}`}
                      placeholder={`Insert ${this.state.oldTokenName} amount`}
                      value={this.state.inputValue[this.state.action] !== null ? this.functionsUtil.BNify(this.state.inputValue[this.state.action]).toString() : ''}
                    />
                    <Flex
                      mt={3}
                      alignItems={'center'}
                      flexDirection={'row'}
                      justifyContent={'space-between'}
                    >
                      <FastBalanceSelector
                        percentage={25}
                        onMouseDown={()=>this.setFastBalanceSelector(25)}
                        isActive={this.state.fastBalanceSelector[this.state.action] === parseInt(25)}
                      />
                      <FastBalanceSelector
                        percentage={50}
                        onMouseDown={()=>this.setFastBalanceSelector(50)}
                        isActive={this.state.fastBalanceSelector[this.state.action] === parseInt(50)}
                      />
                      <FastBalanceSelector
                        percentage={75}
                        onMouseDown={()=>this.setFastBalanceSelector(75)}
                        isActive={this.state.fastBalanceSelector[this.state.action] === parseInt(75)}
                      />
                      <FastBalanceSelector
                        percentage={100}
                        onMouseDown={()=>this.setFastBalanceSelector(100)}
                        isActive={this.state.fastBalanceSelector[this.state.action] === parseInt(100)}
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
                    <TxProgressBar web3={this.props.web3} waitText={`${this.functionsUtil.capitalize(this.state.action)} estimated in`} endMessage={`Finalizing ${this.state.action} request...`} hash={this.state.processing[this.state.action].txHash} />
                  </Flex>
                )
              )
            }
          </Box>
        ) : this.props.children
      )
    )
  }
}

export default Migrate;