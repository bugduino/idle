import { Icon } from "rimble-ui";
import React, { Component } from 'react';
import RoundButton from '../RoundButton/RoundButton';

class RoundIconButton extends Component {
  render() {
    const buttonProps = Object.assign({
      p:0,
      boxShadow:1,
      width:'40px',
      height:'40px',
      mainColor:'white',
      borderRadius:'50%',
      disabled:this.props.disabled
    },this.props.buttonProps);

    buttonProps.minWidth = buttonProps.width;

    return (
       <RoundButton
         buttonProps={buttonProps}
         handleClick={this.props.handleClick}
       >
         <Icon
           color={'copyColor'}
           name={this.props.iconName}
           size={ this.props.iconSize ? this.props.iconSize : '1.3em'}
         />
       </RoundButton>
    );
  }
}

export default RoundIconButton;