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
    let formattedNumber = '-';
    const number = typeof this.props.number !== 'undefined' && !isNaN(this.props.number) && this.props.number !== false && this.props.number !== null ? this.props.number : null;

    if (number){
      switch (this.props.type){
        case 'money':
          formattedNumber = this.functionsUtil.formatMoney(number,this.props.precision);
        break;
        default:
          formattedNumber = this.functionsUtil.abbreviateNumber(number,this.props.decimals,this.props.maxPrecision,this.props.minPrecision);
        break;
      }
    } else {
      formattedNumber = '-';
    }

    const flexProps = {
      width:1,
      alignItems:'center',
      flexDirection:'row',
      justifyContent:'center'
    };

    // Replace props
    if (this.props.flexProps && Object.keys(this.props.flexProps).length){
      Object.keys(this.props.flexProps).forEach(p => {
        flexProps[p] = this.props.flexProps[p];
      });
    }

    const showUnit = formattedNumber !== '-';
    const unitPos = this.props.unitPos ? this.props.unitPos : 'right';

    return (
      <Flex
        {...flexProps}
      >
        {
          this.props.unit && unitPos === 'left' && showUnit &&
            <Text {...this.props.unitProps}>{this.props.unit}</Text>
        }
        <Text {...this.props}>{formattedNumber}</Text>
        {
          this.props.unit && unitPos === 'right' && showUnit &&
            <Text {...this.props.unitProps}>{this.props.unit}</Text>
        }
      </Flex>
    );
  }
}

export default SmartNumber;
