import { Line } from '@nivo/line';
import React, { Component } from 'react';
import FunctionsUtil from '../utilities/FunctionsUtil';
import GenericChart from '../GenericChart/GenericChart';

class PortfolioEquity extends Component {
  state = {
    chartData:null,
    chartwidth:null,
    chartHeight:null
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

  componentWillMount() {
    window.addEventListener('resize', this.handleWindowSizeChange.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowSizeChange);
  }

  async componentDidMount(){
    this.loadUtils();
    this.loadChartData();
    this.handleWindowSizeChange();
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();
    this.handleWindowSizeChange();
  }

  handleWindowSizeChange(){

    const newState = {};

    if (this.props.parentId){
      const chartContainer = document.getElementById(this.props.parentId);
      if (chartContainer){
        const chartWidth = parseFloat(chartContainer.offsetWidth)>0 ? chartContainer.offsetWidth : 0;
        if (chartWidth && chartWidth !== this.state.chartWidth){
          newState.chartWidth = chartWidth;
        }
      }
    }

    if (this.props.parentIdHeight){
      const chartContainerH = document.getElementById(this.props.parentIdHeight);
      if (chartContainerH){
        const chartHeight = parseFloat(chartContainerH.offsetWidth)>0 ? chartContainerH.offsetWidth : 0;
        if (chartHeight && chartHeight !== this.state.chartHeight){
          newState.chartHeight = chartHeight;
        }
      }
    }

    if (Object.keys(newState).length>0){
      this.setState(newState);
    }
  };

  async loadChartData() {

    let enabledTokens = this.props.enabledTokens;
    if (!enabledTokens || !enabledTokens.length){
      enabledTokens = Object.keys(this.props.availableTokens);
    }

    const etherscanTxs = await this.functionsUtil.getEtherscanTxs(this.props.account,0,'latest',enabledTokens);
    const storedTxs = this.functionsUtil.getStoredItem('transactions',true,{});

    // Init storedTxs for pair account-token if empty
    if (typeof storedTxs[this.props.account] !== 'object'){
      storedTxs[this.props.account] = {};
    }

    const tokensBalance = {};
    let firstTxTimestamp = null;
    const chartData = [];

    await this.functionsUtil.asyncForEach(enabledTokens,async (selectedToken) => {

      // const chartRow = {
      //   id:selectedToken,
      //   color: 'hsl('+ this.functionsUtil.getGlobalConfig(['stats','tokens',selectedToken,'color','hsl']).join(',')+')',
      //   data: []
      // };

      tokensBalance[selectedToken] = [];

      const tokenConfig = this.props.availableTokens[selectedToken];

      // Init storedTxs for pair account-token if empty
      if (typeof storedTxs[this.props.account][selectedToken] !== 'object'){
        storedTxs[this.props.account][selectedToken] = {};
      }

      const filteredTxs = Object.values(etherscanTxs).filter(tx => (tx.token === selectedToken));
      if (filteredTxs && filteredTxs.length){

        let amountLent = this.functionsUtil.BNify(0);

        await this.functionsUtil.asyncForEach(filteredTxs,async (tx,index) => {

          firstTxTimestamp = firstTxTimestamp ? Math.min(firstTxTimestamp,parseInt(tx.timeStamp)) : parseInt(tx.timeStamp);

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
          switch (tx.action){
            case 'Send':
              // Decrese amountLent by the last idleToken price
              amountLent = amountLent.minus(tokensTransfered);

              if (amountLent.lte(0)){
                amountLent = this.functionsUtil.BNify(0);
              }

              storedTx.value = tokensTransfered;
            break;
            case 'Receive':
              // Decrese amountLent by the last idleToken price
              amountLent = amountLent.plus(tokensTransfered);
              storedTx.value = tokensTransfered;
            break;
            case 'Swap':
              // Decrese amountLent by the last idleToken price
              amountLent = amountLent.plus(tokensTransfered);
              storedTx.value = tokensTransfered;
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
            break;
            case 'Redeem':
              const redeemedValueFixed = this.functionsUtil.BNify(storedTx.value);

              // Decrese amountLent by redeem amount
              amountLent = amountLent.minus(redeemedValueFixed);

              // Reset amountLent if below zero
              if (amountLent.lt(0)){
                amountLent = this.functionsUtil.BNify(0);
              }

              // Set tx method
              if (!storedTx.method){
                storedTx.method = 'redeemIdleToken';
              }
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
            break;
            default:
            break;
          }

          tokensBalance[selectedToken].push({
            timeStamp: parseInt(storedTx.timeStamp),
            balance: amountLent
          });

          // chartRow.data.push({
          //   x: this.functionsUtil.strToMoment(storedTx.timeStamp*1000).format("YYYY/MM/DD HH:mm"),
          //   y: parseInt(amountLent.toString())
          // });

        });
      }

      // Add token Data
      // chartData.push(chartRow);

      // Update Stored Txs
      if (storedTxs){
        this.functionsUtil.setLocalStorage('transactions',JSON.stringify(storedTxs));
      }
    });

    const aggregatedBalances = [];
    let prevTimestamp = null;
    let prevBalances = {};
    let aggregatedBalance = null;
    const currTimestamp = parseInt(new Date().getTime()/1000);

    const frequency_seconds = {
      hour:3600,
      day:86400,
      week:604800
    };
    const frequency = 'day';

    for (let timeStamp=firstTxTimestamp;timeStamp<=currTimestamp;timeStamp+=frequency_seconds[frequency]){
      aggregatedBalance = this.functionsUtil.BNify(0);

      const foundBalances = {};
      Object.keys(tokensBalance).forEach(token => {
        let filteredBalances = tokensBalance[token].filter(tx => (tx.timeStamp<=timeStamp && (!prevTimestamp || tx.timeStamp>prevTimestamp)));
        
        if (!filteredBalances.length){
          if (prevBalances && prevBalances[token]){
            filteredBalances = prevBalances[token];
          } else {
            filteredBalances = [{
              balance:this.functionsUtil.BNify(0)
            }];
          }
        }

        const lastTx = Object.assign([],filteredBalances).pop();
        aggregatedBalance = aggregatedBalance.plus(lastTx.balance);
        // console.log(this.functionsUtil.strToMoment(timeStamp*1000).format('DD/MM/YYYY HH:mm'),token,lastTx.balance.toString(),aggregatedBalance.toString());

        foundBalances[token] = filteredBalances;
      });

      aggregatedBalances.push({
        x:this.functionsUtil.strToMoment(timeStamp*1000).format('YYYY/MM/DD HH:mm'),
        y:parseFloat(aggregatedBalance)
      });

      // console.log(this.functionsUtil.strToMoment(timeStamp*1000).format('DD/MM/YYYY HH:mm'),aggregatedBalance.toString(),this.functionsUtil.formatMoney(aggregatedBalance));

      prevTimestamp = timeStamp;
      prevBalances = foundBalances;
    }

    // Add token Data
    chartData.push({
      id:'USD',
      color: 'hsl('+ this.functionsUtil.getGlobalConfig(['stats','tokens','USDC','color','hsl']).join(',')+')',
      data:aggregatedBalances
    });
      
    /*
    const chartData = [
      {
        id:'DAI',
        label:'DAI'.substr(0,1).toUpperCase()+'DAI'.substr(1),
        value:parseFloat(5),
        color:'hsl('+globalConfigs.stats.tokens['DAI'.toUpperCase()].color.hsl.join(',')+')'
      },
      {
        id:'USDC',
        label:'USDC'.substr(0,1).toUpperCase()+'USDC'.substr(1),
        value:parseFloat(95),
        color:'hsl('+globalConfigs.stats.tokens['USDC'.toUpperCase()].color.hsl.join(',')+')'
      }
    ];
    */

    // console.log(chartData);

    this.setState({
      chartData
    });
  }

  render() {

    const chartProps = {
      xScale:{
        type: 'time',
        format: '%Y/%m/%d %H:%M',
        // precision: 'hour',
      },
      xFormat:'time:%b %d %H:%M',
      yFormat:value => this.functionsUtil.formatMoney(value,0),
      yScale:{
        type: 'linear',
        stacked: false
      },
      axisLeft:null,
      /*{
        format: v => this.functionsUtil.abbreviateNumber(v,1),
        orient: 'left',
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: '',
        legendOffset: -65,
        legendPosition: 'middle'
      },
      */
      axisBottom:{
        legend: '',
        tickSize:0,
        format: '%b %d',
        orient: 'bottom',
        legendOffset: 36,
        legendPosition: 'middle',
        tickValues: 'every 7 days'
      },
      enableArea:true,
      curve:'monotoneX',
      enableSlices:'x',
      enableGridX:false,
      enableGridY:false,
      colors:d => d.color,
      pointSize:0,
      pointColor:{ from: 'color', modifiers: []},
      pointBorderWidth:1,
      pointLabel:"y",
      pointLabelYOffset:-12,
      useMesh:true,
      animate:false,
      margin:{ top: 30, right: 50, bottom: 65, left: 50 },
    };

    return (
      <GenericChart
        type={Line}
        {...chartProps}
        showLoader={true}
        width={this.state.chartWidth}
        height={this.state.chartHeight}
        data={this.state.chartData}
      />
    );
  }
}

export default PortfolioEquity;
