import theme from '../theme';
import Title from '../Title/Title';
import React, { Component } from 'react';
import { Flex, Icon, Text } from "rimble-ui";
import Breadcrumb from '../Breadcrumb/Breadcrumb';
import FunctionsUtil from '../utilities/FunctionsUtil';
import BuyModal from '../utilities/components/BuyModal';
import FundsOverview from '../FundsOverview/FundsOverview';
import DepositRedeem from '../DepositRedeem/DepositRedeem';
import DashboardCard from '../DashboardCard/DashboardCard';
import TransactionsList from '../TransactionsList/TransactionsList';
import EstimatedEarnings from '../EstimatedEarnings/EstimatedEarnings';

class AssetPage extends Component {

  state = {
    tokenBalance:{},
    tokenApproved:{},
    idleTokenBalance:{},
    buyModalOpened:false,
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

  setBuyModalOpened(buyModalOpened){
    this.setState({
      buyModalOpened
    });
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
          flexDirection={['column','row']}
        >
          <Flex
            width={[1,0.5]}
          >
            <Breadcrumb
              isMobile={this.props.isMobile}
              path={[this.props.selectedToken]}
              handleClick={ e => this.props.goToSection(this.props.selectedStrategy) }
              text={this.functionsUtil.getGlobalConfig(['strategies',this.props.selectedStrategy,'title'])}
            />
          </Flex>
          <Flex
            mt={[3,0]}
            width={[1,0.5]}
            justifyContent={'flex-end'}
          >
            <DashboardCard
              cardProps={{
                py:1,
                px:['12px',3],
                width:['100%','auto'],
              }}
              isInteractive={true}
              handleClick={ e => this.setBuyModalOpened(true) }
            >
              <Flex
                my={1}
                alignItems={'center'}
                flexDirection={'row'}
                justifyContent={'center'}
              >
                <Flex
                  mr={2}
                  p={'4px'}
                  borderRadius={'50%'}
                  alignItems={'center'}
                  justifyContent={'center'}
                  backgroundColor={ theme.colors.transactions.actionBg.redeem }
                >
                  <Icon
                    name={'Add'}
                    align={'center'}
                    color={'redeem'}
                    size={ this.props.isMobile ? '1.3em' : '1.6em' }
                  />
                </Flex>
                <Text
                  fontSize={[2,3]}
                  fontWeight={3}
                >
                  Add Funds
                </Text>
              </Flex>
            </DashboardCard>
          </Flex>
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
              mb={[0,4]}
              width={1}
              flexDirection={'column'}
              id={'funds-overview-container'}
            >
              <Title my={[3,4]}>Funds Overview</Title>
              <FundsOverview
                {...this.props}
              />
            </Flex>
        }
        {
        this.props.account && 
          <Flex
            mb={[3,4]}
            width={1}
            flexDirection={'column'}
            id={'estimated-earnings-container'}
          >
            <Title my={[3,4]}>Estimated earnings</Title>
            <EstimatedEarnings
              {...this.props}
            />
          </Flex>
        }
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
                    width:0.32,
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
                    width:0.18,
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
                    width:0.21,
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
                    width:0.15,
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
        <BuyModal
          {...this.props}
          isOpen={this.state.buyModalOpened}
          buyToken={this.props.selectedToken}
          closeModal={ e => this.setBuyModalOpened(false) }
        />
      </Flex>
    );
  }
}

export default AssetPage;