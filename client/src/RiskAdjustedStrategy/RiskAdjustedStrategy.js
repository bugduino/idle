import Title from '../Title/Title';
import React, { Component } from 'react';
import AssetsList from '../AssetsList/AssetsList';
import FunctionsUtil from '../utilities/FunctionsUtil';
import PortfolioDonut from '../PortfolioDonut/PortfolioDonut';
import TransactionsList from '../TransactionsList/TransactionsList';
import { Flex, Box, Heading } from "rimble-ui";

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
      fontSize:1,
      fontWeight:3,
      color:'cellText'
    };

    return (
      <Box width={1}>
        <Title my={[3,4]}>Best-Yield Dashboard</Title>
        <Flex id="portfolio-charts" width={1} flexDirection={['column','row']}>
          <Flex id="portfolio-composition" width={[1,0.35]} flexDirection={'column'}>
            <Heading.h4 color={'dark-gray'} fontWeight={4} lineHeight={'initial'} fontSize={2} textAlign={'left'}>
              Composition
            </Heading.h4>
            <PortfolioDonut
              {...this.props}
              parentId={'portfolio-composition'}
            />
          </Flex>
          <Flex width={[1,0.65]} flexDirection={'column'}>
            <Heading.h4 color={'dark-gray'} fontWeight={4} lineHeight={'initial'} fontSize={2} textAlign={'left'}>
              Performance
            </Heading.h4>
          </Flex>
        </Flex>
        <Flex id="available-assets" width={1} flexDirection={'column'}>
          <Title my={[3,4]}>Available assets</Title>
          <AssetsList
            cols={[
              {
                title:'CURRENCY',
                props:{
                  width:0.16
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
                title:'WALLET BALANCE',
                props:{
                  width:0.23,
                },
                fields:[
                  {
                    name:'tokenBalance',
                    props:cellTextProps
                  }
                ]
              },
              {
                title:'DEPOSITED FUNDS',
                props:{
                  width:0.23,
                },
                fields:[
                  {
                    name:'depositedBalance',
                    props:cellTextProps
                  }
                ]
              },
              {
                title:'APY',
                props:{
                  width:0.1,
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
                fields:[]
              }
            ]}
            {...this.props}
          />
        </Flex>
        <Flex id="transactions" width={1} flexDirection={'column'}>
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
                title:'TOKEN',
                props:{
                  width:0.15,
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
              {
                title:'AMOUNT',
                props:{
                  width:0.13,
                },
                fields:[
                  {
                    name:'amount',
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
