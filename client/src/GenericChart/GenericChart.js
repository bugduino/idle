import React, { Component } from 'react';
import { Loader, Flex, Text } from 'rimble-ui';

class GenericChart extends Component {
  state = {};

  render() {
    const ChartType = this.props.type;

    return this.props.showLoader && !this.props.data ? (
      <Flex
        width={1}
        alignItems={'center'}
        flexDirection={'column'}
        justifyContent={'center'}
        height={this.props.height}
      >
        <Loader size="30px" /> <Text ml={2}>Loading graph data...</Text>
      </Flex>
    ) : this.props.data && (
      <ChartType
        {...this.props}
      />
    )
  }
}

export default GenericChart;