import React, { Component } from 'react';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';
import { Flex, Heading, Text, Tooltip, Icon } from "rimble-ui";

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
          minHeight:this.props.minHeight ? this.props.minHeight : ['130px','153px']
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
            minHeight={ this.props.titleMinHeight ? this.props.titleMinHeight : ['auto','60px'] }
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
            (typeof this.props.value !== 'undefined' && this.props.value !== null && this.props.value.toString().length>0) &&
              <Text
                lineHeight={1}
                fontSize={[4,5]}
                fontWeight={[3,4]}
                color={'statValue'}
                {...this.props.valueProps}
              >
                {this.props.value}
              </Text>
          }
          {
            this.props.children ?
              this.props.children
            : null
          }
          {
            (typeof this.props.label !== 'undefined' && this.props.label !== null && this.props.label.toString().length>0) && (
              <Flex
                mt={[3,2]}
                alignItems={'center'}
                flexDirection={'row'}
              >
                <Text
                  fontSize={1}
                  fontWeight={3}
                  color={'legend'}
                >
                  {this.props.label}
                </Text>
                {
                  (this.props.labelTooltip && this.props.labelTooltip.length>0) && (
                    <Tooltip
                      placement={'top'}
                      message={this.props.labelTooltip}
                    >
                      <Icon
                        ml={2}
                        name={"Info"}
                        size={'1em'}
                        color={'cellTitle'}
                      />
                    </Tooltip>
                  )
                }
              </Flex>
            )
          }
        </Flex>
      </DashboardCard>
    );
  }
}

export default StatsCard;