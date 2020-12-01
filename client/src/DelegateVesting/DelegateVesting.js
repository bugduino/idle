import React, { Component } from 'react';
import { Flex, Text, Button, Icon } from "rimble-ui";
import GovernanceUtil from '../utilities/GovernanceUtil';
import TxProgressBar from '../TxProgressBar/TxProgressBar';

class DelegateVesting extends Component {

  state = {
    processing:{
      txHash:null,
      loading:false
    },
    priorVotes:null,
    vestingAmount:null,
    currentDelegate:null,
    idleTokenDelegated:false,
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
        priorVotes,
        currentDelegate,
        vestingContract
      ] = await Promise.all([
        this.idleGovToken.getPriorVotes(this.props.account),
        this.governanceUtil.getCurrentDelegate(this.props.account),
        this.governanceUtil.getVestingContract(this.props.account)
      ]);

      let vestingAmount = null;
      if (vestingContract){
        vestingAmount = await this.governanceUtil.getVestingAmount(this.props.account);
      }

      const idleTokenDelegated = currentDelegate && currentDelegate.toLowerCase() === this.props.account.toLowerCase();
      const vestingContractDelegated = priorVotes && vestingAmount && priorVotes.eq(vestingAmount);

      return this.setState({
        priorVotes,
        vestingAmount,
        currentDelegate,
        idleTokenDelegated,
        vestingContractDelegated
      });
    }
    return null;
  }

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

      const txSucceeded = tx.status === 'success';
      if (txSucceeded){
        this.loadData();
      }

      this.setState({
        processing: {
          txHash:null,
          loading:false
        },
        vestingContractDelegated:txSucceeded ? true : false
      });
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

  async delegateVesting(){
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

      const txSucceeded = tx.status === 'success';
      if (txSucceeded){
        this.loadData();
      }

      this.setState({
        processing: {
          txHash:null,
          loading:false
        },
        idleTokenDelegated:txSucceeded ? true : false
      });
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

    this.governanceUtil.delegateVesting(this.props.account,this.props.account,callback,callbackReceipt);

    this.setState((prevState) => ({
      processing: {
        ...prevState.processing,
        loading:true
      }
    }));
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
    return this.state.vestingAmount && (!this.state.idleTokenDelegated || !this.state.vestingContractDelegated) ? (
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
        <Text
          mb={1}
          fontSize={3}
          fontWeight={500}
          color={'#3f4e9a'}
          textAlign={'center'}
        >
          You have {this.state.vestingAmount.div(1e18).toFixed(5)} {this.functionsUtil.getGlobalConfig(['governance','props','tokenName'])} in the Vesting Contract!
        </Text>

        <Text
          fontWeight={500}
          color={'#3f4e9a'}
          fontSize={'15px'}
          textAlign={'center'}
        >
          Follow the next steps to delegate your tokens:
        </Text>

        <Flex
          mt={1}
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
              name={ this.state.idleTokenDelegated ? 'CheckBox' : 'LooksOne'}
              color={ this.state.idleTokenDelegated ? this.props.theme.colors.transactions.status.completed : 'cellText'}
            />
            <Text
              ml={1}
              fontWeight={500}
              fontSize={'15px'}
              color={'#3f4e9a'}
              textAlign={'left'}
            >
              Delegate Tokens
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
              name={ this.state.vestingContractDelegated ? 'CheckBox' : 'LooksTwo'}
              color={ this.state.vestingContractDelegated ? this.props.theme.colors.transactions.status.completed : 'cellText'}
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
        {
          this.state.processing && this.state.processing.loading ? (
            <Flex
              width={1}
              flexDirection={'column'}
            >
              <TxProgressBar
                web3={this.props.web3}
                waitText={`Vote estimated in`}
                hash={this.state.processing.txHash}
                endMessage={`Finalizing vote request...`}
                cancelTransaction={this.cancelTransaction.bind(this)}
              />
            </Flex>
          ) : !this.state.idleTokenDelegated ? (
            <Button
              size={'small'}
              onClick={this.delegateTokens.bind(this)}
            >
              DELEGATE TOKENS
            </Button>
          ) : (!this.state.vestingContractDelegated && this.state.idleTokenDelegated) && (
            <Button
              size={'small'}
              onClick={this.delegateVesting.bind(this)}
            >
              DELEGATE VESTING
            </Button>
          )
        }
      </Flex>
    ) : null;
  }
}

export default DelegateVesting;
