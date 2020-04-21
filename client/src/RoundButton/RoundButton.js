import { Button } from "rimble-ui";
import React, { Component } from 'react';

class RoundButton extends Component {
  render() {
    const buttonProps = Object.assign({
      width:1,
      fontSize:3,
      fontWeight:3,
      height:'45px',
      borderRadius:4,
      boxShadow:null,
      mainColor:'primary'
    },this.props.buttonProps);

    return (
       <Button
        {...buttonProps}
        onClick={this.props.handleClick}
       >
        {this.props.children}
       </Button>
    );
  }
}

export default RoundButton;
