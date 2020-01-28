import React, { Component } from 'react';
import {
  Flex,
  Button
} from "rimble-ui";
import LottieGif from '../LottieGif/LottieGif.js';

class ButtonLoader extends Component {

  render() {
    return (
       <Button
         {...this.props.buttonProps}
       >
        <Flex flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
          <Flex width={1} display={ this.props.isLoading ? 'flex' : 'none' }>
            <LottieGif src={this.props.loaderSrc} width={this.props.loaderWidth} height={this.props.loaderHeight} />
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
