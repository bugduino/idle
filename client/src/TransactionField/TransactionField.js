import React, { Component } from 'react';
import SmartNumber from '../SmartNumber/SmartNumber';
import { Flex, Text, Icon, Link, Image } from "rimble-ui";
import FunctionsUtil from '../utilities/FunctionsUtil';
import ShortHash from "../utilities/components/ShortHash";

class TransactionField extends Component {

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

    const hashChanged = prevProps.hash !== this.props.hash;
    const accountChanged = prevProps.account !== this.props.account;
    const fieldChanged = prevProps.fieldInfo.name !== this.props.fieldInfo.name;
    if (fieldChanged || hashChanged || accountChanged){
      this.loadField();
    }
  }

  async loadField(){
    const fieldInfo = this.props.fieldInfo;
    if (this.props.hash && this.props.account){
      switch (fieldInfo.name){
        case 'icon':
        break;
        case 'hash':
          
        break;
        case 'action':
          
        break;
        case 'date':
        break;
        case 'status':
        break;
        case 'amount':
        break;
        case 'asset':
        break;
        default:
        break;
      }
    }
  }

  render(){
    let icon = null;
    let color = null;
    let output = null;
    let bgColor = null;
    const fieldInfo = this.props.fieldInfo;
    const transaction = this.props.transaction;
    switch (fieldInfo.name){
      case 'icon':
        switch (transaction.action) {
          case 'Deposit':
            color = '#3d53c0';
            icon = "ArrowForward";
            bgColor = '#ced6ff';
          break;
          case 'Redeem':
            color = '#10a0dd';
            icon = "ArrowBack";
            bgColor = '#ceeff6';
          break;
          case 'Send':
            color = '#4f4f4f';
            icon = "Send";
            bgColor = '#dadada';
          break;
          case 'Receive':
            color = '#4f4f4f';
            icon = "Redo";
            bgColor = '#dadada';
          break;
          case 'Migrate':
            color = '#4f4f4f';
            icon = "Sync";
            bgColor = '#dadada';
          break;
          case 'Swap':
            color = '#4f4f4f';
            icon = "SwapHoriz";
            bgColor = '#dadada';
          break;
          default:
            color = '#4f4f4f';
            icon = "Refresh";
            bgColor = '#dadada';
          break;
        }
        output = (
          <Flex
            p={'5px'}
            borderRadius={'50%'}
            {...fieldInfo.props}
            alignItems={'center'}
            backgroundColor={bgColor}
            justifyContent={'center'}
          >
            <Icon
              align={'center'}
              name={ icon }
              color={ color }
              size={"1.2em"}
            />
          </Flex>
        );
      break;
      case 'hash':
        output = (
          <Link
            href={`https://etherscan.io/tx/${transaction.hash}`}
            target={'_blank'}
            rel="nofollow noopener noreferrer"
          >
            <ShortHash
              fontSize={1}
              color={'white'}
              {...fieldInfo.props}
              hash={transaction.hash}
            />
          </Link>
        );
      break;
      case 'action':
        output = (
          <Text {...fieldInfo.props}>{transaction.action.toUpperCase()}</Text>
        );
      break;
      case 'date':
        const formattedDate = transaction.momentDate.format('DD MMM, YYYY');
        output = (
          <Text {...fieldInfo.props}>{formattedDate}</Text>
        );
      break;
      case 'statusIcon':
        switch (transaction.status) {
          case 'Completed':
            color = '#4cde8a';
            icon = "Done";
          break;
          case 'Pending':
            color = '#dadada';
            icon = "Timelapse";
          break;
          case 'Failed':
            color = '#e26924';
            icon = "ErrorOutline";
          break;
          default:
          break;
        }
        output = (
          <Flex
            p={'1px'}
            borderRadius={'50%'}
            {...fieldInfo.props}
            alignItems={'center'}
            border={`2px solid ${color}`}
            justifyContent={'center'}
          >
            <Icon
              align={'center'}
              name={ icon }
              color={ color }
              size={"1.2em"}
            />
          </Flex>
        );
      break;
      case 'status':
        output = (
          <Text {...fieldInfo.props}>{transaction.status}</Text>
        );
      break;
      case 'amount':
        output = (
          <SmartNumber {...fieldInfo.props} number={transaction.amount} />
        );
      break;
      case 'tokenIcon':
        output = (
          <Image src={`images/tokens/${transaction.tokenSymbol}.svg`} {...fieldInfo.props} />
        );
      break;
      case 'tokenName':
        output = (
          <Text {...fieldInfo.props}>{transaction.tokenSymbol}</Text>
        );
      break;
      default:
      break;
    }
    return output;
  }
}

export default TransactionField;
