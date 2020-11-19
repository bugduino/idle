import React, { Component } from 'react';
import { Flex, Text, Icon } from "rimble-ui";
import SmartNumber from '../../SmartNumber/SmartNumber';
import FunctionsUtil from '../../utilities/FunctionsUtil';

class ProposalField extends Component {

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
    let icon = null;
    let color = null;
    let output = null;
    const fieldInfo = this.props.fieldInfo;
    const proposal = Object.assign({},this.props.proposal);

    const fieldProps = {
      fontWeight:3,
      fontSize:[0,2],
      color:'cellText',
      style:{
        maxWidth:'100%',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
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
      case 'date':
        const formattedDate = this.functionsUtil.strToMoment(proposal.timestamp*1000).format('DD MMM, YYYY');
        output = (
          <Text {...fieldProps}>{formattedDate}</Text>
        );
      break;
      case 'statusIcon':
        const state = fieldInfo.state ? fieldInfo.state : proposal.state;
        switch (state) {
          case 'Pending':
            icon = "HourglassEmpty";
            color = '#a5a5a5';
          break;
          case 'Active':
            icon = "Adjust";
            color = '#a5a5a5';
          break;
          case 'Canceled':
            icon = "Cancel";
            color = '#fa0000';
          break;
          case 'Defeated':
            icon = "Block";
            color = '#fa0000';
          break;
          case 'Succeeded':
            icon = "Done";
            color = '#00b84a';
          break;
          case 'Queued':
            icon = "Timelapse";
            color = '#ff9900';
          break;
          case 'Expired':
            icon = "ErrorOutline";
            color = '#a5a5a5';
          break;
          case 'Executed':
            icon = "CheckCircle";
            color = '#00b84a';
          break;
          default:
          break;
        }
        output = (
          <Flex
            {...fieldProps}
            alignItems={'center'}
            justifyContent={'center'}
          >
            <Icon
              name={icon}
              color={color}
              align={'center'}
              size={ fieldProps.size ? fieldProps.size : (this.props.isMobile ? '1em' : '1.8em') }
            />
          </Flex>
        );
      break;
      case 'id':
        output = (
          <Text {...fieldProps}>{proposal.id}</Text>
        );
      break;
      case 'title':
        output = (
          <Text {...fieldProps}>{proposal.title}</Text>
        );
      break;
      case 'votes':
        const forVotes = this.functionsUtil.BNify(proposal.forVotes).div(1e18);
        const againstVotes = this.functionsUtil.BNify(proposal.againstVotes).div(1e18);
        const totalVotes = forVotes.plus(againstVotes);
        output = (
          <Text {...fieldProps}>{this.functionsUtil.formatMoney(totalVotes.toFixed(0,1),0)}</Text>
        );
      break;
      case 'status':
        output = (
          <Text {...fieldProps}>{proposal.state}</Text>
        );
      break;
      case 'support':
        let support = null;
        if (this.props.delegate){
          const delegate = this.props.delegate.delegate.toLowerCase();
          const vote = proposal.votes.find( v => (v.voter.toLowerCase() === delegate) );
          if (vote){
            support = vote.support;
          }
        }
        output = (
          <Text {...fieldProps}>{ support === null ? 'NONE' : (support ? 'FOR' : 'AGAINST') }</Text>
        );
      break;
      case 'forVotes':
        output = (
          <SmartNumber {...fieldProps} number={proposal.forVotes} />
        );
      break;
      case 'againstVotes':
        output = (
          <SmartNumber {...fieldProps} number={proposal.againstVotes} />
        );
      break;
      default:
      break;
    }
    return output;
  }
}

export default ProposalField;
