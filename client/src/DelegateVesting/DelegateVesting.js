import React, { Component } from 'react';
import GovernanceUtil from '../utilities/GovernanceUtil';
import TxProgressBar from '../TxProgressBar/TxProgressBar';
import { Flex, Text, Button, Icon, Checkbox, Input } from "rimble-ui";

class DelegateVesting extends Component {

  state = {
    processing:{
      txHash:null,
      loading:false
    },
    newDelegate:'',
    delegatee:null,
    vestingAmount:null,
    currentDelegate:null,
    delegateAddressValid:false,
    delegateDifferentWallet:false,
    vestingContractDelegated:false
  };

  // Utils
  idleGovToken = null;
  functionsUtil = null;
  governanceUtil = null;

  loadUtils(){
    if (this.governanceUtil){
      this.governanceUtil.setProps(this.props);
    } else {
      this.governanceUtil = new GovernanceUtil(this.props);
    }

    this.functionsUtil = this.governanceUtil.functionsUtil;
    this.idleGovToken = this.functionsUtil.getIdleGovToken();
  }

  async loadData(){
    const idleGovTokenEnabled = this.functionsUtil.getGlobalConfig(['govTokens','IDLE','enabled']);
    if (idleGovTokenEnabled && this.props.account){
      const [
        delegatesChanges,
        currentDelegate,
        vestingContract,
      ] = await Promise.all([
        this.governanceUtil.getDelegatesChanges(),
        this.governanceUtil.getCurrentDelegate(this.props.account),
        this.governanceUtil.getVestingContract(this.props.account),
      ]);

      // Init flags
      let delegatee = null;
      let vestingAmount = null;
      let vestingContractDelegated = false;

      if (vestingContract){
        // Take vesting amount
        vestingAmount = await this.governanceUtil.getVestingAmount(this.props.account);

        // Check Vesting Contract Delegated
        const lastDelegateTx = delegatesChanges.filter( d => (d.returnValues.delegator.toLowerCase() === vestingContract.toLowerCase() ) ).pop();
        delegatee = lastDelegateTx ? lastDelegateTx.returnValues.toDelegate : false;
        vestingContractDelegated = delegatee && delegatee !== '0x0000000000000000000000000000000000000000';
      }

      return this.setState({
        delegatee,
        vestingAmount,
        currentDelegate,
        vestingContractDelegated
      });
    }
    return null;
  }

  /*
  async delegateTokens(){

    const callback = (tx,error) => {
      // Send Google Analytics event
      const eventData = {
        eventCategory: 'Governance',
        eventAction: 'delegateTokens',
      };

      if (error){
        eventData.eventLabel = this.functionsUtil.getTransactionError(error);
      }

      // Send Google Analytics event
      if (error || eventData.status !== 'error'){
        this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
      }


      const newState = {
        processing: {
          txHash:null,
          loading:false
        }
      };

      const txSucceeded = tx.status === 'success';
      if (txSucceeded){
        newState.idleTokenDelegated = true;
        this.loadData();
      }

      this.setState(newState);
    };

    const callbackReceipt = (tx) => {
      const txHash = tx.transactionHash;
      this.setState((prevState) => ({
        processing: {
          ...prevState.processing,
          txHash
        }
      }));
    };

    this.governanceUtil.setDelegate(this.props.account,callback,callbackReceipt);

    this.setState((prevState) => ({
      processing: {
        ...prevState.processing,
        loading:true
      }
    }));
  }
  */

  async delegateVesting(revoke=false){

    let delegate = this.state.delegateDifferentWallet ? this.state.newDelegate : this.props.account;
    if (revoke){
      delegate = '0x'+'0'.repeat(40);
    }

    const delegateValid = this.functionsUtil.checkAddress(delegate);
    if (!delegateValid){
      return false;
    }

    const callback = (tx,error) => {
      // Send Google Analytics event
      const eventData = {
        eventCategory: 'Governance',
        eventAction: 'delegateVesting',
      };

      if (error){
        eventData.eventLabel = this.functionsUtil.getTransactionError(error);
      }

      // Send Google Analytics event
      if (error || eventData.status !== 'error'){
        this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
      }

      const newState = {
        processing: {
          txHash:null,
          loading:false
        }
      };

      const txSucceeded = tx.status === 'success';
      if (txSucceeded){
        newState.delegatee=delegate;
        newState.delegateDifferentWallet=false;
        newState.vestingContractDelegated=!revoke;
        this.loadData();
      }

      this.setState(newState);
    };

    const callbackReceipt = (tx) => {
      const txHash = tx.transactionHash;
      this.setState((prevState) => ({
        processing: {
          ...prevState.processing,
          txHash
        }
      }));
    };

    this.governanceUtil.delegateVesting(this.props.account,delegate,callback,callbackReceipt);

    this.setState((prevState) => ({
      processing: {
        ...prevState.processing,
        loading:true
      }
    }));
  }

  changeDelegate(e){
    const newDelegate = e.target.value;
    const delegateAddressValid = this.functionsUtil.checkAddress(newDelegate);
    this.setState({
      newDelegate,
      delegateAddressValid
    });
  }

