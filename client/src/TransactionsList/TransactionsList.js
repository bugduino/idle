import React, { Component } from 'react';
// import style from './TransactionsList.module.scss';
import TableRow from '../TableRow/TableRow';
import FlexLoader from '../FlexLoader/FlexLoader';
import TableHeader from '../TableHeader/TableHeader';
import FunctionsUtil from '../utilities/FunctionsUtil';
import { Flex, Heading, Text, Link, Icon } from "rimble-ui";
import TransactionField from '../TransactionField/TransactionField';
import TransactionListFilters from '../TransactionListFilters/TransactionListFilters';

class TransactionsList extends Component {

  state = {
    page:1,
    prevTxs:{},
    txsPerPage:5,
    loading:false,
    totalTxs:null,
    totalPages:null,
    activeFilters:{
      status:null,
      assets:null,
      actions:null,
    },
    filters:{
      actions:{
        deposit:'Deposit',
        redeem:'Redeem',
        send:'Send',
        receive:'Receive',
        migrate:'Migrate',
        swap:'Swap-In',
        swapout:'Swap-Out',
        withdraw:'Withdraw',
        // curvein:'CurveIn',
        // curveout:'CurveOut',
        // curvezapin:'CurveZapIn',
        // curvezapout:'CurveZapOut',
      },
      status:{
        completed:'Completed',
        pending:'Pending',
        failed:'Failed'
      },
      assets:{}
    },
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
    const page = Math.min(this.state.totalPages,this.state.page+1);this.processTxs(page);
    this.setState({
      page
    });
  }

  async componentDidMount(){
    this.loadUtils();
    this.loadTxs();
  }

  applyFilters = activeFilters => {
    this.setState({
      activeFilters
    },() => {
      this.processTxs();
    });
  }

  resetFilters = () => {
    this.setState({
      activeFilters:{
        status:null,
        assets:null,
        actions:null,
      }
    },() => {
      this.processTxs();
    });
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

    const assets = {...this.state.filters.assets};

    enabledTokens.forEach((token) => {
      assets[token] = token;
    });

    let actions = {...this.state.filters.actions};
    
    const enabledActions = typeof this.props.enabledActions !== 'undefined' ? this.props.enabledActions : [];

    if (enabledActions.length){
      actions = {};
      enabledActions.forEach( action => {
        actions[action.toLowerCase()] = action;
      });
    }

    const etherscanTxs = await this.functionsUtil.getEtherscanTxs(this.props.account,lastBlockNumber,'latest',enabledTokens);

    // Merge new txs with previous ones
    if (etherscanTxs && etherscanTxs.length){
      etherscanTxs.forEach((tx) => {
        if (tx.hashKey){
          prevTxs[tx.hashKey] = tx;
        } else {
          prevTxs[`t${tx.timeStamp}`] = tx;
        }
      });
    }

    const lastTx = Object.values(prevTxs).pop();

    // Update last block number
    if (lastTx && lastTx.blockNumber && (!this.state.lastBlockNumber || lastTx.blockNumber>this.state.lastBlockNumber)){
      lastBlockNumber = parseInt(lastTx.blockNumber)+1;
    }

    return this.setState( prevState => ({
      prevTxs,
      loading:false,
      lastBlockNumber,
      filters:{
        ...prevState.filters,
        assets,
        actions
      }
    }), () => {
      this.processTxs()
    });
  };

