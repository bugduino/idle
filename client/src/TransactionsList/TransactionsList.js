import React, { Component } from 'react';
// import style from './TransactionsList.module.scss';
import globalConfigs from '../configs/globalConfigs';
import FunctionsUtil from '../utilities/FunctionsUtil';
import { Flex, Box, Heading, Text, Link, Icon, Pill, Loader } from "rimble-ui";

const env = process.env;

class TransactionsList extends Component {

  state = {
    prevTxs:null,
    loading:false,
    renderedTxs:null,
    isFirstDeposit:false,
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

  async componentDidMount(){
    this.loadUtils();
    this.loadTxs();
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();
  }

  async loadTxs(count){
    if (!this.props.selectedToken || !this.props.account){
      return false;
    }

    count = count ? count : 0;

    this.setState({
      loading:true
    });


    const requiredNetwork = globalConfigs.network.requiredNetwork;
    const etherscanInfo = globalConfigs.network.providers.etherscan;
    let lastBlockNumber = this.state.lastBlockNumber;

    let results = [];
    let etherscanEndpoint = null;
    let cachedTxs = null;

    // Check if etherscan is enabled for the required network
    if (etherscanInfo.enabled && etherscanInfo.endpoints[requiredNetwork]){
      const etherscanApiUrl = etherscanInfo.endpoints[requiredNetwork];

      // Add token variable to endpoint for separate cached requests between tokens
      etherscanEndpoint = `${etherscanApiUrl}?apikey=${env.REACT_APP_ETHERSCAN_KEY}&token=${this.props.selectedToken}&module=account&action=tokentx&address=${this.props.account}&startblock=${lastBlockNumber}&endblock=999999999&sort=asc`;

      cachedTxs = this.functionsUtil.getCachedRequest(etherscanEndpoint);
      let txs = cachedTxs;

      if (!txs){
        // Make request
        const error_callback = (err) => {
          this.functionsUtil.customLog('Error getting prev txs');
          if (!count){
            // console.log('Retrieving prevTxs',count);
            setTimeout(() => {
              this.loadTxs(count+1);
            },1000);
            return false;
          }
        };
        txs = await this.functionsUtil.makeRequest(etherscanEndpoint,error_callback);
      }

      if (!txs || !txs.data || !txs.data.result){
        return this.setState({
          earning:0,
          prevTxs:{},
          amountLent:0,
          prevTxsError:true,
        });
      }

      results = txs.data.result;
    }

    const tokenDecimals = this.props.tokenConfig.decimals;

    const migrationContractAddr = this.props.tokenConfig.migration && this.props.tokenConfig.migration.migrationContract ? this.props.tokenConfig.migration.migrationContract.address : null;
    const migrationContractOldAddrs = this.props.tokenConfig.migration && this.props.tokenConfig.migration.migrationContract && this.props.tokenConfig.migration.migrationContract.oldAddresses ? this.props.tokenConfig.migration.migrationContract.oldAddresses : [];
    // const oldContractAddr = this.props.tokenConfig.migration && this.props.tokenConfig.migration.oldContract ? this.props.tokenConfig.migration.oldContract.address.replace('x','').toLowerCase() : null;

    let etherscanTxs = null;

    if (cachedTxs){
      etherscanTxs = cachedTxs.data.result;
    } else {
      etherscanTxs = {};
      results.filter(
          tx => {
            const internalTxs = results.filter(r => r.hash === tx.hash);
            const isSendTransferTx = internalTxs.length === 1 && tx.from.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
            const isReceiveTransferTx = internalTxs.length === 1 && tx.to.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
            const isMigrationTx = migrationContractAddr && (tx.from.toLowerCase() === migrationContractAddr.toLowerCase() || migrationContractOldAddrs.map((v) => { return v.toLowerCase(); }).indexOf(tx.from.toLowerCase()) !== -1 ) && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
            const isRightToken = internalTxs.length>1 && internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === this.props.tokenConfig.address.toLowerCase()).length;
            const isDepositTx = isRightToken && !isMigrationTx && tx.from.toLowerCase() === this.props.account.toLowerCase() && tx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
            const isRedeemTx = isRightToken && !isMigrationTx && tx.contractAddress.toLowerCase() === this.props.tokenConfig.address.toLowerCase() && internalTxs.filter(iTx => iTx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase()).length && tx.to.toLowerCase() === this.props.account.toLowerCase();

            return isSendTransferTx || isReceiveTransferTx || isMigrationTx || isDepositTx || isRedeemTx;
        }
      ).forEach(tx => {
        if (etherscanTxs[tx.hash]){
          etherscanTxs[tx.hash].value = etherscanTxs[tx.hash].value.plus(this.functionsUtil.fixTokenDecimals(tx.value,tokenDecimals));
        } else {
          etherscanTxs[tx.hash] = ({...tx, value: this.functionsUtil.fixTokenDecimals(tx.value,tokenDecimals)});
        }
      });
      etherscanTxs = Object.values(etherscanTxs);

      // Store filtered txs
      if (etherscanEndpoint){
        const cachedRequestData = {
          data:{
            result:etherscanTxs
          }
        };
        this.functionsUtil.saveCachedRequest(etherscanEndpoint,false,cachedRequestData);
      }
    }

    let amountLent = this.functionsUtil.BNify(0);

    // Initialize prevTxs
    let prevTxs = this.state.prevTxs ? Object.assign({},this.state.prevTxs) : {};

    // Take storedTxs from localStorage
    const storedTxs = localStorage && JSON.parse(localStorage.getItem('transactions')) ? JSON.parse(localStorage.getItem('transactions')) : {};
    
    // Inizialize storedTxs for pair account-token if empty
    if (typeof storedTxs[this.props.account] !== 'object'){
      storedTxs[this.props.account] = {};
    }

    if (typeof storedTxs[this.props.account][this.props.selectedToken] !== 'object'){
      storedTxs[this.props.account][this.props.selectedToken] = {};
    }

    // Check if this is the first interaction with Idle
    let depositedTxs = 0;

    if (etherscanTxs && etherscanTxs.length){

      // Merge new txs with previous ones
      await this.functionsUtil.asyncForEach(etherscanTxs,async (tx,index) => {
        prevTxs[tx.hash] = tx;
      });

      const lastTx = etherscanTxs[etherscanTxs.length-1];

      // Update last block number
      if (lastTx && lastTx.blockNumber){
        lastBlockNumber = lastTx.blockNumber;
      }

      // Loop through prevTxs to have all the history
      await this.functionsUtil.asyncForEach(Object.values(prevTxs),async (tx,index) => {

        const txKey = `tx${tx.timeStamp}000`;
        const storedTx = storedTxs[this.props.account][this.props.selectedToken][txKey] ? storedTxs[this.props.account][this.props.selectedToken][txKey] : tx;
        // const isNewTx = etherscanTxs.indexOf(tx) !== -1; // Just fetched from etherscan
        const isMigrationTx = migrationContractAddr && (tx.from.toLowerCase() === migrationContractAddr.toLowerCase() || migrationContractOldAddrs.map((v) => { return v.toLowerCase(); }).indexOf(tx.from.toLowerCase()) !== -1 ) && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
        const isSendTransferTx = !isMigrationTx && tx.from.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
        const isReceiveTransferTx = !isMigrationTx && tx.to.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
        const isDepositTx = !isMigrationTx && !isSendTransferTx && !isReceiveTransferTx && tx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
        const isRedeemTx = !isMigrationTx && !isSendTransferTx && !isReceiveTransferTx && tx.to.toLowerCase() === this.props.account.toLowerCase();

        let tokenPrice = await this.functionsUtil.genericContractCall(this.props.tokenConfig.idle.token, 'tokenPrice',[],{}, tx.blockNumber);
        tokenPrice = this.functionsUtil.fixTokenDecimals(tokenPrice,this.props.tokenConfig.decimals);
        let tokensTransfered = tokenPrice.times(this.functionsUtil.BNify(tx.value));

        // Deposited
        if (isSendTransferTx){
          // amountLent = amountLent.plus(this.functionsUtil.BNify(tx.value));
          // depositedTxs++;

          // Decrese amountLent by the last idleToken price
          amountLent = amountLent.minus(tokensTransfered);

          if (amountLent.lte(0)){
            amountLent = this.functionsUtil.BNify(0);
          }

          // console.log(`Transfer sent of ${tx.value} (${tokensTransfered}) - amountLent: ${amountLent}`);

          storedTx.value = tokensTransfered;

        } else if (isReceiveTransferTx){

          // Decrese amountLent by the last idleToken price
          amountLent = amountLent.plus(tokensTransfered);
          // console.log(`Transfer received of ${tx.value} (${tokensTransfered}) - amountLent: ${amountLent}`);

          storedTx.value = tokensTransfered;

        } else if (isDepositTx){

          amountLent = amountLent.plus(this.functionsUtil.BNify(tx.value));

          depositedTxs++;

          if (!storedTx.idleTokens){

            // Init idleTokens amount
            storedTx.idleTokens = this.functionsUtil.BNify(tx.value);

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

          // console.log(`Deposited ${tx.value} (${storedTx.idleTokens}), AmountLent: ${amountLent}`);

          // Save new storedTx
          storedTxs[this.props.account][this.props.selectedToken][txKey] = storedTx;

        // Redeemed
        } else if (isRedeemTx){

          const redeemedValueFixed = this.functionsUtil.BNify(storedTx.value);

          // Decrese amountLent by redeem amount
          amountLent = amountLent.minus(redeemedValueFixed);

          // Reset amountLent if below zero
          if (amountLent.lt(0)){
            amountLent = this.functionsUtil.BNify(0);
          }
          // console.log(`Redeemed ${tx.value} (${redeemedValueFixed}), AmountLent: ${amountLent}`);
        // Migrated
        } else if (isMigrationTx){

          let migrationValueFixed = this.functionsUtil.BNify(storedTx.value);
          if (!storedTx.tokenPrice){
            storedTx.tokenPrice = tokenPrice;
            migrationValueFixed = migrationValueFixed.times(tokenPrice);

            // Save Tx
            storedTxs[this.props.account][this.props.selectedToken][txKey] = storedTx;
          }

          tx.value = migrationValueFixed;

          amountLent = amountLent.plus(migrationValueFixed);
        }

        // Update transaction
        prevTxs[tx.hash] = tx;
      });
    }

    let minedTxs = storedTxs[this.props.account][this.props.selectedToken];

    // Add missing executed transactions
    if (minedTxs){

      this.functionsUtil.customLog('getPrevTxs adding minedTxs',minedTxs);

      await this.functionsUtil.asyncForEach(Object.keys(minedTxs),async (txKey,i) => {
        const tx = minedTxs[txKey];
        const isStoredTx = storedTxs && storedTxs[this.props.account] && storedTxs[this.props.account][this.props.selectedToken] && storedTxs[this.props.account][this.props.selectedToken][txKey];

        let tokenPrice = await this.functionsUtil.genericContractCall(this.props.tokenConfig.idle.token, 'tokenPrice',[],{}, tx.blockNumber);
        tokenPrice = this.functionsUtil.fixTokenDecimals(tokenPrice,18);

        const allowedMethods = ['mintIdleToken','redeemIdleToken','bridgeIdleV1ToIdleV2']

        // Skip invalid txs
        if (prevTxs[tx.transactionHash] || tx.status !== 'success' || !tx.transactionHash || allowedMethods.indexOf(tx.method)===-1){
          return;
        }

        let realTx = tx.realTx ? tx.realTx : null;

        if (!realTx){
          // console.log('getPrevTxs - getTransaction',tx.transactionHash);
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
          return;
        }

        realTx.contractAddress = this.props.tokenConfig.address;
        realTx.timeStamp = parseInt(tx.created/1000);

        let txValue;
        switch (tx.method){
          case 'mintIdleToken':

            if (realTx.to.toLowerCase() !== this.props.tokenConfig.idle.address.toLowerCase()){
              // Remove wrong contract tx
              if (isStoredTx){
                delete storedTxs[this.props.account][this.props.selectedToken][txKey];
              }

              // this.functionsUtil.customLog('Skipped deposit tx '+tx.transactionHash+' - wrong contract');
              return;
            }

            txValue = tx.params ? this.functionsUtil.fixTokenDecimals(tx.params[0],tokenDecimals).toString() : 0;
            if (!txValue){
              // this.functionsUtil.customLog('Skipped deposit tx '+tx.transactionHash+' - value is zero ('+txValue+')');
              return;
            }
            
            depositedTxs++;
            realTx.status = 'Deposited';
            realTx.value = txValue;
          break;
          case 'redeemIdleToken':
            if (!realTx.tokenPrice){
              const redeemedValue = this.functionsUtil.BNify(tx.value).times(tokenPrice);
              const redeemTokenDecimals = this.props.tokenConfig.decimals;
              const redeemedValueFixed = this.functionsUtil.fixTokenDecimals(redeemedValue,redeemTokenDecimals);
              realTx.tokenPrice = tokenPrice;
              realTx.status = 'Redeemed';
              realTx.value = redeemedValueFixed.toString();
            }

            // TODO: save tx to localstorage
          break;
          case 'bridgeIdleV1ToIdleV2':

            if (!realTx.tokenPrice){
              const migratedValue = this.functionsUtil.BNify(tx.value).times(tokenPrice);
              const migrationTokenDecimals = await this.functionsUtil.getTokenDecimals(this.props.tokenConfig.migration.oldContract.name);
              const migratedValueFixed = this.functionsUtil.fixTokenDecimals(migratedValue,migrationTokenDecimals);
              realTx.tokenPrice = tokenPrice;
              realTx.status = 'Migrated';
              realTx.value = migratedValueFixed.toString();
            }
          break;
          default:
          break;
        }

        realTx.tokenSymbol = this.props.selectedToken;

        if (tx.method==='mintIdleToken'){
          amountLent = amountLent.plus(this.functionsUtil.BNify(realTx.value));
          // console.log('Deposited (localStorage) '+parseFloat(realTx.value),'AmountLent',amountLent.toString());
        } else if (tx.method==='redeemIdleToken'){
          amountLent = amountLent.minus(this.functionsUtil.BNify(realTx.value));

          if (amountLent.lt(0)){
            amountLent = this.functionsUtil.BNify(0);
          }
          // console.log('Redeemed (localStorage) '+parseFloat(realTx.value),'AmountLent',amountLent.toString());
        } else if (tx.method==='bridgeIdleV1ToIdleV2'){
          amountLent = amountLent.plus(this.functionsUtil.BNify(realTx.value));
          // console.log('Migrated (localStorage) '+parseFloat(realTx.value),'AmountLent',amountLent.toString());
        }

        // Save realTx and update localStorage
        if (!tx.realTx){
          tx.realTx = realTx;
          storedTxs[this.props.account][this.props.selectedToken][txKey] = tx;
        }

        prevTxs[realTx.hash] = realTx;
      });
  
      // Update localStorage
      if (storedTxs && localStorage){
        this.functionsUtil.setLocalStorage('transactions',JSON.stringify(storedTxs));
      }
    }

    if (amountLent.lte(0)){
      amountLent = this.functionsUtil.BNify(0);
    }

    const isFirstDeposit = depositedTxs === 1;

    return this.setState({
      prevTxs,
      loading:false,
      isFirstDeposit,
      lastBlockNumber
    }, () => {
      this.processTxs()
    });
  };

  processTxs(){
    const txsIndexes = Object.keys(this.state.prevTxs);
    const txsToShow = 99999999;
    // let totalInterestsAccrued = 0;
    let depositedSinceLastRedeem = 0;
    let totalRedeemed = 0;
    const decimals = Math.min(this.props.tokenConfig.decimals,8);

    const migrationContractAddr = this.props.tokenConfig.migration && this.props.tokenConfig.migration.migrationContract ? this.props.tokenConfig.migration.migrationContract.address : null;
    const migrationContractOldAddrs = this.props.tokenConfig.migration && this.props.tokenConfig.migration.migrationContract && this.props.tokenConfig.migration.migrationContract.oldAddresses ? this.props.tokenConfig.migration.migrationContract.oldAddresses : [];

    let txs = txsIndexes.map((key, i) => {

      const tx = this.state.prevTxs[key];

      const isMigrationTx = migrationContractAddr && (tx.from.toLowerCase() === migrationContractAddr.toLowerCase() || migrationContractOldAddrs.map((v) => { return v.toLowerCase(); }).indexOf(tx.from.toLowerCase()) !== -1 ) && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
      const isSendTransferTx = !isMigrationTx && tx.from.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
      const isReceiveTransferTx = !isMigrationTx && tx.to.toLowerCase() === this.props.account.toLowerCase() && tx.contractAddress.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
      const isDepositTx = !isMigrationTx && !isSendTransferTx && !isReceiveTransferTx && tx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
      const isRedeemTx = !isMigrationTx && !isSendTransferTx && !isReceiveTransferTx && tx.to.toLowerCase() === this.props.account.toLowerCase();

      const date = new Date(tx.timeStamp*1000);
      let status = tx.status ? tx.status : null;
      if (!status){
        if (isDepositTx){
          status = 'Deposited';
        } else if (isRedeemTx){
          status = 'Redeemed';
        } else if (isMigrationTx){
          status = 'Migrated';
        } else if (isSendTransferTx){
          status = 'Transfer';
        } else if (isReceiveTransferTx){
          status = 'Received';
        }
      }

      const parsedValue = parseFloat(tx.value);

      if (!parsedValue){
        return false;
      }

      const value = parsedValue ? (this.props.isMobile ? parsedValue.toFixed(4) : parsedValue.toFixed(decimals)) : '-';
      const momentDate = this.functionsUtil.strToMoment(date);
      const formattedDate = momentDate.fromNow();
      const formattedDateAlt = momentDate.format('YYYY-MM-DD HH:mm:ss');
      let color;
      let icon;
      let interest = null;
      switch (status) {
        case 'Deposited':
          color = 'blue';
          icon = "ArrowDownward";
          depositedSinceLastRedeem+=parsedValue;
          // totalRedeemed = 0;
        break;
        case 'Redeemed':
          color = 'green';
          icon = "ArrowUpward";
          totalRedeemed += Math.abs(parsedValue);
          if (totalRedeemed<depositedSinceLastRedeem){
            interest = null;
          } else {
            interest = totalRedeemed-depositedSinceLastRedeem;
            interest = interest>0 ? '+'+(this.props.isMobile ? parseFloat(interest).toFixed(4) : parseFloat(interest).toFixed(decimals))+' '+this.props.selectedToken : null;
            depositedSinceLastRedeem -= totalRedeemed;
            depositedSinceLastRedeem = Math.max(0,depositedSinceLastRedeem);
            totalRedeemed = 0;
          }
        break;
        case 'Transfer':
          color = 'green';
          icon = "Send";
        break;
        case 'Received':
          color = 'blue';
          icon = "Redo";
        break;
        case 'Migrated':
          color = 'blue';
          icon = "Sync";
          depositedSinceLastRedeem+=parsedValue;
        break;
        default:
          color = 'grey';
          icon = "Refresh";
        break;
      }

      if (i>=txsIndexes.length-txsToShow){
        return (
          <Link key={'tx_'+i} display={'block'} href={`https://etherscan.io/tx/${tx.hash}`} target={'_blank'} rel="nofollow noopener noreferrer">
            <Flex alignItems={'center'} flexDirection={['row','row']} width={'100%'} p={[2,3]} borderBottom={'1px solid #D6D6D6'}>
              <Box width={[1/12,1/12]} textAlign={'right'}>
                  <Icon name={icon} color={color} style={{float:'left'}}></Icon>
              </Box>
              <Box width={[2/12,2/12]} display={['none','block']} textAlign={'center'}>
                <Pill color={color}>
                  {status}
                </Pill>
              </Box>
              <Box width={[6/12,3/12]}>
                <Text textAlign={'center'} fontSize={[2,2]} fontWeight={2}>{value} {this.props.selectedToken}</Text>
              </Box>
              <Box width={3/12} display={['none','block']}>
                <Text textAlign={'center'} fontSize={[2,2]} fontWeight={2}>
                  {interest ? <Pill color={'green'}>{interest}</Pill> : '-'}
                </Text>
              </Box>
              <Box width={[5/12,3/12]} textAlign={'center'}>
                <Text alt={formattedDateAlt} textAlign={'center'} fontSize={[1,2]} fontWeight={2}>{formattedDate}</Text>
              </Box>
            </Flex>
          </Link>
        );
      }

      return null;
    });

    const renderedTxs = txs
            .reverse()
            .filter(function( element ) {
               return (element !== undefined) && (element !== null);
            });


    this.setState({
      renderedTxs
    });
  }

  render() {
    return (
      <Flex flexDirection={'column'} width={[1,'90%']} m={'0 auto'}>
        <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'dark-gray'}>
          Last transactions
        </Heading.h3>
        <Box maxHeight={'500px'} overflow={'auto'}>
        {
          this.state.loading ? (
            <Flex
              justifyContent={'center'}
              alignItems={'center'}
              textAlign={'center'}
              width={1}
              minHeight={ this.props.height }
            >
              <Loader size="40px" /> <Text ml={2}>Loading transactions...</Text>
            </Flex>
          ) : this.state.renderedTxs && this.state.renderedTxs.length ?
                this.state.renderedTxs
              : (
                <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontWeight={2} fontSize={[2]} color={'dark-gray'}>
                  There are no transactions for {this.props.selectedToken}
                </Heading.h3>
              )
        }
        </Box>
      </Flex>
    );
  }
}

export default TransactionsList;
