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
        <Heading.h1 color={'dark-gray'} fontWeight={4} lineHeight={'initial'} fontSize={[4,5]} mb={[3,5]} textAlign={'center'}>
          Best-Yield Dashboard
        </Heading.h1>
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
        <Flex id="available-assets" width={1} flexDirection={['column','row']}>
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
                    name:'idleTokenBalance',
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
        {
        this.props.selectedToken &&
          <TransactionsList
            {...this.props}
          />
        }
      </Box>
    );
  }
}

export default RiskAdjustedStrategy;
