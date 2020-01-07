import React, { Component } from 'react';
import { Flex, Text, Progress, Loader } from 'rimble-ui'
import axios from 'axios';
import moment from 'moment';
import BigNumber from 'bignumber.js';

const LOG_ENABLED = false;
const customLog = (...props) => { if (LOG_ENABLED) console.log(moment().format('HH:mm:ss'),...props); };
const BNify = s => new BigNumber(String(s));

class TxProgressBar extends Component {
  state = {
    initialized:false,
    estimatedTime:null,
    remainingTime:null,
    percentage:0,
    ended:false,
    error:null,
    web3:null
  };

  async componentWillUnmount(){
    var id = window.setTimeout(function() {}, 0);

    while (id--) {
        window.clearTimeout(id); // will do nothing if no timeout with id is present
    }
  }

  async componentDidUpdate(prevProps){
    if (!this.state.initialized && !prevProps.web3 && this.props.web3){
      await this.initProgressBar();
    }
  }

  async componentDidMount() {
    if (this.props.web3){
      await this.initProgressBar();
    }
  }

  async getTransactionReceipt() {
    return new Promise( async (resolve, reject) => {
      customLog('getTransactionReceipt',this.props.hash);
      this.props.web3.eth.getTransactionReceipt(this.props.hash,(err,transactionReceipt) => {
        if (transactionReceipt){
          customLog('getTransactionReceipt resolved',transactionReceipt);
          this.setState({
            transactionReceipt
          });
          return resolve(transactionReceipt);
        }
        customLog('getTransactionReceipt rejected',err);
        return reject(false);
      });
    });
  }

  async getTransaction() {
    return new Promise( async (resolve, reject) => {
      customLog('getTransaction',this.props.hash);
      this.props.web3.eth.getTransaction(this.props.hash,(err,transaction) => {
        if (transaction){
          customLog('getTransaction resolved',transaction);
          this.setState({
            transaction
          });
          return resolve(transaction);
        }
        customLog('getTransaction rejected',err);
        return reject(false);
      });
    });
  }

  /*
  Taken from https://ethgasstation.info/calculatorTxV.php
  */
  _estimateWait (prediction, gasoffered) {
    var minedProb;
    var expectedWait;
    var sum1, sum2;
    var intercept = 4.2794;
    var hpa = .0329;
    var hgo = -3.2836;
    var tx = -0.0004;
    var intercept2 = 7.5375;
    var hpa_coef = -0.0801;
    var txatabove_coef= 0.0003;
    var high_gas_coef = .3532;

    if (gasoffered > 1000000) {    
      sum1 = intercept + (prediction['hashpower_accepting'] * hpa) + hgo  + (prediction['tx_atabove'] * tx);
      sum2 = intercept2 + (prediction['hashpower_accepting'] * hpa_coef) + (prediction['tx_atabove'] * txatabove_coef) + high_gas_coef;
    } else {
      sum1 = intercept + (prediction['hashpower_accepting'] * hpa) + (prediction['tx_atabove'] * tx);
      sum2 = intercept2 + (prediction['tx_atabove'] * txatabove_coef) + (prediction['hashpower_accepting'] * hpa_coef);
    }

    var factor = Math.exp(- 1 * sum1);
    const prob = 1 / (1 + factor);

    if (prob > .95) {
      minedProb = 'Very High';
    } else if (prob > .9 && prob <= .95) {
      minedProb = 'Medium'
    } else {
      minedProb = 'Low';
    }

    expectedWait = Math.exp(sum2);
    if (expectedWait < 2) {
      expectedWait = 2;
    }

    if (gasoffered > 2000000) {
      expectedWait += 100;
    }

    return [expectedWait, prediction['hashpower_accepting'], prediction['tx_atabove'], minedProb];
  }

  async getBlockTime() {
    const pt = await axios.get('https://ethgasstation.info/json/ethgasAPI.json');
    this.setState({
      blockTime:pt.data
    });
  }

  async getPredictionTable() {
    const pt = await axios.get('https://ethgasstation.info/json/predictTable.json');
    this.setState({
      predictTable:pt.data
    });
  }

