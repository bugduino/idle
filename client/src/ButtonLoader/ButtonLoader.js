import React, { Component } from 'react';
import {
  Flex,
  Button
} from "rimble-ui";
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner.js';

class ButtonLoader extends Component {
  render() {
    return (
       <Button
        onClick={this.props.handleClick}
         {...this.props.buttonProps}
       >
        <Flex flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
          <Flex width={1} display={ this.props.isLoading ? 'flex' : 'none' }>
            <LoadingSpinner />
          </Flex>
          <Flex width={1} display={ this.props.isLoading ? 'none' : 'flex' }>
            {this.props.buttonText}
          </Flex>
        </Flex>
       </Button>
    );
  }
}

export default ButtonLoader;