  processTxs = (page=null) => {

    page = page ? page : this.state.page;

    const availableActions = Object.keys(this.state.filters.actions).map( action => (action.toLowerCase()) );

    // Sort prevTxs by timeStamp
    const txsIndexes = Object.values(this.state.prevTxs)
                        .filter(tx => (!!parseFloat(tx.value))) // Filter txs with value
                        .filter(tx => (
                          (this.state.activeFilters.status === null || tx.status.toLowerCase() === this.state.activeFilters.status.toLowerCase()) && 
                          (this.state.activeFilters.assets === null || tx.token.toLowerCase() === this.state.activeFilters.assets.toLowerCase()) &&
                          ( availableActions.includes(tx.action.toLowerCase()) && (this.state.activeFilters.actions === null || (tx.action.toLowerCase() === this.state.activeFilters.actions.toLowerCase()) ))
                        )) // Filter by activeFilters
                        .sort((a,b) => (a.timeStamp > b.timeStamp) ? -1 : 1 );

    // Calculate max number of pages
    const totalTxs = txsIndexes.length;
    const totalPages = Math.ceil(totalTxs/this.state.txsPerPage);

    const processedTxs = [];

    // console.log(this.state.prevTxs,txsIndexes);

    txsIndexes.forEach((tx, i) => {
      const selectedToken = tx.token;
      const tokenConfig = this.props.availableTokens[selectedToken];
      const decimals = Math.min(tokenConfig.decimals,8);
      
      const date = new Date(tx.timeStamp*1000);
      const action = tx.action ? tx.action : this.functionsUtil.getTxAction(tx,tokenConfig);

      const parsedValue = parseFloat(tx.value);

      const amount = parsedValue ? (this.props.isMobile ? parsedValue.toFixed(4) : parsedValue.toFixed(decimals)) : '-';
      const momentDate = this.functionsUtil.strToMoment(date);

      // Save new params
      tx.status = tx.status ? tx.status : 'Completed';
      tx.action = action;
      tx.momentDate = momentDate;
      tx.amount = amount;

      if (i>=((page-1)*this.state.txsPerPage) && i<((page-1)*this.state.txsPerPage)+this.state.txsPerPage) {
        processedTxs.push(tx);
      }
    });

    // console.log('processedTxs',this.state.page,txsIndexes,processedTxs);

    const loading = false;
  
    this.setState({
      loading,
      totalTxs,
      totalPages,
      processedTxs
    });
  }

  render() {

    const hasActiveFilters = Object.values(this.state.activeFilters).filter( v => (v !== null) ).length>0;

    // console.log('processedTxs',this.state.processedTxs);
    const processedTxs = this.state.processedTxs ? Object.values(this.state.processedTxs) : null;

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
          ) : (
            <Flex
              width={1}
              position={'relative'}
              flexDirection={'column'}
              id={'transactions-list-container'}
              pt={[0, hasActiveFilters ? '116px' : 5]}
            >
              <TransactionListFilters
                {...this.props}
                filters={this.state.filters}
                activeFilters={this.state.activeFilters}
                resetFilters={this.resetFilters.bind(this)}
                applyFilters={this.applyFilters.bind(this)}
              />
              {
                processedTxs && processedTxs.length ? (
                  <Flex
                    width={1}
                    flexDirection={'column'}
                  >
                    <TableHeader
                      cols={this.props.cols}
                      isMobile={this.props.isMobile}
                    />
                    <Flex
                      id={'transactions-list'}
                      flexDirection={'column'}
                    >
                      {
                        processedTxs.map( (tx,index) => {
                          const txHash = tx.hash;
                          const txHashKey = tx.hashKey;
                          const handleClick = (e) => {
                            return (txHash ? window.open(`https://etherscan.io/tx/${txHash}`) : null);
                          };

                          return (
                            <TableRow
                              {...this.props}
                              rowProps={{
                                isInteractive:true
                              }}
                              hash={txHash}
                              transaction={tx}
                              key={`tx-${index}`}
                              handleClick={handleClick}
                              rowId={`tx-col-${txHashKey}`}
                              cardId={`tx-card-${txHashKey}`}
                              fieldComponent={TransactionField}
                            />
                          );
                        })
                      }
                    </Flex>
                    <Flex
                      height={'50px'}
                      alignItems={'center'}
                      flexDirection={'row'}
                      justifyContent={'flex-end'}
                      id={'transactions-list-pagination'}
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
          )
        }
      </Flex>
    );
  }
}

export default TransactionsList;
