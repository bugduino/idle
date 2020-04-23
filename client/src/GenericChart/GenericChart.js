import React, { Component } from 'react';
import { Loader, Flex, Text } from 'rimble-ui';

class GenericChart extends Component {
  state = {
    width:null,
    height:null
  };

  componentWillMount() {
    window.addEventListener('resize', this.handleWindowSizeChange.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowSizeChange);
  }

  componentDidMount(){
    this.handleWindowSizeChange();
  }

  handleWindowSizeChange(){
    const newState = {...this.state};

    if (this.props.parentId){
      const chartContainer = document.getElementById(this.props.parentId);
      if (chartContainer){
        const chartWidth = parseFloat(chartContainer.offsetWidth)>0 ? chartContainer.offsetWidth : 0;
        if (chartWidth && chartWidth !== newState.width){
          newState.width = chartWidth;
        }
      }
    }

    if (!newState.width && this.props.width && this.props.width !== newState.width) {
      newState.width = this.props.width;
    }

    if (this.props.parentIdHeight){
      const chartContainerH = document.getElementById(this.props.parentIdHeight);
      if (chartContainerH){
        const chartHeight = parseFloat(chartContainerH.offsetWidth)>0 ? chartContainerH.offsetWidth : 0;
        if (chartHeight && chartHeight !== newState.height){
          newState.height = chartHeight;
        }
      }
    }

    if (!newState.height && this.props.height && this.props.height !== newState.height) {
      newState.height = this.props.height;
    }

    if (Object.keys(newState).length>0){
      this.setState(newState);
    }
  };

  render() {
    const ChartType = this.props.type;

    const height = this.state.height && !isNaN(this.state.height) ? parseInt(this.state.height) : 350;
    const width = this.state.width && !isNaN(this.state.width) ? parseInt(this.state.width) : 0;

    let chartProps = Object.assign({},this.props);
    chartProps = {
      ...chartProps,
      height,
      width
    }

    // console.log(this.props.parentId,width,height);

    return chartProps.showLoader && (!chartProps.data || !width || !height) ? (
      <Flex
        width={1}
        alignItems={'center'}
        flexDirection={'column'}
        justifyContent={'center'}
        height={height}
      >
        <Loader size="30px" mb={2} /> <Text ml={2}>Loading graph data...</Text>
      </Flex>
    ) : this.props.data && (
      <ChartType
        {...chartProps}
      />
    )
  }
}

export default GenericChart;