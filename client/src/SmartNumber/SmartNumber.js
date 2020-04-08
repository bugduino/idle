import { Text } from "rimble-ui";
import React, { Component } from 'react';
import FunctionsUtil from '../utilities/FunctionsUtil';

class SmartNumber extends Component {

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

  render() {
    const formattedNumber = this.functionsUtil.abbreviateNumber(this.props.number,this.props.precision);
    return (
      <Text {...this.props}>{formattedNumber}</Text>
    );
  }
}

export default SmartNumber;
