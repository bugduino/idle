import React, { Component } from 'react';
import {
  Input,
  Tooltip
} from "rimble-ui";
import FunctionsUtil from '../utilities/FunctionsUtil';
import style from './ReferralCode.module.scss';

class ReferralCode extends Component {

  state = {
    elementId:'referralCode_'+new Date().getTime(),
    tooltipText:'Click to copy'
  };

  functionsUtil = new FunctionsUtil();

  copyToClipboard = () => {
    const element = document.getElementById(this.state.elementId);
    const res =this.functionsUtil.copyToClipboard(element);
    if (res){
      this.setState({
        tooltipText:'Copied!'
      });
    }
  }

  render() {
    return (
      <Tooltip message={this.state.tooltipText} placement={"top"}>
        <Input id={this.state.elementId} type={'text'} color={'blue'} fontSize={2} fontWeight={3} className={style.referralCodeContainer} onClick={ e => { this.copyToClipboard() } } value={this.props.code} readOnly={true} {...this.props} />
      </Tooltip>
    );
  }
}

export default ReferralCode;
