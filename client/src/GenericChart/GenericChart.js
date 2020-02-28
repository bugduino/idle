import React, { Component } from 'react';

class GenericChart extends Component {
  state = {};

  render() {

    const ChartType = this.props.type;

    return (
      <ChartType
        {...this.props}
      />
    );
  }
}

export default GenericChart;