import React, { Component } from 'react';
import { Flex, Heading, Text } from "rimble-ui";
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';

class StatsCard extends Component {

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
          p:3,
          minHeight:['130px','153px']
        }}
      >
        <Flex
          width={1}
          alignItems={'flex-start'}
          flexDirection={'column'}
          justifyContent={'flex-start'}
        >
          <Flex
            alignItems={'flex-start'}
            minHeight={['auto','60px']}
          >
            <Heading.h4
              mb={[3,0]}
              fontWeight={4}
              fontSize={[2,3]}
              textAlign={'left'}
              color={'dark-gray'}
              lineHeight={'initial'}
            >
              {this.props.title}
            </Heading.h4>
          </Flex>
          {
            (this.props.value && this.props.value.toString().length>0) &&
              <Text
                lineHeight={1}
                fontSize={[4,5]}
                fontWeight={[3,4]}
                color={'statValue'}
              >
                {this.props.value}
              </Text>
          }
          {this.props.children ? this.props.children : null}
          {
            (this.props.label && this.props.label.toString().length>0) && 
              <Text
                mt={2}
                fontSize={1}
                fontWeight={3}
                color={'legend'}
              >
                {this.props.label}
              </Text>
          }
        </Flex>
      </DashboardCard>
    );
  }
}

export default StatsCard;