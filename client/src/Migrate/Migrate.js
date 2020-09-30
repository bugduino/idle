import React, { Component } from 'react';
import FlexLoader from '../FlexLoader/FlexLoader';
import RoundButton from '../RoundButton/RoundButton';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';
import TxProgressBar from '../TxProgressBar/TxProgressBar';
import TransactionField from '../TransactionField/TransactionField';
import FastBalanceSelector from '../FastBalanceSelector/FastBalanceSelector';
import { Box, Flex, Text, Icon, Checkbox, Input, Link, Image } from "rimble-ui";

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
    skipMigration:false,
    buttonDisabled:false,
    migrationEnabled:null,
    fastBalanceSelector:{},
    oldContractBalance:null,
    biconomyLimitReached:false,
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

  toggleSkipMigration = (skipMigration) => {
    this.setState({
      skipMigration
    });

    if (typeof this.props.toggleSkipMigration === 'function'){
      this.props.toggleSkipMigration(skipMigration);
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

        if (!this.props.tokenConfig.migration || !this.props.tokenConfig.migration.oldContract){
          return false;
        }

        const oldContractName = this.props.tokenConfig.migration.oldContract.name;

        const idleTokenToRedeem = this.functionsUtil.normalizeTokenAmount(inputValue,18);

        // Get amounts for best allocations
        const _skipRebalance = true;
        let paramsForRedeem = null;

        /*
        if (this.props.account){
          const callParams = { from: this.props.account, gas: this.props.web3.utils.toBN(5000000) };
          paramsForRedeem = await this.functionsUtil.genericContractCall(oldContractName,'getParamsForRedeemIdleToken',[idleTokenToRedeem, _skipRebalance],callParams);
        }
        */

        const _clientProtocolAmountsRedeem = paramsForRedeem && paramsForRedeem.length ? paramsForRedeem[1] : [];
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

  componentDidMount(){
    
  }

  componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    const accountChanged = prevProps.account !== this.props.account;
    const biconomyChanged = prevProps.biconomy !== this.props.biconomy;
    const tokenChanged = prevProps.selectedToken !== this.props.selectedToken || (!prevProps.tokenConfig && this.props.tokenConfig);

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
        const tokenApproved = await this.functionsUtil.checkTokenApproved(oldContractName,migrationContractInfo.address,this.props.account);
        return tokenApproved;
      }
    }
    return false;
  }

  checkMigration = async () => {

    if (!this.props.tokenConfig || !this.props.account){
      return false;
    }

    // console.log('checkMigration',this.props.selectedToken,this.props.tokenConfig,this.props.account);

    let loading = true;
    this.setState({
      loading,
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
    });

    let migrationEnabled = false;
    let oldTokenName = 'idleTokens';
    let oldIdleTokensConverted = null;
    let oldContractTokenDecimals = null;
    let migrationContractApproved = false;
    let oldTokenPrice = this.functionsUtil.BNify(0);
    let oldIdleTokens = this.functionsUtil.BNify(0);
    let oldContractBalance = this.functionsUtil.BNify(0);
    const getTokenPrice = this.props.getTokenPrice !== undefined ? this.props.getTokenPrice : true;

    // Check migration contract enabled and balance
    if (this.props.tokenConfig.migration && this.props.tokenConfig.migration.enabled){
      const oldContractInfo = this.props.tokenConfig.migration.oldContract;
      const oldContractABI = oldContractInfo.abi;
      const oldContractName = oldContractInfo.name;
      let oldContract = this.functionsUtil.getContractByName(oldContractName);

      // Initialize contract
      if (!oldContract && oldContractABI){
        oldContract = await this.props.initContract(oldContractName,oldContractInfo.address,oldContractABI);
      }

      let migrationContract = this.functionsUtil.getContractByName(this.props.tokenConfig.migration.migrationContract.name);

      if (!migrationContract && this.props.tokenConfig.migration.migrationContract.abi){
        migrationContract = await this.props.initContract(this.props.tokenConfig.migration.migrationContract.name,this.props.tokenConfig.migration.migrationContract.address,this.props.tokenConfig.migration.migrationContract.abi);
      }

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
          (getTokenPrice ? this.functionsUtil.genericContractCall(oldContractName,'tokenPrice') : null)
        ]);

        // console.log('Migration',oldContractName,migrationContractApproved,this.props.selectedToken,oldContractBalance ? oldContractBalance.toString() : null,oldTokenPrice ? oldTokenPrice.toString() : null);

        if (oldContractBalance){
          // Convert old idleTokens
          oldIdleTokens = this.functionsUtil.fixTokenDecimals(oldContractBalance,oldContractTokenDecimals);
          if (oldTokenPrice){
            oldTokenPrice = this.functionsUtil.fixTokenDecimals(oldTokenPrice,this.props.tokenConfig.decimals);
            oldIdleTokensConverted = this.functionsUtil.BNify(oldIdleTokens).times(this.functionsUtil.BNify(oldTokenPrice));
          }
          // Enable migration if old contract balance if greater than 0
          migrationEnabled = this.functionsUtil.BNify(oldContractBalance).gt(0);
        }
      }
    }
    
    loading = false;

    const newState = {
      loading,
      oldTokenName,
      oldIdleTokens,
      migrationEnabled,
      oldContractBalance,
      oldIdleTokensConverted,
      oldContractTokenDecimals,
      migrationContractApproved
    };

    if (this.props.biconomy){
      const biconomyLimits = await this.functionsUtil.checkBiconomyLimits(this.props.account);
      if (biconomyLimits && !biconomyLimits.allowed){
        newState.biconomyLimitReached = true;
      }
    }

    // Set migration contract balance
    return this.setState(newState);
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

  cancelTransaction = async () => {
    this.setState({
      processing: {
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
    });
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
            eventLabel: tx ? tx.status : null
          };

          const txSucceeded = tx && tx.status === 'success';

          // console.log('callbackApprove',tx,error);

          if (error){
            eventData.eventLabel = this.functionsUtil.getTransactionError(error);
          }

          // Send Google Analytics event
          if (error || eventData.status !== 'error'){
            this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
          }

          this.setState((prevState) => ({
            migrationContractApproved: txSucceeded, // True
            processing: {
              ...prevState.processing,
              approve:{
                txHash:null,
                loading:false
              }
            }
          }));

          if (typeof this.props.callbackApprove === 'function' && txSucceeded){
            this.props.callbackApprove(tx);
          }

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

  migrate = async (e,migrationMethod,params) => {
    e.preventDefault();

    const migrationContractInfo = this.props.tokenConfig.migration.migrationContract;
    const migrationContract = this.functionsUtil.getContractByName(migrationContractInfo.name);
    if (migrationContract){

      // Check if the migration contract is approved
      // const migrationContractApproved = await this.checkMigrationContractApproved();

      // if (!migrationContractApproved){
      //   return this.approveMigration();
      // } else {
        const callbackMigrate = (tx,error) => {

          if (!error && tx && tx.status === 'error'){
            error = {
              message:'Unknown error'
            };
          } else if (!tx && error){
            tx = {
              status:'error'
            };
          }

          const txSucceeded = tx && tx.status === 'success';

          // Send Google Analytics event
          const eventData = {
            eventCategory: 'Migrate',
            eventAction: migrationMethod,
            eventLabel: tx ? tx.status : null,
            eventValue: parseInt(oldIdleTokens)
          };

          if (error){
            eventData.eventLabel = this.functionsUtil.getTransactionError(error);
          }

          // Send Google Analytics event
          if (error || eventData.status !== 'error'){
            this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
          }

          // console.log('callbackMigrate',tx,tx.status,txSucceeded,error,this.props.migrationCallback);

          if (txSucceeded){
            // Toast message
            window.toastProvider.addMessage(`Migration completed`, {
              secondaryMessage: `Your funds has been migrated`,
              colorTheme: 'light',
              actionHref: "",
              actionText: "",
              variant: "success",
            });

            if (this.props.migrationCallback && typeof this.props.migrationCallback === 'function'){
              this.props.migrationCallback();
            }

          } else { // Show migration error toast only for real error
            window.toastProvider.addMessage(`Migration error`, {
              secondaryMessage: `The migration has failed, try again...`,
              colorTheme: 'light',
              actionHref: "",
              actionText: "",
              variant: "failure",
            });

            // Check migration if failed
            this.checkMigration();
          }

          this.setState((prevState) => ({
            migrationEnabled:txSucceeded ? false : true,
            processing: {
              ...prevState.processing,
              migrate:{
                txHash:null,
                loading:false
              }
            }
          }));
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

        const useMetaTx = this.props.biconomy && this.state.metaTransactionsEnabled && !this.state.biconomyLimitReached;

        // Call migration contract function to migrate funds
        const oldIdleTokens = this.state.oldIdleTokens;
        const toMigrate = this.functionsUtil.integerValue(this.state.oldContractBalance);
        // const toMigrate =  this.functionsUtil.normalizeTokenAmount('1',this.state.oldContractTokenDecimals).toString(); // TEST AMOUNT

        let _skipRebalance = typeof this.props.tokenConfig.skipMintForDeposit !== 'undefined' ? this.props.tokenConfig.skipMintForDeposit : this.functionsUtil.getGlobalConfig(['contract','methods','migrate','skipRebalance']);

        // Mint if someone mint over X amount
        let minAmountForRebalance = null;
        
        if (_skipRebalance){

          // Check if the amount is over a certain amount to rebalance the pool
          if (useMetaTx){
            minAmountForRebalance = this.functionsUtil.getGlobalConfig(['contract','methods','migrate','minAmountForRebalanceMetaTx']);
          } else {
            minAmountForRebalance = this.functionsUtil.getGlobalConfig(['contract','methods','migrate','minAmountForRebalance']);
          }

          if (minAmountForRebalance){
            const amountToDeposit = await this.functionsUtil.convertTokenBalance(oldIdleTokens,this.props.selectedToken,this.props.tokenConfig,false);
            if (amountToDeposit.gte(this.functionsUtil.BNify(minAmountForRebalance))){
              _skipRebalance = false;
            }
          }
        }

        let migrationParams = this.props.migrationParams ? this.props.migrationParams : [toMigrate,this.props.tokenConfig.migration.oldContract.address,this.props.tokenConfig.idle.address,this.props.tokenConfig.address,_skipRebalance];

        if (typeof migrationParams === 'function'){
          migrationParams = migrationParams(toMigrate);
        }

        // console.log('Migration params',oldIdleTokens,minAmountForRebalance,migrationContractInfo.name, migrationMethod, migrationParams);

        // Check if Biconomy is enabled
        if (useMetaTx){
          const functionSignature = migrationContract.methods[migrationMethod](...migrationParams).encodeABI();
          this.functionsUtil.sendBiconomyTxWithPersonalSign(migrationContractInfo.name, functionSignature, callbackMigrate, callbackReceiptMigrate);
          // this.functionsUtil.sendBiconomyTx(migrationContractInfo.name, migrationContractInfo.address, functionSignature, callbackMigrate, callbackReceiptMigrate);
        } else {
          // Send migration tx
          this.functionsUtil.contractMethodSendWrapper(migrationContractInfo.name, migrationMethod, migrationParams, callbackMigrate, callbackReceiptMigrate);
        }

        // debugger;

        this.setState((prevState) => ({
          processing: {
            ...prevState.processing,
            migrate:{
              txHash:null,
              loading:true
            }
          }
        }));
      // }
    }

    return false;
  }

  render() {

    if (!this.props.tokenConfig || !this.props.selectedToken){
      return null;
    }

    const batchMigrationInfo = this.functionsUtil.getGlobalConfig(['tools','batchMigration']);
    const batchMigrationEnabled = batchMigrationInfo.enabled && typeof batchMigrationInfo.props.availableTokens[this.props.tokenConfig.idle.token] !== 'undefined';
    const batchMigrationDepositEnabled = batchMigrationInfo.depositEnabled;

    const SkipMigrationComponent = (props) => (
      <DashboardCard
        cardProps={{
          pt:2,
          pb:3,
          px:2,
          mb:2,
          display:'flex',
          alignItems:'center',
          flexDirection:'column',
          justifyContent:'center',
          mt:this.state.skipMigration ? 3 : 2,
        }}
      >
        <Flex
          width={1}
          alignItems={'center'}
          flexDirection={'column'}
          justifyContent={'center'}
        >
          <Icon
            size={'1.8em'}
            color={'cellText'}
            name={'FastForward'}
          />
        </Flex>
        <Checkbox
          required={false}
          checked={this.state.skipMigration}
          label={`Skip migration and deposit in Idle v4`}
          onChange={ e => this.toggleSkipMigration(e.target.checked) }
        />
      </DashboardCard>
    );

    const biconomyEnabled = this.functionsUtil.getGlobalConfig(['network','providers','biconomy','enabled']) && !this.state.biconomyLimitReached;

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
        (this.state.migrationEnabled && !this.state.skipMigration) ? (
          <Box width={1}>
            {
              !this.props.isMigrationTool &&
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
                      color={'cellText'}
                      name={ this.props.isMigrationTool ? 'SwapHoriz' : 'Warning' }
                    />
                    <Text
                      mt={1}
                      fontSize={2}
                      color={'cellText'}
                      textAlign={'center'}
                    >
                      { this.props.migrateTextBefore !== null ? this.props.migrateTextBefore : null }
                      { this.props.migrateTextBefore !== null &&
                        <br />
                      }
                      You { !this.props.isMigrationTool ? 'still' : '' } have <strong>{this.state.oldIdleTokens.toFixed(4)} {this.state.oldTokenName} {this.state.oldIdleTokensConverted ? `(${this.state.oldIdleTokensConverted.toFixed(4)} ${this.props.selectedToken})` : ''}</strong> to migrate.<br />
                      { this.props.migrateText !== null ? this.props.migrateText : 'Please use the section below to migrate or redeem your old tokens.' }
                    </Text>
                  </Flex>
                </DashboardCard>
              </Flex>
            }
            {
              (this.props.showActions === undefined || this.props.showActions) && 
                <Flex
                  mt={2}
                  flexDirection={'column'}
                >
                  {
                    !this.props.isMigrationTool && 
                      <SkipMigrationComponent />
                  }
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
            }
            {
              this.state.action === 'migrate' ? (
                <Flex
                  mt={3}
                  flexDirection={'column'}
                >
                  {
                    (batchMigrationEnabled && batchMigrationDepositEnabled && !this.props.isMigrationTool) &&
                      <Flex
                        mb={3}
                        width={1}
                        alignItems={'center'}
                        flexDirection={'row'}
                        justifyContent={'center'}
                      >
                        <Link
                          textAlign={'center'}
                          hoverColor={'primary'}
                          href={`/#/dashboard/tools/${batchMigrationInfo.route}/${this.props.tokenConfig.idle.token}`}
                        >
                          Gas fees too high? Save gas with our Batch Migrator!
                        </Link>
                        <Icon
                          ml={1}
                          size={'1em'}
                          color={'primary'}
                          name={'LocalGasStation'}
                        />
                      </Flex>
                  }
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
                              hash={this.state.processing.migrate.txHash}
                              endMessage={`Finalizing migration request...`}
                              cancelTransaction={this.cancelTransaction.bind(this)}
                              waitText={ this.props.waitText ? this.props.waitText : 'Migration estimated in'}
                              sendingMessage={ this.props.biconomy && this.state.metaTransactionsEnabled ? 'Sending meta-transaction...' : 'Sending transaction...' }
                            />
                          </Flex>
                        ) : (
                          <Flex
                            alignItems={'center'}
                            flexDirection={'column'}
                          >
                            {
                              this.props.migrationImage ? (
                                <Image
                                  {...this.props.migrationImage}
                                />
                              ) : (
                                <Icon
                                  size={'2.3em'}
                                  color={'cellText'}
                                  name={ this.props.migrationIcon ? this.props.migrationIcon : (this.props.isMigrationTool ? 'SwapHoriz' : 'Repeat') }
                                />
                              )
                            }
                            <Text
                              mt={1}
                              fontSize={2}
                              color={'cellText'}
                              textAlign={'center'}
                            >
                              {
                                this.props.migrationText ? (
                                  <Text.span
                                    migrationTextProps={this.props.migrationTextProps}
                                    dangerouslySetInnerHTML={{
                                      __html:this.props.migrationText
                                    }}
                                  >
                                  </Text.span>
                                ) : (
                                  <Text.span
                                    color={'cellText'}
                                  >
                                    You are one step away from the migration of your { this.props.isMigrationTool ? this.state.oldIdleTokens.toFixed(4) : 'old' } {this.state.oldTokenName}{ this.props.isMigrationTool ? ` into the Idle ${this.props.tokenConfig.token} ${this.props.selectedStrategy} strategy` : '' }!
                                  </Text.span>
                                )
                              }
                            </Text>
                            <Flex
                              width={1}
                              alignItems={'center'}
                              flexDirection={'column'}
                              justifyContent={'space-between'}
                            >
                            {
                              biconomyEnabled && 
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
                                      width:[1,0.5],
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
                            <TxProgressBar
                              web3={this.props.web3}
                              waitText={`Approve estimated in`}
                              hash={this.state.processing.approve.txHash}
                              endMessage={`Finalizing approve request...`}
                              cancelTransaction={this.cancelTransaction.bind(this)}
                            />
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
                              mt={1}
                              fontSize={2}
                              color={'cellText'}
                              textAlign={'center'}
                            >
                              {
                                this.props.approveText ? this.props.approveText : (
                                  <>To migrate your { !this.props.isMigrationTool ? 'old' : '' } {this.state.oldTokenName} you need to approve our Smart-Contract first.</>
                                )
                              }
                            </Text>
                            <RoundButton
                              buttonProps={{
                                mt:3,
                                width:[1,1/2]
                              }}
                              handleClick={this.approveMigration.bind(this)}
                            >
                              Approve
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
                    <TxProgressBar
                      web3={this.props.web3}
                      cancelTransaction={this.cancelTransaction.bind(this)}
                      hash={this.state.processing[this.state.action].txHash}
                      endMessage={`Finalizing ${this.state.action} request...`}
                      waitText={`${this.functionsUtil.capitalize(this.state.action)} estimated in`}
                    />
                  </Flex>
                )
              )
            }
          </Box>
        ) : (
          <Flex
            width={1}
            alignItems={'center'}
            flexDirection={'column'}
            justifyContent={'center'}
          >
            {
              (!this.props.isMigrationTool && this.state.migrationEnabled) && 
                <SkipMigrationComponent />
            }
            {
              this.props.children ? this.props.children : null
            }
          </Flex>
        )
      )
    )
  }
}

export default Migrate;