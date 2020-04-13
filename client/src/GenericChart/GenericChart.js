import React, { Component } from 'react';
import { Loader, Flex, Text } from 'rimble-ui';

class GenericChart extends Component {
  state = {};

  render() {
    const ChartType = this.props.type;

    return this.props.showLoader && (!this.props.data || !this.props.width || !this.props.height) ? (
      <Flex
        width={1}
        alignItems={'center'}
        flexDirection={'column'}
        justifyContent={'center'}
        height={this.props.height}
      >
        <Loader size="30px" mb={2} /> <Text ml={2}>Loading graph data...</Text>
      </Flex>
    ) : this.props.data && (
      <ChartType
        {...this.props}
      />
    )
  }
}

export default GenericChart;