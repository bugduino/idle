import React, { Component } from 'react';
import SmartNumber from '../SmartNumber/SmartNumber';
import FunctionsUtil from '../utilities/FunctionsUtil';
import { Image, Text, Loader, Button } from "rimble-ui";
import VariationNumber from '../VariationNumber/VariationNumber';

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

  async loadField(fieldName=null){
    const setState = fieldName === null;
    const fieldInfo = this.props.fieldInfo;
    if (!fieldName){
      fieldName = fieldInfo.name;
    }
    if (this.props.token && this.props.account){
      let tokenAprs = null;
      switch (fieldName){
        case 'tokenBalance':
          const tokenBalance = await this.functionsUtil.getTokenBalance(this.props.token,this.props.account);
          if (tokenBalance){
            if (setState){
              this.setState({
                tokenBalance:tokenBalance.toString()
              });
            }
            return tokenBalance;
          }
        break;
        case 'amountLent':
          const amountLents = await this.functionsUtil.getAmountLent([this.props.token],this.props.account);
          if (amountLents && amountLents[this.props.token]){
            if (setState){
              this.setState({
                amountLent:amountLents[this.props.token].toString()
              });
            }
            return amountLents[this.props.token];
          }
        break;
        case 'idleTokenBalance':
          const idleTokenBalance1 = await this.functionsUtil.getTokenBalance(this.props.tokenConfig.idle.token,this.props.account);
          if (idleTokenBalance1){
            if (setState){
              this.setState({
                idleTokenBalance:idleTokenBalance1.toString()
              });
            }
            return idleTokenBalance1;
          }
        break;
        case 'redeemableBalance':
          const [idleTokenBalance2,idleTokenPrice] = await Promise.all([
            this.loadField('idleTokenBalance'),
            this.functionsUtil.genericContractCall(this.props.tokenConfig.idle.token, 'tokenPrice')
          ]);
          if (idleTokenBalance2 && idleTokenPrice){
            const redeemableBalance = this.functionsUtil.fixTokenDecimals(idleTokenBalance2.times(idleTokenPrice),this.props.tokenConfig.decimals);
            if (setState){
              this.setState({
                redeemableBalance:redeemableBalance.toString()
              });
            }
            return redeemableBalance;
          }
        break;
        case 'earnings':
          const [amountLent1,redeemableBalance1] = await Promise.all([
            this.loadField('amountLent'),
            this.loadField('redeemableBalance')
          ]);
          if (amountLent1 && redeemableBalance1){
            const earnings = redeemableBalance1.minus(amountLent1);
            if (setState){
              this.setState({
                earnings:earnings.toString()
              });
            }
            return earnings;
          }
        break;
        case 'pool':
          const tokenAllocation = await this.functionsUtil.getTokenAllocation(this.props.tokenConfig);
          if (tokenAllocation && tokenAllocation.totalAllocation){
            if (setState){
              this.setState({
                poolSize:tokenAllocation.totalAllocation.toString()
              })
            }
            return tokenAllocation.totalAllocation;
          }
        break;
        case 'earningsPerc':
          const [amountLent2,redeemableBalance2] = await Promise.all([
            this.loadField('amountLent'),
            this.loadField('redeemableBalance')
          ]);
          if (amountLent2 && redeemableBalance2){
            const earningsPerc = redeemableBalance2.div(amountLent2).minus(1).times(100);
            if (setState){
              this.setState({
                earningsPerc:parseFloat(earningsPerc).toFixed(3),
                earningsPercDirection:parseFloat(earningsPerc)>0 ? 'up' : 'down'
              });
            }
          }
        break;
        case 'apr':
          tokenAprs = await this.functionsUtil.getTokenAprs(this.props.tokenConfig);
          if (tokenAprs && tokenAprs.avgApr !== null){
            const tokenAPR = tokenAprs.avgApr;
            if (setState){
              this.setState({
                tokenAPR:parseFloat(tokenAPR).toFixed(3)
              });
            }
            return tokenAPR;
          }
        break;
        case 'apy':
          const tokenAPR = await this.loadField('apr');
          if (tokenAPR){
            const tokenAPY = this.functionsUtil.apr2apy(tokenAPR.div(100)).times(100);
            if (setState){
              this.setState({
                tokenAPR:parseFloat(tokenAPR).toFixed(3),
                tokenAPY:parseFloat(tokenAPY).toFixed(3)
              });
            }
            return tokenAPY;
          }
        break;
        default:

        break;
      }
    }
    return null;
  }

  render(){
    const fieldInfo = this.props.fieldInfo;
    let output = null;

    const loader = (<Loader size="20px" />);

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
          <SmartNumber {...fieldInfo.props} minPrecision={4} number={this.state.tokenBalance} />
        ) : loader
      break;
      case 'idleTokenBalance':
        output = this.state.idleTokenBalance ? (
          <SmartNumber {...fieldInfo.props} minPrecision={4} number={this.state.idleTokenBalance} />
        ) : loader
      break;
      case 'redeemableBalance':
        output = this.state.redeemableBalance ? (
          <SmartNumber {...fieldInfo.props} minPrecision={4} number={this.state.redeemableBalance} />
        ) : loader
      break;
      case 'amountLent':
        output = this.state.amountLent ? (
          <SmartNumber {...fieldInfo.props} minPrecision={4} number={this.state.amountLent} />
        ) : loader
      break;
      case 'pool':
        output = this.state.poolSize ? (
          <SmartNumber {...fieldInfo.props} minPrecision={4} number={this.state.poolSize} />
        ) : loader
      break;
      case 'earningsPerc':
        output = this.state.earningsPerc ? (
          <VariationNumber direction={this.state.earningsPercDirection}>
            <Text {...fieldInfo.props}>{this.state.earningsPerc}%</Text>
          </VariationNumber>
        ) : loader
      break;
      case 'apr':
        output = this.state.tokenAPR ? (
          <Text {...fieldInfo.props}>{this.state.tokenAPR}%</Text>
        ) : loader
      break;
      case 'apy':
        output = this.state.tokenAPY ? (
          <Text {...fieldInfo.props}>{this.state.tokenAPY}%</Text>
        ) : loader
      break;
      case 'button':
        output = (
          <Button {...fieldInfo.props}>{fieldInfo.label}</Button>
        );
      break;
      default:
      break;
    }
    return output;
  }
}

export default AssetField;
