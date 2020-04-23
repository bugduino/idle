import theme from '../theme';
import { Flex, Heading } from "rimble-ui";
import Title from '../Title/Title';
import React, { Component } from 'react';
import AssetField from '../AssetField/AssetField';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';
import PortfolioEquity from '../PortfolioEquity/PortfolioEquity';

class FundsOverview extends Component {

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
      <Flex
        id="funds-overview"
        width={1}
        flexDirection={'column'}
      >
        <DashboardCard
          cardProps={{
            px:2,
            py:3
          }}
        >
          <Flex
            width={1}
          >
            <PortfolioEquity
              {...this.props}
              chartHeight={350}
              parentId={'funds-overview'}
              chartToken={this.props.selectedToken}
              enabledTokens={[this.props.selectedToken]}
              frequencySeconds={this.functionsUtil.getFrequencySeconds('day',1)}
            />
          </Flex>
          <Flex
            width={1}
            flexDirection={['column','row']}
          >
            <Flex
              width={[0.5,0.25]}
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={'flex-start'}
            >
              <Title
                mb={2}
                fontSize={[3,4]}
                component={Heading.h3}
              >
                Deposited Funds
              </Title>
              <AssetField
                {...this.props}
                token={this.props.selectedToken}
                fieldInfo={{
                  name:'amountLent',
                  props:{
                    decimals:6,
                    fontSize:'2.3em',
                    fontWeight:300,
                    color:theme.colors.counter
                  }
                }}
              />
            </Flex>
            <Flex
              width={[0.5,0.25]}
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={'flex-start'}
            >
              <Title
                mb={2}
                fontSize={[3,4]}
                component={Heading.h3}
              >
                Redeemable Funds
              </Title>
              <AssetField
                {...this.props}
                token={this.props.selectedToken}
                fieldInfo={{
                  name:'redeemableBalanceCounter',
                  decimals:6,
                  props:{
                    style:{
                      fontSize:'2.3em',
                      fontWeight:300,
                      color:theme.colors.counter
                    }
                  }
                }}
              />
              <AssetField
                {...this.props}
                token={this.props.selectedToken}
                fieldInfo={{
                  name:'earningsPerc',
                  props:{
                    fontSize:1,
                    fontWeight:2,
                    color:'cellText'
                  }
                }}
              />
            </Flex>
            <Flex
              width={[0.5,0.25]}
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={'flex-start'}
            >
              <Title
                mb={2}
                fontSize={[3,4]}
                component={Heading.h3}
              >
                Total Earned
              </Title>
              <AssetField
                {...this.props}
                token={this.props.selectedToken}
                fieldInfo={{
                  name:'earningsCounter',
                  decimals:6,
                  props:{
                    style:{
                      fontSize:'2.3em',
                      fontWeight:300,
                      color:theme.colors.counter
                    }
                  }
                }}
              />
            </Flex>
            <Flex
              width={[0.5,0.25]}
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={'flex-start'}
            >
              <Title
                mb={2}
                fontSize={[3,4]}
                component={Heading.h3}
              >
                Current APY
              </Title>
              <AssetField
                {...this.props}
                token={this.props.selectedToken}
                fieldInfo={{
                  name:'apy',
                  props:{
                    decimals:2,
                    fontSize:'2.3em',
                    fontWeight:300,
                    color:theme.colors.counter
                  }
                }}
              />
            </Flex>
          </Flex>
        </DashboardCard>
      </Flex>
    );
  }
}

export default FundsOverview;