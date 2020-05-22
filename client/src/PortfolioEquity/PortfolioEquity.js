import theme from '../theme';
import { Line } from '@nivo/line';
import { Flex, Text } from "rimble-ui";
import React, { Component } from 'react';
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
    const tokensBalance = {};
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

          switch (tx.action){
            case 'Swap':
            case 'Deposit':
            case 'Receive':
            case 'Migrate':
              amountLent = amountLent.plus(tx.tokenAmount);
            break;
            case 'Send':
            case 'Redeem':
            case 'SwapOut':
            case 'Withdraw':
              amountLent = amountLent.minus(tx.tokenAmount);
            break;
            default:
            break;
          }

          // Reset amountLent if below zero
          if (amountLent.lt(0)){
            amountLent = this.functionsUtil.BNify(0);
          }

          const timeStamp = parseInt(tx.timeStamp);
          const balance = amountLent;
          const action = tx.action;
          const tokenPrice = this.functionsUtil.BNify(tx.tokenPrice);
          const idleTokens = this.functionsUtil.BNify(tx.idleTokens);

          if (!tokenPrice.isNaN() && !tokenPrice.isNaN()){
            tokensBalance[selectedToken].push({
              action,
              balance,
              timeStamp,
              tokenPrice,
              idleTokens
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
    let maxChartValue = 0;
    const aggregatedBalances = [];
    let prevTimestamp = null;
    let prevBalances = {};
    let aggregatedBalance = null;
    const currTimestamp = parseInt(new Date().getTime()/1000)+86400;

    const tokensData = {};
    await this.functionsUtil.asyncForEach(Object.keys(tokensBalance),async (token) => {
      tokensData[token] = await this.functionsUtil.getTokenApiData(this.props.availableTokens[token].address,firstTxTimestamp,currTimestamp);

      // Filter by isRisk flag
      const isRisk = this.props.selectedStrategy === 'risk';
      tokensData[token] = tokensData[token].filter( d => ( d.isRisk === isRisk ) );
    });

    const idleTokenBalance = {};

    for (let timeStamp=firstTxTimestamp;timeStamp<=currTimestamp;timeStamp+=this.props.frequencySeconds){

      timeStamp = Math.min(currTimestamp,timeStamp);

      aggregatedBalance = this.functionsUtil.BNify(0);

      const foundBalances = {};

      // eslint-disable-next-line
      await this.functionsUtil.asyncForEach(Object.keys(tokensBalance),async (token) => {

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
            if (currentBalance>0 && timeStamp>firstTxTimestamp){
              const filteredTokenData = tokensData[token].filter(tx => (tx.timestamp>=prevTimestamp && tx.timestamp<=timeStamp));
              // const filteredTokenData = tokensData[token];
              if (filteredTokenData && filteredTokenData.length){
                const lastTokenData = filteredTokenData.pop();
                const idleTokens = idleTokenBalance[token];
                const idlePrice = this.functionsUtil.fixTokenDecimals(lastTokenData.idlePrice,tokenDecimals);
                const newBalance = idleTokens.times(idlePrice);
                
                // console.log(this.functionsUtil.strToMoment(timeStamp*1000).format('DD/MM/YYYY HH:mm'),token,'idleTokens:'+idleTokens.toFixed(5)+', Old balance:'+parseFloat(lastFilteredTx.balance).toFixed(5)+',New balance:'+parseFloat(newBalance).toFixed(5)+',oldTokenPrice:'+parseFloat(lastFilteredTx.tokenPrice).toFixed(5)+',tokenPrice:'+parseFloat(idlePrice).toFixed(5));

                // Set new balance and tokenPrice
                lastFilteredTx.balance = newBalance;
                lastFilteredTx.tokenPrice = idlePrice;
                filteredBalances = [lastFilteredTx];
              }
            }
          } else {
            filteredBalances = [{
              balance:this.functionsUtil.BNify(0)
            }];
          }
        } else {
          // const startDate = prevTimestamp ? this.functionsUtil.strToMoment(prevTimestamp*1000).format('DD/MM/YYYY HH:mm') : null;
          // const endDate = this.functionsUtil.strToMoment(timeStamp*1000).format('DD/MM/YYYY HH:mm');
          
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
          });
        }

        const lastTx = Object.assign([],filteredBalances).pop();

        aggregatedBalance = aggregatedBalance.plus(lastTx.balance);
        // console.log(aggregatedBalance.toFixed(5));
        // console.log(this.functionsUtil.strToMoment(timeStamp*1000).format('DD/MM/YYYY HH:mm'),token,lastTx.balance.toFixed(5),aggregatedBalance.toFixed(5));

        foundBalances[token] = filteredBalances;
      });
  
  
      const momentDate = this.functionsUtil.strToMoment(timeStamp*1000);
      if (startDate === null || momentDate.isSameOrAfter(startDate)){
        // Save days for axisBottom format
        days[momentDate.format('YYYY/MM/DD')] = 1;
        aggregatedBalances.push({
          x:momentDate.format('YYYY/MM/DD HH:mm'),
          y:parseFloat(aggregatedBalance)
        });

        maxChartValue = Math.max(maxChartValue,aggregatedBalance);
      }

      // console.log(this.functionsUtil.strToMoment(timeStamp*1000).format('DD/MM/YYYY HH:mm'),aggregatedBalance.toFixed(5),this.functionsUtil.formatMoney(aggregatedBalance));

      prevTimestamp = timeStamp;
      prevBalances = foundBalances;
    }

    // Add day before to start with zero balance
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

    const chartToken = this.props.chartToken ? this.props.chartToken.toUpperCase() : 'USD';

    // Add token Data
    chartData.push({
      id:chartToken,
      color: 'hsl('+ this.functionsUtil.getGlobalConfig(['stats','tokens',chartToken,'color','hsl']).join(',')+')',
      data:aggregatedBalances
    });

    // Add 5% to the max grid value
    // maxChartValue += maxChartValue*0.1;
    const maxGridLines = 5;
    const gridYStep = parseFloat(maxChartValue/maxGridLines);
    const gridYValues = [];
    for (let i=1;i<=5;i++){
      gridYValues.push(i*gridYStep);
    }
    
    const axisBottomMaxValues = 10;
    const daysCount = Object.values(days).length;    
    const daysFrequency = Math.max(1,Math.floor(daysCount/axisBottomMaxValues));

    const chartProps = {
      xScale:{
        type: 'time',
        format: '%Y/%m/%d %H:%M',
      },
      xFormat:'time:%b %d %H:%M',
      yFormat:value => this.functionsUtil.formatMoney(value,2),
      yScale:{
        type: 'linear',
        stacked: false
      },
      axisLeft:null,
      areaOpacity:0.1,
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
      enableArea:true,
      curve:'monotoneX',
      enableSlices:'x',
      enableGridX:false,
      enableGridY:true,
      colors:d => d.color,
      pointSize:0,
      pointColor:{ from: 'color', modifiers: []},
      pointBorderWidth:1,
      pointLabel:"y",
      pointLabelYOffset:-12,
      useMesh:true,
      animate:false,
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
      margin: this.props.isMobile ? { top: 20, right: 25, bottom: 25, left: 20 } : { top: 30, right: 50, bottom: 45, left: 50 },
      sliceTooltip:(sliceData) => {
        const { slice: {points} } = sliceData;
        const point = points[0];
        return (
          <DashboardCard
            cardProps={{
              py:2,
              px:3
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
