import { Flex } from "rimble-ui";
import React, { Component } from 'react';
import FunctionsUtil from '../utilities/FunctionsUtil';
import TxProgressBar from '../TxProgressBar/TxProgressBar';

class ExecuteTransaction extends Component {

  state = {
    txStatus:null,
    processing:{
      txHash:null,
      loading:false
    }
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
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
  }

  async cancelTransaction(){
    this.setState({
      processing: {
        txHash:null,
        loading:false
      }
    });
  }

  execute(){

    const callback = (tx,error) => {
      // Send Google Analytics event
      const eventData = {
        eventCategory: 'Transaction',
        eventLabel: this.props.methodName,
        eventAction: this.props.contractName
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
        if (typeof this.props.callback === 'function'){
          this.props.callback();
        }
      }

      this.setState({
        txStatus:tx.status,
        processing: {
          txHash:null,
          loading:false
        }
      });
    };

    const callbackReceipt = (tx) => {
      const txHash = tx.transactionHash;
      this.setState((prevState) => ({
        txStatus:'processing',
        processing: {
          ...prevState.processing,
          txHash
        }
      }));
    };

    this.functionsUtil.contractMethodSendWrapper(this.props.contractName,this.props.methodName,this.props.params,callback,callbackReceipt);

    this.setState((prevState) => ({
      txStatus:'loading',
      processing: {
        ...prevState.processing,
        loading:true
      }
    }));
  }

  render() {
    const ExecuteComponent = this.props.Component;
    return (
      <Flex
        {...this.props.parentProps}
      >
        {
          this.state.txStatus === 'success' && this.props.children ?
            this.props.children
          : this.state.processing && this.state.processing.loading ? (
            <TxProgressBar
              web3={this.props.web3}
              hash={this.state.processing.txHash}
              waitText={`${this.props.action} estimated in`}
              cancelTransaction={this.cancelTransaction.bind(this)}
              endMessage={`Finalizing ${this.props.action} request...`}
            />
          ) : (
            <ExecuteComponent
              onClick={this.execute.bind(this)}
              {...this.props.componentProps}
            >
              {this.props.componentProps.value}
            </ExecuteComponent>
          )
        }
      </Flex>
    );
  }
}

export default ExecuteTransaction;
