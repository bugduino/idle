import theme from '../theme';
import Title from '../Title/Title';
import React, { Component } from 'react';
import { Flex, Heading, Text } from "rimble-ui";
import AssetField from '../AssetField/AssetField';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';
import PortfolioEquityCurve from '../PortfolioEquityCurve/PortfolioEquityCurve';

class FundsOverviewCurve extends Component {

  state = {
    compAPR:null,
    aggregatedValues:[],
    govTokensUserBalance:null
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

    await this.functionsUtil.getCurveAvgBuyPrice();

    // debugger;

    await this.functionsUtil.getCurveAvgSlippage();

    // debugger;
    /*
    const govTokenAvailableTokens = {};
    govTokenAvailableTokens[this.props.selectedToken] = this.props.tokenConfig;

    const [govTokensUserBalance,avgAPY,days] = await Promise.all([
      this.functionsUtil.getGovTokensUserBalances(this.props.account,govTokenAvailableTokens,'DAI'),
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

    let [tokenAllocation,compAPR] = await Promise.all([
      this.functionsUtil.getTokenAllocation(this.props.tokenConfig,false,false),
      this.functionsUtil.getCompAPR(this.props.selectedToken,this.props.tokenConfig)
    ]);

    if (tokenAllocation){
      const compoundInfo = this.props.tokenConfig.protocols.find( p => (p.name === 'compound') );
      if (compoundInfo){
        if (tokenAllocation.protocolsAllocationsPerc[compoundInfo.address.toLowerCase()]){
          const compoundAllocationPerc = tokenAllocation.protocolsAllocationsPerc[compoundInfo.address.toLowerCase()];
          compAPR = compAPR.times(compoundAllocationPerc);
        }
      }
    }

    this.setState({
      compAPR,
      aggregatedValues,
      govTokensUserBalance
    });
    */
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
  }

  render() {
    return (
      <Flex
        width={1}
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
            ml={[0,3]}
            id={"funds-overview"}
          >
            <PortfolioEquityCurve
              {...this.props}
              chartHeight={350}
              parentId={'funds-overview'}
              frequencySeconds={this.functionsUtil.getFrequencySeconds('day',1)}
            />
          </Flex>
          <Flex
            width={1}
            flexDirection={['column','row']}
          >
            <Flex
              mb={[2,0]}
              width={[1,1/5]}
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
                  name:'amountLentCurve',
                  props:{
                    decimals:4,
                    maxPrecision:8,
                    fontWeight:300,
                    fontSize:['1.8em','1.9em'],
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
              width={[1,1/5]}
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
                  name:'redeemableBalanceCounterCurve',
                  props:{
                    decimals:7,
                    maxPrecision:8,
                    style:{
                      fontWeight:300,
                      color:theme.colors.counter,
                      fontSize: this.props.isMobile ? '1.8em' : '1.9em',
                    },
                    flexProps:{
                      justifyContent:'center'
                    }
                  }
                }}
              />
              <Flex
                width={1}
                mt={'-9px'}
              >
                <AssetField
                  {...this.props}
                  token={this.props.selectedToken}
                  fieldInfo={{
                    name:'earningsPercCurve',
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
            </Flex>
            <Flex
              mb={[2,0]}
              width={[1,1/5]}
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
                  name:'earningsCounterCurve',
                  props:{
                    decimals:7,
                    maxPrecision:8,
                    style:{
                      fontWeight:300,
                      fontSize:this.props.isMobile ? '1.8em' : '1.9em',
                      color:theme.colors.counter
                    },
                    flexProps:{
                      justifyContent:'center'
                    }
                  }
                }}
              />
            </Flex>
            {
              /*
              <Flex
                mb={[2,0]}
                width={[1,1/5]}
                alignItems={'center'}
                flexDirection={'column'}
                justifyContent={'flex-start'}
              >
                <Title
                  mb={2}
                  fontSize={[3,4]}
                  component={Heading.h3}
                >
                  Fees
                </Title>
                <AssetField
                  {...this.props}
                  token={this.props.selectedToken}
                  fieldInfo={{
                    name:'feesCounter',
                    props:{
                      decimals:7,
                      maxPrecision:8,
                      style:{
                        fontWeight:300,
                        fontSize:this.props.isMobile ? '1.8em' : '1.9em',
                        color:theme.colors.counter
                      },
                      flexProps:{
                        justifyContent:'center'
                      }
                    }
                  }}
                />
              </Flex>
              */
            }
            <Flex
              mb={[2,0]}
              width={[1,1/5]}
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
                  name:'curveApy',
                  props:{
                    decimals:2,
                    fontWeight:300,
                    fontSize:['1.8em','1.9em'],
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
              width={[1,1/5]}
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={'flex-start'}
            >
              <Title
                mb={2}
                fontSize={[3,4]}
                component={Heading.h3}
              >
                Avg Slippage
              </Title>
              <AssetField
                {...this.props}
                token={this.props.selectedToken}
                fieldInfo={{
                  name:'curveAvgSlippage',
                  props:{
                    decimals:2,
                    fontWeight:300,
                    fontSize:['1.8em','1.9em'],
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

export default FundsOverviewCurve;