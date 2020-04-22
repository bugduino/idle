import theme from '../theme';
import Title from '../Title/Title';
import React, { Component } from 'react';
// import FlexLoader from '../FlexLoader/FlexLoader';
import { Flex, Box, Heading } from "rimble-ui";
import AssetField from '../AssetField/AssetField';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';
import DepositRedeem from '../DepositRedeem/DepositRedeem';
import PortfolioEquity from '../PortfolioEquity/PortfolioEquity';
import TransactionsList from '../TransactionsList/TransactionsList';

class AssetPage extends Component {

  state = {
    tokenBalance:{},
    idleTokenBalance:{},
    componentMounted:false
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

  async loadTokensBalance(){
    if (this.props.account){
      const newState = {...this.state};
      await this.functionsUtil.asyncForEach(Object.keys(this.props.availableTokens),async (token) => {
        const tokenConfig = this.props.availableTokens[token];
        newState.tokenBalance[token] = await this.functionsUtil.getTokenBalance(token,this.props.account);
        newState.idleTokenBalance[token] = await this.functionsUtil.getTokenBalance(tokenConfig.idle.token,this.props.account);
      });
      newState.componentMounted = true;
      this.setState(newState);
    }
  }

  async componentWillMount(){
    this.loadUtils();
    await this.loadTokensBalance();
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();

    const accountChanged = prevProps.account !== this.props.account;
    if (accountChanged){
      this.loadTokensBalance();
    }
  }

  render() {

    const cellTextProps = {
      fontSize:[1,2],
      fontWeight:3,
      color:'cellText'
    };

    const userHasFunds = this.props.account && this.state.idleTokenBalance[this.props.selectedToken] && this.functionsUtil.BNify(this.state.idleTokenBalance[this.props.selectedToken]).gt(0);

    return (
      <Flex
        width={1}
        alignItems={'center'}
        flexDirection={'column'}
        justifyContent={'center'}
      >
        <Title my={[3,4]}>Deposit / Redeem</Title>
        <Flex
          width={1}
        >
          <DepositRedeem
            {...this.props}
            tokenBalance={this.state.tokenBalance[this.props.selectedToken]}
            idleTokenBalance={this.state.idleTokenBalance[this.props.selectedToken]}
          />
        </Flex>
        {
          userHasFunds &&
            <Box
              width={1}>
              <Flex
                mb={[3,4]}
                width={1}
                id={'transactions'}
                flexDirection={'column'}
              >
                <Title my={[3,4]}>Funds Overview</Title>
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
                      flexDirection={'row'}
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
              </Flex>
              <Flex
                mb={[3,4]}
                width={1}
                id={'transactions'}
                flexDirection={'column'}
              >
                <Title my={[3,4]}>Transactions</Title>
                <TransactionsList
                  {...this.props}
                  enabledTokens={[this.props.selectedToken]}
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
            </Box>
        }
      </Flex>
    );
  }
}

export default AssetPage;