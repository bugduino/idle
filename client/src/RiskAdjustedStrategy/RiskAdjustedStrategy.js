import Title from '../Title/Title';
import React, { Component } from 'react';
import AssetsList from '../AssetsList/AssetsList';
import { Flex, Box } from "rimble-ui";
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';
import PortfolioDonut from '../PortfolioDonut/PortfolioDonut';
import PortfolioEquity from '../PortfolioEquity/PortfolioEquity';
import TransactionsList from '../TransactionsList/TransactionsList';

// const env = process.env;

class RiskAdjustedStrategy extends Component {

  state = {};

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
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();
  }

  render() {

    const cellTextProps = {
      fontSize:[1,2],
      fontWeight:3,
      color:'cellText'
    };

    return (
      <Box width={1}>
        <Title my={[3,4]}>Best-Yield Dashboard</Title>
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
              />
            </DashboardCard>
          </Flex>
        </Flex>
        <Flex id="available-assets" width={1} flexDirection={'column'}>
          <Title my={[3,4]}>Available assets</Title>
          <AssetsList
            cols={[
              {
                title:'CURRENCY',
                props:{
                  width:0.13
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
                  width:0.13,
                },
                fields:[
                  {
                    name:'tokenBalance',
                    props:cellTextProps
                  }
                ]
              },
              {
                title:'DEPOSITED',
                props:{
                  width:0.13,
                },
                fields:[
                  {
                    name:'amountLent',
                    props:cellTextProps
                  }
                ]
              },
              {
                title:'POOL',
                props:{
                  width:0.10,
                },
                fields:[
                  {
                    name:'pool',
                    props:cellTextProps
                  }
                ]
              },
              {
                title:'EARNINGS %',
                props:{
                  width:0.12,
                },
                fields:[
                  {
                    name:'earningsPerc',
                    props:cellTextProps
                  }
                ]
              },
              {
                title:'APY',
                props:{
                  width:0.11,
                  textAlign:'center',
                  justifyContent:'center'
                },
                fields:[
                  {
                    name:'apy',
                    props:cellTextProps
                  }
                ]
              },
              {
                title:'',
                props:{
                  width:0.28,
                },
                parentProps:{
                  width:1
                },
                fields:[
                  {
                    name:'button',
                    label:'Redeem',
                    props:{
                      width:1,
                      mr:[0,1],
                      fontWeight:3,
                      height:'45px',
                      borderRadius:4,
                      boxShadow:null,
                      mainColor:'redeem',
                    }
                  },
                  {
                    name:'button',
                    label:'Deposit',
                    props:{
                      width:1,
                      ml:[0,1],
                      fontWeight:3,
                      height:'45px',
                      borderRadius:4,
                      boxShadow:null,
                      mainColor:'deposit'
                    }
                  }
                ]
              }
            ]}
            {...this.props}
          />
        </Flex>
        <Flex
          width={1}
          id="transactions"
          flexDirection={'column'}
        >
          <Title my={[3,4]}>Transactions</Title>
          <TransactionsList
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
                      height:'1.5em',
                    }
                  },
                  {
                    name:'tokenName',
                    props:cellTextProps
                  },
                ]
              },
            ]}
            {...this.props}
          />
        </Flex>
      </Box>
    );
  }
}

export default RiskAdjustedStrategy;
