import Title from '../Title/Title';
import React, { Component } from 'react';
import AssetsList from '../AssetsList/AssetsList';
import FlexLoader from '../FlexLoader/FlexLoader';
import { Flex, Box, Heading, Text } from "rimble-ui";
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';
import PortfolioDonut from '../PortfolioDonut/PortfolioDonut';
import PortfolioEquity from '../PortfolioEquity/PortfolioEquity';
import TransactionsList from '../TransactionsList/TransactionsList';
import EarningsEstimation from '../EarningsEstimation/EarningsEstimation';

// const env = process.env;

class RiskAdjustedStrategy extends Component {

  state = {
    depositedTokens:null,
    remainingTokens:null,
    portfolioLoaded:false
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

  async componentDidMount(){
    this.loadUtils();
    this.loadPortfolio();
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();
  }

  async loadPortfolio(){
    // Load portfolio if account is set
    if (this.props.account){
      const portfolio = await this.functionsUtil.getAccountPortfolio(this.props.availableTokens,this.props.account);
      if (portfolio){
        const depositedTokens = Object.keys(portfolio.tokensBalance).filter(token => {
          return this.functionsUtil.BNify(portfolio.tokensBalance[token].idleTokenBalance).gt(0);
        });
        const remainingTokens = Object.keys(this.props.availableTokens).filter(token => !depositedTokens.includes(token) );
        this.setState({
          depositedTokens,
          remainingTokens,
          portfolioLoaded:true
        });
      }
    // Show available assets for not logged users
    } else {
      this.setState({
        depositedTokens:[],
        portfolioLoaded:true,
        remainingTokens:Object.keys(this.props.availableTokens),
      });
    }
  }

  render() {

    const cellTextProps = {
      fontSize:[1,2],
      fontWeight:3,
      color:'cellText'
    };

    return (
      <Box width={1}>
        <Title my={[3,4]}>Best-yield strategy</Title>
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
                    <Flex id="portfolio-composition" width={[1,0.38]} flexDirection={'column'}>
                      <DashboardCard
                        title={'Composition'}
                      >
                        <PortfolioDonut
                          {...this.props}
                          parentId={'portfolio-composition'}
                        />
                      </DashboardCard>
                    </Flex>
                    <Flex id="portfolio-performance" width={[1,0.60]} flexDirection={'column'}>
                      <DashboardCard
                        title={'Performance'}
                      >
                        <PortfolioEquity
                          {...this.props}
                          enabledTokens={[]}
                          parentId={'portfolio-performance'}
                          parentIdHeight={'portfolio-composition'}
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
                      textAlign={'center'}
                    >
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
                      dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
                      ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
                      eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
                      deserunt mollit anim id est laborum.
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
                      id="deposited-assets"
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
                          fontSize={4}
                          fontWeight={[3,4]}
                        >
                          Deposited assets
                        </Heading.h4>
                      </Flex>
                      <AssetsList
                        enabledTokens={this.state.depositedTokens}
                        cols={[
                          {
                            title:'CURRENCY',
                            props:{
                              width:0.15
                            },
                            fields:[
                              {
                                name:'icon',
                                props:{
                                  mr:2,
                                  height:'2.3em'
                                }
                              },
                              {
                                name:'tokenName',
                                props:cellTextProps
                              }
                            ]
                          },
                          {
                            title:'BALANCE',
                            props:{
                              width:0.15,
                            },
                            fields:[
                              {
                                name:'tokenBalance',
                                props:cellTextProps
                              }
                            ]
                          },
                          {
                            title:'POOL',
                            props:{
                              width:0.14,
                            },
                            fields:[
                              {
                                name:'pool',
                                props:cellTextProps
                              }
                            ]
                          },
                          {
                            title:'APY',
                            props:{
                              width:0.11,
                            },
                            fields:[
                              {
                                name:'apy',
                                props:cellTextProps
                              }
                            ]
                          },
                          {
                            title:'DEPOSITED',
                            props:{
                              width:0.14,
                            },
                            fields:[
                              {
                                name:'amountLent',
                                props:cellTextProps
                              }
                            ]
                          },
                          {
                            title:'EARNINGS %',
                            props:{
                              width:0.14,
                            },
                            fields:[
                              {
                                name:'earningsPerc',
                                props:cellTextProps
                              }
                            ]
                          },
                          {
                            title:'',
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
                          fontSize={4}
                          fontWeight={[3,4]}
                        >
                          Available assets
                        </Heading.h4>
                      </Flex>
                      <AssetsList
                        enabledTokens={this.state.remainingTokens}
                        cols={[
                          {
                            title:'CURRENCY',
                            props:{
                              width:0.15
                            },
                            fields:[
                              {
                                name:'icon',
                                props:{
                                  mr:2,
                                  height:'2.3em'
                                }
                              },
                              {
                                name:'tokenName',
                                props:cellTextProps
                              }
                            ]
                          },
                          {
                            title:'BALANCE',
                            props:{
                              width:0.15,
                            },
                            fields:[
                              {
                                name:'tokenBalance',
                                props:cellTextProps
                              }
                            ]
                          },
                          {
                            title:'POOL',
                            props:{
                              width:0.15,
                            },
                            fields:[
                              {
                                name:'pool',
                                props:cellTextProps
                              }
                            ]
                          },
                          {
                            title:'APY',
                            props:{
                              width: this.state.depositedTokens.length>0 ? 0.11 : 0.14,
                            },
                            fields:[
                              {
                                name:'apy',
                                props:cellTextProps
                              }
                            ]
                          },
                          {
                            title:'APR LAST WEEK',
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
                            props:{
                              width:0.17,
                            },
                            parentProps:{
                              width:1
                            },
                            fields:[
                              {
                                name:'button',
                                label:'Deposit',
                                props:{
                                  width:1,
                                  fontSize:3,
                                  fontWeight:3,
                                  height:'45px',
                                  borderRadius:4,
                                  boxShadow:null,
                                  mainColor:'deposit',
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
                this.props.account && 
                  <Flex
                    mb={[3,4]}
                    width={1}
                    id="transactions"
                    flexDirection={'column'}
                  >
                    <Title my={[3,4]}>Transactions</Title>
                    <TransactionsList
                      {...this.props}
                      enabledTokens={[]}
                      cols={[
                        {
                          title:'TRANSACTIONS',
                          props:{
                            width:0.22
                          },
                          fields:[
                            {
                              name:'icon',
                              props:{
                                mr:2
                              }
                            },
                            {
                              name:'hash',
                              props:cellTextProps
                            }
                          ]
                        },
                        {
                          title:'ACTION',
                          props:{
                            width:0.15,
                          },
                          fields:[
                            {
                              name:'action',
                              props:cellTextProps
                            }
                          ]
                        },
                        {
                          title:'DATE',
                          props:{
                            width:0.18,
                          },
                          fields:[
                            {
                              name:'date',
                              props:cellTextProps
                            }
                          ]
                        },
                        {
                          title:'STATUS',
                          props:{
                            width:0.18,
                          },
                          fields:[
                            {
                              name:'statusIcon',
                              props:{
                                mr:2
                              }
                            },
                            {
                              name:'status',
                              props:cellTextProps
                            }
                          ]
                        },
                        {
                          title:'AMOUNT',
                          props:{
                            width:0.15,
                          },
                          fields:[
                            {
                              name:'amount',
                              props:cellTextProps
                            },
                          ]
                        },
                        {
                          title:'TOKEN',
                          props:{
                            width:0.13,
                          },
                          fields:[
                            {
                              name:'tokenIcon',
                              props:{
                                mr:2,
                                height:'1.6em',
                              }
                            },
                            {
                              name:'tokenName',
                              props:cellTextProps
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

export default RiskAdjustedStrategy;