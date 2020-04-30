import { Line } from '@nivo/line';
import CountUp from 'react-countup';
import React, { Component } from 'react';
import { linearGradientDef } from '@nivo/core'
import SmartNumber from '../SmartNumber/SmartNumber';
import FunctionsUtil from '../utilities/FunctionsUtil';
import { Image, Text, Loader, Button } from "rimble-ui";
import GenericChart from '../GenericChart/GenericChart';
import VariationNumber from '../VariationNumber/VariationNumber';

class AssetField extends Component {

  state = {};

  // Utils
  functionsUtil = null;

  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  async componentWillMount(){
    this.loadUtils();
  }

  async componentDidMount(){
    this.loadField();
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();

    const tokenChanged = prevProps.token !== this.props.token;
    const accountChanged = prevProps.account !== this.props.account;
    const fieldChanged = prevProps.fieldInfo.name !== this.props.fieldInfo.name;
    const contractInitialized = prevProps.contractsInitialized !== this.props.contractsInitialized && this.props.contractsInitialized;
    const transactionsChanged = prevProps.transactions && this.props.transactions && Object.values(prevProps.transactions).filter(tx => (tx.status==='success')).length !== Object.values(this.props.transactions).filter(tx => (tx.status==='success')).length;
    if (fieldChanged || tokenChanged || accountChanged || transactionsChanged || contractInitialized){
      this.setState({},() => {
        this.loadField();
      });
    }
  }

