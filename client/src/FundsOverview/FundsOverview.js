import theme from '../theme';
import Title from '../Title/Title';
import React, { Component } from 'react';
import { Flex, Heading, Text } from "rimble-ui";
import AssetField from '../AssetField/AssetField';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';
import PortfolioEquity from '../PortfolioEquity/PortfolioEquity';

class FundsOverview extends Component {

  state = {
    aggregatedValues:[]
  };

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

  async componentDidMount(){

    const [avgAPY,days] = await Promise.all([
      this.functionsUtil.loadAssetField('avgAPY',this.props.selectedToken,this.props.tokenConfig,this.props.account),
      this.functionsUtil.loadAssetField('daysFirstDeposit',this.props.selectedToken,this.props.tokenConfig,this.props.account),
    ]);

    const aggregatedValues = [
      {
        flexProps:{
          width:[1,0.32],
        },
        props:{
          title:'Avg APY',
          children:(
            <Flex
              width={1}
              alignItems={'center'}
              height={['55px','59px']}
              flexDirection={'column'}
              justifyContent={'center'}
            >
              <Text
                lineHeight={1}
                fontWeight={[3,4]}
                color={'copyColor'}
                fontFamily={'counter'}
                fontSize={['1.7em','1.7em']}
                dangerouslySetInnerHTML={{ __html: (avgAPY ? avgAPY.toFixed(2)+'%' : '-') }}
              />
            </Flex>
          )
        }
      },
      {
        flexProps:{
          width:[1,0.32],
        },
        props:{
          title:'Current Allocation',
          children:(
            <Flex
              width={1}
              id={'allocationChart'}
              height={['55px','59px']}
              flexDirection={'column'}
            >
              <AssetField
                {...this.props}
                showLoader={true}
                fieldInfo={{
                  name:'allocationChart'
                }}
                parentId={'allocationChart'}
                token={this.props.selectedToken}
                tokenConfig={this.props.tokenConfig}
              />
            </Flex>
          ),
          label:'',
        }
      },
      {
        flexProps:{
          width:[1,0.32],
        },
        props:{
          title:'Days since first deposit',
          children:(
            <Flex
              width={1}
              alignItems={'center'}
              height={['55px','59px']}
              flexDirection={'column'}
              justifyContent={'center'}
            >
              <Text
                lineHeight={1}
                fontWeight={[3,4]}
                color={'copyColor'}
                fontFamily={'counter'}
                fontSize={['1.7em','1.7em']}
                dangerouslySetInnerHTML={{ __html: (days ? parseInt(days) : '-') }}
              />
            </Flex>
          )
        }
      }
    ];

    this.setState({
      aggregatedValues
    });
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
  }

  render() {
    return (
      <Flex
        width={1}
        id={"funds-overview"}
        flexDirection={'column'}
      >
        {
          this.state.aggregatedValues.length>0 && 
            <Flex
              width={1}
              mb={[0,3]}
              mt={[2,0]}
              alignItems={'center'}
              flexDirection={['column','row']}
              justifyContent={'space-between'}
            >
              {
                this.state.aggregatedValues.map((v,i) => (
                  <Flex
                    {...v.flexProps}
                    flexDirection={'column'}
                    key={`aggregatedValue_${i}`}
                  >
                    <DashboardCard
                      cardProps={{
                        py:[2,3],
                        mb:[3,0]
                      }}
                    >
                      <Flex
                        width={1}
                        alignItems={'center'}
                        flexDirection={'column'}
                        justifyContent={'center'}
                      >
                        {
                          v.props.children ? v.props.children : (
                            <Text
                              lineHeight={1}
                              fontWeight={[3,4]}
                              color={'copyColor'}
                              fontFamily={'counter'}
                              fontSize={[4,'1.7em']}
                              dangerouslySetInnerHTML={{ __html: v.props.value }}
                            >
                            </Text>
                          )
                        }
                        <Text
                          mt={2}
                          fontWeight={2}
                          fontSize={[1,2]}
                          color={'cellText'}
                        >
                          {v.props.title}
                        </Text>
                      </Flex>
                    </DashboardCard>
                  </Flex>
                ))
              }
            </Flex>
        }
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
                    decimals:4,
                    maxPrecision:8,
                    fontWeight:300,
                    fontSize:['1.8em','2.2em'],
                    color:theme.colors.counter,
                    flexProps:{
                      justifyContent:'center'
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
                Redeemable
              </Title>
              <AssetField
                {...this.props}
                token={this.props.selectedToken}
                fieldInfo={{
                  name:'redeemableBalanceCounter',
                  props:{
                    decimals:7,
                    maxPrecision:8,
                    style:{
                      fontWeight:300,
                      fontSize: this.props.isMobile ? '1.8em' : '2.2em',
                      color:theme.colors.counter
                    },
                    flexProps:{
                      justifyContent:'center'
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
                    color:'cellText',
                    flexProps:{
                      justifyContent:'center'
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
                Earnings
              </Title>
              <AssetField
                {...this.props}
                token={this.props.selectedToken}
                fieldInfo={{
                  name:'earningsCounter',
                  props:{
                    decimals:7,
                    maxPrecision:8,
                    style:{
                      fontWeight:300,
                      fontSize:this.props.isMobile ? '1.8em' : '2.2em',
                      color:theme.colors.counter
                    },
                    flexProps:{
                      justifyContent:'center'
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
                    fontSize:['1.8em','2.2em'],
                    color:theme.colors.counter,
                    flexProps:{
                      justifyContent:'center'
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
                    fontSize:['1.8em','2.2em'],
                    color:theme.colors.counter,
                    flexProps:{
                      justifyContent:'center'
                    }
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