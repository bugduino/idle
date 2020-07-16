import theme from '../theme';
import { Line } from '@nivo/line';
import { Flex, Text } from "rimble-ui";
import React, { Component } from 'react';
// import { linearGradientDef } from '@nivo/core'
import FunctionsUtil from '../utilities/FunctionsUtil';
import GenericChart from '../GenericChart/GenericChart';
import DashboardCard from '../DashboardCard/DashboardCard';

class PortfolioEquity extends Component {
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
  }

  async loadChartData() {

    let enabledTokens = this.props.enabledTokens;
    if (!enabledTokens || !enabledTokens.length){
      enabledTokens = Object.keys(this.props.availableTokens);
    }

    const etherscanTxs = await this.functionsUtil.getEtherscanTxs(this.props.account,0,'latest',enabledTokens);

    const chartData = [];
    let tokensBalance = {};
    let firstTxTimestamp = null;

    await this.functionsUtil.asyncForEach(enabledTokens,async (selectedToken) => {

      tokensBalance[selectedToken] = [];

      const filteredTxs = Object.values(etherscanTxs).filter(tx => (tx.token === selectedToken));
      if (filteredTxs && filteredTxs.length){

        let amountLent = this.functionsUtil.BNify(0);

        filteredTxs.forEach((tx,index) => {

          // Skip transactions with no hash or pending
          if (!tx.hash || (tx.status && tx.status === 'Pending')){
            return false;
          }
          
          firstTxTimestamp = firstTxTimestamp ? Math.min(firstTxTimestamp,parseInt(tx.timeStamp)) : parseInt(tx.timeStamp);

          const tokenAmount = this.functionsUtil.BNify(tx.tokenAmount);

          switch (tx.action){
            case 'Swap':
            case 'Deposit':
            case 'Receive':
            case 'Migrate':
              amountLent = amountLent.plus(tokenAmount);
            break;
            case 'Send':
            case 'Redeem':
            case 'SwapOut':
            case 'Withdraw':
              amountLent = amountLent.minus(tokenAmount);
            break;
            default:
            break;
          }

          // Reset amountLent if below zero
          if (amountLent.lt(0)){
            amountLent = this.functionsUtil.BNify(0);
          }

          const balance = amountLent;
          const action = tx.action;
          const timeStamp = parseInt(tx.timeStamp);
          const tokenPrice = this.functionsUtil.BNify(tx.tokenPrice);
          const idleTokens = this.functionsUtil.BNify(tx.idleTokens);

          if (!tokenPrice.isNaN() && !tokenPrice.isNaN()){
            tokensBalance[selectedToken].push({
              action,
              balance,
              timeStamp,
              tokenPrice,
              idleTokens,
              tokenAmount
            });
          }
        });
      }
    });

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
    let aggregatedBalance = null;
    const aggregatedBalancesKeys = {};
    const currTimestamp = parseInt(new Date().getTime()/1000)+86400;

    const tokensData = {};
    const isRisk = this.props.selectedStrategy === 'risk';

    await this.functionsUtil.asyncForEach(Object.keys(tokensBalance),async (token) => {
      tokensData[token] = await this.functionsUtil.getTokenApiData(this.props.availableTokens[token].address,isRisk,firstTxTimestamp,null,false,3600);
    });

    // debugger;

    const idleTokenBalance = {};

    for (let timeStamp=firstTxTimestamp;timeStamp<=currTimestamp;timeStamp+=this.props.frequencySeconds){

      timeStamp = Math.min(currTimestamp,timeStamp);

      aggregatedBalance = this.functionsUtil.BNify(0);

      const foundBalances = {};

      // await this.functionsUtil.asyncForEach(Object.keys(tokensBalance),async (token) => {
      // eslint-disable-next-line
      Object.keys(tokensBalance).forEach(token => {

        let lastTokenData = null;
        const filteredTokenData = tokensData[token].filter(tx => (tx.timestamp>=prevTimestamp && tx.timestamp<=timeStamp));
        if (filteredTokenData && filteredTokenData.length){
          lastTokenData = filteredTokenData.pop();
        }

        if (!idleTokenBalance[token]){
          idleTokenBalance[token] = this.functionsUtil.BNify(0);
        }

        const tokenConfig = this.props.availableTokens[token];
        const tokenDecimals = tokenConfig.decimals;
        let filteredBalances = tokensBalance[token].filter(tx => (tx.timeStamp<=timeStamp && (!prevTimestamp || tx.timeStamp>prevTimestamp)));
        
        if (!filteredBalances.length){
          if (prevBalances && prevBalances[token]){
            filteredBalances = prevBalances[token];
            const lastFilteredTx = Object.assign([],filteredBalances).pop();
            const currentBalance = parseFloat(lastFilteredTx.balance);

            // Take idleToken price from API and calculate new balance
            if (currentBalance>0 && timeStamp>firstTxTimestamp && lastTokenData){
              const idleTokens = idleTokenBalance[token];
              const idlePrice = this.functionsUtil.fixTokenDecimals(lastTokenData.idlePrice,tokenDecimals);
              let newBalance = idleTokens.times(idlePrice);

              // console.log('1-',this.functionsUtil.strToMoment(timeStamp*1000).format('DD/MM/YYYY HH:mm'),token,idleTokens.toString(),newBalance.toString(),idlePrice.toString());

              // Set new balance and tokenPrice
              lastFilteredTx.balance = newBalance;
              lastFilteredTx.tokenPrice = idlePrice;
              filteredBalances = [lastFilteredTx];
            }
          } else {
            filteredBalances = [{
              balance:this.functionsUtil.BNify(0),
              tokenPrice:this.functionsUtil.BNify(0)
            }];
          }
        } else {
          filteredBalances.forEach(tx => {
            switch (tx.action){
              case 'Deposit':
              case 'Migrate':
              case 'Receive':
              case 'Swap':
                idleTokenBalance[token] = idleTokenBalance[token].plus(tx.idleTokens);
              break;
              default:
                idleTokenBalance[token] = idleTokenBalance[token].minus(tx.idleTokens);
                if (idleTokenBalance[token].lt(0)){
                  idleTokenBalance[token] = this.functionsUtil.BNify(0);
                }
              break;
            }

            // console.log('2-',this.functionsUtil.strToMoment(tx.timeStamp*1000).format('DD/MM/YYYY HH:mm'),token,idleTokenBalance[token].toString(),tx.balance.toString(),tx.tokenPrice.toString());
          });
        }

        const lastTx = Object.assign([],filteredBalances).pop();
        // let lastTxBalance = this.functionsUtil.BNify(lastTx.balance);
        let lastTxBalance = idleTokenBalance[token].times(lastTx.tokenPrice);

        if (lastTxBalance.gt(0)){
          // Convert token balance to USD
          let tokenUsdConversionRate = null;
          const conversionRateField = this.functionsUtil.getGlobalConfig(['stats','tokens',token,'conversionRateField']);
          if (!this.props.chartToken && conversionRateField && lastTokenData && lastTokenData[conversionRateField]){
            tokenUsdConversionRate = this.functionsUtil.fixTokenDecimals(lastTokenData[conversionRateField],18);
            if (tokenUsdConversionRate.gt(0)){
              lastTxBalance = lastTxBalance.times(tokenUsdConversionRate);
            }
          }

          aggregatedBalance = aggregatedBalance.plus(lastTxBalance);
          // console.log('3-',this.functionsUtil.strToMoment(timeStamp*1000).format('DD/MM/YYYY HH:mm'),token,lastTx.idleTokens.toString(),lastTx.balance.toString(),(tokenUsdConversionRate ? tokenUsdConversionRate.toString() : null),lastTxBalance.toString(),lastTx.tokenPrice.toString(),aggregatedBalance.toString());
        }

        foundBalances[token] = filteredBalances;
      });

      let momentDate = this.functionsUtil.strToMoment(timeStamp*1000);

      if (startDate === null || momentDate.isSameOrAfter(startDate)){
        
        if (momentDate.isAfter(new Date(),'day')){
          momentDate = this.functionsUtil.strToMoment(new Date());
        }

        const formattedDate = momentDate.format('YYYY/MM/DD HH:mm');

        // Save days for axisBottom format
        days[momentDate.format('YYYY/MM/DD')] = 1;

        aggregatedBalance = parseFloat(parseFloat(aggregatedBalance.toFixed(6)));

        aggregatedBalancesKeys[formattedDate] = aggregatedBalance;

        minChartValue = minChartValue === null ? aggregatedBalance : Math.min(minChartValue,aggregatedBalance);
        maxChartValue = maxChartValue === null ? aggregatedBalance : Math.max(maxChartValue,aggregatedBalance);
      }

      // console.log(this.functionsUtil.strToMoment(timeStamp*1000).format('DD/MM/YYYY HH:mm'),aggregatedBalance.toFixed(5),this.functionsUtil.formatMoney(aggregatedBalance));

      prevTimestamp = timeStamp;
      prevBalances = foundBalances;
    }

    const aggregatedBalances = Object.keys(aggregatedBalancesKeys).map(date => ({
      x:date,
      y:aggregatedBalancesKeys[date]
    }));
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

    const chartToken = this.props.chartToken ? this.props.chartToken.toUpperCase() : 'USD';

    // Add token Data
    chartData.push({
      id:chartToken,
      color: 'hsl('+ this.functionsUtil.getGlobalConfig(['stats','tokens',chartToken,'color','hsl']).join(',')+')',
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
      axisLeft:null,
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
      sliceTooltip:(sliceData) => {
        const { slice: {points} } = sliceData;
        const point = points[0];
        return (
          <DashboardCard
            cardProps={{
              py:2,
              px:3,
              left:'-110%'
            }}
          >
            <Flex
              width={1}
              flexDirection={'column'}
            >
              <Text
                mb={2}
                fontSize={1}
                fontWeight={3}
                color={'cellText'}
                textAlign={'right'}
              >
                {point.data.xFormatted}
              </Text>
              <Text
                mb={2}
                fontWeight={3}
                fontSize={[1,2]}
                textAlign={'right'}
                color={'copyColor'}
              >
                 {point.data.yFormatted} {point.serieId}
              </Text>
            </Flex>
          </DashboardCard>
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

export default PortfolioEquity;
