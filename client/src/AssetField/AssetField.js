import { Line } from '@nivo/line';
import CountUp from 'react-countup';
import React, { Component } from 'react';
import { linearGradientDef } from '@nivo/core'
import SmartNumber from '../SmartNumber/SmartNumber';
import FunctionsUtil from '../utilities/FunctionsUtil';
import { Image, Text, Loader, Button } from "rimble-ui";
import GenericChart from '../GenericChart/GenericChart';
import VariationNumber from '../VariationNumber/VariationNumber';
import AllocationChart from '../AllocationChart/AllocationChart';

class AssetField extends Component {

  state = {
    ready:false
  };

  // Utils
  functionsUtil = null;
  componentUnmounted = false;

  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  async componentWillUnmount(){
    this.componentUnmounted = true;
  }

  async componentWillMount(){
    this.loadUtils();
  }

  async componentDidMount(){
    this.loadField();
  }

  async setStateSafe(newState,callback=null) {
    if (!this.componentUnmounted){
      return this.setState(newState,callback);
    }
    return null;
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();

    const tokenChanged = prevProps.token !== this.props.token;
    const accountChanged = prevProps.account !== this.props.account;
    const fieldChanged = prevProps.fieldInfo.name !== this.props.fieldInfo.name;
    const contractInitialized = prevProps.contractsInitialized !== this.props.contractsInitialized && this.props.contractsInitialized;
    const transactionsChanged = prevProps.transactions && this.props.transactions && Object.values(prevProps.transactions).filter(tx => (tx.status==='success')).length !== Object.values(this.props.transactions).filter(tx => (tx.status==='success')).length;

    if (fieldChanged || tokenChanged || accountChanged || transactionsChanged || (contractInitialized && !this.state.ready)){
      this.setStateSafe({},() => {
        this.loadField();
      });
    }
  }

