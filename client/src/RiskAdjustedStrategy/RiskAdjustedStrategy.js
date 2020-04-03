import React, { Component } from 'react';
// import style from './RiskAdjustedStrategy.module.scss';
import FunctionsUtil from '../utilities/FunctionsUtil';
import TransactionsList from '../TransactionsList/TransactionsList';
// import { Flex, Box, Heading, Text, Link, Icon, Pill, Loader } from "rimble-ui";

// const env = process.env;

class RiskAdjustedStrategy extends Component {

  state = {

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

  async componentDidMount(){
    this.loadUtils();
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();
  }

  render() {
    return (
      this.props.selectedToken &&
        <TransactionsList {...this.props} />
    );
  }
}

export default RiskAdjustedStrategy;
