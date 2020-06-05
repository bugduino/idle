/*
Theming: https://github.com/plouc/nivo/issues/308
*/
import React, { Component } from 'react';
import FlexLoader from '../FlexLoader/FlexLoader';

class GenericChart extends Component {
  state = {
    width:null,
    height:null
  };

  componentUnmounted = false;

  componentWillMount() {
    window.addEventListener('resize', this.handleWindowSizeChange.bind(this));
  }

  componentWillUnmount() {
    this.componentUnmounted = true;
    window.removeEventListener('resize', this.handleWindowSizeChange);
  }

  componentDidMount(){
    this.handleWindowSizeChange();
  }

  componentDidUpdate(prevProps){
    if (prevProps.isMobile !== this.props.isMobile){
      this.handleWindowSizeChange();
    }
  }

  handleWindowSizeChange(){
    if (this.componentUnmounted){
      return false;
    }

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

    return chartProps.showLoader && (!chartProps.data || !width || !height) ? (
      <FlexLoader
        flexProps={{
          flexDirection:'row',
          minHeight:height
        }}
        loaderProps={ this.props.loaderProps ? this.props.loaderProps : {
          size:'30px'
        }}
        textProps={{
          ml:2
        }}
        text={ this.props.loaderText !== undefined ? this.props.loaderText : 'Loading graph data...'}
      />
    ) : this.props.data && (
      <ChartType
        {...chartProps}
      />
    )
  }
}

export default GenericChart;