  loadField = async(fieldName=null) => {
    // Exit if component unmounted
    if (this.componentUnmounted || !this.props.token || !this.props.tokenConfig){
      return false;
    }

    const isRisk = this.props.selectedStrategy === 'risk';

    const setState = fieldName === null;
    const fieldInfo = this.props.fieldInfo;
    if (!fieldName){
      fieldName = fieldInfo.name;
    }

    const fieldProps = fieldInfo.props;
    const decimals = fieldProps && fieldProps.decimals ? fieldProps.decimals : ( this.props.isMobile ? 2 : 3 );

    let output = null;
    if (this.props.token){
      let tokenAprs = null;
      switch (fieldName){
        case 'tokenBalance':
          let tokenBalance = this.props.account ? await this.functionsUtil.getTokenBalance(this.props.tokenConfig.token,this.props.account) : false;
          if (!tokenBalance){
            tokenBalance = '-';
          }
          if (setState){
            this.setStateSafe({
              tokenBalance:tokenBalance.toString()
            });
          }
          output = tokenBalance;
        break;
        case 'amountToMigrate':
          const {
            oldContractBalanceFormatted
          } = await this.functionsUtil.checkMigration(this.props.tokenConfig,this.props.account);

          if (setState){
            this.setStateSafe({
              amountToMigrate:oldContractBalanceFormatted.toString()
            });
          }
          output = oldContractBalanceFormatted;
        break;
        case 'amountLent':
          const amountLents = this.props.account ? await this.functionsUtil.getAmountLent([this.props.token],this.props.account) : false;
          let amountLent = '-';
          if (amountLents && amountLents[this.props.token]){
            amountLent = amountLents[this.props.token];
          }
          if (setState){
            this.setStateSafe({
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
            this.setStateSafe({
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
              this.setStateSafe({
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
            this.setStateSafe({
              earnings:earnings.toString()
            });
          }
          output = earnings;
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

            if (setState){
              this.setStateSafe({
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
              this.setStateSafe({
                redeemableBalance:redeemableBalance.toString()
              });
            }
            output = redeemableBalance;
          }
        break;
        case 'score':
          const tokenScore = await this.functionsUtil.getTokenScore(this.props.tokenConfig,isRisk);
          if (setState){
            this.setStateSafe({
              score:tokenScore ? tokenScore : false
            })
          }
          output = tokenScore;
        break;
        case 'pool':
          const tokenAllocation = await this.functionsUtil.getTokenAllocation(this.props.tokenConfig);

          if (tokenAllocation && tokenAllocation.totalAllocation){
            if (setState){
              this.setStateSafe({
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
          }

          if (setState){
            this.setStateSafe({
              earningsPercDirection:parseFloat(earningsPerc)>0 ? 'up' : 'down',
              earningsPerc:parseFloat(earningsPerc).toFixed(decimals)
            });
          }
          output = earningsPerc;
        break;
        case 'apr':
          tokenAprs = await this.functionsUtil.getTokenAprs(this.props.tokenConfig);
          if (tokenAprs && tokenAprs.avgApr !== null){
            const tokenAPR = tokenAprs.avgApr;
            if (setState){
              this.setStateSafe({
                tokenAPR:parseFloat(tokenAPR).toFixed(decimals)
              });
            }
            output = tokenAPR;
          }
        break;
        case 'apy':
          const tokenAPR = await this.loadField('apr');
          if (tokenAPR !== null){
            if (!tokenAPR.isNaN()){
              const tokenAPY = this.functionsUtil.apr2apy(tokenAPR.div(100)).times(100);
              if (setState){
                this.setStateSafe({
                  tokenAPR:parseFloat(tokenAPR).toFixed(decimals),
                  tokenAPY:parseFloat(tokenAPY).toFixed(decimals)
                });
              }
              return tokenAPY;
            } else {
              if (setState){
                this.setStateSafe({
                  tokenAPR:false,
                  tokenAPY:false
                });
              }
              return false;
            }
          }
        break;
        case 'allocationChart':
          let allocationChartWidth = 0;
          let allocationChartHeight = 0;

          const resizeAllocationChart = () => {
            const allocationChartRowElement = document.getElementById(this.props.parentId) ? document.getElementById(this.props.parentId) : document.getElementById(this.props.rowId);
            if (allocationChartRowElement){
              const $allocationChartRowElement = window.jQuery(allocationChartRowElement);
              allocationChartWidth = $allocationChartRowElement.innerWidth()-parseFloat($allocationChartRowElement.css('padding-right'))-parseFloat($allocationChartRowElement.css('padding-left'));
              allocationChartHeight = $allocationChartRowElement.innerHeight();

              // Make it a square
              allocationChartWidth = Math.min(allocationChartWidth,allocationChartHeight);
              allocationChartHeight = allocationChartWidth;

              if (allocationChartWidth !== this.state.allocationChartWidth){
                if (setState){
                  this.setStateSafe({
                    allocationChartWidth,
                    allocationChartHeight
                  });
                }
              }
            }
          }

          // Set chart width and Height and set listener
          resizeAllocationChart();
          window.removeEventListener('resize', resizeAllocationChart.bind(this));
          window.addEventListener('resize', resizeAllocationChart.bind(this));

          if (setState){
            this.setStateSafe({
              allocationChartWidth,
              allocationChartHeight
            });
          }
        break;
        case 'aprChart':
          // Set start timestamp for v3 tokens
          const aprChartStartTimestamp = Math.max(this.functionsUtil.getGlobalConfig(['stats','versions','v3','startTimestamp']),parseInt(this.functionsUtil.strToMoment(this.functionsUtil.strToMoment(new Date()).format('DD/MM/YYYY 00:00:00'),'DD/MM/YYYY HH:mm:ss').subtract(7,'days')._d.getTime()/1000));

          // Check for cached data
          let aprChartData = null;
          const cachedDataKey = `aprChart_${this.props.tokenConfig.address}_${isRisk}`;
          const cachedData = this.functionsUtil.getCachedData(cachedDataKey);
          if (cachedData !== null){
            aprChartData = cachedData;
          } else {
            let apiResultsAprChart = await this.functionsUtil.getTokenApiData(this.props.tokenConfig.address,isRisk,aprChartStartTimestamp,null,false,43200);
            aprChartData = [{
              id:this.props.token,
              color: this.props.color ? this.props.color : 'hsl('+this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.token,'color','hsl']).join(',')+')',
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

            /*
            // FAKE CHART DATA
            aprChartData[0].data = [];
            const startTimestamp = new Date().getTime();
            let y = 20;
            for (var i=0; i<=16; i++) {
              const mDate = this.functionsUtil.strToMoment(startTimestamp).add(i,'day');
              const x = mDate.format("YYYY/MM/DD HH:mm");
              // Grow
              if ((i>=5 && i<=10) || (i>=13)){
                y+=Math.random()*4+2; // Risk
                // y+=Math.random()*7+4; // Best
              // Decrease
              } else {
                y-=Math.random()*3+1; // Risk
                // y-=Math.random()*3+1; // Best
              }
              aprChartData[0].data.push({x,y});
            }
            */

            this.functionsUtil.setCachedData(cachedDataKey,aprChartData);
          }


          // Add same value
          if (aprChartData[0].data.length === 1){
            const newPoint = Object.assign({},aprChartData[0].data[0]);
            newPoint.x = this.functionsUtil.strToMoment(newPoint,"YYYY/MM/DD HH:mm").add(1,'hours').format("YYYY/MM/DD HH:mm")
            aprChartData[0].data.push(newPoint);
          }

          let aprChartWidth = 0;
          let aprChartHeight = 0;

          const resizeAprChart = () => {
            const aprChartRowElement = document.getElementById(this.props.parentId) ? document.getElementById(this.props.parentId) : document.getElementById(this.props.rowId);
            if (aprChartRowElement){
              const $aprChartRowElement = window.jQuery(aprChartRowElement);
              aprChartWidth = $aprChartRowElement.innerWidth()-parseFloat($aprChartRowElement.css('padding-right'))-parseFloat($aprChartRowElement.css('padding-left'));
              aprChartHeight = $aprChartRowElement.innerHeight();
              if (aprChartWidth !== this.state.aprChartWidth || !this.state.aprChartHeight){
                this.setStateSafe({
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
            curve:'monotoneX',
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
            this.setStateSafe({
              ready:true,
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
                this.setStateSafe({
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

          // Set start timestamp for v3 tokens
          const apr_start_timestamp =  Math.max(this.functionsUtil.getGlobalConfig(['stats','versions','v3','startTimestamp']),parseInt(apr_start_date._d.getTime()/1000));
          // const apr_end_timestamp = parseInt(apr_end_date._d.getTime()/1000);

          let apiResultsPerformanceChart = await this.functionsUtil.getTokenApiData(this.props.tokenConfig.address,isRisk,apr_start_timestamp,null,false,43200);

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
            this.setStateSafe({
              ready:true,
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

    const showLoader = fieldInfo.showLoader === undefined || fieldInfo.showLoader;
    const loader = showLoader ? (<Loader size="20px" />) : null;

    const fieldProps = {
      fontWeight:3,
      fontSize:[0,2],
      color:'cellText',
      flexProps:{
        justifyContent:'flex-start'
      }
    };

    // Replace props
    if (fieldInfo.props && Object.keys(fieldInfo.props).length){
      Object.keys(fieldInfo.props).forEach(p => {
        fieldProps[p] = fieldInfo.props[p];
      });
    }

    // Merge with funcProps
    if (fieldInfo.funcProps && Object.keys(fieldInfo.funcProps).length){
      Object.keys(fieldInfo.funcProps).forEach(p => {
        if (typeof fieldInfo.funcProps[p]==='function'){
          fieldProps[p] = fieldInfo.funcProps[p](this.props);
        }
      });
    }
      
    const maxPrecision = fieldProps && fieldProps.maxPrecision ? fieldProps.maxPrecision : 5;
    const decimals = fieldProps && fieldProps.decimals ? fieldProps.decimals : ( this.props.isMobile ? 2 : 3 );
    const minPrecision = fieldProps && fieldProps.minPrecision ? fieldProps.minPrecision : ( this.props.isMobile ? 3 : 4 );

    switch (fieldInfo.name){
      case 'icon':
        const icon = this.props.tokenConfig && this.props.tokenConfig.icon ? this.props.tokenConfig.icon : `images/tokens/${this.props.token}.svg`;
        output = (
          <Image src={icon} {...fieldProps} />
        );
      break;
      case 'tokenName':
        output = (
          <Text {...fieldProps}>{this.props.token}</Text>
        );
      break;
      case 'tokenBalance':
        output = this.state.tokenBalance ? (
          <SmartNumber {...fieldProps} minPrecision={minPrecision} number={this.state.tokenBalance} />
        ) : loader
      break;
      case 'amountToMigrate':
        output = this.state.amountToMigrate ? (
          <SmartNumber {...fieldProps} minPrecision={minPrecision} number={this.state.amountToMigrate} />
        ) : loader
      break;
      case 'idleTokenBalance':
        output = this.state.idleTokenBalance ? (
          <SmartNumber {...fieldProps} minPrecision={minPrecision} number={this.state.idleTokenBalance} />
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
            decimals={decimals}
            end={parseFloat(this.state.redeemableBalanceEnd)}
            start={parseFloat(this.state.redeemableBalanceStart)}
            formattingFn={ n => this.functionsUtil.abbreviateNumber(n,decimals,maxPrecision,minPrecision) }
          >
            {({ countUpRef, start }) => (
              <span style={fieldProps.style} ref={countUpRef} />
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
            decimals={decimals}
            end={parseFloat(this.state.earningsEnd)}
            start={parseFloat(this.state.earningsStart)}
            formattingFn={ n => this.functionsUtil.abbreviateNumber(n,decimals,maxPrecision,minPrecision) }
          >
            {({ countUpRef, start }) => (
              <span style={fieldProps.style} ref={countUpRef} />
            )}
          </CountUp>
        ) : loader
      break;
      case 'redeemableBalance':
        output = this.state.redeemableBalance ? (
          <SmartNumber {...fieldProps} decimals={decimals} minPrecision={minPrecision} maxPrecision={maxPrecision} number={this.state.redeemableBalance} />
        ) : loader
      break;
      case 'amountLent':
        output = this.state.amountLent ? (
          <SmartNumber {...fieldProps} decimals={decimals} minPrecision={minPrecision} maxPrecision={maxPrecision} number={this.state.amountLent} />
        ) : loader
      break;
      case 'pool':
        output = this.state.poolSize ? (
          <SmartNumber {...fieldProps} decimals={decimals} minPrecision={minPrecision} maxPrecision={maxPrecision} number={this.state.poolSize} />
        ) : loader
      break;
      case 'score':
        output = this.state.score !== null ? (
          <SmartNumber {...fieldProps} decimals={1} number={this.state.score} />
        ) : loader
      break;
      case 'earningsPerc':
        output = this.state.earningsPerc ?
          (typeof fieldInfo.showDirection === 'undefined' || fieldInfo.showDirection) ? (
            <VariationNumber
              isMobile={this.props.isMobile}
              direction={this.state.earningsPercDirection}
            >
              <Text {...fieldProps}>{this.state.earningsPerc}%</Text>
            </VariationNumber>
          ) : (
            <Text {...fieldProps}>{this.state.earningsPerc}%</Text>
          )
        : loader
      break;
      case 'earnings':
        output = this.state.earnings ? (
          <VariationNumber
            direction={'up'}
            isMobile={this.props.isMobile}
          >
            <SmartNumber
              {...fieldProps}
              decimals={decimals}
              minPrecision={minPrecision}
              number={this.state.earnings}
            />
          </VariationNumber>
        ) : loader
      break;
      case 'apr':
        output = this.state.tokenAPR ? (
          <Text {...fieldProps}>{this.state.tokenAPR}%</Text>
        ) : loader
      break;
      case 'apy':
        output = this.state.tokenAPY !== undefined ? (
          <Text {...fieldProps}>{this.state.tokenAPY !== false ? this.state.tokenAPY : '-' }<small>%</small></Text>
        ) : loader
      break;
      case 'button':
        const buttonLabel = typeof fieldInfo.label === 'function' ? fieldInfo.label(this.props) : fieldInfo.label;
        output = (
          <Button {...fieldProps} onClick={() => fieldProps.handleClick(this.props) }>{buttonLabel}</Button>
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
      case 'allocationChart':
        output = this.state.allocationChartWidth && this.state.allocationChartHeight ? (
          <AllocationChart
            {...this.props}
            loaderProps={{
              size:'20px'
            }}
            loaderText={''}
            selectedToken={this.props.token}
            width={this.state.allocationChartWidth}
            height={this.state.allocationChartHeight}
            inline={typeof this.props.inline !== 'undefined' ? this.props.inline : true}
            showLoader={typeof this.props.showLoader !== 'undefined' ? this.props.showLoader : false}
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
