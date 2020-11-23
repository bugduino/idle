import React, { Component } from 'react';
import { Flex, Icon, Text } from "rimble-ui";
import RoundButton from '../RoundButton/RoundButton';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';

class ConnectBox extends Component {

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
          mt:3
        }}
      >
        <Flex
          alignItems={'center'}
          flexDirection={'column'}
        >
          <Icon
            size={'1.8em'}
            name={'Input'}
            color={'cellText'}
          />
          <Text
            mt={2}
            fontSize={2}
            color={'cellText'}
            textAlign={'center'}
          >
            Please connect with your wallet interact with Idle.
          </Text>
          <RoundButton
            buttonProps={{
              mt:2,
              width:[1,1/2]
            }}
            handleClick={this.props.connectAndValidateAccount}
          >
            Connect
          </RoundButton>
        </Flex>
      </DashboardCard>
    );
  }
}

export default ConnectBox;
