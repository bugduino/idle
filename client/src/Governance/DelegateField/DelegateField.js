import React, { Component } from 'react';
import { Flex, Text, Blockie } from "rimble-ui";
import FunctionsUtil from '../../utilities/FunctionsUtil';

class DelegateField extends Component {

  state = {};

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

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();
  }

  render(){
    let output = null;
    const fieldInfo = this.props.fieldInfo;
    const delegate = Object.assign({},this.props.delegate);

    const fieldProps = {
      fontWeight:3,
      fontSize:[0,2],
      color:'cellText',
      style:{
        maxWidth:'100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      },
      flexProps:{
        justifyContent:'flex-start'
      }
    };

    // Replace props
    if (fieldInfo.props && Object.keys(fieldInfo.props).length){
      Object.keys(fieldInfo.props).forEach(p => {
        fieldProps[p] = fieldInfo.props[p];
      });
    }

    switch (fieldInfo.name){
      case 'avatar':
        output = (
          <Flex
            {...fieldProps}
            alignItems={'center'}
            justifyContent={'center'}
          >
            <Blockie
              opts={{
                size: 7,
                color: "#dfe",
                bgcolor: "#a71",
                spotcolor: "#000",
                seed: delegate.delegate,
              }}
            />
          </Flex>
        );
      break;
      case 'rank':
      case 'votes':
      case 'delegate':
      case 'proposals':
      case 'vote_weight':
        let value = delegate[fieldInfo.name];
        if (fieldInfo.name === 'votes'){
          value = this.functionsUtil.formatMoney(this.functionsUtil.BNify(value).toFixed(2,1),2);
        }
        output = (
          <Text
            {...fieldProps}
          >
            {value}
          </Text>
        );
      break;
      default:
      break;
    }
    return output;
  }
}

export default DelegateField;
