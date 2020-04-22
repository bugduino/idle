import React, { Component } from 'react';
// import style from './TransactionsList.module.scss';
import TableRow from '../TableRow/TableRow';
import FlexLoader from '../FlexLoader/FlexLoader';
import TableHeader from '../TableHeader/TableHeader';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';
import TransactionField from '../TransactionField/TransactionField';
import { Flex, Box, Heading, Text, Link, Icon, Card } from "rimble-ui";

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
    const tokenChanged = JSON.stringify(prevProps.enabledTokens) !== JSON.stringify(this.props.enabledTokens);
    if (tokenChanged){
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
    let prevTxs = this.state.prevTxs ? Object.assign({},this.state.prevTxs) : {};
    let lastBlockNumber = Math.max(firstBlockNumber,this.state.lastBlockNumber);

    let enabledTokens = this.props.enabledTokens;
    if (!enabledTokens || !enabledTokens.length){
      enabledTokens = Object.keys(this.props.availableTokens);
    }

    const etherscanTxs = await this.functionsUtil.getEtherscanTxs(this.props.account,lastBlockNumber,'latest',enabledTokens);

    // Merge new txs with previous ones
    if (etherscanTxs && etherscanTxs.length){
      etherscanTxs.forEach((tx) => {
        prevTxs[tx.hash] = tx;
      });
    }

    let amountLent = this.functionsUtil.BNify(0);

    // Take storedTxs from localStorage
    const storedTxs = this.functionsUtil.getStoredItem('transactions',true,{});
    
    // Inizialize storedTxs for pair account-token if empty
    if (typeof storedTxs[this.props.account] !== 'object'){
      storedTxs[this.props.account] = {};
    }

    await this.functionsUtil.asyncForEach(enabledTokens,async (selectedToken) => {

      const tokenConfig = this.props.availableTokens[selectedToken];

      if (typeof storedTxs[this.props.account][selectedToken] !== 'object'){
        storedTxs[this.props.account][selectedToken] = {};
      }

      // Check if this is the first interaction with Idle
      let avgBuyPrice = this.functionsUtil.BNify(0);

      const tokenDecimals = tokenConfig.decimals;
      const oldContractAddr = tokenConfig.migration && tokenConfig.migration.oldContract ? tokenConfig.migration.oldContract.address.replace('x','').toLowerCase() : null;

      // console.log('enabledTokens',enabledTokens);
      const filteredTxs = Object.values(prevTxs).filter(tx => (tx.token === selectedToken));

      if (filteredTxs && filteredTxs.length){

        const lastTx = filteredTxs[Object.values(filteredTxs).pop()];

        // Update last block number
        if (lastTx && lastTx.blockNumber && (!this.state.lastBlockNumber || lastTx.blockNumber>this.state.lastBlockNumber)){
          lastBlockNumber = parseInt(lastTx.blockNumber)+1;
        }

        // Loop through filteredTxs to have all the history
        await this.functionsUtil.asyncForEach(filteredTxs,async (tx,index) => {

          const txKey = `tx${tx.timeStamp}000`;
          const storedTx = storedTxs[this.props.account][selectedToken][txKey] ? storedTxs[this.props.account][selectedToken][txKey] : tx;

          let tokenPrice = null;
          if (storedTx.tokenPrice){
            tokenPrice = this.functionsUtil.BNify(storedTx.tokenPrice);
          } else {
            tokenPrice = await this.functionsUtil.genericContractCall(tokenConfig.idle.token, 'tokenPrice',[],{}, tx.blockNumber);
            tokenPrice = this.functionsUtil.fixTokenDecimals(tokenPrice,tokenConfig.decimals);
            storedTx.tokenPrice = tokenPrice;
          }

          let tokensTransfered = tokenPrice.times(this.functionsUtil.BNify(tx.value));

          // Add transactionHash to storedTx
          if (!storedTx.transactionHash){
            storedTx.transactionHash = tx.hash;
          }

          // Deposited
          switch (storedTx.action){
            case 'Send':
              // amountLent = amountLent.plus(this.functionsUtil.BNify(tx.value));

              // Decrese amountLent by the last idleToken price
              amountLent = amountLent.minus(tokensTransfered);

              if (amountLent.lte(0)){
                amountLent = this.functionsUtil.BNify(0);
                avgBuyPrice = this.functionsUtil.BNify(0);
              }

              // console.log(`${selectedToken} - Send of ${tx.value} (${tokensTransfered}) - amountLent: ${amountLent}`);

              storedTx.value = tokensTransfered;
            break;
            case 'Receive':

              // Decrese amountLent by the last idleToken price
              amountLent = amountLent.plus(tokensTransfered);

              // Calculate avgBuyPrice for current earnings
              avgBuyPrice = avgBuyPrice.plus(tokensTransfered);

              // console.log(`${selectedToken} - Receive of ${tx.value} (${tokensTransfered}) - amountLent: ${amountLent}`);

              storedTx.value = tokensTransfered;
            break;
            case 'Swap':
              // Decrese amountLent by the last idleToken price
              amountLent = amountLent.plus(tokensTransfered);

              // Calculate avgBuyPrice for current earnings
              avgBuyPrice = avgBuyPrice.plus(tokensTransfered);

              storedTx.value = tokensTransfered;

              // console.log(`${selectedToken} - Swap In of ${tx.value} (${tokensTransfered}) - amountLent: ${amountLent}`);
            break;
            case 'SwapOut':
              // Decrese amountLent by the last idleToken price
              amountLent = amountLent.minus(tokensTransfered);

              if (amountLent.lte(0)){
                amountLent = this.functionsUtil.BNify(0);
              }

              storedTx.value = tokensTransfered;

              // console.log(`${selectedToken} - Swap Out of ${tx.value} (${tokensTransfered}) - amountLent: ${amountLent}`);
            break;
            case 'Deposit':
              amountLent = amountLent.plus(this.functionsUtil.BNify(tx.value));

              if (!storedTx.idleTokens){

                // Init idleTokens amount
                storedTx.idleTokens = this.functionsUtil.BNify(tx.value);
                storedTx.method = 'mintIdleToken';

                const decodeLogs = [
                  {
                    "internalType": "uint256",
                    "name": "_tokenAmount",
                    "type": "uint256"
                  }
                ];

                const walletAddress = this.props.account.replace('x','').toLowerCase();
                const res = await this.functionsUtil.getTxDecodedLogs(tx,walletAddress,decodeLogs,storedTx);

                if (res){
                  const [txReceipt,logs] = res;

                  storedTx.idleTokens = this.functionsUtil.fixTokenDecimals(logs._tokenAmount,18);
                  storedTx.txReceipt = txReceipt;
                }
              }

              // Calculate avgBuyPrice for current earnings
              avgBuyPrice = avgBuyPrice.plus(tokensTransfered);

              // console.log(`${selectedToken} - Deposited ${tx.value} (${storedTx.idleTokens}), AmountLent: ${amountLent}`);
            break;
            case 'Redeem':

              const redeemedValueFixed = this.functionsUtil.BNify(storedTx.value);

              // Decrese amountLent by redeem amount
              amountLent = amountLent.minus(redeemedValueFixed);
              avgBuyPrice = avgBuyPrice.minus(tokensTransfered);

              // Reset amountLent if below zero
              if (amountLent.lt(0)){
                amountLent = this.functionsUtil.BNify(0);

                // Reset Avg Buy Price
                avgBuyPrice = this.functionsUtil.BNify(0);
              }

              // Set tx method
              if (!storedTx.method){
                storedTx.method = 'redeemIdleToken';
              }

              // console.log(`${selectedToken} - Redeemed ${redeemedValueFixed} (${storedTx.idleTokens}), AmountLent: ${amountLent}`);
            break;
            case 'Migrate':

              let migrationValueFixed = 0;

              if (!storedTx.migrationValueFixed){
                storedTx.method = 'bridgeIdleV1ToIdleV2';
                migrationValueFixed = this.functionsUtil.BNify(tx.value).times(tokenPrice);
                storedTx.migrationValueFixed = migrationValueFixed;
              } else {
                migrationValueFixed = this.functionsUtil.BNify(storedTx.migrationValueFixed);
              }
     
              storedTx.value = migrationValueFixed;

              amountLent = amountLent.plus(migrationValueFixed);

              // Calculate avgBuyPrice for current earnings
              tokensTransfered = tokenPrice.times(migrationValueFixed);
              avgBuyPrice = avgBuyPrice.plus(tokensTransfered);

              // console.log(`${selectedToken} - Migrated ${migrationValueFixed} (${storedTx.idleTokens}), AmountLent: ${amountLent}`);
            break;
            default:
            break;
          }

          // Save Tx
          storedTxs[this.props.account][selectedToken][txKey] = storedTx;

          // Update transaction
          prevTxs[tx.hash] = tx;
        });
      }

      let minedTxs = storedTxs[this.props.account][selectedToken];

      // Add missing executed transactions
      if (minedTxs){

        this.functionsUtil.customLog('loadTxs adding minedTxs',minedTxs);

        await this.functionsUtil.asyncForEach(Object.keys(minedTxs),async (txKey,i) => {
          const tx = minedTxs[txKey];
          const isStoredTx = storedTxs && storedTxs[this.props.account] && storedTxs[this.props.account][selectedToken] && storedTxs[this.props.account][selectedToken][txKey];

          const allowedMethods = ['mintIdleToken','redeemIdleToken','bridgeIdleV1ToIdleV2']

          // Skip invalid txs
          if (prevTxs[tx.transactionHash] || tx.status !== 'success' || !tx.transactionHash || allowedMethods.indexOf(tx.method)===-1){
            // console.log(`Skip stored Tx ${tx.transactionHash}, Processed: ${!!prevTxs[tx.transactionHash]}, status: ${tx.status}, method: ${tx.method}`);
            return false;
          }

          let realTx = tx.realTx ? tx.realTx : null;

          if (!realTx){
            // console.log('loadTxs - getTransaction',tx.transactionHash);
            realTx = await (new Promise( async (resolve, reject) => {
              this.props.web3.eth.getTransaction(tx.transactionHash,(err,txReceipt)=>{
                if (err){
                  reject(err);
                }
                resolve(txReceipt);
              });
            }));
          }

          this.functionsUtil.customLog('realTx (localStorage)',realTx);

          // Skip txs from other wallets
          if (!realTx || realTx.from.toLowerCase() !== this.props.account.toLowerCase()){
            // this.functionsUtil.customLog('Skipped tx '+tx.transactionHash+' not from this account.');
            // console.log(`Skip stored Tx ${tx.transactionHash}, from: ${realTx.from}`);
            return false;
          }

          let tokenPrice = await this.functionsUtil.genericContractCall(tokenConfig.idle.token,'tokenPrice',[],{}, tx.blockNumber);
          tokenPrice = this.functionsUtil.fixTokenDecimals(tokenPrice,18);

          realTx.contractAddress = tokenConfig.address;
          realTx.timeStamp = parseInt(tx.created/1000);

          let txValue;
          switch (tx.method){
            case 'mintIdleToken':

              if (realTx.to.toLowerCase() !== tokenConfig.idle.address.toLowerCase()){
                // Remove wrong contract tx
                if (isStoredTx){
                  delete storedTxs[this.props.account][selectedToken][txKey];
                }
                // this.functionsUtil.customLog('Skipped deposit tx '+tx.transactionHash+' - wrong contract');
                return false;
              }

              txValue = tx.params ? this.functionsUtil.fixTokenDecimals(tx.params[0],tokenDecimals).toString() : 0;
              if (!txValue){
                // this.functionsUtil.customLog('Skipped deposit tx '+tx.transactionHash+' - value is zero ('+txValue+')');
                return false;
              }

              realTx.status = 'Deposited';
              realTx.value = txValue;
            break;
            case 'redeemIdleToken':
              if (!realTx.tokenPrice){
                const redeemedValue = this.functionsUtil.BNify(tx.params[0]).times(tokenPrice);
                const redeemTokenDecimals = await this.getTokenDecimals();
                const redeemedValueFixed = this.functionsUtil.fixTokenDecimals(redeemedValue,redeemTokenDecimals);
                realTx.tokenPrice = tokenPrice;
                realTx.status = 'Redeemed';
                realTx.value = redeemedValueFixed.toString();
              }
            break;
            case 'bridgeIdleV1ToIdleV2':

              let migrationTxReceipt = tx.txReceipt ? tx.txReceipt : null;

              if (!migrationTxReceipt){
                migrationTxReceipt = await (new Promise( async (resolve, reject) => {
                  this.props.web3.eth.getTransactionReceipt(tx.transactionHash,(err,tx)=>{
                    if (err){
                      reject(err);
                    }
                    resolve(tx);
                  });
                }));
              }

              if (!migrationTxReceipt){
                return false;
              }

              const contractAddress = tokenConfig.idle.address.toLowerCase().replace('x','');
              const isMigrationRightContract = migrationTxReceipt.logs.filter((tx) => { return tx.topics[tx.topics.length-1].toLowerCase() === `0x00000000000000000000000${contractAddress}`; });

              if (!isMigrationRightContract.length){
                // Remove wrong contract tx
                if (isStoredTx){
                  delete storedTxs[this.props.account][selectedToken][txKey];
                }
                return false;
              }

              // Save txReceipt into the tx
              if (!tx.txReceipt){
                tx.txReceipt = migrationTxReceipt;
                if (isStoredTx){
                  storedTxs[this.props.account][selectedToken][txKey] = tx;
                }
              }

              const migrationTxInternalTransfers = migrationTxReceipt.logs.filter((tx) => { return tx.topics[tx.topics.length-1].toLowerCase() === `0x00000000000000000000000${oldContractAddr}`; });

              if (!migrationTxInternalTransfers.length){
                return false;
              }

              const migrationInternalTransfer = migrationTxInternalTransfers.pop();

              const decodedLogs = this.props.web3.eth.abi.decodeLog([
                {
                  "internalType": "uint256",
                  "name": "_idleToken",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "_token",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "_price",
                  "type": "uint256"
                },
              ],migrationInternalTransfer.data,migrationInternalTransfer.topics);

              const migrationValue = decodedLogs._token;
              const migrationTokenDecimals = this.state.oldContractTokenDecimals ? this.state.oldContractTokenDecimals : await this.functionsUtil.getTokenDecimals(tokenConfig.migration.oldContract.name);
              const migrationValueFixed = this.functionsUtil.fixTokenDecimals(migrationValue,migrationTokenDecimals);

              realTx.status = 'Migrated';
              realTx.value = migrationValueFixed.toString();
            break;
            default:
            break;
          }

          realTx.tokenSymbol = selectedToken;

          // console.log('Adding localStorage tx',realTx);

          // this.functionsUtil.customLog('realTx from localStorage:',realTx);
          const tokensTransfered = tokenPrice.times(this.functionsUtil.BNify(realTx.value));

          if (!isNaN(realTx.value) && parseFloat(realTx.value)){
            if (tx.method==='mintIdleToken'){
              amountLent = amountLent.plus(this.functionsUtil.BNify(realTx.value));
              avgBuyPrice = avgBuyPrice.plus(tokensTransfered);
              // console.log(`Deposited (localStorage) ${realTx.value} @${tokenPrice}, AmountLent: ${amountLent}`);
            } else if (tx.method==='redeemIdleToken'){
              amountLent = amountLent.minus(this.functionsUtil.BNify(realTx.value));
              avgBuyPrice = avgBuyPrice.minus(tokenPrice.times(this.functionsUtil.BNify(realTx.value)));

              if (amountLent.lt(0)){
                amountLent = this.functionsUtil.BNify(0);
                avgBuyPrice = this.functionsUtil.BNify(0);
              }
              // console.log(`Redeemed (localStorage) ${realTx.value} @${tokenPrice}, AmountLent: ${amountLent}`);
            } else if (tx.method==='bridgeIdleV1ToIdleV2'){
              amountLent = amountLent.plus(this.functionsUtil.BNify(realTx.value));
              avgBuyPrice = avgBuyPrice.plus(tokensTransfered);
              // console.log(`Migrated (localStorage) ${realTx.value} @${tokenPrice}, AmountLent: ${amountLent}`);
            }

            // Save realTx and update localStorage
            if (!tx.realTx){
              tx.realTx = realTx;
              storedTxs[this.props.account][selectedToken][txKey] = tx;
            }

            prevTxs[realTx.hash] = realTx;

          } else if (isStoredTx){
            delete storedTxs[this.props.account][selectedToken][txKey];
          }
        });
      }

      // Update localStorage
      if (storedTxs){
        this.functionsUtil.setLocalStorage('transactions',JSON.stringify(storedTxs));
      }
    });

    if (amountLent.lte(0)){
      amountLent = this.functionsUtil.BNify(0);
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
    const txsIndexes = Object.values(this.state.prevTxs).sort((a,b) => (a.timeStamp > b.timeStamp) ? -1 : 1 );

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

      if (!parsedValue){
        return false;
      }

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
