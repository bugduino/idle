import { Flex, Text } from "rimble-ui";
import React, { Component } from 'react';
import DashboardCard from '../DashboardCard/DashboardCard';

class ChartCustomTooltip extends Component {

  async componentWillMount(){

  }

  async componentDidUpdate(prevProps,prevState){
    
  }

  render() {
    return (
      <DashboardCard
        key={this.props.point.id}
        cardProps={{
          py:2,
          px:3,
          width:1,
          left: this.props.point.data.itemPos && this.props.point.data.itemPos>50 ? '-110%' : '0'
        }}
      >
        <Flex
          width={1}
          flexDirection={'column'}
        >
          {
            this.props.point.data.xFormatted && 
              <Text
                mb={2}
                fontSize={1}
                fontWeight={3}
                color={'cellText'}
                textAlign={'left'}
              >
                {this.props.point.data.xFormatted}
              </Text>
          }
          {this.props.children}
        </Flex>
      </DashboardCard>
    );
  }
}

export default ChartCustomTooltip;
