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

    let cardProps = {
      p:2,
      width:0.23,
      onMouseDown:this.props.onMouseDown
    };

    let textProps = {
      fontSize:2,
      fontWeight:3,
      textAlign:'center',
      color:this.props.isActive ? 'copyColor' : 'legend'
    }

    cardProps = this.functionsUtil.replaceArrayProps(cardProps,this.props.cardProps);
    textProps = this.functionsUtil.replaceArrayProps(textProps,this.props.textProps);

    return (
      <DashboardCard
        isInteractive={true}
        cardProps={cardProps}
        isActive={this.props.isActive}
      >
        <Text 
          {...textProps}
        >
          {this.props.percentage}%
        </Text>
      </DashboardCard>
    );
  }
}

export default FastBalanceSelector;