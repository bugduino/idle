import moment from 'moment';
import colors from '../colors';
import { Bar } from '@nivo/bar';
import { Line } from '@nivo/line';
import React, { Component } from 'react';
import { Flex, Loader, Text } from 'rimble-ui';
import globalConfigs from '../configs/globalConfigs';
import FunctionsUtil from '../utilities/FunctionsUtil';
import GenericChart from '../GenericChart/GenericChart';

class StatsChart extends Component {
  state = {
    chartProps:{},
    chartType:null,
    chartData:null,
    chartWidth:null,
    apiResults:null,
    apiResults_unfiltered:null,
  };

  async componentWillMount() {
    window.addEventListener('resize', this.handleWindowSizeChange);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowSizeChange);
  }

  async componentDidMount() {
    if (!this.props.contractsInitialized){
      return false;
    }
    this.setState({
      chartData:null,
      chartType:null,
      chartProps:null,
    });
    this.loadUtils();
    this.handleWindowSizeChange();
    this.loadApiData();
  }

  async componentDidUpdate(prevProps) {
    const contractsInitialized = prevProps.contractsInitialized !== this.props.contractsInitialized;
    const tokenChanged = prevProps.tokenConfig !== this.props.tokenConfig;
    const dateChanged = prevProps.startTimestamp !== this.props.startTimestamp || prevProps.endTimestamp !== this.props.endTimestamp;
    const showAdvancedChanged = prevProps.showAdvanced !== this.props.showAdvanced;
    if (tokenChanged || dateChanged || contractsInitialized || showAdvancedChanged){
      this.componentDidMount();
    }
  }

  handleWindowSizeChange = () => {
    const chartContainer = document.getElementById(this.props.parentId);
    if (chartContainer && chartContainer.offsetWidth !== this.state.chartWidth){
      const chartWidth = parseFloat(chartContainer.offsetWidth)>0 ? chartContainer.offsetWidth : 0;
      return this.setState({
        chartWidth
      });
    }
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

  parseAum = value => {
    return (parseInt(value)>=1000 ? parseFloat(value/1000).toFixed(1)+'K' : parseFloat(value) )+' '+this.props.selectedToken
  }

  abbreviateNumber = (value) => {
    let newValue = value;
    if (value >= 1000) {
      const suffixes = ["", "k", "m", "b","t"];
      const suffixNum = Math.floor( (""+value).length/4 );
      let shortValue = '';
      for (let precision = 3; precision >= 1; precision--) {
        shortValue = parseFloat( (suffixNum !== 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
        const dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
        if (dotLessShortValue.length <= 3) { break; }
      }
      if (shortValue % 1 !== 0)  shortValue = shortValue.toFixed(2);
      newValue = shortValue+suffixes[suffixNum];
    }
    return newValue;
  }

  loadApiData = async () => {

    if (!this.props.tokenConfig || !this.props.selectedToken || !this.props.chartMode){
      return false;
    }

    const apiResults_unfiltered = await this.props.getTokenData(this.props.tokenConfig.address,false);
    const apiResults = await this.props.getTokenData(this.props.tokenConfig.address);

    let chartData = [];
    let chartProps = {};
    let chartType = Line;
    let keys = {};
    let tempData = {};
    let axisBottomIndex = 0;

    switch (this.props.chartMode){
      case 'VOL':
        let divergingData = {};

        const startTimestamp = parseInt(apiResults_unfiltered[0].timestamp);
        const endTimestamp = parseInt(moment()._d.getTime()/1000);

        for (let timestamp=startTimestamp;timestamp<=endTimestamp;timestamp+=86400){
          const date = moment(timestamp*1000).format("YYYY/MM/DD");
          if (!divergingData[date]){
            divergingData[date] = {
              date,
              timestamp,
              deposits: 0,
              redeems: 0
            };
          }
        }

        let lastRow = null;
        apiResults_unfiltered.forEach(row => {
          const date = moment(row.timestamp*1000).format("YYYY/MM/DD");
          const idleTokens = this.functionsUtil.fixTokenDecimals(row.idleSupply,18);

          if (!divergingData[date]){
            divergingData[date] = {
              date,
              timestamp:row.timestamp,
              deposits: 0,
              redeems: 0
            };
          }

          if (lastRow){
            const idleTokensPrev = this.functionsUtil.fixTokenDecimals(lastRow.idleSupply,18);
            const idleTokensDiff = !idleTokens.eq(idleTokensPrev);
            if (idleTokensDiff){
              const diff = idleTokens.minus(idleTokensPrev);
              // Deposits
              if (diff.gte(0)){
                divergingData[date].deposits+=parseFloat(diff);
              } else {
                divergingData[date].redeems+=parseFloat(diff);
              }
            }
          } else {
            divergingData[date].deposits+=parseFloat(idleTokens);
          }

          lastRow = row;
        });

        chartData = Object.values(divergingData).filter(v => {
          return (!this.props.startTimestamp || v.timestamp>=this.props.startTimestamp) && (!this.props.endTimestamp || v.timestamp<=this.props.endTimestamp);
        });

        let maxRange = 0;
        chartData.forEach(v => {
          maxRange = Math.max(maxRange,Math.abs(v.deposits),Math.abs(v.redeems));
        })

        chartType = Bar;

        axisBottomIndex = 0;

        chartProps = {
          indexBy: 'date',
          enableLabel: false,
          enableGridX: true,
          enableGridY: false,
          minValue:-maxRange,
          maxValue:maxRange,
          label: d => {
            return Math.abs(d.value);
          },
          axisBottom:{
            legend: '',
            format: (value) => {
              if (axisBottomIndex++ % ( this.props.isMobile ? 3 : 2 ) === 0){
                return moment(value,'YYYY/MM/DD HH:mm').format('MMM DD')
              }
            },
            orient: 'bottom',
            legendOffset: 36,
            legendPosition: 'middle',
            tickValues: 'every 2 days'
          },
          axisLeft: null,
          axisRight: {
            format: v => this.abbreviateNumber(Math.abs(v))
          },
          markers: [
            {
              axis: 'y',
              value: 0,
              lineStyle: { strokeOpacity: 0 },
              textStyle: { fill: colors.blue },
              legend: 'deposits',
              legendPosition: 'top-left',
              legendOrientation: 'vertical',
              // legendOffsetY: 120,
              legendOffsetX: -10
            },
            {
              axis: 'y',
              value: 0,
              lineStyle: { stroke: colors.red, strokeWidth: 1 },
              textStyle: { fill: colors.green },
              legend: 'redeems',
              legendPosition: 'bottom-left',
              legendOrientation: 'vertical',
              // legendOffsetY: 120,
              legendOffsetX: -10
            },
          ],
          keys:['deposits','redeems'],
          padding:0.4,
          colors:[colors.blue, colors.green],
          margin: this.props.isMobile ? { top: 20, right: 20, bottom: 40, left: 50 } : { top: 20, right: 60, bottom: 40, left: 60 },
          labelTextColor: 'inherit:darker(1.4)',
          labelSkipWidth: 16,
          labelSkipHeight: 16,
          tooltip:({ id, value, color }) => {
            value = this.functionsUtil.formatMoney(value,0);
            return (
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <tbody>
                  <tr>
                    <td style={{padding:'3px 5px'}}>
                      <span style={{display:'block', width: '12px', height: '12px', background: color}}></span>
                    </td>
                    <td style={{padding:'3px 5px',textTransform:'capitalize'}}>{id}</td>
                    <td style={{padding:'3px 5px'}}><strong>{value} {this.props.selectedToken}</strong></td>
                  </tr>
                </tbody>
              </table>
            );
          }
          // labelFormat:v => `${v}%`
        };
      break;
      /*
      case 'AUM_ALL':
        await this.functionsUtil.asyncForEach(Object.keys(availableTokens[globalConfigs.network.requiredNetwork]),async (tokenName,i) => {
          const tokenConfig = availableTokens[globalConfigs.network.requiredNetwork][tokenName];
          const tokenDataApi = await this.props.getTokenData(tokenConfig.address);
          chartData.push({
            id:tokenName,
            color: tokenConfig.color,
            data: tokenDataApi.map((d,i) => {
              const idleTokens = this.functionsUtil.fixTokenDecimals(d.idleSupply,18);
              const idlePrice = this.functionsUtil.fixTokenDecimals(d.idlePrice,tokenConfig.decimals);
              const aum = idleTokens.times(idlePrice);
              return {
                x: moment(d.timestamp*1000).format("YYYY/MM/DD HH:mm"),
                y: parseInt(aum.toString())
              };
            })
          });
        });

        // Set chart type
        chartType = Line;

        chartProps = {
          xScale:{
            type: 'time',
            format: '%Y/%m/%d %H:%M',
            // precision: 'hour',
          },
          xFormat:'time:%b %d %H:%M',
          yFormat:value => (parseInt(value)>=1000 ? parseFloat(value/1000).toFixed(1)+'K' : parseFloat(value) )+' '+this.props.selectedToken,
          yScale:{
            type: 'linear',
            stacked: false
          },
          axisLeft:{
            format: v => this.abbreviateNumber(v),
            orient: 'left',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: '',
            legendOffset: -65,
            legendPosition: 'middle'
          },
          axisBottom:{
            format: '%b %d',
            tickValues: this.props.isMobile ? 'every 4 days' : 'every 2 days',
            orient: 'bottom',
            legend: '',
            legendOffset: 36,
            legendPosition: 'middle'
          },
          enableArea:false,
          curve:"linear",
          enableSlices:'x',
          enableGridX:true,
          enableGridY:false,
          colors:d => d.color,
          pointSize:0,
          pointColor:{ from: 'color', modifiers: []},
          pointBorderWidth:1,
          pointLabel:"y",
          pointLabelYOffset:-12,
          useMesh:true,
          animate:false,
          margin: this.props.isMobile ? { top: 20, right: 20, bottom: 40, left: 50 } : { top: 20, right: 60, bottom: 40, left: 60 },
        };
      break;
      */
      case 'AUM':
        chartData.push({
          id:'AUM',
          color: 'hsl('+globalConfigs.stats.protocols.idle.color.hsl.join(',')+')',
          data: apiResults.map((d,i) => {
            const idleTokens = this.functionsUtil.fixTokenDecimals(d.idleSupply,18);
            const idlePrice = this.functionsUtil.fixTokenDecimals(d.idlePrice,this.props.tokenConfig.decimals);
            const aum = idleTokens.times(idlePrice);
            return {
              x: moment(d.timestamp*1000).format("YYYY/MM/DD HH:mm"),
              y: parseInt(aum.toString())
            };
          })
        });

        // Add allocation
        this.props.tokenConfig.protocols.forEach((p,j) => {
          apiResults.map((d,i) => {
            return d.protocolsData.filter((protocolAllocation,x) => {
                return protocolAllocation.protocolAddr.toLowerCase() === p.address.toLowerCase()
            })
            .map((protocolAllocation,z) => {
              const protocolPaused = this.functionsUtil.BNify(protocolAllocation.rate).eq(0);
              if (!protocolPaused){
                const x = moment(d.timestamp*1000).format("YYYY/MM/DD HH:mm");
                const y = parseInt(this.functionsUtil.fixTokenDecimals(protocolAllocation.allocation,this.props.tokenConfig.decimals));
                let foundItem = chartData[0].data.filter(item => { return item.x === x });
                if (foundItem){
                  foundItem = foundItem[0];
                  const pos = chartData[0].data.indexOf(foundItem);
                  if (!foundItem.allocations){
                    foundItem.allocations = {};
                  }
                  foundItem.allocations[p.name] = y;
                  chartData[0].data[pos] = foundItem;
                }
              }
              return undefined;
            })[0]
          }).filter((v) => { return v !== undefined; } )
        });

        // Set chart type
        chartType = Line;

        chartProps = {
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
          axisLeft:{
            format: v => this.abbreviateNumber(v),
            orient: 'left',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: '',
            legendOffset: -65,
            legendPosition: 'middle'
          },
          axisBottom:{
            format: '%b %d',
            tickValues: this.props.isMobile ? 'every 4 days' : 'every 2 days',
            orient: 'bottom',
            legend: '',
            legendOffset: 36,
            legendPosition: 'middle'
          },
          enableArea:true,
          curve:"linear",
          enableSlices:'x',
          enableGridX:true,
          enableGridY:false,
          colors:d => d.color,
          pointSize:0,
          pointColor:{ from: 'color', modifiers: []},
          pointBorderWidth:1,
          pointLabel:"y",
          pointLabelYOffset:-12,
          useMesh:true,
          animate:false,
          margin: this.props.isMobile ? { top: 20, right: 20, bottom: 40, left: 50 } : { top: 20, right: 40, bottom: 40, left: 60 },
          sliceTooltip:(slideData) => {
            const { slice } = slideData;
            const point = slice.points[0];
            if (typeof point === 'object' && typeof point.data === 'object'){
              return (
                <div
                    key={point.id}
                    style={{
                      background: 'white',
                      color: 'inherit',
                      fontSize: 'inherit',
                      borderRadius: '2px',
                      boxShadow: 'rgba(0, 0, 0, 0.25) 0px 1px 2px',
                      padding: '5px 9px'
                    }}
                >
                  <div>
                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                      <tbody>
                        <tr>
                          <td style={{padding:'3px 5px'}}>
                            <span style={{display:'block', width: '12px', height: '12px', background: point.serieColor}}></span>
                          </td>
                          <td style={{padding:'3px 5px'}}>{point.serieId}</td>
                          <td style={{padding:'3px 5px'}}><strong>{point.data.yFormatted}</strong></td>
                        </tr>
                        {
                          point.data.allocations && typeof point.data.allocations === 'object' &&
                            Object.keys(point.data.allocations).map(protocolName => {
                              const protocolColor = 'hsl('+globalConfigs.stats.protocols[protocolName].color.hsl.join(',')+')';
                              const protocolAllocation = this.functionsUtil.formatMoney(point.data.allocations[protocolName],0);
                              const protocolAllocationPerc = this.functionsUtil.BNify(point.data.allocations[protocolName]).div(this.functionsUtil.BNify(point.data.y)).times(100).toFixed(0)+'%';
                              return (
                                <tr key={`${point.id}_${protocolName}`}>
                                  <td style={{padding:'3px 5px'}}>
                                    <span style={{display:'block', width: '12px', height: '12px', background: protocolColor}}></span>
                                  </td>
                                  <td style={{padding:'3px 5px',textTransform:'capitalize'}}>{protocolName}</td>
                                  <td style={{padding:'3px 5px'}}><strong>{protocolAllocation}</strong> ({protocolAllocationPerc})</td>
                                </tr>
                              );
                            })
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            return null;
          }
        };
      break;
      case 'ALL':
        keys = {};
        tempData = {};

        apiResults.forEach((d,i) => {
          const date = moment(d.timestamp*1000).format("YYYY/MM/DD");

          let row = {
            date
          };

          if (tempData[date]){
            row = tempData[date];
          }

          d.protocolsData.forEach((protocolData) => {
            const protocolPaused = this.functionsUtil.BNify(protocolData.rate).eq(0);
            const protocolName = this.props.tokenConfig.protocols.filter((p) => { return p.address.toLowerCase() === protocolData.protocolAddr.toLowerCase() })[0].name;
            if (!protocolPaused){
              const allocation = parseInt(this.functionsUtil.fixTokenDecimals(protocolData.allocation,this.props.tokenConfig.decimals));
              if (!row[protocolName] || row[protocolName]<allocation || !allocation){
                keys[protocolName] = 1;
                row[protocolName] = allocation;
                row[`${protocolName}Color`] = 'hsl('+globalConfigs.stats.protocols[protocolName].color.hsl.join(',')+')';
              }
            } else {
              row[protocolName] = 0;
            }
          });

          tempData[date] = row;
        });

        chartData = Object.values(tempData);

        // Set chart type
        chartType = Bar;

        axisBottomIndex = 0;

        chartProps = {
          padding: 0.2,
          animate: false,
          indexBy: 'date',
          enableLabel: false,
          labelSkipWidth: 16,
          labelSkipHeight: 16,
          keys: Object.keys(keys),
          labelTextColor: 'inherit:darker(1.4)',
          margin: this.props.isMobile ? { top: 20, right: 20, bottom: 40, left: 50 } : { top: 20, right: 40, bottom: 40, left: 60 },
          colors: ({ id, data }) => data[`${id}Color`],
          axisLeft:{
            format: v => this.abbreviateNumber(v),
            orient: 'left',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: '',
            legendOffset: -65,
            legendPosition: 'middle'
          },
          axisBottom:{
            legend: '',
            format: (value) => {
              if (axisBottomIndex++ % ( this.props.isMobile ? 3 : 2 ) === 0){
                return moment(value,'YYYY/MM/DD HH:mm').format('MMM DD')
              }
            },
            orient: 'bottom',
            legendOffset: 36,
            legendPosition: 'middle',
            tickValues: 'every 2 days'
          },
          tooltip:({ id, value, color }) => {
            const allocation = this.functionsUtil.formatMoney(value,0);
            return (
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <tbody>
                  <tr>
                    <td style={{padding:'3px 5px'}}>
                      <span style={{display:'block', width: '12px', height: '12px', background: color}}></span>
                    </td>
                    <td style={{padding:'3px 5px',textTransform:'capitalize'}}>{id}</td>
                    <td style={{padding:'3px 5px'}}><strong>{allocation} {this.props.selectedToken}</strong></td>
                  </tr>
                </tbody>
              </table>
            )
          }
        }
      break;
      case 'ALL_PERC':
        keys = {};
        tempData = {};

        apiResults.forEach((d,i) => {
          const date = moment(d.timestamp*1000).format("YYYY/MM/DD")
          let row = {
            date:moment(d.timestamp*1000).format("YYYY/MM/DD HH:mm")
          };
          if (tempData[date]){
            row = tempData[date];
          }

          const totalAllocation = d.protocolsData.reduce((accumulator,protocolAllocation) => {
            const allocation = this.functionsUtil.fixTokenDecimals(protocolAllocation.allocation,this.props.tokenConfig.decimals);
            return this.functionsUtil.BNify(accumulator).plus(allocation);
          },0);

          d.protocolsData.forEach((protocolData) => {
            const protocolPaused = this.functionsUtil.BNify(protocolData.rate).eq(0);
            const protocolName = this.props.tokenConfig.protocols.filter((p) => { return p.address.toLowerCase() === protocolData.protocolAddr.toLowerCase() })[0].name;
            if (!protocolPaused){
              const allocation = this.functionsUtil.fixTokenDecimals(protocolData.allocation,this.props.tokenConfig.decimals);
              const allocationPerc = parseFloat(allocation.div(totalAllocation).times(100));
              keys[protocolName] = 1;
              row[protocolName] = allocationPerc;
              row[`${protocolName}Color`] = 'hsl('+globalConfigs.stats.protocols[protocolName].color.hsl.join(',')+')';
            } else if (typeof row[protocolName] !== undefined) {
              row[protocolName] = 0;
            } 
          });
          
          tempData[date] = row;
        });

        chartData = Object.values(tempData);

        // Set chart type
        chartType = Bar;

        axisBottomIndex = 0;

        chartProps = {
          padding: 0.2,
          animate: false,
          indexBy: 'date',
          data: chartData,
          enableLabel: false,
          labelSkipWidth: 16,
          labelSkipHeight: 16,
          keys: Object.keys(keys),
          labelTextColor: 'inherit:darker(1.4)',
          margin: this.props.isMobile ? { top: 20, right: 20, bottom: 40, left: 50 } : { top: 20, right: 40, bottom: 40, left: 60 },
          colors: ({ id, data }) => data[`${id}Color`],
          axisLeft:{
            format: v => parseInt(v)+'%'
          },
          axisBottom:{
            legend: '',
            format: (value) => {
              if (axisBottomIndex++ % ( this.props.isMobile ? 3 : 2 ) === 0){
                return moment(value,'YYYY/MM/DD HH:mm').format('MMM DD')
              }
            },
            orient: 'bottom',
            legendOffset: 36,
            legendPosition: 'middle',
            tickValues: 'every 2 days'
          },
          tooltip:({ id, value, color }) => {
            const allocation = parseInt(value)===100 ? this.functionsUtil.formatMoney(value,0) : this.functionsUtil.formatMoney(value,2);
            return (
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <tbody>
                  <tr>
                    <td style={{padding:'3px 5px'}}>
                      <span style={{display:'block', width: '12px', height: '12px', background: color}}></span>
                    </td>
                    <td style={{padding:'3px 5px',textTransform:'capitalize'}}>{id}</td>
                    <td style={{padding:'3px 5px'}}><strong>{allocation}%</strong></td>
                  </tr>
                </tbody>
              </table>
            )
          }
        }
      break;
      case 'APR':
        this.props.tokenConfig.protocols.forEach((p,j) => {
          if (chartData.filter(d => { return d.name === p.name; }).length){
            return;
          }
          chartData.push({
            id:p.name,
            color:'hsl('+globalConfigs.stats.protocols[p.name].color.hsl.join(',')+')',
            data:apiResults.map((d,i) => {
              return d.protocolsData.filter((protocolAllocation,x) => {
                  return protocolAllocation.protocolAddr.toLowerCase() === p.address.toLowerCase()
              })
              .map((protocolAllocation,z) => {
                const protocolPaused = this.functionsUtil.BNify(protocolAllocation.rate).eq(0);
                if (!protocolPaused){
                  const x = moment(d.timestamp*1000).format("YYYY/MM/DD HH:mm");
                  const y = parseFloat(this.functionsUtil.fixTokenDecimals(protocolAllocation.rate,18));
                  return { x, y };
                }
                return undefined;
              })[0]
            }).filter((v) => { return v !== undefined; } )
          })
        });

        chartData.push({
          id:'Idle',
          color: 'hsl('+globalConfigs.stats.protocols.idle.color.hsl.join(',')+')',
          data: apiResults.map((d,i) => {
            const x = moment(d.timestamp*1000).format("YYYY/MM/DD HH:mm");
            const y = parseFloat(this.functionsUtil.fixTokenDecimals(d.idleRate,18));
            return { x, y };
          })
        });

        // Set chart type
        chartType = Line;

        chartProps = {
          xScale:{
            type: 'time',
            format: '%Y/%m/%d %H:%M',
            // precision: 'hour',
          },
          xFormat:'time:%b %d %H:%M',
          yFormat:value => parseFloat(value).toFixed(2)+'%',
          yScale:{
            type: 'linear',
            stacked: false
          },
          axisLeft:{
            format: value => parseInt(value)+'%',
            orient: 'left',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: '',
            legendOffset: -70,
            legendPosition: 'middle'
          },
          axisBottom:{
            format: '%b %d',
            tickValues: this.props.isMobile ? 'every 4 days' : 'every 2 days',
            orient: 'bottom',
            legend: '',
            legendOffset: 36,
            legendPosition: 'middle'
          },
          pointSize:0,
          useMesh:true,
          animate:false,
          pointLabel:"y",
          curve:'linear',
          enableArea:false,
          enableSlices:'x',
          enableGridX:true,
          enableGridY:false,
          pointBorderWidth:1,
          colors:d => d.color,
          pointLabelYOffset:-12,
          pointColor:{ from: 'color', modifiers: []},
          margin: this.props.isMobile ? { top: 20, right: 20, bottom: 40, left: 50 } : { top: 20, right: 40, bottom: 40, left: 60 },
        };
      break;
      case 'PRICE':

        let firstTokenPrice = null;
        let firstIdleBlock = null;

        const idleChartData = apiResults.map((d,i) => {
          const x = moment(d.timestamp*1000).format("YYYY/MM/DD HH:mm");

          const tokenPrice = this.functionsUtil.fixTokenDecimals(d.idlePrice,this.props.tokenConfig.decimals);
          let y = 0;

          if (!firstTokenPrice){
            firstTokenPrice = tokenPrice;
          } else {
            y = parseFloat(tokenPrice.div(firstTokenPrice).minus(1).times(100));
          }

          if (firstIdleBlock === null){
            firstIdleBlock = parseInt(d.blocknumber);
          }

          return { x, y, blocknumber: d.blocknumber };
        });

        // const aave_data = {};

        await this.functionsUtil.asyncForEach(this.props.tokenConfig.protocols,async (p) => {

          const chartRow = {
            id:p.name,
            color: 'hsl('+globalConfigs.stats.protocols[p.name].color.hsl.join(',')+')',
            data: []
          };

          firstTokenPrice = null;
          let lastRowData = null;
          let lastTokenPrice = null;
          let baseProfit = 0;
          let firstProtocolBlock = null;

          await this.functionsUtil.asyncForEach(apiResults,async (d) => {

            const protocolData = d.protocolsData.find((pData,x) => {
              return pData.protocolAddr.toLowerCase() === p.address.toLowerCase()
            });

            if (protocolData){
              const protocolPaused = this.functionsUtil.BNify(protocolData.rate).eq(0);
              if (!protocolPaused){

                // Start new protocols from Idle performances
                if (firstProtocolBlock === null){
                  firstProtocolBlock = parseInt(d.blocknumber);
                  if (firstProtocolBlock>firstIdleBlock){
                    const idlePerformance = idleChartData.find(d1 => {
                      return d1.blocknumber>=firstProtocolBlock;
                    });
                    if (idlePerformance){
                      baseProfit = idlePerformance.y;
                    }
                  }
                }

                let rowData = {};
                let tokenExchangeRate = protocolData.price;
                let tokenPriceFixed = this.functionsUtil.fixTokenDecimals(tokenExchangeRate,p.decimals);
                const x = moment(d.timestamp*1000).format("YYYY/MM/DD HH:mm");

                // Take data from
                if (globalConfigs.stats.protocols[p.name] && globalConfigs.stats.protocols[p.name].data && globalConfigs.stats.protocols[p.name].data[p.address.toLowerCase()] && globalConfigs.stats.protocols[p.name].data[p.address.toLowerCase()][d.blocknumber]){
                  tokenExchangeRate = this.functionsUtil.BNify(globalConfigs.stats.protocols[p.name].data[p.address.toLowerCase()][d.blocknumber]);
                  tokenPriceFixed = this.functionsUtil.fixTokenDecimals(tokenExchangeRate,p.decimals);
                }/* else if (p.name === 'aave'){
                  // Token holders (aDAI = 0xc025c03e10f656d3ee76685d53d236824d8ef3da , aUSDC = 0xd2c734fbd8f5d1c809185e014016dd4097e94711)
                  let aaveTokenBalance = await this.functionsUtil.genericContractCall(p.token,'balanceOf',['0xd2c734fbd8f5d1c809185e014016dd4097e94711'],{},d.blocknumber);
                  if (aaveTokenBalance){
                    if (!Object.values(aave_data).length){
                      tokenExchangeRate = this.functionsUtil.normalizeTokenAmount(1,p.decimals);
                      aave_data[d.blocknumber] = aaveTokenBalance.toString();
                    } else {
                      const firstBalance = Object.values(aave_data)[0];
                      tokenExchangeRate = this.functionsUtil.normalizeTokenAmount(this.functionsUtil.BNify(aaveTokenBalance).div(this.functionsUtil.BNify(firstBalance)).toFixed(p.decimals),p.decimals);
                      aave_data[d.blocknumber] = tokenExchangeRate.toString();
                    }
                  }
                }
                */

                let y = baseProfit;

                if (!firstTokenPrice){
                  firstTokenPrice = tokenPriceFixed;
                } else {
                  if (tokenPriceFixed.lt(lastTokenPrice)){
                    firstTokenPrice = tokenPriceFixed;
                    const lastYDiff = chartRow.data[chartRow.data.length-1].y-chartRow.data[chartRow.data.length-2].y;
                    y = lastRowData.y+lastYDiff;
                    baseProfit = y;
                  } else {
                    y += parseFloat(tokenPriceFixed.div(firstTokenPrice).minus(1).times(100));
                  }
                }

                rowData = {
                  x,
                  y
                };

                lastTokenPrice = tokenPriceFixed;
                lastRowData = rowData;
                chartRow.data.push(rowData);
              }
            }
          });

          chartData.push(chartRow);
        });

        // if (Object.values(aave_data).length){
        //   aave_data[Object.keys(aave_data)[0]] = 1;
        //   console.log(JSON.stringify(aave_data));
        // }

        chartData.push({
          id:'Idle',
          color: 'hsl('+globalConfigs.stats.protocols.idle.color.hsl.join(',')+')',
          data: idleChartData
        });

        // Set chart type
        chartType = Line;

        chartProps = {
          xScale:{
            type: 'time',
            format: '%Y/%m/%d %H:%M',
            // precision: 'day',
          },
          xFormat:'time:%b %d %H:%M',
          yFormat:value => parseFloat(value).toFixed(3)+'%',
          yScale:{
            type: 'linear',
            stacked: false,
            // min: 1
          },
          axisLeft:{
            format: value => parseFloat(value).toFixed(2)+'%',
            orient: 'left',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: '',
            legendOffset: -70,
            legendPosition: 'middle'
          },
          axisBottom:{
            format: '%b %d',
            tickValues: this.props.isMobile ? 'every 4 days' : 'every 2 days',
            orient: 'bottom',
            legend: '',
            legendOffset: 36,
            legendPosition: 'middle'
          },
          pointSize:0,
          useMesh:true,
          animate:false,
          pointLabel:"y",
          curve:'linear',
          enableArea:false,
          enableSlices:'x',
          enableGridX:true,
          enableGridY:false,
          pointBorderWidth:1,
          colors:d => d.color,
          pointLabelYOffset:-12,
          pointColor:{ from: 'color', modifiers: []},
          margin: this.props.isMobile ? { top: 20, right: 20, bottom: 40, left: 50 } : { top: 20, right: 40, bottom: 40, left: 80 },
        };
      break;
      default:
      break;
    }

    this.setState({
      chartType,
      chartProps,
      chartData
    });
  }

  render() {
    if (!this.state.chartType || !this.state.chartData || !this.state.chartProps || !this.props.contractsInitialized){
      return (
        <Flex
          justifyContent={'center'}
          alignItems={'center'}
          textAlign={'center'}
          width={1}
          minHeight={ this.props.height }
        >
          <Loader size="40px" /> <Text ml={2}>Loading graph data...</Text>
        </Flex>
      );
    }

    return(
      <GenericChart
        {...this.state.chartProps}
        height={this.props.height}
        type={this.state.chartType}
        data={this.state.chartData}
        width={this.state.chartWidth}
      />
    );
  }
}

export default StatsChart;