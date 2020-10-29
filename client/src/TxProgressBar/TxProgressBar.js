import axios from 'axios';
import React, { Component } from 'react';
import FlexLoader from '../FlexLoader/FlexLoader';
import FunctionsUtil from '../utilities/FunctionsUtil';
import { Flex, Text, Progress, Icon, Link } from 'rimble-ui'

class TxProgressBar extends Component {
  state = {
    error:null,
    ended:false,
    percentage:0,
    processing:true,
    txTimestamp:null,
    initialized:false,
    estimatedTime:null,
    remainingTime:null
  };

  componentUnmounted = false;

  // Utils
  functionsUtil = null;

  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  async componentWillUnmount(){

    this.componentUnmounted = true;

    var id = window.setTimeout(function() {}, 0);

    while (id--) {
        window.clearTimeout(id); // will do nothing if no timeout with id is present
    }
  }

  componentWillMount(){
    this.loadUtils();
  }

  async componentDidUpdate(prevProps){
    this.loadUtils();

    if (!this.state.initialized && this.props.web3){
      this.initProgressBar();
    }
  }

  componentDidMount = async () => {
    this.initProgressBar();
  }

  getTransaction = async () => {
    const transaction = await (new Promise( async (resolve, reject) => {
      this.functionsUtil.customLog('getTransaction',this.props.hash);
      this.props.web3.eth.getTransaction(this.props.hash,(err,transaction) => {
        resolve(transaction);
      });
    }));

    const newState = {};
    if (transaction){
      newState.transaction = transaction;
    } else {
      newState.processing = false;
      newState.error = 'Unable to find the transaction';
    }

    this.setState(newState);
    return transaction;
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

  getBlockTime = async () => {
    const pt = await axios.get('https://ethgasstation.info/json/ethgasAPI.json');
    if (pt){
      const blockTime = pt.data;
      this.setState({
        blockTime
      });
      return blockTime;
    }
    return null;
  }

  getPredictionTable = async () => {
    const pt = await axios.get('https://ethgasstation.info/json/predictTable.json');
    if (pt){
      const predictTable = pt.data;
      this.setState({
        predictTable
      });
      return predictTable;
    }
    return null;
  }

  getTxEstimatedTime = (gasPrice) => {
    let prediction = null;
    if (this.state.predictTable){
      this.state.predictTable.forEach((p,i) => {
        if (!prediction && parseFloat(p.gasprice)>=parseFloat(gasPrice)){
          prediction = p;
          return true;
        }
      });
    }

    if (this.state.blockTime && prediction){
      const pdValues = this._estimateWait(prediction,this.state.transaction.gas);
      const blocksWait = pdValues[0];
      const blockInterval = this.state.blockTime.block_time;
      let txMeanSecs = blocksWait * blockInterval;
      txMeanSecs = parseInt(txMeanSecs.toFixed(0));
      this.functionsUtil.customLog('getTxEstimatedTime',prediction,this.state.transaction.gas,pdValues,txMeanSecs);
      return txMeanSecs; // Customized
    }

    return null;
  }

  calculateRemainingTime = async () => {
    let remainingTime = 0;
    let estimatedTime = 0;

    if (!this.state.transaction || this.componentUnmounted){
      return false;
    }

    if (!this.state.transaction.blockNumber){
      const gasPrice = parseFloat(this.functionsUtil.BNify(this.state.transaction.gasPrice).div(1e9).toString());
      remainingTime = this.getTxEstimatedTime(gasPrice);
    }

    estimatedTime = remainingTime ? remainingTime : 0;

    if (this.state.txTimestamp){
      const currTimestamp = new Date().getTime();
      const secondsPassed = parseInt((currTimestamp-parseInt(this.state.txTimestamp))/1000);
      
      // Calculate new remaining time
      remainingTime -= secondsPassed;
      remainingTime = Math.max(remainingTime,0);

      this.functionsUtil.customLog('Estimated time',estimatedTime,'secondsPassed',secondsPassed,'New remaining time',remainingTime);
    }

    const timePassed = estimatedTime-remainingTime;
    const percentage = estimatedTime>0 ? parseFloat(timePassed/estimatedTime) : 1;

    this.setState({
      estimatedTime,
      remainingTime,
      percentage
    });

    setTimeout(()=>{this.updateProgressBar()},1000);
  }

  updateProgressBar = () => {

    if (this.componentUnmounted){
      return false;
    }

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

  getTxInfo = async () => {

    // Get tx timestamp
    const txProgressBarKey = `txProgressBarData`;
    const txHash = this.props.hash.toLowerCase();

    let txProgressBarData = null;
    let txTimestamp = null;
    let newState = {};

    if (localStorage){
      txProgressBarData = localStorage.getItem(txProgressBarKey);
      if (txProgressBarData){
        txProgressBarData = JSON.parse(txProgressBarData);
      }
    }

    if (!txProgressBarData || !txProgressBarData[txHash]){
      txTimestamp = new Date().getTime();

      const [predictTable,blockTime] = await Promise.all([
        this.getPredictionTable(),
        this.getBlockTime()
      ]);

      txProgressBarData = {};
      txProgressBarData[txHash] = {
        txTimestamp,
        blockTime,
        predictTable
      };

      // Save progress bar status in localStorage
      this.functionsUtil.setLocalStorage(txProgressBarKey,JSON.stringify(txProgressBarData));

      newState = txProgressBarData[txHash];

      if (!predictTable || !blockTime){
        newState.error = 'Processing transaction';
      }
    }

    this.setState(newState);
  }

  initProgressBar = async () => {

    if (!this.props.hash || !this.props.web3){
      return false;
    }

    const newState = {
      initialized:true
    };
    this.setState(newState);

    const transaction = await this.getTransaction();

    if (transaction){
      await this.getTxInfo();
      try{
        this.calculateRemainingTime();
      } catch (err) {
        newState.error = 'Processing transaction';

        // const errStringified = JSON.stringify(err);
      }

      this.setState(newState);
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
            this.state.ended ? (
              <FlexLoader
                textProps={{
                  ml:2,
                  color:this.props.textColor ? this.props.textColor : 'copyColor'
                }}
                loaderProps={{
                  size:'25px'
                }}
                flexProps={{
                  textAlign:'center',
                  alignItems:'center',
                  justifyContent:'center',
                }}
                text={this.props.endMessage ? this.props.endMessage : 'Finalizing transaction...'}
              />
            ) : (
              <Flex
                mb={2}
                alignItems={'center'}
                flexDirection={'column'}
                justifyContent={'center'}
              >
                <Text mb={2} color={ this.props.textColor ? this.props.textColor : 'copyColor'}>{ this.props.waitText ? this.props.waitText : 'Remaining time:' } <Text.span color={ this.props.textColor ? this.props.textColor : 'copyColor'} fontWeight={3}>{ this.renderRemainingTime() }</Text.span></Text>
                <Progress value={ this.state.percentage } />
              </Flex>
            )
          ) : (
            this.state.error !== null && !this.state.processing ? (
              <Flex
                alignItems={'center'}
                flexDirection={'column'}
              >
                <Icon
                  size={'2em'}
                  name={'Warning'}
                  color={'cellText'}
                />
                <Text
                  mt={0}
                  fontSize={2}
                  textAlign={'center'}
                  color={this.props.textColor ? this.props.textColor : 'cellText'}
                >
                  {this.state.error}
                </Text>
              </Flex>
            ) : (
              <FlexLoader
                textProps={{
                  ml:2,
                  color:this.props.textColor ? this.props.textColor : 'copyColor'
                }}
                loaderProps={{
                  size:'25px'
                }}
                flexProps={{
                  textAlign:'center',
                  alignItems:'center',
                  justifyContent:'center',
                }}
                text={ this.state.error ? this.state.error : (this.props.hash ? (this.props.loadingMessage ? this.props.loadingMessage : 'Calculating estimated time...') : (this.props.sendingMessage ? this.props.sendingMessage : 'Sending transaction...') ) }
              />
            )
          )
        }
        {
          this.props.hash ? (
            <Link
              mt={0}
              target={'_blank'}
              hoverColor={'dark-gray'}
              rel={"nofollow noopener noreferrer"}
              href={`https://etherscan.io/tx/${this.props.hash}`}
              color={this.props.textColor ? this.props.textColor : 'cellText'}
            >
              <Flex
                alignItems={'center'}
                flexDirection={'row'}
                justifyContent={'center'}
              >
                <Text
                  fontSize={0}
                  textAlign={'center'}
                  color={this.props.textColor ? this.props.textColor : 'cellText'}
                >
                  View in Etherscan
                </Text>
                <Icon
                  ml={1}
                  size={'0.75em'}
                  name={'OpenInNew'}
                  color={this.props.textColor ? this.props.textColor : 'cellText'}
                />
              </Flex>
            </Link>
          ) : typeof this.props.cancelTransaction === 'function' ? (
              <Link
                mt={0}
                href={`javascript:void(0)`}
                onClick={ e => this.props.cancelTransaction() }
                color={this.props.cancelTextColor ? this.props.cancelTextColor : 'cellText'}
                hoverColor={this.props.cancelTextHoverColor ? this.props.cancelTextHoverColor : 'dark-gray'}
              >
                <Flex
                  alignItems={'center'}
                  flexDirection={'row'}
                  justifyContent={'center'}
                >
                  <Text
                    fontSize={0}
                    textAlign={'center'}
                    color={this.props.cancelTextColor ? this.props.cancelTextColor : 'cellText'}
                  >
                    Cancel transaction
                  </Text>
                  <Icon
                    ml={1}
                    size={'0.85em'}
                    name={'Cancel'}
                    color={this.props.cancelTextColor ? this.props.cancelTextColor : 'cellText'}
                  />
                </Flex>
              </Link>
          ) : null
        }
      </Flex>
    );
  }
}

export default TxProgressBar;