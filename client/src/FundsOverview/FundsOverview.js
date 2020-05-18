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
              mb={[2,0]}
              width={[1,0.2]}
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={'flex-start'}
            >
              <Title
                mb={2}
                fontSize={[3,4]}
                component={Heading.h3}
              >
                Deposited
              </Title>
              <AssetField
                {...this.props}
                token={this.props.selectedToken}
                fieldInfo={{
                  name:'amountLent',
                  props:{
                    decimals:6,
                    fontWeight:300,
                    fontSize:['1.8em','2.3em'],
                    color:theme.colors.counter
                  }
                }}
              />
            </Flex>
            <Flex
              mb={[2,0]}
              width={[1,0.2]}
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={'flex-start'}
            >
              <Title
                mb={2}
                fontSize={[3,4]}
                component={Heading.h3}
              >
                Redeemable
              </Title>
              <AssetField
                {...this.props}
                token={this.props.selectedToken}
                fieldInfo={{
                  name:'redeemableBalanceCounter',
                  decimals:6,
                  props:{
                    style:{
                      fontWeight:300,
                      fontSize: this.props.isMobile ? '1.8em' : '2.3em',
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
              mb={[2,0]}
              width={[1,0.2]}
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={'flex-start'}
            >
              <Title
                mb={2}
                fontSize={[3,4]}
                component={Heading.h3}
              >
                Earnings
              </Title>
              <AssetField
                {...this.props}
                token={this.props.selectedToken}
                fieldInfo={{
                  name:'earningsCounter',
                  decimals:6,
                  props:{
                    style:{
                      fontWeight:300,
                      fontSize:this.props.isMobile ? '1.8em' : '2.3em',
                      color:theme.colors.counter
                    }
                  }
                }}
              />
            </Flex>
            <Flex
              mb={[2,0]}
              width={[1,0.2]}
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
                    fontWeight:300,
                    fontSize:['1.8em','2.3em'],
                    color:theme.colors.counter
                  }
                }}
              />
            </Flex>
            <Flex
              mb={[2,0]}
              width={[1,0.2]}
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={'flex-start'}
            >
              <Title
                mb={2}
                fontSize={[3,4]}
                component={Heading.h3}
              >
                Risk Score
              </Title>
              <AssetField
                {...this.props}
                token={this.props.selectedToken}
                fieldInfo={{
                  name:'score',
                  props:{
                    decimals:1,
                    fontWeight:300,
                    fontSize:['1.8em','2.3em'],
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