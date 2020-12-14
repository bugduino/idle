import { Line } from '@nivo/line';
import CountUp from 'react-countup';
import React, { Component } from 'react';
import { linearGradientDef } from '@nivo/core'
import SmartNumber from '../SmartNumber/SmartNumber';
import FunctionsUtil from '../utilities/FunctionsUtil';
import GenericChart from '../GenericChart/GenericChart';
import VariationNumber from '../VariationNumber/VariationNumber';
import AllocationChart from '../AllocationChart/AllocationChart';
import { Image, Text, Loader, Button, Tooltip, Icon, Flex } from "rimble-ui";

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
    // console.log('loadField',this.props.fieldInfo.name,this.props.account,this.props.token,this.props.tokenConfig);

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
    // const addCurveApy = typeof this.props.addCurveApy !== 'undefined' ? this.props.addCurveApy : false;
    const addGovTokens = typeof this.props.addGovTokens !== 'undefined' ? this.props.addGovTokens : true;

    let output = null;
    if (this.props.token){
      switch (fieldName){
        case 'tokenBalance':
          output = await this.functionsUtil.loadAssetField(fieldName,this.props.token,this.props.tokenConfig,this.props.account,addGovTokens);
          if (output && setState){
            this.setStateSafe({
              tokenBalance:output.toString()
            });
          }
        break;
        case 'govTokens':
          const govTokens = this.functionsUtil.getTokenGovTokens(this.props.tokenConfig);
          const getGovTokensDistributionSpeed = await this.functionsUtil.getGovTokensDistributionSpeed(this.props.tokenConfig);
          this.setStateSafe({
            govTokens,
            getGovTokensDistributionSpeed
          });
        break;
        case 'tokenPrice':
          output = await this.functionsUtil.loadAssetField(fieldName,this.props.token,this.props.tokenConfig,this.props.account,addGovTokens);
          if (output && setState){
            let tokenPrice = '-';
            if (typeof this.props.tokenConfig.showPrice === 'undefined' || this.props.tokenConfig.showPrice){
              tokenPrice = output.toString();
            }
            this.setStateSafe({
              tokenPrice
            });
          }
        break;
        case 'fee':
          output = await this.functionsUtil.loadAssetField(fieldName,this.props.token,this.props.tokenConfig,this.props.account,addGovTokens);
          if (output && setState){
            this.setStateSafe({
              fee:output.toString()
            });
          }
        break;
        case 'amountToMigrate':
          const {
            oldContractBalanceFormatted
          } = await this.functionsUtil.checkMigration(this.props.tokenConfig,this.props.account,addGovTokens);

          if (setState && oldContractBalanceFormatted){
            this.setStateSafe({
              amountToMigrate:oldContractBalanceFormatted.toString()
            });
            output = oldContractBalanceFormatted;
          }
        break;
        case 'amountLent':
          output = await this.functionsUtil.loadAssetField(fieldName,this.props.token,this.props.tokenConfig,this.props.account,addGovTokens);
          if (output && setState){
            this.setStateSafe({
              amountLent:output.toString()
            });
          }
        break;
        case 'idleTokenBalance':
          output = await this.functionsUtil.loadAssetField(fieldName,this.props.token,this.props.tokenConfig,this.props.account,addGovTokens);
          if (output && setState){
            this.setStateSafe({
              idleTokenBalance:output.toString()
            });
          }
        break;
        case 'redeemableBalanceCounterCurve':
          const {
            redeemableBalanceCurveEnd,
            redeemableBalanceCurveStart
          } = await this.functionsUtil.loadAssetField(fieldName,this.props.token,this.props.tokenConfig,this.props.account,addGovTokens);

          if (redeemableBalanceCurveStart && redeemableBalanceCurveEnd){
            if (setState){
              this.setStateSafe({
                redeemableBalanceCurveEnd,
                redeemableBalanceCurveStart
              });
            }

            output = {
              redeemableBalanceCurveEnd,
              redeemableBalanceCurveStart
            };
          }
        break;
        case 'redeemableBalanceCounter':
          const {
            redeemableBalanceEnd,
            redeemableBalanceStart
          } = await this.functionsUtil.loadAssetField(fieldName,this.props.token,this.props.tokenConfig,this.props.account,addGovTokens);

          if (redeemableBalanceStart && redeemableBalanceEnd){
            if (setState){
              this.setStateSafe({
                redeemableBalanceEnd,
                redeemableBalanceStart
              });
            }

            output = {
              redeemableBalanceEnd,
              redeemableBalanceStart
            };
          }
        break;
        case 'earnings':
          output = await this.functionsUtil.loadAssetField(fieldName,this.props.token,this.props.tokenConfig,this.props.account,addGovTokens);
          if (output && setState){
            this.setStateSafe({
              earnings:output.toString()
            });
          }
        break;
        case 'feesCounter':
          const [earningsCounter,feePercentage] = await Promise.all([
            this.loadField('earningsCounter'),
            this.functionsUtil.getTokenFees(this.props.tokenConfig)
          ]);

          if (earningsCounter && earningsCounter.earningsStart && earningsCounter.earningsEnd && feePercentage){

            const feesStart = earningsCounter.earningsStart.times(feePercentage);
            const feesEnd = earningsCounter.earningsEnd.times(feePercentage);

            if (setState){
              this.setStateSafe({
                feesEnd,
                feesStart
              });
            }

            output = {
              feesEnd,
              feesStart
            };
          }
        break;
        case 'earningsCounterCurve':
          const [curveApy,earningsCurveStart,amountLentCurve] = await Promise.all([
            this.functionsUtil.getCurveAPY(),
            this.functionsUtil.loadAssetField('earningsCurve',this.props.token,this.props.tokenConfig,this.props.account,addGovTokens),
            this.functionsUtil.loadAssetField('amountLentCurve',this.props.token,this.props.tokenConfig,this.props.account,addGovTokens)
          ]);

          if (amountLentCurve && earningsCurveStart && curveApy){
            const earningsCurveEnd = amountLentCurve.gt(0) ? amountLentCurve.times(curveApy.div(100)).plus(earningsCurveStart) : 0;

            if (setState){
              this.setStateSafe({
                earningsCurveEnd,
                earningsCurveStart
              });
            }

            output = {
              earningsCurveEnd,
              earningsCurveStart
            };
          }
        break;
        case 'earningsCounter':
          const [tokenAPY2,earningsStart,amountLent2] = await Promise.all([
            this.functionsUtil.loadAssetField('apy',this.props.token,this.props.tokenConfig,this.props.account,addGovTokens),
            this.functionsUtil.loadAssetField('earnings',this.props.token,this.props.tokenConfig,this.props.account,addGovTokens),
            this.functionsUtil.loadAssetField('amountLent',this.props.token,this.props.tokenConfig,this.props.account,addGovTokens)
          ]);

          if (amountLent2 && earningsStart && tokenAPY2){
            const earningsEnd = amountLent2.gt(0) ? amountLent2.times(tokenAPY2.div(100)).plus(earningsStart) : 0;

            if (setState){
              this.setStateSafe({
                earningsEnd,
                earningsStart
              });
            }

            output = {
              earningsEnd,
              earningsStart
            };
          }
        break;
        case 'redeemableBalance':
          output = await this.functionsUtil.loadAssetField(fieldName,this.props.token,this.props.tokenConfig,this.props.account,addGovTokens);
          if (output && setState){
            this.setStateSafe({
              redeemableBalance:output.toString()
            });
          }
        break;
        case 'score':
          const tokenScore = await this.functionsUtil.getTokenScore(this.props.tokenConfig,isRisk);
          if (setState){
            this.setStateSafe({
              score:tokenScore ? tokenScore : false
            });
          }
          output = tokenScore;
        break;
        case 'pool':
          output = await this.functionsUtil.loadAssetField(fieldName,this.props.token,this.props.tokenConfig,this.props.account,addGovTokens);
          if (output && setState){
            this.setStateSafe({
              poolSize:output.toString()
            });
          }
        break;
        case 'earningsPercCurve':
          output = await this.functionsUtil.loadAssetField(fieldName,this.props.token,this.props.tokenConfig,this.props.account,addGovTokens);
          if (output && setState){
            this.setStateSafe({
              earningsPercCurveDirection:parseFloat(output)>0 ? 'up' : 'down',
              earningsPercCurve:parseFloat(output).toFixed(decimals)
            });
          }
        break;
        case 'earningsPerc':
          output = await this.functionsUtil.loadAssetField(fieldName,this.props.token,this.props.tokenConfig,this.props.account,addGovTokens);
          if (output && setState){
            this.setStateSafe({
              earningsPercDirection:parseFloat(output)>0 ? 'up' : 'down',
              earningsPerc:parseFloat(output).toFixed(decimals)
            });
          }
        break;
        case 'apr':
          output = await this.functionsUtil.loadAssetField(fieldName,this.props.token,this.props.tokenConfig,this.props.account,addGovTokens);
          if (output && setState){
            let tokenAPR = '-';
            if (typeof this.props.tokenConfig.showAPR === 'undefined' || this.props.tokenConfig.showAPR){
              tokenAPR = parseFloat(output).toFixed(decimals);
            }
            this.setStateSafe({
              tokenAPR
            });
          }
        break;
        case 'oldApy':
          if (this.props.tokenConfig.migration && this.props.tokenConfig.migration.oldContract){
            const oldTokenConfig = Object.assign({},this.props.tokenConfig);
            oldTokenConfig.idle = Object.assign({},this.props.tokenConfig.migration.oldContract);
            oldTokenConfig.protocols = Object.values(this.props.tokenConfig.protocols);

            // Override token with name
            oldTokenConfig.idle.token = oldTokenConfig.idle.name;

            // Replace protocols with old protocols
            if (oldTokenConfig.migration.oldProtocols){
              oldTokenConfig.migration.oldProtocols.forEach( oldProtocol => {
                const foundProtocol = oldTokenConfig.protocols.find( p => (p.name === oldProtocol.name) );
                if (foundProtocol){
                  const protocolPos = oldTokenConfig.protocols.indexOf(foundProtocol);
                  oldTokenConfig.protocols[protocolPos] = oldProtocol;
                }
              });
            }

            output = await this.functionsUtil.loadAssetField('apy',this.props.token,oldTokenConfig,this.props.account,false);

          } else {
            output = await this.loadField('apyNoGov');
          }

          if (output && setState){
            if (!output.isNaN()){
              this.setStateSafe({
                oldAPY:parseFloat(output).toFixed(decimals)
              });
            } else {
              this.setStateSafe({
                oldAPY:false
              });
            }
          }
        break;
        case 'apyNoGov':
          output = await this.functionsUtil.loadAssetField('apy',this.props.token,this.props.tokenConfig,this.props.account,false);
          // debugger;
          if (output && setState){
            if (!output.isNaN()){
              this.setStateSafe({
                tokenAPYNoGov:parseFloat(output).toFixed(decimals)
              });
            } else {
              this.setStateSafe({
                tokenAPYNoGov:false
              });
            }
          }
        break;
        case 'curveApy':
          output = await this.functionsUtil.loadAssetField(fieldName,this.props.token,this.props.tokenConfig,this.props.account,addGovTokens);
          // debugger;
          if (output && setState){
            if (!output.isNaN()){
              this.setStateSafe({
                curveApy:parseFloat(output).toFixed(decimals)
              });
            } else {
              this.setStateSafe({
                curveApy:false
              });
            }
          }
        break;
        case 'curveAvgSlippage':
          output = await this.functionsUtil.loadAssetField(fieldName,this.props.token,this.props.tokenConfig,this.props.account,addGovTokens);
          // debugger;
          if (output && setState){
            if (!output.isNaN()){
              this.setStateSafe({
                curveAvgSlippage:(parseFloat(output)*100).toFixed(decimals)
              });
            } else {
              this.setStateSafe({
                curveAvgSlippage:false
              });
            }
          }
        break;

        case 'apy':
          output = await this.functionsUtil.loadAssetField(fieldName,this.props.token,this.props.tokenConfig,this.props.account,addGovTokens);
          // debugger;
          if (output && setState){
            if (!output.isNaN()){
              const tokenAPY = parseFloat(output).toFixed(decimals);
              const showTooltip = !this.props.isMobile && (fieldInfo.showTooltip !== undefined && fieldInfo.showTooltip);
              const govTokensAprs = showTooltip ? await this.functionsUtil.getGovTokensAprs(this.props.token,this.props.tokenConfig) : null;
              this.setStateSafe({
                tokenAPY,
                govTokensAprs
              });
            } else {
              this.setStateSafe({
                tokenAPY:false
              });
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
              allocationChartWidth = parseInt(allocationChartWidth)>0 ? Math.min(allocationChartWidth,allocationChartHeight) : allocationChartHeight;
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
          const aprChartEndTimestamp = isRisk ? this.functionsUtil.getGlobalConfig(['stats','versions','v3','endTimestamp']) : null;
          const aprChartStartTimestamp = isRisk ? aprChartEndTimestamp-(7*24*60*60) : Math.max(this.functionsUtil.getGlobalConfig(['stats','versions','v3','startTimestamp']),parseInt(this.functionsUtil.strToMoment(this.functionsUtil.strToMoment(new Date()).format('DD/MM/YYYY 00:00:00'),'DD/MM/YYYY HH:mm:ss').subtract(7,'days')._d.getTime()/1000));

          // Check for cached data
          let aprChartData = null;
          const cachedDataKey = `aprChart_${this.props.tokenConfig.address}_${isRisk}`;
          const cachedData = this.functionsUtil.getCachedData(cachedDataKey);

          aprChartData = [{
            id:this.props.token,
            color: this.props.color ? this.props.color : 'hsl('+this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.token,'color','hsl']).join(',')+')',
            data: []
          }];

          if (cachedData !== null){
            aprChartData = cachedData;
          } else {

            // FAKE CHART DATA
            if (this.props.token === 'COMP'){
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
            } else {
              const frequencySeconds = this.functionsUtil.getFrequencySeconds('hour',12);
              const apiResultsAprChart = await this.functionsUtil.getTokenApiData(this.props.tokenConfig.address,isRisk,aprChartStartTimestamp,aprChartEndTimestamp,false,frequencySeconds);

              // if (isRisk){
              //   debugger;
              // }

              apiResultsAprChart.forEach((d,i) => {
                const x = this.functionsUtil.strToMoment(d.timestamp*1000).format("YYYY/MM/DD HH:mm");
                const y = parseFloat(this.functionsUtil.fixTokenDecimals(d.idleRate,18));
                aprChartData[0].data.push({ x, y });
              });
            }

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
          output = await this.functionsUtil.loadAssetField(fieldName,this.props.token,this.props.tokenConfig,this.props.account,addGovTokens);
          if (output && setState){
            this.setStateSafe({
              [fieldName]:output
            });
          }
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
      case 'iconTooltip':
        const icon1 = this.props.tokenConfig && this.props.tokenConfig.icon ? this.props.tokenConfig.icon : `images/tokens/${this.props.token}.svg`;
        output = (
          <Tooltip
            placement={'top'}
            message={this.props.token}
            {...fieldInfo.tooltipProps}
          >
            <Image src={icon1} {...fieldProps} />
          </Tooltip>
        );
      break;
      case 'icon':
        const icon2 = this.props.tokenConfig && this.props.tokenConfig.icon ? this.props.tokenConfig.icon : `images/tokens/${this.props.token}.svg`;
        output = (
          <Image src={icon2} {...fieldProps} />
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
      case 'fee':
        output = this.state.fee ? (
          <SmartNumber {...fieldProps} minPrecision={minPrecision} number={this.state.fee} />
        ) : loader
      break;
      case 'tokenPrice':
        output = this.state.tokenPrice ? (
          <SmartNumber {...fieldProps} minPrecision={minPrecision} number={this.state.tokenPrice} />
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
      case 'redeemableBalanceCounterCurve':
        output = this.state.redeemableBalanceCurveStart && this.state.redeemableBalanceCurveEnd ? (
          <CountUp
            delay={0}
            decimal={'.'}
            separator={''}
            useEasing={false}
            duration={31536000}
            decimals={decimals}
            end={parseFloat(this.state.redeemableBalanceCurveEnd)}
            start={parseFloat(this.state.redeemableBalanceCurveStart)}
            formattingFn={ n => this.functionsUtil.abbreviateNumber(n,decimals,maxPrecision,minPrecision) }
          >
            {({ countUpRef, start }) => (
              <span style={fieldProps.style} ref={countUpRef} />
            )}
          </CountUp>
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
      case 'feesCounter':
        output = this.state.feesStart && this.state.feesEnd ? (
          <CountUp
            delay={0}
            decimal={'.'}
            separator={''}
            useEasing={false}
            duration={31536000}
            decimals={decimals}
            end={parseFloat(this.state.feesEnd)}
            start={parseFloat(this.state.feesStart)}
            formattingFn={ n => this.functionsUtil.abbreviateNumber(n,decimals,maxPrecision,minPrecision) }
          >
            {({ countUpRef, start }) => (
              <span style={fieldProps.style} ref={countUpRef} />
            )}
          </CountUp>
        ) : loader
      break;
      case 'earningsCounterCurve':
        output = this.state.earningsCurveStart && this.state.earningsCurveEnd ? (
          <CountUp
            delay={0}
            decimal={'.'}
            separator={''}
            useEasing={false}
            duration={31536000}
            decimals={decimals}
            end={parseFloat(this.state.earningsCurveEnd)}
            start={parseFloat(this.state.earningsCurveStart)}
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
      case 'govTokens':
        output = this.state.govTokens ? (
          <Flex
            width={1}
            alignItems={'center'}
            flexDirection={'row'}
            justifyContent={'flex-start'}
          >
            {
              Object.values(this.state.govTokens).map( (govTokenConfig,govTokenIndex) => (
                <AssetField
                  token={govTokenConfig.token}
                  tokenConfig={govTokenConfig}
                  key={`asset_${govTokenIndex}`}
                  fieldInfo={{
                    name:'iconTooltip',
                    tooltipProps:{
                      message:`${govTokenConfig.token}`+(this.state.getGovTokensDistributionSpeed && this.state.getGovTokensDistributionSpeed[govTokenConfig.token] ? `: ${this.state.getGovTokensDistributionSpeed[govTokenConfig.token].toFixed(decimals)}/${govTokenConfig.distributionFrequency} (for the whole pool)` : '')
                    },
                    props:{
                      borderRadius:'50%',
                      position:'relative',
                      height:['1.1em','2em'],
                      ml:govTokenIndex ? '-10px' : 0,
                      zIndex:Object.values(this.state.govTokens).length-govTokenIndex,
                      boxShadow:['1px 1px 1px 0px rgba(0,0,0,0.1)','1px 2px 3px 0px rgba(0,0,0,0.1)'],
                    }
                  }}
                />
              ))
            }
          </Flex>
        ) : loader
      break;
      case 'amountLentCurve':
        output = this.state.amountLentCurve ? (
          <SmartNumber {...fieldProps} decimals={decimals} minPrecision={minPrecision} maxPrecision={maxPrecision} number={this.state.amountLentCurve} />
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
        // console.log('score',this.state.score);
        output = this.state.score !== undefined && this.state.score !== null ? (
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
      case 'earningsPercCurve':
        output = this.state.earningsPercCurve ?
          (typeof fieldInfo.showDirection === 'undefined' || fieldInfo.showDirection) ? (
            <VariationNumber
              isMobile={this.props.isMobile}
              direction={this.state.earningsPercCurveDirection}
            >
              <Text {...fieldProps}>{this.state.earningsPercCurve}%</Text>
            </VariationNumber>
          ) : (
            <Text {...fieldProps}>{this.state.earningsPercCurve}%</Text>
          )
        : loader
      break;
      case 'earningsCurve':
        output = this.state.earningsCurve ? (
          <VariationNumber
            direction={'up'}
            isMobile={this.props.isMobile}
          >
            <SmartNumber
              {...fieldProps}
              decimals={decimals}
              minPrecision={minPrecision}
              number={this.state.earningsCurve}
            />
          </VariationNumber>
        ) : loader
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
      case 'idleDistribution':
        const governanceTokenName = this.functionsUtil.getGlobalConfig(['governance','props','tokenName']);
        const idleTokenConfig = this.functionsUtil.getGlobalConfig(['govTokens',governanceTokenName]);
        output = this.state.idleDistribution ? (
          <Text {...fieldProps}>+{this.state.idleDistribution.toFixed(decimals)} IDLE/{idleTokenConfig.distributionFrequency}</Text>
        ) : loader
      break;
      case 'userDistributionSpeed':
        output = this.state.userDistributionSpeed ? (
          <Text {...fieldProps}>{this.state.userDistributionSpeed.toFixed(decimals)}/{this.props.tokenConfig.distributionFrequency}</Text>
        ) : loader
      break;
      case 'distributionSpeed':
        output = this.state.distributionSpeed ? (
          <Text {...fieldProps}>{this.state.distributionSpeed.toFixed(decimals)}</Text>
        ) : loader
      break;
      case 'apr':
        output = this.state.tokenAPR ? (
          <Text {...fieldProps}>{this.state.tokenAPR}{!isNaN(parseFloat(this.state.tokenAPR)) ? '%' : ''}</Text>
        ) : loader
      break;
      case 'oldApy':
        output = this.state.oldAPY !== undefined ? (
          <Text {...fieldProps}>{this.state.oldAPY !== false ? this.state.oldAPY : '-' }<small>%</small></Text>
        ) : loader
      break;
      case 'apyNoGov':
        output = this.state.tokenAPYNoGov !== undefined ? (
          <Text {...fieldProps}>{this.state.tokenAPYNoGov !== false ? this.state.tokenAPYNoGov : '-' }<small>%</small></Text>
        ) : loader
      break;
      case 'curveApy':
        output = this.state.curveApy !== undefined ? (
          <Text {...fieldProps}>{this.state.curveApy !== false ? this.state.curveApy : '-' }<small>%</small></Text>
        ) : loader
      break;
      case 'curveAvgSlippage':
        output = this.state.curveAvgSlippage !== undefined ? (
          <Text {...fieldProps}>{this.state.curveAvgSlippage !== false ? this.state.curveAvgSlippage : '-' }<small>%</small></Text>
        ) : loader
      break;
      case 'apy':
        output = this.state.tokenAPY !== undefined ? (
          <Flex
            alignItems={'center'}
            flexDirection={'row'}
          >
            <Text {...fieldProps}>{this.state.tokenAPY !== false ? this.state.tokenAPY : '-' }<small>%</small></Text>
            {
              this.state.govTokensAprs && Object.keys(this.state.govTokensAprs).length>0 && 
                <AssetField
                  fieldInfo={{
                    name:'tooltip',
                    props:{
                      iconProps:{
                        ml:1
                      },
                      placement:'top',
                      message:Object.keys(this.state.govTokensAprs).map( govToken => {
                        const distributionFrequency = this.functionsUtil.getGlobalConfig(['govTokens',govToken,'distributionFrequency']);
                        const tooltipMode = this.functionsUtil.getGlobalConfig(['govTokens',govToken,'aprTooltipMode']);
                        let value = this.state.govTokensAprs[govToken].toFixed(decimals);
                        switch (tooltipMode){
                          default:
                          case 'apr':
                            value += '%';
                          break;
                          case 'distribution':
                            value = `${value}/${distributionFrequency}`;
                          break;
                        }
                        return `${govToken}: ${value}`
                      }).join('; ')
                    }
                  }}
                />
            }
          </Flex>
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
      case 'tooltip':
        output = (
          <Tooltip
            {...fieldProps}
          >
            <Icon
              ml={2}
              name={"Info"}
              size={'1em'}
              color={'cellTitle'}
              {...fieldProps.iconProps}
            />
          </Tooltip>
        );
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
        let formattedValue = this.state[fieldInfo.name];
        if (this.state[fieldInfo.name] && this.state[fieldInfo.name]._isBigNumber){
          formattedValue = this.state[fieldInfo.name].toFixed(decimals);
        }
        output = this.state[fieldInfo.name] ? (
          <Text {...fieldProps}>{formattedValue}</Text>
        ) : loader
      break;
    }
    return output;
  }
}

export default AssetField;
