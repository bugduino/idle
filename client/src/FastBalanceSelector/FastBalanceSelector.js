import { Text } from "rimble-ui";
import React, { Component } from 'react';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';

class FastBalanceSelector extends Component {

  // Utils
  functionsUtil = null;

  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  async componentWillMount(){
    this.loadUtils();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
  }

  render() {
    return (
      <DashboardCard
        cardProps={{
          p:2,
          width:0.23,
          onMouseDown:this.props.onMouseDown
        }}
        isInteractive={true}
        isActive={this.props.isActive}
      >
        <Text 
          fontSize={2}
          fontWeight={3}
          textAlign={'center'}
          color={this.props.isActive ? 'copyColor' : 'legend'}
        >
          {this.props.percentage}%
        </Text>
      </DashboardCard>
    );
  }
}

export default FastBalanceSelector;