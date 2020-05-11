import { Flex } from "rimble-ui";
import Title from '../Title/Title';
import React, { Component } from 'react';
import Breadcrumb from '../Breadcrumb/Breadcrumb';
import FunctionsUtil from '../utilities/FunctionsUtil';
import FundsOverview from '../FundsOverview/FundsOverview';
import DepositRedeem from '../DepositRedeem/DepositRedeem';
import TransactionsList from '../TransactionsList/TransactionsList';
import EstimatedEarnings from '../EstimatedEarnings/EstimatedEarnings';

class AssetPage extends Component {

  state = {
    tokenBalance:{},
    tokenApproved:{},
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

        const [tokenBalance,idleTokenBalance,tokenApproved] = await Promise.all([
          this.functionsUtil.getTokenBalance(token,this.props.account),
          this.functionsUtil.getTokenBalance(tokenConfig.idle.token,this.props.account)
        ]);

        newState.tokenBalance[token] = tokenBalance;
        newState.tokenApproved[token] = tokenApproved;
        newState.idleTokenBalance[token] = idleTokenBalance;
      });

      // console.log(newState);

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

    // console.log('selectedToken',this.props.selectedToken);
    const transactionsChanged = prevProps.transactions && this.props.transactions && Object.values(prevProps.transactions).filter(tx => (tx.status==='success')).length !== Object.values(this.props.transactions).filter(tx => (tx.status==='success')).length;
    const accountChanged = prevProps.account !== this.props.account;
    if (accountChanged || transactionsChanged){
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
        <Flex
          width={1}
          mb={[3,4]}
          justifyContent={'flex-start'}
        >
          <Breadcrumb
            path={[this.props.selectedToken]}
            handleClick={ e => this.props.goToSection(this.props.selectedStrategy) }
            text={this.functionsUtil.getGlobalConfig(['strategies',this.props.selectedStrategy,'title'])}
          />
        </Flex>
        <Title
          mb={[3,4]}
        >
          Deposit / Redeem
        </Title>
        <Flex
          width={1}
        >
          <DepositRedeem
            {...this.props}
            tokenBalance={this.state.tokenBalance[this.props.selectedToken]}
            tokenApproved={this.state.tokenApproved[this.props.selectedToken]}
            idleTokenBalance={this.state.idleTokenBalance[this.props.selectedToken]}
          />
        </Flex>
        {
          userHasFunds &&
            <Flex
              mb={[3,4]}
              width={1}
              id={'funds-overview-container'}
              flexDirection={'column'}
            >
              <Title my={[3,4]}>Funds Overview</Title>
              <FundsOverview
                {...this.props}
              />
            </Flex>
        }
        <Flex
          mb={[3,4]}
          width={1}
          id={'funds-overview-container'}
          flexDirection={'column'}
        >
          <Title my={[3,4]}>Estimated earnings</Title>
          <EstimatedEarnings
            {...this.props}
          />
        </Flex>
        {
          this.props.account && 
            <Flex
              mb={[3,4]}
              width={1}
              id={'transactions-container'}
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