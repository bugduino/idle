import React, { Component } from 'react';
// import style from './TransactionsList.module.scss';
import TableRow from '../TableRow/TableRow';
import FlexLoader from '../FlexLoader/FlexLoader';
import TableHeader from '../TableHeader/TableHeader';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';
import { Flex, Heading, Text, Link, Icon } from "rimble-ui";
import TransactionField from '../TransactionField/TransactionField';

class TransactionsList extends Component {

  state = {
    page:1,
    txsPerPage:5,
    prevTxs:{},
    loading:false,
    totalTxs:null,
    totalPages:null,
    renderedTxs:null,
    processedTxs:null,
    lastBlockNumber:null
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

  prevPage(e){
    if (e){
      e.preventDefault();
    }
    const page = Math.max(1,this.state.page-1);
    this.setState({
      page
    });
  }

  nextPage(e){
    if (e){
      e.preventDefault();
    }
    const page = Math.min(this.state.totalPages,this.state.page+1);
    this.setState({
      page
    });
  }

  async componentDidMount(){
    this.loadUtils();
    this.loadTxs();
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();
    const transactionsChanged = JSON.stringify(prevProps.transactions) !== JSON.stringify(this.props.transactions);
    const tokenChanged = JSON.stringify(prevProps.enabledTokens) !== JSON.stringify(this.props.enabledTokens);

    if (tokenChanged || transactionsChanged){
      this.setState({
        page:1,
        prevTxs:{}
      },()=>{
        this.loadTxs();
      })
      return false;
    }
    const pageChanged = prevState.page !== this.state.page;
    if (pageChanged){
      this.processTxs();
    }
  }

  async loadTxs(count,endBlockNumber='latest'){
    if (!this.props.account){
      return false;
    }

    count = count ? count : 0;

    this.setState({
      loading:true
    });

    const firstBlockNumber = this.functionsUtil.getGlobalConfig(['network','firstBlockNumber']);

    // Take last block number, is null take first block number
    let prevTxs = {...this.state.prevTxs};
    let lastBlockNumber = Math.max(firstBlockNumber,this.state.lastBlockNumber);

    let enabledTokens = this.props.enabledTokens;
    if (!enabledTokens || !enabledTokens.length){
      enabledTokens = Object.keys(this.props.availableTokens);
    }

    const etherscanTxs = await this.functionsUtil.getEtherscanTxs(this.props.account,lastBlockNumber,'latest',enabledTokens);

    // Merge new txs with previous ones
    if (etherscanTxs && etherscanTxs.length){
      etherscanTxs.forEach((tx) => {
        if (tx.hash){
          prevTxs[tx.hash] = tx;
        } else {
          prevTxs[`t${tx.timeStamp}`] = tx;
        }
      });
    }

    // console.log('prevTxs',prevTxs);

    const lastTx = Object.values(prevTxs).pop();

    // Update last block number
    if (lastTx && lastTx.blockNumber && (!this.state.lastBlockNumber || lastTx.blockNumber>this.state.lastBlockNumber)){
      lastBlockNumber = parseInt(lastTx.blockNumber)+1;
    }

    return this.setState({
      prevTxs,
      loading:false,
      lastBlockNumber
    }, () => {
      this.processTxs()
    });
  };

  processTxs(){

    // let totalInterestsAccrued = 0;
    let depositedSinceLastRedeem = 0;
    let totalRedeemed = 0;

    // Sort prevTxs by timeStamp
    const txsIndexes = Object.values(this.state.prevTxs)
                        .filter(tx => (!!parseFloat(tx.value)))
                        .sort((a,b) => (a.timeStamp > b.timeStamp) ? -1 : 1 );

    // Calculate max number of pages
    const totalTxs = txsIndexes.length;
    const totalPages = Math.ceil(totalTxs/this.state.txsPerPage);

    const processedTxs = [];

    txsIndexes.forEach((tx, i) => {
      const selectedToken = tx.token;
      const tokenConfig = this.props.availableTokens[selectedToken];
      const decimals = Math.min(tokenConfig.decimals,8);
      
      const date = new Date(tx.timeStamp*1000);
      let action = tx.action ? tx.action : this.functionsUtil.getTxAction(tx,tokenConfig);

      const parsedValue = parseFloat(tx.value);

      const amount = parsedValue ? (this.props.isMobile ? parsedValue.toFixed(4) : parsedValue.toFixed(decimals)) : '-';
      const momentDate = this.functionsUtil.strToMoment(date);
      let interest = null;
      switch (action) {
        case 'Deposit':
          depositedSinceLastRedeem+=parsedValue;
        break;
        case 'Redeem':
          totalRedeemed += Math.abs(parsedValue);
          if (totalRedeemed<depositedSinceLastRedeem){
            interest = null;
          } else {
            interest = totalRedeemed-depositedSinceLastRedeem;
            interest = interest>0 ? '+'+(this.props.isMobile ? parseFloat(interest).toFixed(4) : parseFloat(interest).toFixed(decimals))+' '+selectedToken : null;
            depositedSinceLastRedeem -= totalRedeemed;
            depositedSinceLastRedeem = Math.max(0,depositedSinceLastRedeem);
            totalRedeemed = 0;
          }
        break;
        default:
        break;
      }

      // Save new params
      tx.status = tx.status ? tx.status : 'Completed';
      tx.action = action;
      tx.momentDate = momentDate;
      tx.amount = amount;
      tx.interest = interest;

      if (i>=((this.state.page-1)*this.state.txsPerPage) && i<((this.state.page-1)*this.state.txsPerPage)+this.state.txsPerPage){
        processedTxs.push(tx);
      }
    });
  
    this.setState({
      totalTxs,
      totalPages,
      processedTxs,
      loading:false
    });
  }

  render() {
    return (
      <Flex flexDirection={'column'} width={1} m={'0 auto'}>
        {
          this.state.loading ? (
            <FlexLoader
              flexProps={{
                flexDirection:'row',
                minHeight:this.props.height
              }}
              loaderProps={{
                size:'30px'
              }}
              textProps={{
                ml:2
              }}
              text={'Loading transactions...'}
            />
          ) : this.state.processedTxs && this.state.processedTxs.length ? (
            <Flex id="transactions-list-container" width={1} flexDirection={'column'}>
              <Flex
                mb={3}
                alignItems={'center'}
                flexDirection={'row'}
                justifyContent={'flex-start'}
              >
                <DashboardCard
                  cardProps={{
                    py:2,
                    px:3,
                    width:[1,1/6]
                  }}
                  isInteractive={true}
                >
                  <Flex
                    width={1}
                    alignItems={'center'}
                    flexDirection={'row'}
                    justifyContent={'space-between'}
                  >
                    <Text
                      fontSize={2}
                      fontWeight={500}
                      color={'copyColor'}
                    >
                      Filters
                    </Text>
                    <Icon
                      size={'1.5em'}
                      name={'Tune'}
                      color={'copyColor'}
                    />
                  </Flex>
                </DashboardCard>
              </Flex>
              <TableHeader
                cols={this.props.cols}
              />
              <Flex id="transactions-list" flexDirection={'column'}>
                {
                  this.state.processedTxs.map(transaction => {
                    const transactionHash = transaction.hash;
                    return (
                      <TableRow
                        {...this.props}
                        hash={transactionHash}
                        transaction={transaction}
                        key={`tx-${transactionHash}`}
                        fieldComponent={TransactionField}
                        rowId={`tx-col-${transactionHash}`}
                        cardId={`tx-card-${transactionHash}`}
                      />
                    );
                  })
                }
              </Flex>
              <Flex
                height={'50px'}
                flexDirection={'row'}
                alignItems={'center'}
                justifyContent={'flex-end'}
                id="transactions-list-pagination"
              >
                <Flex mr={3}>
                  <Link mr={1} onClick={ e => this.prevPage(e) }>
                    <Icon
                      name={'KeyboardArrowLeft'}
                      size={'2em'}
                      color={ this.state.page>1 ? '#4f4f4f' : '#d8d8d8' }
                    />
                  </Link>
                  <Link onClick={ e => this.nextPage(e) }>
                    <Icon
                      name={'KeyboardArrowRight'}
                      size={'2em'}
                      color={ this.state.page<this.state.totalPages ? '#4f4f4f' : '#d8d8d8' }
                    />
                  </Link>
                </Flex>
                <Flex alignItems={'center'}>
                  <Text 
                    fontSize={1}
                    fontWeight={3}
                    color={'cellText'}
                  >
                    Page {this.state.page} of {this.state.totalPages}
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          ) : (
            <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontWeight={2} fontSize={[2]} color={'dark-gray'}>
              There are no transactions
            </Heading.h3>
          )
        }
      </Flex>
    );
  }
}

export default TransactionsList;
