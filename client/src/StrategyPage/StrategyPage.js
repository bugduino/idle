import Title from '../Title/Title';
import CountUp from 'react-countup';
import React, { Component } from 'react';
import FlexLoader from '../FlexLoader/FlexLoader';
import AssetsList from '../AssetsList/AssetsList';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';
import PortfolioDonut from '../PortfolioDonut/PortfolioDonut';
import GenericSelector from '../GenericSelector/GenericSelector';
import PortfolioEquity from '../PortfolioEquity/PortfolioEquity';
import { Flex, Box, Heading, Text, Tooltip, Icon } from "rimble-ui";
import TransactionsList from '../TransactionsList/TransactionsList';
import EarningsEstimation from '../EarningsEstimation/EarningsEstimation';

// const env = process.env;

class StrategyPage extends Component {

  state = {
    tokensToMigrate:{},
    aggregatedValues:[],
    depositedTokens:null,
    remainingTokens:null,
    portfolioLoaded:false,
    availableGovTokens:null,
    portfolioEquityStartDate:null,
    portfolioEquityQuickSelection:'week'
  };

  // Utils
  functionsUtil = null;
  componentUnmounted = false;

  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  componentWillMount(){
    this.loadUtils();
  }

  componentWillUnmount(){
    this.componentUnmounted = true;
  }

  async componentDidMount(){
    await this.loadPortfolio();
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();
  }

  async setStateSafe(newState,callback=null) {
    if (!this.componentUnmounted){
      return this.setState(newState,callback);
    }
    return null;
  }

  setPortfolioEquityQuickSelection(portfolioEquityQuickSelection){
    this.setStateSafe({
      portfolioEquityQuickSelection
    });
  }

