import React, { Component } from 'react';
import { Flex, Loader, Text } from "rimble-ui";

class FlexLoader extends Component {
  render() {
    return (
      <Flex
        width={1}
        alignItems={'center'}
        justifyContent={'center'}
        {...this.props.flexProps}
      >
        <Loader {...this.props.loaderProps} />
        {
          this.props.text &&
            <Text {...this.props.textProps}>{this.props.text}</Text>
        }
      </Flex>
    );
  }
}

export default FlexLoader;
