import { Flex, Text } from "rimble-ui";
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
    let formattedNumber = this.props.number;
    if (!isNaN(this.props.number)){
      switch (this.props.type){
        case 'money':
          formattedNumber = this.functionsUtil.formatMoney(this.props.number,this.props.precision);
        break;
        default:
          formattedNumber = this.functionsUtil.abbreviateNumber(this.props.number,this.props.decimals,this.props.maxPrecision,this.props.minPrecision);
        break;
      }
    }
    return (
      <Flex
        width={1}
        alignItems={'center'}
        flexDirection={'row'}
        justifyContent={'center'}
      >
        <Text {...this.props}>{formattedNumber}</Text>
        {
          this.props.unit &&
            <Text {...this.props.unitProps}>{this.props.unit}</Text>
        }
      </Flex>
    );
  }
}

export default SmartNumber;