  async loadPortfolio(){
    // Load portfolio if account is set
    if (this.props.account){

      const newState = {};

      // Get deposited tokens
      const portfolio = await this.functionsUtil.getAccountPortfolio(this.props.availableTokens,this.props.account);

      if (portfolio){
        const depositedTokens = Object.keys(portfolio.tokensBalance).filter(token => ( this.functionsUtil.BNify(portfolio.tokensBalance[token].idleTokenBalance).gt(0) ));

        newState.depositedTokens = depositedTokens;

        const isRisk = this.props.selectedStrategy === 'risk';

        let avgAPY = this.functionsUtil.BNify(0);
        let avgScore = this.functionsUtil.BNify(0);
        let totalEarnings = this.functionsUtil.BNify(0);
        let totalAmountLent = this.functionsUtil.BNify(0);

        await this.functionsUtil.asyncForEach(depositedTokens,async (token) => {
          const tokenConfig = this.props.availableTokens[token];

          const [tokenAprs,idleTokenPrice,tokenScore,avgBuyPrice,amountLent] = await Promise.all([
            this.functionsUtil.getTokenAprs(tokenConfig),
            this.functionsUtil.getIdleTokenPrice(tokenConfig),
            this.functionsUtil.getTokenScore(tokenConfig,isRisk),
            this.functionsUtil.getAvgBuyPrice([token],this.props.account),
            this.functionsUtil.getAmountLent([token],this.props.account)
          ]);

          const amountLentToken = await this.functionsUtil.convertTokenBalance(amountLent[token],token,tokenConfig,isRisk);

          const tokenAPY = this.functionsUtil.BNify(tokenAprs.avgApy);
          const tokenWeight = portfolio.tokensBalance[token].tokenBalance.div(portfolio.totalBalance);
          const tokenEarningsPerc = idleTokenPrice.div(avgBuyPrice[token]).minus(1);
          const tokenEarnings = amountLentToken ? amountLentToken.times(tokenEarningsPerc) : 0;

          // console.log(token,idleTokenPrice.toFixed(5),avgBuyPrice[token].toFixed(5),amountLentToken.toFixed(5),tokenEarningsPerc.toFixed(5),tokenEarnings.toFixed(5));

          if (tokenEarnings){
            totalEarnings = totalEarnings.plus(tokenEarnings);
          }

          if (tokenAPY){
            avgAPY = avgAPY.plus(tokenAPY.times(tokenWeight));
          }

          if (tokenScore){
            avgScore = avgScore.plus(tokenScore.times(tokenWeight));
          }

          if (amountLentToken){
            totalAmountLent = totalAmountLent.plus(amountLentToken);
          }
        });

        // Add gov tokens to earnings
        const govTokensTotalBalance = await this.functionsUtil.getGovTokensUserTotalBalance(this.props.account,this.props.availableTokens,'DAI');
        const govTokensUserBalance = await this.functionsUtil.getGovTokensUserBalances(this.props.account,this.props.availableTokens,null);
        const govTokensTotalBalanceTooltip = govTokensUserBalance ? Object.keys(govTokensUserBalance).map( govToken => {
          const balance = govTokensUserBalance[govToken];
          if (balance.gt(0)){
            return `+${balance.toFixed(2)} ${govToken}`;
          } else {
            return null;
          }
        }).filter(v => (v !== null)) : null;

        const earningsStart = totalEarnings;
        const earningsEnd = totalAmountLent.times(avgAPY.div(100));

        newState.aggregatedValues = [
          {
            flexProps:{
              pr:[0,2],
              width:[1,1/3],
            },
            props:{
              label:'',
              title:'Avg APY',
              value:avgAPY.toFixed(2)+'<small>%</small>',
              description:this.functionsUtil.getGlobalConfig(['messages','apyLong'])
            }
          },
          {
            flexProps:{
              px:[0,2],
              width:[1,1/3],
            },
            props:{
              title:'Total Earnings',
              description:'Total earnings does not include accrued governance tokens: '+(govTokensTotalBalance && govTokensTotalBalance.gt(0) ? ` (${govTokensTotalBalanceTooltip.join(' / ')})` : ''),
              children:(
                <Flex
                  alignItems={'center'}
                  flexDirection={'column'}
                  justifyContent={'center'}
                >
                  <CountUp
                    delay={0}
                    decimals={8}
                    decimal={'.'}
                    separator={''}
                    useEasing={false}
                    duration={31536000}
                    end={parseFloat(earningsEnd)}
                    start={parseFloat(earningsStart)}
                    formattingFn={ n => '$ '+this.functionsUtil.abbreviateNumber(n,8,10,8) }
                  >
                    {({ countUpRef, start }) => (
                      <span
                        ref={countUpRef}
                        style={{
                          lineHeight:1,
                          color:this.props.theme.colors.copyColor,
                          fontFamily:this.props.theme.fonts.counter,
                          fontWeight: this.props.isMobile ? 600 : 700,
                          fontSize:this.props.isMobile ? '21px' : '1.7em',
                        }}
                      />
                    )}
                  </CountUp>
                  {
                    /*
                    govTokensTotalBalance && govTokensTotalBalance.gt(0) &&
                      <Text
                        fontSize={1}
                        fontWeight={2}
                        color={'cellText'}
                        textAlign={'center'}
                      >
                        {govTokensTotalBalanceTooltip.join(' / ')}
                      </Text>
                    */
                  }
                </Flex>
              ),
              label:'',
            }
          },
          {
            flexProps:{
              pl:[0,2],
              width:[1,1/3],
            },
            props:{
              title:'Avg Risk Score',
              value:avgScore.toFixed(1),
              label:''
            }
          },
        ];
      }

      // Get tokens to migrate
      const tokensToMigrate = await this.functionsUtil.getTokensToMigrate(this.props.selectedStrategy);

      newState.tokensToMigrate = tokensToMigrate;
      newState.portfolioLoaded = true;

      const remainingTokens = Object.keys(this.props.availableTokens).filter(token => (!newState.depositedTokens.includes(token) && !Object.keys(newState.tokensToMigrate).includes(token)) );
      newState.remainingTokens = remainingTokens;

      // Load and process Etherscan Txs
      const firstBlockNumber = this.functionsUtil.getGlobalConfig(['network','firstBlockNumber']);
      await this.functionsUtil.getEtherscanTxs(this.props.account,firstBlockNumber,'latest',Object.keys(this.props.availableTokens))

      // Portfolio loaded
      this.setStateSafe(newState);
    // Show available assets for not logged users
    } else {
      this.setStateSafe({
        tokensToMigrate:{},
        depositedTokens:[],
        portfolioLoaded:true,
        remainingTokens:Object.keys(this.props.availableTokens),
      });
    }
  }