  setDelegateDifferentWallet(delegateDifferentWallet){
    this.setState({
      delegateDifferentWallet
    });
  }

  async cancelTransaction(){
    this.setState({
      processing: {
        txHash:null,
        loading:false
      }
    });
  }

  async componentWillMount(){
    this.loadUtils();
    this.loadData();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
    const accountChanged = prevProps.account !== this.props.account;
    if (accountChanged){
      this.loadData();
    }
  }

  render() {
    return this.state.vestingAmount ? (
      <Flex
        p={2}
        mt={3}
        width={1}
        borderRadius={1}
        alignItems={'center'}
        flexDirection={'column'}
        justifyContent={'center'}
        backgroundColor={'#f3f6ff'}
        boxShadow={'0px 0px 0px 1px rgba(0,54,255,0.3)'}
      >
        <Flex
          width={1}
          alignItems={'center'}
          flexDirection={'column'}
          justifyContent={'center'}
        >
          <Text
            mb={1}
            fontSize={3}
            fontWeight={500}
            color={'#3f4e9a'}
            textAlign={'center'}
          >
            You have {this.state.vestingAmount.div(1e18).toFixed(5)} {this.functionsUtil.getGlobalConfig(['governance','props','tokenName'])} in the Vesting Contract
          </Text>
          {
            (this.state.vestingContractDelegated && this.state.delegatee && !this.state.delegateDifferentWallet) ? (
              <Text
                mb={1}
                fontWeight={500}
                color={'#3f4e9a'}
                fontSize={'15px'}
                textAlign={'center'}
              >
                Currently your votes are delegated to {this.state.delegatee}
              </Text>
            ) : (
              <Flex
                width={1}
                alignItems={'center'}
                flexDirection={'column'}
                justifyContent={'center'}
              >
                <Text
                  mb={1}
                  fontWeight={500}
                  color={'#3f4e9a'}
                  fontSize={'15px'}
                  textAlign={'center'}
                >
                  {
                    this.state.delegateDifferentWallet ? 'Follow the next steps to delegate your tokens:' : 'Press the button below to delegate the votes in the vesting contract to yourself:'
                  }
                </Text>
                {
                  this.state.delegateDifferentWallet && (
                    <Flex
                      mb={2}
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
                          name={ this.state.delegateAddressValid ? 'CheckBox' : 'LooksOne'}
                          color={ this.state.delegateAddressValid ? this.props.theme.colors.transactions.status.completed : 'cellText'}
                        />
                        <Text
                          ml={1}
                          fontWeight={500}
                          fontSize={'15px'}
                          color={'#3f4e9a'}
                          textAlign={'left'}
                        >
                          Insert delegate address
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
                          name={'LooksTwo'}
                          color={'cellText'}
                        />
                        <Text
                          ml={1}
                          fontWeight={500}
                          fontSize={'15px'}
                          color={'#3f4e9a'}
                          textAlign={'left'}
                        >
                          Delegate Vesting
                        </Text>
                      </Flex>
                    </Flex>
                  )
                }
              </Flex>
            )
          }
        </Flex>
        {
          this.state.delegateDifferentWallet && (
            <Input
              mb={2}
              min={0}
              type={'text'}
              required={true}
              borderRadius={2}
              fontWeight={500}
              textAlign={'center'}
              width={['100%','30em']}
              boxShadow={'none !important'}
              value={this.state.newDelegate}
              placeholder={`Insert delegate address`}
              onChange={this.changeDelegate.bind(this)}
              border={`1px solid ${this.props.theme.colors.divider}`}
            />
          )
        }
        {
          this.state.processing && this.state.processing.loading ? (
            <Flex
              width={1}
              flexDirection={'column'}
            >
              <TxProgressBar
                web3={this.props.web3}
                waitText={`Delegate estimated in`}
                hash={this.state.processing.txHash}
                endMessage={`Finalizing delegate request...`}
                cancelTransaction={this.cancelTransaction.bind(this)}
              />
            </Flex>
          ) : (this.state.vestingContractDelegated && !this.state.delegateDifferentWallet) ? (
            <Button
              size={'small'}
              mainColor={'red'}
              onClick={ e => this.delegateVesting(true) }
            >
              REVOKE DELEGATE
            </Button>
          )
          /*
          : !this.state.idleTokenDelegated && !this.state.delegateDifferentWallet ? (
            <Button
              size={'small'}
              onClick={ e => this.delegateTokens() }
            >
              DELEGATE TOKENS
            </Button>
          )*/
          : (!this.state.vestingContractDelegated || this.state.delegateDifferentWallet) && (
            <Button
              size={'small'}
              onClick={ e => this.delegateVesting(false) }
              disabled={ this.state.delegateDifferentWallet && !this.state.delegateAddressValid }
            >
              DELEGATE VESTING
            </Button>
          )
        }
        <Checkbox
          mt={1}
          required={false}
          color={'#f3f6ff'}
          label={`Delegate to different wallet`}
          checked={this.state.delegateDifferentWallet}
          onChange={ e => this.setDelegateDifferentWallet(e.target.checked) }
        />
      </Flex>
    ) : null;
  }
}

export default DelegateVesting;
