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
    govTokensAprs:null,
    aggregatedValues:[],
    govTokensTotalApr:null,
    govTokensUserBalance:null,
    govTokensDistribution:null,
    govTokensTotalBalance:null,
    govTokensTotalAprTooltip:null,
    idleTokenUserDistribution:null,
    govTokensDistributionTooltip:null,
    govTokensTotalBalanceTooltip:null
  };

  // Utils
  functionsUtil = null;
  idleGovToken = null;

  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }

    this.idleGovToken = this.functionsUtil.getIdleGovToken();
  }

  async componentWillMount(){
    this.loadUtils();
  }

  async componentDidMount(){

    const govTokenAvailableTokens = {};
    govTokenAvailableTokens[this.props.selectedToken] = this.props.tokenConfig;

    const [
      govTokensAprs,
      idleTokenUserDistribution,
      govTokensUserBalance,
      avgAPY,
      days
    ] = await Promise.all([
      this.functionsUtil.getGovTokensAprs(this.props.selectedToken,this.props.tokenConfig),
      this.idleGovToken.getUserDistribution(this.props.account,govTokenAvailableTokens,true),
      this.functionsUtil.getGovTokensUserBalances(this.props.account,govTokenAvailableTokens,null),
      this.functionsUtil.loadAssetField('avgAPY',this.props.selectedToken,this.props.tokenConfig,this.props.account),
      this.functionsUtil.loadAssetField('daysFirstDeposit',this.props.selectedToken,this.props.tokenConfig,this.props.account),
    ]);

    const govTokensTotalBalance = govTokensUserBalance ? Object.values(govTokensUserBalance).reduce( (totBalance,govTokenBalance) => {
      return totBalance.plus(this.functionsUtil.BNify(govTokenBalance));
    },this.functionsUtil.BNify(0)) : null;

    const govTokensTotalBalanceTooltip = govTokensUserBalance ? Object.keys(govTokensUserBalance).map( govToken => {
      const balance = govTokensUserBalance[govToken];
      if (balance.gt(0)){
        return `+${balance.toFixed(2)} ${govToken}`;
      } else {
        return null;
      }
    }).filter(v => (v !== null)) : null;

    // console.log(govTokensTotalBalance,govTokensUserBalance,govTokensTotalBalanceTooltip);

    const govTokensTotalApr = govTokensAprs ? Object.values(govTokensAprs).reduce( (totApr,govTokenApr) => {
      return totApr.plus(this.functionsUtil.BNify(govTokenApr));
    },this.functionsUtil.BNify(0)) : null;

    const govTokensTotalAprTooltip = govTokensAprs ? Object.keys(govTokensAprs).map( govToken => {
      const apr = govTokensAprs[govToken];
      if (apr.gt(0)){
        return `${govToken}: ${apr.toFixed(2)}%`;
      }
      return null;
    }).filter(v => (v !== null)) : null;

    /*
    const govTokensDistributionTooltip = govTokensUserDistribution ? Object.keys(govTokensUserDistribution).map( govToken => {
      const speed = govTokensUserDistribution[govToken];
      if (speed.gt(0)){
        const distributionFrequency = this.functionsUtil.getGlobalConfig(['govTokens',govToken,'distributionFrequency']);
        return `+${speed.toFixed(4)} ${govToken}/${distributionFrequency}`;
      }
      return null;
    }).filter(v => (v !== null)) : null;
    */

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
      govTokensAprs,
      aggregatedValues,
      govTokensTotalApr,
      govTokensUserBalance,
      govTokensTotalBalance,
      govTokensTotalAprTooltip,
      idleTokenUserDistribution,
      govTokensTotalBalanceTooltip
    });
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
              width={[1,1/6]}
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
              width={[1,1/6]}
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
            </Flex>
            <Flex
              mb={[2,0]}
              width={[1,1/6]}
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
                      fontSize:this.props.isMobile ? '1.8em' : '1.9em',
                      color:theme.colors.counter
                    },
                    flexProps:{
                      justifyContent:'center'
                    }
                  }
                }}
              />
              {
                this.state.govTokensTotalBalanceTooltip && this.state.govTokensTotalBalanceTooltip.length>0 && (
                  <Flex
                    width={1}
                    alignItems={'center'}
                    flexDirection={'column'}
                    justifyContent={'center'}
                  >
                    {
                      this.state.govTokensTotalBalanceTooltip.map((govTokenBalance,govTokenIndex) => (
                        <Text
                          fontSize={1}
                          lineHeight={1}
                          fontWeight={2}
                          color={'cellText'}
                          textAlign={'center'}
                          mt={govTokenIndex ? 1 : 0}
                          key={`govToken_${govTokenIndex}`}
                        >
                          {govTokenBalance}
                        </Text>
                      ))
                    }
                  </Flex>
                )/* : this.state.govTokensUserBalance && Object.keys(this.state.govTokensUserBalance).length>1 ? (
                  <Flex
                    width={1}
                    alignItems={'center'}
                    flexDirection={'row'}
                    justifyContent={'center'}
                  >
                    <Text
                      fontSize={1}
                      lineHeight={1}
                      fontWeight={2}
                      color={'cellText'}
                      textAlign={'center'}
                    >
                      + ${this.state.govTokensTotalBalance.toFixed(4)}
                    </Text>
                    <Tooltip
                      placement={'top'}
                      message={this.state.govTokensTotalBalanceTooltip.join(' / ')}
                    >
                      <Icon
                        ml={1}
                        size={'1em'}
                        color={'cellTitle'}
                        name={"InfoOutline"}
                      />
                    </Tooltip>
                  </Flex>
                ) : null
                */
              }
            </Flex>
            <Flex
              mb={[2,0]}
              width={[1,1/6]}
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
            <Flex
              mb={[2,0]}
              width={[1,1/6]}
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
                    fontSize:['1.8em','1.9em'],
                    color:theme.colors.counter,
                    flexProps:{
                      justifyContent:'center'
                    }
                  }
                }}
              />
              {
                this.state.idleTokenUserDistribution && (
                  <Flex
                    width={1}
                    alignItems={'center'}
                    flexDirection={'column'}
                    justifyContent={'center'}
                  >
                    <Text
                      mt={1}
                      fontSize={1}
                      lineHeight={1}
                      fontWeight={2}
                      color={'cellText'}
                      textAlign={'center'}
                    >
                      {this.state.idleTokenUserDistribution.toFixed(4)} {this.idleGovToken.tokenName}/{this.idleGovToken.tokenConfig.distributionFrequency}
                    </Text>
                  </Flex>
                )
                /*
                this.state.govTokensAprs && Object.keys(this.state.govTokensAprs).length===1 ? (
                  <Flex
                    width={1}
                    alignItems={'center'}
                    flexDirection={'row'}
                    justifyContent={'center'}
                  >
                    {
                      Object.keys(this.state.govTokensAprs).map((govToken,govTokenIndex) => (
                        <Text
                          fontSize={1}
                          lineHeight={1}
                          fontWeight={2}
                          color={'cellText'}
                          textAlign={'center'}
                          ml={govTokenIndex ? 2 : 0}
                          key={`govToken_${govToken}`}
                        >
                          {this.state.govTokensAprs[govToken].toFixed(2)}% {govToken}
                        </Text>
                      ))
                    }
                  </Flex>
                ) : this.state.govTokensAprs && Object.keys(this.state.govTokensAprs).length>1 ? (
                  <Flex
                    width={1}
                    alignItems={'center'}
                    flexDirection={'row'}
                    justifyContent={'center'}
                  >
                    <Text
                      fontSize={1}
                      lineHeight={1}
                      fontWeight={2}
                      color={'cellText'}
                      textAlign={'center'}
                    >
                      + {this.state.govTokensTotalApr.toFixed(2)}%
                    </Text>
                    <Tooltip
                      placement={'top'}
                      message={this.state.govTokensTotalAprTooltip.join('; ')}
                    >
                      <Icon
                        ml={1}
                        size={'1em'}
                        color={'cellTitle'}
                        name={"InfoOutline"}
                      />
                    </Tooltip>
                  </Flex>
                ) : null
                */
              }
            </Flex>
            <Flex
              mb={[2,0]}
              width={[1,1/6]}
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

export default FundsOverview;