  async getTransactionTimestamp(){
    if (!this.state.transaction.blockNumber){
      return null;
    }
    return new Promise( async (resolve, reject) => {
      customLog('getTransactionTimestamp',this.state.transaction.blockNumber);
      this.props.web3.eth.getBlock(this.state.transaction.blockNumber,(err,block) => {
        if (block){
          customLog('getTransactionTimestamp resolved',block);
          return resolve(block.timestamp);
        }
        customLog('getTransactionTimestamp rejected',err);
        return reject(false);
      });
    });
  }

  getTxEstimatedTime(gasPrice) {
    let prediction = null;
    this.state.predictTable.forEach((p,i) => {
      if (!prediction && parseFloat(p.gasprice)>=parseFloat(gasPrice)){
        prediction = p;
        return true;
      }
    });

    if (prediction){
      const pdValues = this._estimateWait(prediction,this.state.transaction.gas);
      const blocksWait = pdValues[0];
      const blockInterval = this.state.blockTime.block_time;
      let txMeanSecs = blocksWait * blockInterval;
      txMeanSecs = parseInt(txMeanSecs.toFixed(0));
      customLog('getTxEstimatedTime',prediction,this.state.transaction.gas,pdValues,txMeanSecs);
      return txMeanSecs; // Customized
    }

    return null;
  }

  async calculateRemainingTime() {
    let remainingTime = 0;

    if (!this.state.transaction){
      return false;
    }

    if (!this.state.transaction.blockNumber){
      const gasPrice = parseFloat(BNify(this.state.transaction.gasPrice).div(1e9).toString());
      remainingTime = this.getTxEstimatedTime(gasPrice);
    }

    this.setState({
      estimatedTime:remainingTime,
      remainingTime
    });

    setTimeout(()=>{this.updateProgressBar()},1000);
  }

  updateProgressBar() {
    let remainingTime = this.state.remainingTime;
    if (remainingTime){
      remainingTime--;
      if (!remainingTime){
        this.setState({
          percentage:1,
          ended:true
        });
      } else {
        const timePassed = this.state.estimatedTime-remainingTime;
        const percentage = parseFloat(timePassed/this.state.estimatedTime);
        this.setState({
          percentage,
          remainingTime
        });
        setTimeout(()=>{this.updateProgressBar()},1000);
      }
    } else {
      this.setState({
        percentage:1,
        ended:true
      });
    }
  }

  async initProgressBar() {
    await Promise.all([
      this.getTransaction(),
      this.getPredictionTable(),
      this.getBlockTime()
    ]);

    this.setState({
      initialized:true
    });

    try{
      this.calculateRemainingTime();
    } catch (err) {
      this.setState({
        error:'Processing transaction'
      })
    }
  }

  renderRemainingTime(){
    // More than 60 seconds
    if (this.state.remainingTime>60){
      const minutes = Math.floor(this.state.remainingTime/60);
      const seconds = this.state.remainingTime-(minutes*60);
      return ('0'+minutes).substr(-2)+':'+('0'+seconds).substr(-2)+' min';
    } else {
      return this.state.remainingTime+'s';
    }
  }

  render() {
    return (
      <Flex flexDirection={'column'} alignItems={'center'}>
        {
          this.state.remainingTime !== null ? (
            <>
              {
                this.state.ended ? (
                  <Flex
                    justifyContent={'center'}
                    alignItems={'center'}
                    textAlign={'center'}>
                    <Loader size="40px" /> <Text ml={2} color={ this.props.textColor ? this.props.textColor : 'dark-gray'}>{this.props.endMessage ? this.props.endMessage : 'Finalizing transaction...'}</Text>
                  </Flex>
                ): (
                  <>
                    <Text mb={2} color={ this.props.textColor ? this.props.textColor : 'dark-gray'}>{ this.props.waitText ? this.props.waitText : 'Remaining time:' } <Text.span color={ this.props.textColor ? this.props.textColor : 'dark-gray'} fontWeight={3}>{ this.renderRemainingTime() }</Text.span></Text>
                    <Progress value={ this.state.percentage } />
                  </>
                )
              }
            </>
          ) : (
            <Flex
              justifyContent={'center'}
              alignItems={'center'}
              textAlign={'center'}>
              <Loader size="40px" />
              <Text color={ this.props.textColor ? this.props.textColor : 'dark-gray'} ml={2}>
                { this.state.error ? this.state.error : (this.props.loadingMessage ? this.props.loadingMessage : 'Calculating estimated time...') }
              </Text>
            </Flex>
          )
        }
      </Flex>
    );
  }
}

export default TxProgressBar;