  async loadField(fieldName=null){
    const setState = fieldName === null;
    const fieldInfo = this.props.fieldInfo;
    if (!fieldName){
      fieldName = fieldInfo.name;
    }
    let output = null;
    if (this.props.token){
      let tokenAprs = null;
      switch (fieldName){
        case 'tokenBalance':
          let tokenBalance = this.props.account ? await this.functionsUtil.getTokenBalance(this.props.token,this.props.account) : false;
          if (!tokenBalance){
            tokenBalance = '-';
          }
          if (setState){
            this.setState({
              tokenBalance:tokenBalance.toString()
            });
          }
          output = tokenBalance;
        break;
        case 'amountLent':
          const amountLents = this.props.account ? await this.functionsUtil.getAmountLent([this.props.token],this.props.account) : false;
          let amountLent = '-';
          if (amountLents && amountLents[this.props.token]){
            amountLent = amountLents[this.props.token];
          }
          if (setState){
            this.setState({
              amountLent:amountLent.toString()
            });
          }
          output = amountLent;
        break;
        case 'idleTokenBalance':
          let idleTokenBalance1 = this.props.account ? await this.functionsUtil.getTokenBalance(this.props.tokenConfig.idle.token,this.props.account) : false;
          if (!idleTokenBalance1){
            idleTokenBalance1 = '-';
          }
          if (setState){
            this.setState({
              idleTokenBalance:idleTokenBalance1.toString()
            });
          }
          output = idleTokenBalance1;
        break;
        case 'redeemableBalanceCounter':
          const [redeemableBalanceStart,tokenAPY1] = await Promise.all([
            this.loadField('redeemableBalance'),
            this.loadField('apy')
          ]);
          if (redeemableBalanceStart && tokenAPY1){
            const earningPerYear = this.functionsUtil.BNify(redeemableBalanceStart).times(this.functionsUtil.BNify(tokenAPY1).div(100));
            const redeemableBalanceEnd = this.functionsUtil.BNify(redeemableBalanceStart).plus(this.functionsUtil.BNify(earningPerYear));
            if (setState){
              this.setState({
                redeemableBalanceEnd,
                redeemableBalanceStart
              });
            }
            return {
              redeemableBalanceEnd,
              redeemableBalanceStart
            };
          }
        break;
        case 'earningsCounter':
          const [amountLent2,idleTokenPrice3,avgBuyPrice2,tokenAPY2] = await Promise.all([
            this.loadField('amountLent'),
            this.functionsUtil.getIdleTokenPrice(this.props.tokenConfig),
            this.functionsUtil.getAvgBuyPrice([this.props.token],this.props.account),
            this.loadField('apy')
          ]);
          if (amountLent2 && idleTokenPrice3 && avgBuyPrice2 && avgBuyPrice2[this.props.token] && tokenAPY2){
            const earningsPerc = idleTokenPrice3.div(avgBuyPrice2[this.props.token]).minus(1);
            const earningsStart = amountLent2.gt(0) ? amountLent2.times(earningsPerc) : 0;
            const earningsEnd = amountLent2.gt(0) ? amountLent2.times(tokenAPY2.div(100)) : 0;
            // console.log('earningsCounter',earningsStart.toFixed(5),earningsEnd.toFixed(5),earningsPerc.toFixed(5),amountLent2.toFixed(5),idleTokenPrice3.toFixed(5),avgBuyPrice2[this.props.token].toFixed(5),tokenAPY2.toFixed(5));
            if (setState){
              this.setState({
                earningsEnd,
                earningsStart
              });
            }
            return {
              earningsEnd,
              earningsStart
            };
          }
        break;
        case 'redeemableBalance':
          const [idleTokenBalance2,idleTokenPrice] = await Promise.all([
            this.loadField('idleTokenBalance'),
            this.functionsUtil.genericContractCall(this.props.tokenConfig.idle.token, 'tokenPrice')
          ]);
          if (idleTokenBalance2 && idleTokenPrice){
            const redeemableBalance = this.functionsUtil.fixTokenDecimals(idleTokenBalance2.times(idleTokenPrice),this.props.tokenConfig.decimals);
            if (setState){
              this.setState({
                redeemableBalance:redeemableBalance.toString()
              });
            }
            output = redeemableBalance;
          }
        break;
        case 'earnings':
          let [amountLent1,redeemableBalance1] = await Promise.all([
            this.loadField('amountLent'),
            this.loadField('redeemableBalance')
          ]);
          if (!amountLent1){
            amountLent1 = this.functionsUtil.BNify(0);
          }
          if (!redeemableBalance1){
            redeemableBalance1 = this.functionsUtil.BNify(0);
          }
          const earnings = redeemableBalance1.minus(amountLent1);
          if (setState){
            this.setState({
              earnings:earnings.toString()
            });
          }
          output = earnings;
        break;
        case 'pool':
          const tokenAllocation = await this.functionsUtil.getTokenAllocation(this.props.tokenConfig);
          if (tokenAllocation && tokenAllocation.totalAllocation){
            if (setState){
              this.setState({
                poolSize:tokenAllocation.totalAllocation.toString()
              })
            }
            output = tokenAllocation.totalAllocation;
          }
        break;
        case 'earningsPerc':
          const [avgBuyPrice,idleTokenPrice2] = await Promise.all([
            this.functionsUtil.getAvgBuyPrice([this.props.token],this.props.account),
            this.functionsUtil.getIdleTokenPrice(this.props.tokenConfig)
          ]);

          let earningsPerc = 0;
          if (avgBuyPrice && avgBuyPrice[this.props.token] && avgBuyPrice[this.props.token].gt(0) && idleTokenPrice2){
            earningsPerc = idleTokenPrice2.div(avgBuyPrice[this.props.token]).minus(1).times(100);
            // console.log(this.props.token,avgBuyPrice[this.props.token].toFixed(5),idleTokenPrice2.toFixed(5),parseFloat(earningsPerc).toFixed(3));
          }

          if (setState){
            this.setState({
              earningsPerc:parseFloat(earningsPerc).toFixed(3),
              earningsPercDirection:parseFloat(earningsPerc)>0 ? 'up' : 'down'
            });
          }
          output = earningsPerc;
        break;
        case 'apr':
          tokenAprs = await this.functionsUtil.getTokenAprs(this.props.tokenConfig);
          if (tokenAprs && tokenAprs.avgApr !== null){
            const tokenAPR = tokenAprs.avgApr;
            if (setState){
              this.setState({
                tokenAPR:parseFloat(tokenAPR).toFixed(3)
              });
            }
            output = tokenAPR;
          }
        break;
        case 'apy':
          const tokenAPR = await this.loadField('apr');
          if (tokenAPR){
            const tokenAPY = this.functionsUtil.apr2apy(tokenAPR.div(100)).times(100);
            if (setState){
              this.setState({
                tokenAPR:parseFloat(tokenAPR).toFixed(3),
                tokenAPY:parseFloat(tokenAPY).toFixed(3)
              });
            }
            return tokenAPY;
          }
        break;
        case 'aprChart':

          const apiResultsAprChart = await this.functionsUtil.getTokenApiData(this.props.tokenConfig.address,parseInt(new Date().getTime()/1000)-(60*60*24*7));

          const aprChartData = [{
            id:this.props.token,
            color: 'hsl('+this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.token,'color','hsl']).join(',')+')',
            data: []
          }];

          const frequencySeconds = this.functionsUtil.getFrequencySeconds('hour',12);

          let prevTimestamp = null;
          apiResultsAprChart.forEach((d,i) => {
            if (prevTimestamp === null || d.timestamp-prevTimestamp>=frequencySeconds){
              const x = this.functionsUtil.strToMoment(d.timestamp*1000).format("YYYY/MM/DD HH:mm");
              const y = parseFloat(this.functionsUtil.fixTokenDecimals(d.idleRate,18));
              aprChartData[0].data.push({ x, y });
              prevTimestamp = d.timestamp;
            }
          });

          let aprChartWidth = 0;
          let aprChartHeight = 0;

          const resizeAprChart = () => {
            const aprChartRowElement = document.getElementById(this.props.parentId) ? document.getElementById(this.props.parentId) : document.getElementById(this.props.rowId);
            if (aprChartRowElement){
              const $aprChartRowElement = window.jQuery(aprChartRowElement);
              aprChartWidth = $aprChartRowElement.innerWidth()-parseFloat($aprChartRowElement.css('padding-right'))-parseFloat($aprChartRowElement.css('padding-left'));
              aprChartHeight = $aprChartRowElement.innerHeight();
              if (aprChartWidth !== this.state.aprChartWidth || !this.state.aprChartHeight){
                this.setState({
                  aprChartWidth,
                  aprChartHeight: this.state.aprChartHeight ? this.state.aprChartHeight : aprChartHeight
                });
              }
            }
          }

          // Set chart width and Height and set listener
          resizeAprChart();
          window.removeEventListener('resize', resizeAprChart.bind(this));
          window.addEventListener('resize', resizeAprChart.bind(this));

          // Set chart type
          const aprChartType = Line;

          const aprChartProps = {
            pointSize:0,
            lineWidth:1,
            useMesh:false,
            axisLeft:null,
            animate:false,
            curve:'linear',
            axisBottom:null,
            enableArea:true,
            areaOpacity:0.1,
            enableGridX:false,
            enableGridY:false,
            pointBorderWidth:2,
            enableSlices:false,
            isInteractive:false,
            colors:d => d.color,
            defs:[
              linearGradientDef('gradientArea', [
                  { offset: 0, color: '#faf047' },
                  { offset: 50, color: '#e4b400' },
              ])
            ],
            fill:[
              { match: { id: this.props.token } , id: 'gradientArea' },
            ],
            margin: { top: 10, right: 0, bottom: 0, left: 0 }
          };

          if (this.props.chartProps){
            // Replace props
            if (this.props.chartProps && Object.keys(this.props.chartProps).length){
              Object.keys(this.props.chartProps).forEach(p => {
                aprChartProps[p] = this.props.chartProps[p];
              });
            }
          }

          if (setState){
            this.setState({
              aprChartType,
              aprChartData,
              aprChartProps,
              aprChartWidth,
              aprChartHeight
            });
          }
          output = aprChartData;
        break;
        case 'performanceChart':
          let firstTokenPrice = null;
          let firstIdleBlock = null;
          /*
          let performanceChartWidth = 0;
          let performanceChartHeight = 0;

          const performanceChartRowElement = document.getElementById(this.props.rowId) ? document.getElementById(this.props.rowId) : document.getElementById(this.props.parentId);
          if (performanceChartRowElement){
            performanceChartWidth = parseFloat(performanceChartRowElement.offsetWidth)>0 ? performanceChartRowElement.offsetWidth* (this.props.colProps ? this.props.colProps.width : 1) : 0;
            performanceChartHeight = parseFloat(performanceChartRowElement.offsetHeight);
          }
          */

          let performanceChartWidth = 0;
          let performanceChartHeight = 0;

          const resizePerformanceChart = () => {
            const PerformanceChartRowElement = document.getElementById(this.props.parentId) ? document.getElementById(this.props.parentId) : document.getElementById(this.props.rowId);
            if (PerformanceChartRowElement){
              const $PerformanceChartRowElement = window.jQuery(PerformanceChartRowElement);
              performanceChartWidth = $PerformanceChartRowElement.innerWidth()-parseFloat($PerformanceChartRowElement.css('padding-right'))-parseFloat($PerformanceChartRowElement.css('padding-left'));
              performanceChartHeight = $PerformanceChartRowElement.innerHeight();
              if (performanceChartWidth !== this.state.performanceChartWidth || !this.state.performanceChartHeight){
                this.setState({
                  performanceChartWidth,
                  performanceChartHeight: this.state.performanceChartHeight ? this.state.performanceChartHeight : performanceChartHeight
                });
              }
            }
          }

          // Set chart width and Height and set listener
          resizePerformanceChart();
          window.removeEventListener('resize', resizePerformanceChart.bind(this));
          window.addEventListener('resize', resizePerformanceChart.bind(this));

          const apr_end_date = this.functionsUtil.strToMoment(this.functionsUtil.strToMoment(new Date()).subtract(1,'day').format('YYYY-MM-DD 23:59'),'YYYY-MM-DD HH:mm');
          const apr_start_date = apr_end_date.clone().subtract(1,'week');

          const apr_start_timestamp = parseInt(apr_start_date._d.getTime()/1000);
          const apr_end_timestamp = parseInt(apr_end_date._d.getTime()/1000);

          const apiResultsPerformanceChart = await this.functionsUtil.getTokenApiData(this.props.tokenConfig.address,apr_start_timestamp,apr_end_timestamp);

          const idleTokenPerformance = apiResultsPerformanceChart.map((d,i) => {
            let y = 0;
            const x = this.functionsUtil.strToMoment(d.timestamp*1000).format("YYYY/MM/DD HH:mm");
            const tokenPrice = this.functionsUtil.fixTokenDecimals(d.idlePrice,this.props.tokenConfig.decimals);

            if (!firstTokenPrice){
              firstTokenPrice = tokenPrice;
            } else {
              y = parseFloat(tokenPrice.div(firstTokenPrice).minus(1).times(100));
            }

            if (firstIdleBlock === null){
              firstIdleBlock = parseInt(d.blocknumber);
            }

            return { x, y };
          });

          const performanceChartData = [{
            id:'Idle',
            color: 'hsl('+this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.token,'color','hsl']).join(',')+')',
            data: idleTokenPerformance
          }];

          // Set chart type
          const performanceChartType = Line;

          const performanceChartProps = {
            pointSize:0,
            lineWidth:1,
            useMesh:false,
            animate:false,
            axisLeft:null,
            axisBottom:null,
            enableArea:true,
            enableGridX:false,
            enableGridY:false,
            curve:'monotoneX',
            enableSlices:false,
            pointBorderWidth:1,
            colors:d => d.color,
            pointLabelYOffset:-12,
            margin: { top: 0, right: 0, bottom: 0, left: 0 }
          };

          if (this.props.chartProps){
            // Replace props
            if (this.props.chartProps && Object.keys(this.props.chartProps).length){
              Object.keys(this.props.chartProps).forEach(p => {
                performanceChartProps[p] = this.props.chartProps[p];
              });
            }
          }

          if (setState){
            this.setState({
              performanceChartType,
              performanceChartData,
              performanceChartProps,
              performanceChartWidth,
              performanceChartHeight
            });
          }
          output = performanceChartData;
        break;
        default:
        break;
      }
    }
    return output;
  }

  render(){
    const fieldInfo = this.props.fieldInfo;
    let output = null;

    const loader = (<Loader size="20px" />);

    const minPrecision = fieldInfo.props && fieldInfo.props.minPrecision ? fieldInfo.props.minPrecision : 4;

    switch (fieldInfo.name){
      case 'icon':
        output = (
          <Image src={`images/tokens/${this.props.token}.svg`} {...fieldInfo.props} />
        );
      break;
      case 'tokenName':
        output = (
          <Text {...fieldInfo.props}>{this.props.token}</Text>
        );
      break;
      case 'tokenBalance':
        output = this.state.tokenBalance ? (
          <SmartNumber {...fieldInfo.props} minPrecision={minPrecision} number={this.state.tokenBalance} />
        ) : loader
      break;
      case 'idleTokenBalance':
        output = this.state.idleTokenBalance ? (
          <SmartNumber {...fieldInfo.props} minPrecision={minPrecision} number={this.state.idleTokenBalance} />
        ) : loader
      break;
      case 'redeemableBalanceCounter':
        output = this.state.redeemableBalanceStart && this.state.redeemableBalanceEnd ? (
          <CountUp
            delay={0}
            decimal={'.'}
            separator={''}
            useEasing={false}
            duration={31536000}
            decimals={fieldInfo.decimals}
            end={parseFloat(this.state.redeemableBalanceEnd)}
            start={parseFloat(this.state.redeemableBalanceStart)}
          >
            {({ countUpRef, start }) => (
              <span {...fieldInfo.props} ref={countUpRef} />
            )}
          </CountUp>
        ) : loader
      break;
      case 'earningsCounter':
        output = this.state.earningsStart && this.state.earningsEnd ? (
          <CountUp
            delay={0}
            decimal={'.'}
            separator={''}
            useEasing={false}
            duration={31536000}
            decimals={fieldInfo.decimals}
            end={parseFloat(this.state.earningsEnd)}
            start={parseFloat(this.state.earningsStart)}
          >
            {({ countUpRef, start }) => (
              <span {...fieldInfo.props} ref={countUpRef} />
            )}
          </CountUp>
        ) : loader
      break;
      case 'redeemableBalance':
        output = this.state.redeemableBalance ? (
          <SmartNumber {...fieldInfo.props} minPrecision={minPrecision} number={this.state.redeemableBalance} />
        ) : loader
      break;
      case 'amountLent':
        output = this.state.amountLent ? (
          <SmartNumber {...fieldInfo.props} minPrecision={minPrecision} number={this.state.amountLent} />
        ) : loader
      break;
      case 'pool':
        output = this.state.poolSize ? (
          <SmartNumber {...fieldInfo.props} minPrecision={minPrecision} number={this.state.poolSize} />
        ) : loader
      break;
      case 'earningsPerc':
        output = this.state.earningsPerc ? (
          <VariationNumber direction={this.state.earningsPercDirection}>
            <Text {...fieldInfo.props}>{this.state.earningsPerc}%</Text>
          </VariationNumber>
        ) : loader
      break;
      case 'apr':
        output = this.state.tokenAPR ? (
          <Text {...fieldInfo.props}>{this.state.tokenAPR}%</Text>
        ) : loader
      break;
      case 'apy':
        output = this.state.tokenAPY ? (
          <Text {...fieldInfo.props}>{this.state.tokenAPY}%</Text>
        ) : loader
      break;
      case 'button':
        output = (
          <Button {...fieldInfo.props} onClick={() => fieldInfo.props.handleClick(this.props) }>{fieldInfo.label}</Button>
        );
      break;
      case 'performanceChart':
        output = this.state.performanceChartData ? (
          <GenericChart
            {...this.state.performanceChartProps}
            type={this.state.performanceChartType}
            data={this.state.performanceChartData}
            width={this.state.performanceChartWidth}
            height={this.state.performanceChartHeight}
          />
        ) : loader
      break;
      case 'aprChart':
        output = this.state.aprChartData ? (
          <GenericChart
            {...this.state.aprChartProps}
            type={this.state.aprChartType}
            data={this.state.aprChartData}
            width={this.state.aprChartWidth}
            height={this.state.aprChartHeight}
          />
        ) : loader
      break;
      default:
      break;
    }
    return output;
  }
}

export default AssetField;
