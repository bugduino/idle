import theme from '../theme';
import { Line } from '@nivo/line';
import React, { Component } from 'react';
// import { linearGradientDef } from '@nivo/core'
import FunctionsUtil from '../utilities/FunctionsUtil';
import GenericChart from '../GenericChart/GenericChart';
import ChartCustomTooltip from '../ChartCustomTooltip/ChartCustomTooltip';
import ChartCustomTooltipRow from '../ChartCustomTooltipRow/ChartCustomTooltipRow';

class PortfolioEquityCurve extends Component {
  state = {
    startDate:null,
    chartData:null,
    chartProps:null,
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

  async componentDidMount(){
    this.loadUtils();
    this.loadChartData();
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();

    const quickDateSelectionChanged = prevProps.quickDateSelection !== this.props.quickDateSelection;
    const tokenChanged = JSON.stringify(prevProps.enabledTokens) !== JSON.stringify(this.props.enabledTokens);
    if (tokenChanged || quickDateSelectionChanged){
      this.setState({
        chartData:null
      },() => {
        this.componentDidMount();
      });
    }

    const mobileChanged = prevProps.isMobile !== this.props.isMobile;
    if (mobileChanged){
      this.loadChartData();
    }
  }

  async loadChartData() {

    let enabledTokens = this.props.enabledTokens;
    if (!enabledTokens || !enabledTokens.length){
      enabledTokens = Object.keys(this.props.availableTokens);
    }

    const curveTxs = await this.functionsUtil.getCurveTxs(this.props.account,0,'latest',enabledTokens);

    const chartData = [];
    let tokensBalance = [];
    const processedTxs = {};
    let firstTxTimestamp = null;
    let totalBalance = this.functionsUtil.BNify(0);
    const curvePoolContract = this.functionsUtil.getGlobalConfig(['curve','poolContract']);

    if (curveTxs && curveTxs.length){

      curveTxs.forEach((tx,index) => {

        if (!processedTxs[tx.hash]){
          processedTxs[tx.hash] = [];
        }

        if (processedTxs[tx.hash].includes(tx.action)){
          return;
        }
        
        firstTxTimestamp = firstTxTimestamp ? Math.min(firstTxTimestamp,parseInt(tx.timeStamp)) : parseInt(tx.timeStamp);

        const curveTokens = this.functionsUtil.BNify(tx.curveTokens);

        switch (tx.action){
          case 'CurveIn':
          case 'CurveZapIn':
          case 'CurveDepositIn':
          case 'CurveTransferIn':
            totalBalance = totalBalance.plus(curveTokens);
          break;
          case 'CurveOut':
          case 'CurveZapOut':
          case 'CurveDepositOut':
          case 'CurveTransferOut':
            totalBalance = totalBalance.minus(curveTokens);
          break;
          default:
          break;
        }

        // Reset totalBalance if below zero
        if (totalBalance.lt(0)){
          totalBalance = this.functionsUtil.BNify(0);
        }

        const action = tx.action;
        const balance = totalBalance;
        const timeStamp = parseInt(tx.timeStamp);
        const curveTokenPrice = this.functionsUtil.fixTokenDecimals(tx.curveTokenPrice,curvePoolContract.decimals);

        // console.log(this.functionsUtil.strToMoment(timeStamp*1000).format('YYYY/MM/DD HH:mm'),tx.hash,tx.action,curveTokens.toString(),totalBalance.toString());

        if (!curveTokenPrice.isNaN() && !curveTokenPrice.isNaN()){
          tokensBalance.push({
            action,
            balance,
            timeStamp,
            curveTokens,
            curveTokenPrice
          });

          processedTxs[tx.hash].push(action);
        }
      });
    }

    // Calculate Start Date
    let startDate = null;
    const currentDate = this.functionsUtil.strToMoment(new Date());

    switch (this.props.quickDateSelection){
      case 'week':
        startDate = currentDate.clone().subtract(1,'week');
      break;
      case 'month':
        startDate = currentDate.clone().subtract(1,'month');
      break;
      case 'month3':
        startDate = currentDate.clone().subtract(3,'month');
      break;
      case 'month6':
        startDate = currentDate.clone().subtract(6,'month');
      break;
      default:
        startDate = null;
      break;
    }

    const days = {};
    let prevBalances = {};
    let prevTimestamp = null;
    let minChartValue = null;
    let maxChartValue = null;
    const aggregatedBalancesKeys = {};
    const tokensBalancesPerDate = {};
    let aggregatedBalance = this.functionsUtil.BNify(0);
    // let curveTokenBalance = this.functionsUtil.BNify(0);
    const currTimestamp = parseInt(new Date().getTime()/1000)+86400;

    const tokensData = await this.functionsUtil.getTokenApiData(Object.values(this.props.availableTokens)[0].address,false,firstTxTimestamp,null,false,3600);

    for (let timeStamp=firstTxTimestamp;timeStamp<=currTimestamp;timeStamp+=this.props.frequencySeconds){

      let foundBalances = {};
      let tokensBalances = {};
      timeStamp = Math.min(currTimestamp,timeStamp);
      let momentDate = this.functionsUtil.strToMoment(timeStamp*1000);

      // eslint-disable-next-line
      const filteredTokenData = tokensData.filter(tx => (tx.timestamp>=prevTimestamp && tx.timestamp<=timeStamp));

      // eslint-disable-next-line
      let filteredBalances = tokensBalance.filter(tx => (tx.timeStamp<=timeStamp && (!prevTimestamp || tx.timeStamp>prevTimestamp)));
      
      if (!filteredBalances.length){
        if (prevBalances){
          filteredBalances = prevBalances;
          const lastFilteredTx = Object.values(filteredBalances).pop();
          const currentBalance = parseFloat(lastFilteredTx.balance);

          const lastTokenData = Object.values(filteredTokenData).pop();
          let curveTokenPrice = null;
          if (lastTokenData){
            curveTokenPrice = await this.functionsUtil.getCurveTokenPrice(lastTokenData.blocknumber);
          }

          // Take idleToken price from API and calculate new balance
          if (currentBalance>0 && timeStamp>firstTxTimestamp && curveTokenPrice){
            // Set new curveTokenPrice
            lastFilteredTx.curveTokenPrice = curveTokenPrice;
            filteredBalances = [lastFilteredTx];
          }
        } else {
          filteredBalances = [{
            balance:this.functionsUtil.BNify(0),
            curveTokenPrice:this.functionsUtil.BNify(0)
          }];
        }
      }

      const lastTx = Object.assign([],filteredBalances).pop();
      let lastTxBalance = this.functionsUtil.BNify(lastTx.balance).times(lastTx.curveTokenPrice);

      tokensBalances[curvePoolContract.token] = this.functionsUtil.BNify(lastTx.balance);
      aggregatedBalance = lastTxBalance;

      foundBalances = filteredBalances;

      // console.log(momentDate.format('YYYY/MM/DD 00:00'),lastTx.balance.toString(),lastTx.curveTokenPrice.toString(),lastTxBalance.toString());

      if (startDate === null || momentDate.isSameOrAfter(startDate)){
        
        if (momentDate.isAfter(new Date(),'day')){
          momentDate = this.functionsUtil.strToMoment(new Date());
        }

        // Force date to midnight
        const formattedDate = momentDate.format('YYYY/MM/DD 00:00');

        // Save days for axisBottom format
        days[momentDate.format('YYYY/MM/DD')] = 1;

        const aggregatedBalanceParsed = parseFloat(parseFloat(aggregatedBalance.toFixed(6)));

        aggregatedBalancesKeys[formattedDate] = aggregatedBalanceParsed;
        tokensBalancesPerDate[formattedDate] = tokensBalances;

        // console.log(formattedDate,tokensBalances);

        minChartValue = minChartValue === null ? aggregatedBalanceParsed : Math.min(minChartValue,aggregatedBalanceParsed);
        maxChartValue = maxChartValue === null ? aggregatedBalanceParsed : Math.max(maxChartValue,aggregatedBalanceParsed);
      }

      prevTimestamp = timeStamp;
      prevBalances = foundBalances;
    }

    const aggregatedBalances = Object.keys(aggregatedBalancesKeys).map(date => ({
      x:date,
      y:aggregatedBalancesKeys[date],
      balances:tokensBalancesPerDate[date]
    }));

    let itemIndex = 0;
    aggregatedBalances.forEach( (item,index) => {
      const itemPos = Math.floor(itemIndex/aggregatedBalances.length*100);
      aggregatedBalances[index].itemPos = itemPos;
      itemIndex++;
    });

    /*
    aggregatedBalances.push({
      x:momentDate.format('YYYY/MM/DD HH:mm'),
      y:aggregatedBalance
    });
    */

    // Add day before to start with zero balance
    /*
    const firstTxMomentDate = this.functionsUtil.strToMoment(firstTxTimestamp*1000);
    if ((startDate === null || startDate.isSameOrBefore(firstTxMomentDate)) && aggregatedBalances.length){
      const firstItem = aggregatedBalances[0];
      const firstDate = this.functionsUtil.strToMoment(firstItem.x,'YYYY/MM/DD HH:mm');
      firstDate.subtract(1,'day');
      aggregatedBalances.unshift({
        x:firstDate.format('YYYY/MM/DD HH:mm'),
        y:0
      });
    }
    */

    // Add token Data
    chartData.push({
      id:'USD',
      color: 'hsl('+ this.functionsUtil.getGlobalConfig(['stats','tokens','USD','color','hsl']).join(',')+')',
      data:aggregatedBalances
    });

    let yFormatDecimals = 2;
    if (maxChartValue-minChartValue<1){
      yFormatDecimals = 4;
    }

    if (maxChartValue === minChartValue){
      minChartValue = Math.max(0,maxChartValue-1);
    }

    const maxGridLines = 5;
    const gridYStep = (maxChartValue-minChartValue)/maxGridLines;
    const gridYValues = [];
    for (let i=0;i<=maxGridLines;i++){
      const gridYValue = parseFloat(parseFloat(minChartValue+(i*gridYStep)).toFixed(6));
      gridYValues.push(gridYValue);
    }
    
    const axisBottomMaxValues = 10;
    const daysCount = Object.values(days).length;    
    const daysFrequency = Math.max(1,Math.ceil(daysCount/axisBottomMaxValues));

    const chartProps = {
      xScale:{
        type: 'time',
        format: '%Y/%m/%d %H:%M',
      },
      yScale:{
        type: 'linear',
        stacked: false,
        min: minChartValue,
        max: maxChartValue
      },
      xFormat:'time:%b %d %Y',
      yFormat:value => this.functionsUtil.formatMoney(value,yFormatDecimals),
      axisBottom: this.props.isMobile ? null : {
        legend: '',
        tickSize:0,
        format: '%b %d',
        tickPadding: 15,
        orient: 'bottom',
        legendOffset: 36,
        legendPosition: 'middle',
        tickValues:'every '+daysFrequency+' days'
      },
      gridYValues,
      pointSize:0,
      useMesh:true,
      axisLeft: this.props.isMobile ? null : {
        legend: '',
        tickSize: 0,
        orient: 'left',
        tickPadding: 10,
        tickRotation: 0,
        legendOffset: -70,
        tickValues:gridYValues,
        legendPosition: 'middle',
        format: v => this.functionsUtil.abbreviateNumber(v,2),
      },
      animate:true,
      pointLabel:'y',
      areaOpacity:0.1,
      enableArea:true,
      enableSlices:'x',
      enableGridY:true,
      curve:'monotoneX',
      enableGridX:false,
      pointBorderWidth:1,
      colors:d => d.color,
      pointLabelYOffset:-12,
      areaBaselineValue:minChartValue,
      pointColor:{ from: 'color', modifiers: []},
      theme:{
        axis: {
          ticks: {
            text: {
              fontSize:12,
              fontWeight:600,
              fill:theme.colors.legend,
              fontFamily: theme.fonts.sansSerif
            }
          }
        },
        grid: {
          line: {
            stroke: '#dbdbdb', strokeDasharray: '8 4'
          }
        },
      },
      /*
      defs:[
        linearGradientDef('gradientA', [
          { offset: 0, color: 'inherit' },
          { offset: 100, color: 'inherit', opacity: 0 },
        ]),
      ],
      fill:[{ match: '*', id: 'gradientA' }],
      */
      margin: this.props.isMobile ? { top: 20, right: 25, bottom: 25, left: 20 } : { top: 30, right: 50, bottom: 45, left: 50 },
      sliceTooltip:(slideData) => {
        const { slice } = slideData;
        const point = slice.points[0];
        return (
          <ChartCustomTooltip
            point={point}
          >
            <ChartCustomTooltipRow
              color={point.color}
              label={point.serieId}
              value={`$ ${point.data.yFormatted}`}
            />
            {
            typeof point.data.balances === 'object' && Object.keys(point.data.balances).length>0 &&
              Object.keys(point.data.balances).map(token => {
                if (token === point.serieId){
                  return null;
                }
                const tokenInfo = this.functionsUtil.getGlobalConfig(['stats','tokens',token]);
                const tokenName = tokenInfo.name ? tokenInfo.name : token;
                const color = tokenInfo.color.hex;
                const balance = point.data.balances[token];
                let formattedBalance = this.functionsUtil.formatMoney(balance,2);
                if (parseFloat(balance)>=0.01){
                  return (
                    <ChartCustomTooltipRow
                      label={tokenName}
                      color={color}
                      key={`row_${token}`}
                      value={`${formattedBalance}`}
                    />
                  );
                }
                return null;
              })
            }
          </ChartCustomTooltip>
        );
      }
    };

    this.setState({
      chartData,
      chartProps
    });
  }

  render() {
    return (
      <GenericChart
        type={Line}
        showLoader={true}
        {...this.state.chartProps}
        data={this.state.chartData}
        parentId={this.props.parentId}
        height={this.props.chartHeight}
        parentIdHeight={this.props.parentIdHeight}
      />
    );
  }
}

export default PortfolioEquityCurve;