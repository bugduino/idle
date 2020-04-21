import Title from '../Title/Title';
import React, { Component } from 'react';
// import FlexLoader from '../FlexLoader/FlexLoader';
import { Flex, Box } from "rimble-ui";
import FunctionsUtil from '../utilities/FunctionsUtil';
import DepositRedeem from '../DepositRedeem/DepositRedeem';
import TransactionsList from '../TransactionsList/TransactionsList';

class AssetPage extends Component {

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
      <Flex
        width={1}
        alignItems={'center'}
        flexDirection={'column'}
        justifyContent={'center'}
      >
        <Title my={[3,4]}>Deposit / Redeem</Title>
        <Flex
          width={0.36}
        >
          <DepositRedeem
            {...this.props}
          />
        </Flex>

        {
          this.props.account && 
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
        }
      </Flex>
    );
  }
}

export default AssetPage;