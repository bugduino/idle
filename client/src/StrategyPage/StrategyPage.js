import Title from '../Title/Title';
import React, { Component } from 'react';
import AssetsList from '../AssetsList/AssetsList';
import FlexLoader from '../FlexLoader/FlexLoader';
import { Flex, Box, Heading, Text } from "rimble-ui";
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';
import PortfolioDonut from '../PortfolioDonut/PortfolioDonut';
import GenericSelector from '../GenericSelector/GenericSelector';
import PortfolioEquity from '../PortfolioEquity/PortfolioEquity';
import TransactionsList from '../TransactionsList/TransactionsList';
import EarningsEstimation from '../EarningsEstimation/EarningsEstimation';

// const env = process.env;

class StrategyPage extends Component {

  state = {
    tokensToMigrate:[],
    depositedTokens:null,
    remainingTokens:null,
    portfolioLoaded:false,
    portfolioEquityStartDate:null,
    portfolioEquityQuickSelection:'month3'
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

  componentWillMount(){
    this.loadUtils();
  }

  async componentDidMount(){
    await this.loadPortfolio();
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();
  }

  setPortfolioEquityQuickSelection(portfolioEquityQuickSelection){
    this.setState({
      portfolioEquityQuickSelection
    });
  }

  async loadPortfolio(){
    // Load portfolio if account is set
    if (this.props.account){

      const newState = {};

      const portfolio = await this.functionsUtil.getAccountPortfolio(this.props.availableTokens,this.props.account);

      if (portfolio){
        const depositedTokens = Object.keys(portfolio.tokensBalance).filter(token => {
          return this.functionsUtil.BNify(portfolio.tokensBalance[token].idleTokenBalance).gt(0);
        });
        const remainingTokens = Object.keys(this.props.availableTokens).filter(token => !depositedTokens.includes(token) );

        newState.depositedTokens = depositedTokens;
        newState.remainingTokens = remainingTokens;
      }

      const tokensToMigrate = [];
      await this.functionsUtil.asyncForEach(Object.keys(this.props.availableTokens),async (token) => {
        const tokenConfig = this.props.availableTokens[token];
        const {migrationEnabled} = await this.functionsUtil.checkMigration(tokenConfig,this.props.account);
        
        if (migrationEnabled){
          tokensToMigrate.push(token);
        }
      });

      newState.tokensToMigrate = tokensToMigrate;
      newState.portfolioLoaded = true;

      // Load and process Etherscan Txs
      const firstBlockNumber = this.functionsUtil.getGlobalConfig(['network','firstBlockNumber']);
      await this.functionsUtil.getEtherscanTxs(this.props.account,firstBlockNumber,'latest',Object.keys(this.props.availableTokens));

      // Portfolio loaded
      this.setState(newState);
    // Show available assets for not logged users
    } else {
      this.setState({
        tokensToMigrate:[],
        depositedTokens:[],
        portfolioLoaded:true,
        remainingTokens:Object.keys(this.props.availableTokens),
      });
    }
  }

  render() {
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
                    id={"portfolio-charts"}
                    justifyContent={'space-between'}
                    flexDirection={['column','row']}
                  >
                    <Flex
                      mb={[3,0]}
                      width={[1,0.38]}
                      flexDirection={'column'}
                      maxWidth={['auto','35em']}
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
                      width={[1,0.60]}
                      flexDirection={'column'}
                      maxWidth={['auto','55em']}
                      id={"portfolio-performance"}
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
                                {value:'month3',label:'3 Months'}
                              }
                              name={'performance-time'}
                              options={[
                                {value:'week',label:'Week'},
                                {value:'month',label:'Month'},
                                {value:'month3',label:'3 Months'},
                                {value:'month6',label:'6 Months'},
                                {value:'all',label:'All'},
                              ]}
                              onChange={ v => this.setPortfolioEquityQuickSelection(v) }
                            />
                          </Flex>
                        </Flex>
                        <PortfolioEquity
                          {...this.props}
                          enabledTokens={[]}
                          parentId={'portfolio-performance'}
                          parentIdHeight={'portfolio-composition'}
                          quickDateSelection={this.state.portfolioEquityQuickSelection}
                          frequencySeconds={this.functionsUtil.getFrequencySeconds('day',1)}
                        />
                      </DashboardCard>
                    </Flex>
                  </Flex>
                ) : (
                  <Flex
                    mb={[3,4]}
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
              <Flex id="available-assets" width={1} flexDirection={'column'}>
                {
                  this.state.depositedTokens.length>0 &&
                    <Title my={[3,4]}>Available assets</Title>
                }
                <Flex width={1} flexDirection={'column'}>
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
                              width:[0.28,0.15]
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
                              width:0.14,
                            },
                            fields:[
                              {
                                name:'pool'
                              }
                            ]
                          },
                          {
                            title:'APY',
                            props:{
                              width:[0.18,0.11],
                            },
                            fields:[
                              {
                                name:'apy'
                              }
                            ]
                          },
                          {
                            title:'DEPOSITED',
                            props:{
                              width:[0.27,0.14],
                            },
                            fields:[
                              {
                                name:'amountLent'
                              }
                            ]
                          },
                          {
                            title:'EARNINGS',
                            mobile:false,
                            props:{
                              width:0.15,
                            },
                            fields:[
                              {
                                name:'earnings',
                                props:{
                                  decimals:3
                                }
                              }
                            ]
                          },
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
                              width:[0.28, this.props.account === null ? 0.23 : 0.15]
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
                            title:'BALANCE',
                            visible:this.props.account !== null,
                            props:{
                              width:[0.27,0.15],
                            },
                            fields:[
                              {
                                name:'tokenBalance'
                              }
                            ]
                          },
                          {
                            title:'POOL',
                            props:{
                              width:[this.props.account === null ? 0.25 : 0.27, this.props.account === null ? 0.18 : 0.15],
                            },
                            fields:[
                              {
                                name:'pool'
                              }
                            ]
                          },
                          {
                            title:'APY',
                            props:{
                              width:[0.18,this.state.depositedTokens.length>0 ? 0.11 : this.props.account === null ? 0.17 : 0.14],
                            },
                            fields:[
                              {
                                name:'apy'
                              }
                            ]
                          },
                          {
                            title:'APR LAST WEEK',
                            mobile:false,
                            props:{
                              width: this.state.depositedTokens.length>0 ? 0.28 : 0.25,
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
                              width:[ this.props.account === null ? 0.29 : 0 ,0.17],
                            },
                            parentProps:{
                              width:1
                            },
                            fields:[
                              {
                                name:'button',
                                label: (props) => {
                                  return this.state.tokensToMigrate.includes(props.token) ? 'Migrate' : 'Deposit';
                                },
                                props:{
                                  width:1,
                                  fontSize:3,
                                  fontWeight:3,
                                  height:'45px',
                                  borderRadius:4,
                                  boxShadow:null,
                                  mainColor: 'deposit',
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
                </Flex>
              </Flex>
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
                            width:[0.15,0.22]
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
                            width:[0.15,0.15],
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
                            width:[0.32,0.18],
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
                            width:[0.18,0.18],
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
                            width:[0.21,0.14],
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
                            width:[0.15,0.13],
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