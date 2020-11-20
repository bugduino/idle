import React, { Component } from 'react';
import { Flex, Text, Link, Icon } from "rimble-ui";
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';

class AuditCard extends Component {

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
          my:[2,0],
          mx:[0,3],
          width:[1,'auto']
        }}
        isInteractive={this.props.link ? true : false}
        handleClick={this.props.link ? e => window.open(this.props.link) : null}
      >
        <Flex
          flexDirection={'column'}
        >
          <Text
            mb={2}
            color={'blue'}
            fontSize={[1,3]}
          >
            {this.props.date}
          </Text>
          <Text
            mb={2}
            fontSize={4}
            fontWeight={500}
          >
            {this.props.title}
          </Text>
          <Link
            hoverColor={'blue'}
            style={{
              display:'flex',
              borderRadius:'8px',
              flexDirection:'row',
              alignItems:'center'
            }}
          >
            VIEW REPORT
            <Icon
              ml={1}
              size={'1.3em'}
              color={'blue'}
              style={{
                transform:'rotate(180deg)'
              }}
              name={'KeyboardBackspace'}
            />
          </Link>
        </Flex>
      </DashboardCard>
    );
  }
}

export default AuditCard;