  render(){
    const govTokens = this.functionsUtil.getGlobalConfig(['govTokens']);
    const apyLong = this.functionsUtil.getGlobalConfig(['messages','apyLong']);
    const riskScore = this.functionsUtil.getGlobalConfig(['messages','riskScore']);
    const yieldFarming = this.functionsUtil.getGlobalConfig(['messages','yieldFarming']);

    return (
      <Box width={1}>
        <Title mb={[3,4]}>{this.functionsUtil.getGlobalConfig(['strategies',this.props.selectedStrategy,'title'])} strategy</Title>
        {
          !this.state.portfolioLoaded ? (
            <FlexLoader
              textProps={{
                textSize:4,
                fontWeight:2
              }}
              loaderProps={{
                mb:3,
                size:'40px'
              }}
              flexProps={{
                minHeight:'50vh',
                flexDirection:'column'
              }}
              text={'Loading portfolio...'}
            />
          ) : (
            <>
              {
                this.state.depositedTokens.length>0 ? (
                  <Flex
                    width={1}
                    flexDirection={'column'}
                  >
                    <Flex
                      mb={3}
                      width={1}
                      mt={[2,0]}
                      alignItems={'center'}
                      justifyContent={'center'}
                      flexDirection={['column','row']}
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
                                py:[3,4],
                                mb:[2,0]
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
                                  <Flex
                                    mt={2}
                                    width={1}
                                    alignItems={'center'}
                                    flexDirection={'row'}
                                    justifyContent={'center'}
                                  >
                                    <Text
                                      fontWeight={2}
                                      fontSize={[1,2]}
                                      color={'cellText'}
                                    >
                                      {v.props.title}
                                    </Text>
                                  {
                                    v.props.description && (
                                      <Tooltip
                                        placement={'bottom'}
                                        message={v.props.description}
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
                              </Flex>
                            </DashboardCard>
                          </Flex>
                        ))
                      }
                    </Flex>
                    <Flex
                      width={1}
                      id={"portfolio-charts"}
                      justifyContent={'space-between'}
                      flexDirection={['column','row']}
                    >
                      <Flex
                        mb={[3,0]}
                        width={[1,0.33]}
                        flexDirection={'column'}
                        id={"portfolio-composition"}
                      >
                        <DashboardCard
                          title={'Composition'}
                          titleProps={ !this.props.isMobile ? {
                            style:{
                              minHeight:'39px'
                            }
                          } : null}
                        >
                          <PortfolioDonut
                            {...this.props}
                            parentId={'portfolio-composition'}
                          />
                        </DashboardCard>
                      </Flex>
                      <Flex
                        width={[1,0.66]}
                        flexDirection={'column'}
                      >
                        <DashboardCard>
                          <Flex
                            pt={[3,4]}
                            px={[3,4]}
                            aligItems={'center'}
                            flexDirection={['column','row']}
                          >
                            <Flex
                              width={[1,0.7]}
                              flexDirection={'column'}
                              justifyContent={'flex-start'}
                            >
                              <Title
                                fontWeight={4}
                                fontSize={[2,3]}
                                textAlign={'left'}
                              >
                                Performance
                              </Title>
                            </Flex>
                            <Flex
                              mt={[2,0]}
                              width={[1,0.3]}
                              flexDirection={'column'}
                              justifyContent={'flex-end'}
                            >
                              <GenericSelector
                                innerProps={{
                                  p:0,
                                  px:1
                                }}
                                defaultValue={
                                  {value:'week',label:'1W'}
                                }
                                name={'performance-time'}
                                options={[
                                  {value:'week',label:'1W'},
                                  {value:'month',label:'1M'},
                                  {value:'month3',label:'3M'},
                                  {value:'month6',label:'6M'},
                                  {value:'all',label:'MAX'},
                                ]}
                                onChange={ v => this.setPortfolioEquityQuickSelection(v) }
                              />
                            </Flex>
                          </Flex>
                          <Flex
                            ml={[0,3]}
                            aligItems={'center'}
                            justifyContent={'center'}
                            id={"portfolio-performance"}
                          >
                            <PortfolioEquity
                              {...this.props}
                              enabledTokens={[]}
                              parentId={'portfolio-performance'}
                              parentIdHeight={'portfolio-composition'}
                              quickDateSelection={this.state.portfolioEquityQuickSelection}
                              frequencySeconds={this.functionsUtil.getFrequencySeconds('day',1)}
                            />
                          </Flex>
                        </DashboardCard>
                      </Flex>
                    </Flex>
                  </Flex>
                ) : (
                  <Flex
                    mb={3}
                    mx={'auto'}
                    width={[1,0.8]}
                    aligItems={'center'}
                    justifyContent={'center'}
                  >
                    <Text
                      fontWeight={2}
                      fontSize={[1,2]}
                      textAlign={'center'}
                    >
                      {
                        this.props.isMobile ?
                          this.functionsUtil.getGlobalConfig(['strategies',this.props.selectedStrategy,'descShort'])
                        :
                          this.functionsUtil.getGlobalConfig(['strategies',this.props.selectedStrategy,'descLong'])
                      }
                    </Text>
                  </Flex>
                )
              }
              <Flex
                width={1}
                id={'available-assets'}
                flexDirection={'column'}
                mb={!this.state.depositedTokens.length ? 4 : 0}
              >
                {
                  (this.state.depositedTokens.length>0 || Object.keys(this.state.tokensToMigrate).length>0 || this.state.remainingTokens.length>0 ) &&
                    <Title my={[3,4]}>Available assets</Title>
                }
                <Flex width={1} flexDirection={'column'}>
                  {
                    Object.keys(this.state.tokensToMigrate).length>0 &&
                    <Flex
                      width={1}
                      mb={[3,4]}
                      id={"migrate-assets"}
                      flexDirection={'column'}
                    >
                      <Flex
                        pb={2}
                        width={1}
                        mb={[2,3]}
                        borderColor={'divider'}
                        borderBottom={'1px solid transparent'}
                      >
                        <Heading.h4
                          fontSize={[2,4]}
                          fontWeight={[3,4]}
                        >
                          Assets to migrate
                        </Heading.h4>
                      </Flex>
                      <AssetsList
                        enabledTokens={Object.keys(this.state.tokensToMigrate)}
                        handleClick={(props) => this.props.changeToken(props.token)}
                        cols={[
                          {
                            title:'CURRENCY',
                            props:{
                              width:[0.27,0.15]
                            },
                            fields:[
                              {
                                name:'icon',
                                props:{
                                  mr:2,
                                  height:['1.4em','2.3em']
                                }
                              },
                              {
                                name:'tokenName'
                              }
                            ]
                          },
                          {
                            title:'POOL',
                            mobile:this.props.account !== null,
                            props:{
                              width:[0.21, 0.12],
                            },
                            fields:[
                              {
                                name:'pool',
                                props:{
                                  decimals:2
                                }
                              }
                            ]
                          },
                          {
                            title:'APY',
                            desc:apyLong,
                            props:{
                              width:[0.29,0.15],
                            },
                            parentProps:{
                              flexDirection:'column',
                              alignItems:'flex-start',
                            },
                            fields:[
                              {
                                name:'apy',
                                showTooltip:true
                              },
                              {
                                name:'idleDistribution',
                                showLoader:false,
                                props:{
                                  decimals:this.props.isMobile ? 1 : 2,
                                  fontSize:this.props.isMobile ? '9px' : 0
                                }
                              },
                            ]
                          },
                          {
                            title:'SCORE',
                            desc:riskScore,
                            props:{
                              width:[0.21,0.12],
                            },
                            fields:[
                              {
                                name:'score'
                              }
                            ]
                          },
                          {
                            title:'BALANCE',
                            mobile:false,
                            props:{
                              width:[0.16,0.14],
                            },
                            parentProps:{
                              width:1,
                              pr:[2,4]
                            },
                            fields:[
                              {
                                name:'amountToMigrate',
                              }
                            ]
                          },
                          {
                            mobile:false,
                            title:'FARMING',
                            desc:yieldFarming,
                            props:{
                              width:[0.25,0.15],
                              textAlign:'center'
                            },
                            fields:[
                              {
                                name:'govTokens'
                              }
                            ]
                          },
                          {
                            title:'',
                            mobile:this.props.account === null,
                            props:{
                              width:[ this.props.account === null ? 0.29 : 0 ,0.17],
                            },
                            parentProps:{
                              width:1
                            },
                            fields:[
                              {
                                name:'button',
                                label: 'Migrate',
                                props:{
                                  width:1,
                                  fontSize:3,
                                  fontWeight:3,
                                  height:'45px',
                                  borderRadius:4,
                                  boxShadow:null,
                                  mainColor:'migrate',
                                  size: this.props.isMobile ? 'small' : 'medium',
                                  handleClick:(props) => this.props.changeToken(props.token)
                                }
                              }
                            ]
                          }
                        ]}
                        {...this.props}
                      />
                    </Flex>
                  }
                  {
                  this.state.depositedTokens.length>0 &&
                    <Flex
                      mb={ this.state.remainingTokens.length>0 ? [3,4] : 0 }
                      width={1}
                      id={"deposited-assets"}
                      flexDirection={'column'}
                    >
                      <Flex
                        pb={2}
                        width={1}
                        mb={[2,3]}
                        borderColor={'divider'}
                        borderBottom={'1px solid transparent'}
                      >
                        <Heading.h4
                          fontSize={[2,4]}
                          fontWeight={[3,4]}
                        >
                          Deposited assets
                        </Heading.h4>
                      </Flex>
                      <AssetsList
                        enabledTokens={this.state.depositedTokens}
                        handleClick={(props) => this.props.changeToken(props.token)}
                        cols={[
                          {
                            title:'CURRENCY',
                            props:{
                              width:[0.27,0.13]
                            },
                            fields:[
                              {
                                name:'icon',
                                props:{
                                  mr:2,
                                  height:['1.4em','2.3em']
                                }
                              },
                              {
                                name:'tokenName'
                              }
                            ]
                          },
                          {
                            title:'POOL',
                            mobile:false,
                            props:{
                              width:[0.12,0.09],
                            },
                            fields:[
                              {
                                name:'pool',
                                props:{
                                  decimals:2
                                }
                              }
                            ]
                          },
                          {
                            title:'APY',
                            desc:apyLong,
                            props:{
                              width:[0.30,0.14],
                            },
                            parentProps:{
                              flexDirection:'column',
                              alignItems:'flex-start',
                            },
                            fields:[
                              {
                                name:'apy',
                                showTooltip:true
                              },
                              {
                                name:'idleDistribution',
                                showLoader:false,
                                props:{
                                  decimals:this.props.isMobile ? 1 : 2,
                                  fontSize:this.props.isMobile ? '9px' : 0
                                }
                              },
                            ]
                          },
                          {
                            title:'SCORE',
                            desc:riskScore,
                            props:{
                              width:[0.21,0.10],
                            },
                            parentProps:{
                              alignItems:['center','flex-start'],
                            },
                            fields:[
                              {
                                name:'score',
                              }
                            ]
                          },
                          {
                            title:'DEPOSITED',
                            props:{
                              width:[0.22,0.13],
                              justifyContent:['center','flex-start']
                            },
                            fields:[
                              {
                                name:'amountLent'
                              }
                            ]
                          },
                          {
                            mobile:false,
                            title:'FARMING',
                            desc:yieldFarming,
                            props:{
                              width:[0.25,0.11],
                              textAlign:'center'
                            },
                            fields:[
                              {
                                name:'govTokens',
                                props:{
                                  decimals:2
                                }
                              }
                            ]
                          },
                          {
                            mobile:false,
                            title:'EARNINGS',
                            props:{
                              width:[0.15,0.13],
                              textAlign:'center'
                            },
                            parentProps:{
                              alignItems:'center',
                              flexDirection:'column',
                            },
                            fields:[
                              {
                                name:'earnings',
                                props:{
                                  decimals:3
                                }
                              },
                              {
                                name:'earningsPerc',
                                showLoader:false,
                                showDirection:false,
                                props:{
                                  fontSize:0,
                                  decimals:3
                                }
                              }
                            ]
                          },
                          /*
                          {
                            title:'EARNINGS %',
                            props:{
                              width:[0.27,0.14],
                            },
                            fields:[
                              {
                                name:'earningsPerc'
                              }
                            ]
                          },
                          */
                          {
                            title:'',
                            mobile:false,
                            props:{
                              width:0.17,
                            },
                            parentProps:{
                              width:1
                            },
                            fields:[
                              {
                                name:'button',
                                label:'Manage',
                                props:{
                                  width:1,
                                  fontSize:3,
                                  fontWeight:3,
                                  height:'45px',
                                  borderRadius:4,
                                  boxShadow:null,
                                  mainColor:'redeem',
                                  size: this.props.isMobile ? 'small' : 'medium',
                                  handleClick:(props) => this.props.changeToken(props.token)
                                }
                              }
                            ]
                          }
                        ]}
                        {...this.props}
                      />
                    </Flex>
                  }
                  {
                    this.state.remainingTokens.length>0 &&
                    <Flex id="remaining-assets" width={1} flexDirection={'column'}>
                      <Flex
                        pb={2}
                        width={1}
                        mb={[2,3]}
                        borderColor={'divider'}
                        borderBottom={'1px solid transparent'}
                      >
                        <Heading.h4
                          fontSize={[2,4]}
                          fontWeight={[3,4]}
                        >
                          Available assets
                        </Heading.h4>
                      </Flex>
                      <AssetsList
                        enabledTokens={this.state.remainingTokens}
                        handleClick={(props) => this.props.changeToken(props.token)}
                        cols={[
                          {
                            title:'CURRENCY',
                            props:{
                              width:[0.27,0.13]
                            },
                            fields:[
                              {
                                name:'icon',
                                props:{
                                  mr:2,
                                  height:['1.4em','2.3em']
                                }
                              },
                              {
                                name:'tokenName'
                              }
                            ]
                          },
                          {
                            title:'POOL',
                            mobile:this.props.account !== null,
                            props:{
                              width:[0.21, 0.10],
                            },
                            fields:[
                              {
                                name:'pool',
                                props:{
                                  decimals:2
                                }
                              }
                            ]
                          },
                          {
                            title:'APY',
                            desc:apyLong,
                            props:{
                              width:[0.31,this.state.depositedTokens.length>0 ? 0.14 : 0.14],
                            },
                            parentProps:{
                              flexDirection:'column',
                              alignItems:'flex-start',
                            },
                            fields:[
                              {
                                name:'apy',
                                showTooltip:true
                              },
                              {
                                name:'idleDistribution',
                                showLoader:false,
                                props:{
                                  decimals:this.props.isMobile ? 1 : 2,
                                  fontSize:this.props.isMobile ? '9px' : 0
                                }
                              },
                            ]
                          },
                          {
                            title:'SCORE',
                            desc:riskScore,
                            props:{
                              width:[0.22,0.10],
                            },
                            fields:[
                              {
                                name:'score'
                              }
                            ]
                          },
                          {
                            mobile:false,
                            title:'FARMING',
                            desc:yieldFarming,
                            props:{
                              width:[0.25,0.11],
                              textAlign:'center'
                            },
                            fields:[
                              {
                                name:'govTokens',
                                props:{
                                  decimals:2
                                }
                              }
                            ]
                          },
                          {
                            title:'APR LAST WEEK',
                            mobile:false,
                            props:{
                              width:0.25,
                            },
                            parentProps:{
                              width:1,
                              pr:[2,4]
                            },
                            fields:[
                              {
                                name:'aprChart',
                              }
                            ]
                          },
                          {
                            title:'',
                            mobile:this.props.account === null,
                            props:{
                              width:[ this.props.account === null ? 0.26 : 0 , 0.17],
                            },
                            parentProps:{
                              width:1
                            },
                            fields:[
                              {
                                name:'button',
                                label: (props) => {
                                  return Object.keys(this.state.tokensToMigrate).includes(props.token) ? 'Migrate' : 'Deposit';
                                },
                                props:{
                                  width:1,
                                  fontSize:3,
                                  fontWeight:3,
                                  height:'45px',
                                  borderRadius:4,
                                  boxShadow:null,
                                  size: this.props.isMobile ? 'small' : 'medium',
                                  handleClick:(props) => this.props.changeToken(props.token)
                                },
                                funcProps:{
                                  mainColor: (props) => {
                                    return Object.keys(this.state.tokensToMigrate).includes(props.token) ? 'migrate' : 'deposit'
                                  }
                                }
                              }
                            ]
                          }
                        ]}
                        {...this.props}
                      />
                    </Flex>
                  }
                </Flex>
              </Flex>
              {
                this.state.depositedTokens.length>0 &&
                  <Flex
                    width={1}
                    id={"yield-farming"}
                    flexDirection={'column'}
                  >
                    <Title my={[3,4]}>Yield Farming</Title>
                    <AssetsList
                      enabledTokens={Object.keys(govTokens)}
                      cols={[
                        {
                          title:'TOKEN',
                          props:{
                            width:[0.3,0.15]
                          },
                          fields:[
                            {
                              name:'icon',
                              props:{
                                mr:2,
                                height:['1.4em','2.3em']
                              }
                            },
                            {
                              name:'tokenName'
                            }
                          ]
                        },
                        {
                          mobile:false,
                          title:'BALANCE',
                          props:{
                            width:[0.33, 0.25],
                          },
                          fields:[
                            {
                              name:'tokenBalance',
                              props:{
                                decimals: this.props.isMobile ? 6 : 8
                              }
                            }
                          ]
                        },
                        {
                          title:'REDEEMABLE',
                          desc:this.functionsUtil.getGlobalConfig(['messages','govTokenRedeemableBalance']),
                          props:{
                            width:[0.35,0.30],
                            justifyContent:['center','flex-start']
                          },
                          fields:[
                            {
                              name:'redeemableBalance',
                              props:{
                                decimals: this.props.isMobile ? 6 : 8
                              }
                            },
                          ]
                        },
                        {
                          title:'DISTRIBUTION',
                          desc:this.functionsUtil.getGlobalConfig(['messages','userDistributionSpeed']),
                          props:{
                            width:[0.35,0.30],
                          },
                          fields:[
                            {
                              name:'userDistributionSpeed',
                              props:{
                                decimals:6
                              }
                            }
                          ]
                        },
                        /*
                        {
                          mobile:false,
                          title:'APR',
                          desc:this.functionsUtil.getGlobalConfig(['messages','govTokenApr']),
                          props:{
                            width:[0.2,0.15],
                          },
                          fields:[
                            {
                              name:'apr',
                            }
                          ]
                        },
                        {
                          title:'TOKEN PRICE',
                          desc:this.functionsUtil.getGlobalConfig(['messages','tokenPrice']),
                          mobile:false,
                          props:{
                            width: 0.17,
                          },
                          parentProps:{
                            width:1,
                            pr:[2,4]
                          },
                          fields:[
                            {
                              name:'tokenPrice',
                              props:{
                                unit:'$',
                                unitPos:'left',
                                unitProps:{
                                  mr:1,
                                  fontWeight:3,
                                  fontSize:[0,2],
                                  color:'cellText'
                                }
                              }
                            }
                          ]
                        },
                        */
                      ]}
                      {...this.props}
                      availableTokens={govTokens}
                    />
                  </Flex>
              }
              {
                this.state.depositedTokens.length>0 &&
                  <Flex
                    width={1}
                    id="earnings-estimation"
                    flexDirection={'column'}
                  >
                    <Title my={[3,4]}>Estimated earnings</Title>
                    <EarningsEstimation
                      {...this.props}
                      enabledTokens={this.state.depositedTokens}
                    />
                  </Flex>
              }
              {
                this.props.account && this.state.depositedTokens.length>0 && 
                  <Flex
                    mb={[3,4]}
                    width={1}
                    id={'transactions'}
                    flexDirection={'column'}
                  >
                    <Title my={[3,4]}>Transactions</Title>
                    <TransactionsList
                      {...this.props}
                      enabledTokens={[]}
                      cols={[
                        {
                          title: this.props.isMobile ? '' : 'HASH',
                          props:{
                            width:[0.15,0.24]
                          },
                          fields:[
                            {
                              name:'icon',
                              props:{
                                mr:[0,2]
                              }
                            },
                            {
                              name:'hash',
                              mobile:false
                            }
                          ]
                        },
                        {
                          title:'ACTION',
                          mobile:false,
                          props:{
                            width:0.15,
                          },
                          fields:[
                            {
                              name:'action'
                            }
                          ]
                        },
                        {
                          title:'DATE',
                          props:{
                            width:[0.32,0.23],
                          },
                          fields:[
                            {
                              name:'date'
                            }
                          ]
                        },
                        {
                          title:'STATUS',
                          props:{
                            width:[0.18,0.22],
                            justifyContent:['center','flex-start']
                          },
                          fields:[
                            {
                              name:'statusIcon',
                              props:{
                                mr:[0,2]
                              }
                            },
                            {
                              mobile:false,
                              name:'status'
                            }
                          ]
                        },
                        {
                          title:'AMOUNT',
                          props:{
                            width:0.19,
                          },
                          fields:[
                            {
                              name:'amount'
                            },
                          ]
                        },
                        {
                          title:'ASSET',
                          props:{
                            width:[0.15,0.20],
                            justifyContent:['center','flex-start']
                          },
                          fields:[
                            {
                              name:'tokenIcon',
                              props:{
                                mr:[0,2],
                                height:['1.4em','1.6em']
                              }
                            },
                            {
                              mobile:false,
                              name:'tokenName'
                            },
                          ]
                        },
                      ]}
                    />
                  </Flex>
              }
            </>
          )
        }
      </Box>
    );
  }
}

export default StrategyPage;