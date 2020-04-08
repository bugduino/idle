import React, { Component } from 'react';
import { Image, Text, Loader } from "rimble-ui";
import SmartNumber from '../SmartNumber/SmartNumber';
import FunctionsUtil from '../utilities/FunctionsUtil';

class AssetField extends Component {

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

  async componentDidMount(){
    this.loadUtils();
    this.loadField();
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();

    const tokenChanged = prevProps.token !== this.props.token;
    const accountChanged = prevProps.account !== this.props.account;
    const fieldChanged = prevProps.fieldInfo.name !== this.props.fieldInfo.name;
    if (fieldChanged || tokenChanged || accountChanged){
      this.loadField();
    }
  }

  async loadField(){
    const fieldInfo = this.props.fieldInfo;
    if (this.props.token && this.props.account){
      let tokenAprs = null;
      switch (fieldInfo.name){
        case 'tokenBalance':
          const tokenBalance = await this.functionsUtil.getTokenBalance(this.props.token,this.props.account);
          if (tokenBalance){
            this.setState({
              tokenBalance:tokenBalance.toString()
            });
          }
        break;
        case 'idleTokenBalance':
          const idleTokenBalance = await this.functionsUtil.getTokenBalance(this.props.tokenConfig.idle.token,this.props.account);
          if (idleTokenBalance){
            this.setState({
              idleTokenBalance:idleTokenBalance.toString()
            });
          }
        break;
        case 'apr':
          tokenAprs = await this.functionsUtil.getTokenAprs(this.props.tokenConfig);
          if (tokenAprs && tokenAprs.avgApr !== null){
            const tokenAPR = tokenAprs.avgApr;
            this.setState({
              tokenAPR:parseFloat(tokenAPR).toFixed(3)
            })
          }
        break;
        case 'apy':
          tokenAprs = await this.functionsUtil.getTokenAprs(this.props.tokenConfig);
          if (tokenAprs && tokenAprs.avgApr !== null){
            const tokenAPR = tokenAprs.avgApr;
            const tokenAPY = this.functionsUtil.apr2apy(tokenAPR.div(100)).times(100);
            this.setState({
              tokenAPR:parseFloat(tokenAPR).toFixed(3),
              tokenAPY:parseFloat(tokenAPY).toFixed(3)
            })
          }
        break;
        default:

        break;
      }
    }
  }

  render(){
    const fieldInfo = this.props.fieldInfo;
    let output = null;
    switch (fieldInfo.name){
      case 'icon':
        output = (
          <Image src={`images/tokens/${this.props.token}.svg`} {...fieldInfo.props} />
        );
      break;
      case 'tokenName':
        output = (
          <Text {...fieldInfo.props}>{this.props.token}</Text>
        );
      break;
      case 'tokenBalance':
        output = this.state.tokenBalance ? (
          <SmartNumber {...fieldInfo.props} number={this.state.tokenBalance} />
        ) : (
          <Loader size="20px" />
        );
      break;
      case 'idleTokenBalance':
        output = this.state.idleTokenBalance ? (
          <SmartNumber {...fieldInfo.props} number={this.state.idleTokenBalance} />
        ) : (
          <Loader size="20px" />
        );
      break;
      case 'apr':
        output = this.state.tokenAPR ? (
          <Text {...fieldInfo.props}>{this.state.tokenAPR}%</Text>
        ) : (
          <Loader size="20px" />
        );
      break;
      case 'apy':
        output = this.state.tokenAPY ? (
          <Text {...fieldInfo.props}>{this.state.tokenAPY}%</Text>
        ) : (
          <Loader size="20px" />
        );
      break;
      default:
      break;
    }
    return output;
  }
}

export default AssetField;
