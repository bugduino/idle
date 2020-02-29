import moment from 'moment';
import colors from '../colors';
import { Bar } from '@nivo/bar';
import { Line } from '@nivo/line';
import React, { Component } from 'react';
import { Flex, Loader, Text } from 'rimble-ui';
import globalConfigs from '../configs/globalConfigs';
import FunctionsUtil from '../utilities/FunctionsUtil';
import GenericChart from '../GenericChart/GenericChart';
import availableTokens from '../configs/availableTokens';

class StatsChart extends Component {
  state = {
    chartProps:{},
    chartType:null,
    chartData:null,
    chartWidth:null
  };

  async componentWillMount() {
    window.addEventListener('resize', this.handleWindowSizeChange);
  }

  async componentDidMount() {
    this.loadUtils();
    this.handleWindowSizeChange();
    this.loadApiData();
  }

  async componentDidUpdate(prevProps) {
    const dateChanged = prevProps.startTimestamp !== this.props.startTimestamp || prevProps.endTimestamp !== this.props.endTimestamp;
    if (prevProps.tokenConfig !== this.props.tokenConfig || dateChanged){
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

    const apiResults = await this.props.getTokenData(this.props.tokenConfig.address);

    let chartData = [];
    let chartProps = {};
    let chartType = Line;
    let keys = {};
    let tempData = {};

    switch (this.props.chartMode){
      case 'VOL':
        const results = await this.functionsUtil.getEtherscanTxs(this.props.tokenConfig.idle.address,60);
        if (results){
          const filteredTxs = results.filter(
              tx => {
                const internalTxs = results.filter(r => r.hash === tx.hash);
                const isRightToken = internalTxs.length>1 && internalTxs.indexOf(tx) === 0;
                const isDepositTx = isRightToken && tx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase() && tx.contractAddress.toLowerCase() === this.props.tokenConfig.address.toLowerCase();
                const isRedeemTx = isRightToken && tx.from.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
                const isCorrectTimestamp = (!this.props.startTimestamp || tx.timeStamp >= this.props.startTimestamp) && (!this.props.endTimestamp || tx.timeStamp <= this.props.endTimestamp);

                return isCorrectTimestamp && (isDepositTx || isRedeemTx);
            }
          ).map(tx => {
            return ({...tx, value: this.functionsUtil.fixTokenDecimals(tx.value,this.props.tokenConfig.decimals)});
          });

          const startTimestamp = parseInt(filteredTxs[0].timeStamp);
          const endTimestamp = parseInt(moment()._d.getTime()/1000); //parseInt(filteredTxs[filteredTxs.length-1].timeStamp);

          let divergingData = {};

          for (let timestamp=startTimestamp;timestamp<=endTimestamp;timestamp+=86400){
            const date = moment(timestamp*1000).format("YYYY/MM/DD");
            if (!divergingData[date]){
              divergingData[date] = {
                date,
                deposits: 0,
                redeems: 0
              };
            }
          }

          const protocolsAddresses = this.props.tokenConfig.protocols.map(p => { return p.address.toLowerCase() });

          // Filter deposits
          filteredTxs
            .filter((tx) => { return tx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase(); })
            .forEach((tx,i) => {
              const date = moment(tx.timeStamp*1000).format("YYYY/MM/DD");
              divergingData[date].deposits+=parseFloat(tx.value);
            });

          // Filter redeems
          filteredTxs
            .filter((tx) => { return tx.from.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase(); })
            .forEach((tx,i) => {
              let isRebalanceTx = false;
              const txs = results.filter(r => r.hash === tx.hash && protocolsAddresses.includes(tx.contractAddress.toLowerCase()));
              if (txs.length > 1){
                const firstTx = txs[0];
                const lastTx = txs[txs.length-1];
                isRebalanceTx = firstTx.contractAddress.toLowerCase() !== lastTx.contractAddress.toLowerCase();
              }

              if (!isRebalanceTx){
                const date = moment(tx.timeStamp*1000).format("YYYY/MM/DD");
                divergingData[date].redeems-=parseFloat(tx.value);
              }
            });

          chartData = Object.values(divergingData);

          chartType = Bar;

          chartProps = {
            indexBy: 'date',
            enableLabel: false,
            enableGridX: true,
            enableGridY: false,
            // label: d => Math.abs(d.value),
            labelTextColor: 'inherit:darker(1.2)',
            axisTop: {
              tickSize: 0,
              tickPadding: 12,
            },
            axisBottom:{
              legend: '',
              format: (value) => {
                if (axisBottomIndex++ % 2 === 0){
                  return moment(value,'YYYY/MM/DD HH:mm').format('MMM DD')
                }
              },
              orient: 'bottom',
              legendOffset: 36,
              legendPosition: 'middle',
              tickValues: 'every 2 days'
            },
            axisLeft: null,
            // axisRight: {
            //     format: v => `${Math.abs(v)}%`,
            // },
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
              },
            ],
            keys:['deposits','redeems'],
            padding:0.4,
            colors:[colors.blue, colors.green],
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

          // debugger;
        }
      break;
      /*
      case 'VOL_LINE':
        const results = await this.functionsUtil.getEtherscanTxs(this.props.tokenConfig.idle.address,60);
        if (results){
          const filteredTxs = results.filter(
              tx => {
                const internalTxs = results.filter(r => r.hash === tx.hash);
                const isRightToken = internalTxs.length>1 && internalTxs.indexOf(tx) === 0;
                const isDepositTx = isRightToken && tx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase() && tx.contractAddress.toLowerCase() === this.props.tokenConfig.address.toLowerCase();
                const isRedeemTx = isRightToken && tx.from.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase();
                const isCorrectTimestamp = (!this.props.startTimestamp || tx.timeStamp >= this.props.startTimestamp) && (!this.props.endTimestamp || tx.timeStamp <= this.props.endTimestamp);

                return isCorrectTimestamp && (isDepositTx || isRedeemTx);
            }
          ).map(tx => {
            return ({...tx, value: this.functionsUtil.fixTokenDecimals(tx.value,this.props.tokenConfig.decimals)});
          });

          // console.log(results,filteredTxs);

          const startTimestamp = parseInt(filteredTxs[0].timeStamp);
          const endTimestamp = parseInt(moment()._d.getTime()/1000); //parseInt(filteredTxs[filteredTxs.length-1].timeStamp);

          const deposits = {};
          const redeems = {};

          for (let timestamp=startTimestamp;timestamp<=endTimestamp;timestamp+=3600){
            const x = moment(timestamp*1000).format("YYYY/MM/DD HH:00");
            const y = 0;
            if (!deposits[x]){
              deposits[x] = { x, y };
            }
            if (!redeems[x]){
              redeems[x] = { x, y };
            }
          }

          // Filter deposits
          filteredTxs
            .filter((tx) => { return tx.to.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase(); })
            .forEach((tx,i) => {
              // console.log(`Deposit of ${tx.value} ${this.props.selectedToken} - ${tx.hash}`);
              const x = moment(tx.timeStamp*1000).format("YYYY/MM/DD HH:00");
              if (!deposits[x]){
                deposits[x] = {
                  x,
                  y:0
                };
              }

              deposits[x].y+=parseFloat(tx.value);
            });

          // Filter redeems
          filteredTxs
            .filter((tx) => { return tx.from.toLowerCase() === this.props.tokenConfig.idle.address.toLowerCase(); })
            .forEach((tx,i) => {
              // console.log(`Redeem of ${tx.value} ${this.props.selectedToken} - ${tx.hash}`);
              const x = moment(tx.timeStamp*1000).format("YYYY/MM/DD HH:00");
              if (!redeems[x]){
                redeems[x] = {
                  x,
                  y:0
                };
              }

              redeems[x].y+=parseFloat(tx.value);
            });

          chartData.push({
            id:'Deposits',
            color: colors.blue,
            data: Object.values(deposits)
          });

          chartData.push({
            id:'Redeems',
            color: colors.green,
            data: Object.values(redeems)
          });

          // Set chart type
          chartType = Line;

          chartProps = {
            xScale:{
              type: 'time',
              format: '%Y/%m/%d %H:%M',
            },
            xFormat:'time:%b %d %H:%M',
            yFormat:value => (parseInt(value)>=1000 ? parseFloat(value/1000).toFixed(1)+'K' : parseFloat(value).toFixed(1) )+' '+this.props.selectedToken,
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
              tickValues: 'every 2 days',
              orient: 'bottom',
              legend: '',
              legendOffset: 36,
              legendPosition: 'middle'
            },
            lineWidth:1,
            enableArea:false,
            curve:"monotoneX",
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
            margin:{ top: 20, right: 20, bottom: 60, left: 80 }
          };
        }
      break;
      */
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
            tickValues: 'every 2 days',
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
          margin:{ top: 20, right: 20, bottom: 60, left: 80 }
        };
      break;
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
            tickValues: 'every 2 days',
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
          margin:{ top: 20, right: 20, bottom: 60, left: 80 },
          sliceTooltip:(slideData) => {
            const { slice } = slideData;
            const point = slice.points[0];
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
                      {Object.keys(point.data.allocations).map(protocolName => {
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
            )
          }
        };
      break;
      case 'ALL':
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

          d.protocolsData.forEach((protocolData) => {
            const protocolPaused = this.functionsUtil.BNify(protocolData.rate).eq(0);
            const protocolName = this.props.tokenConfig.protocols.filter((p) => { return p.address.toLowerCase() === protocolData.protocolAddr.toLowerCase() })[0].name;
            if (!protocolPaused){
              const allocation = parseInt(this.functionsUtil.fixTokenDecimals(protocolData.allocation,this.props.tokenConfig.decimals));
              keys[protocolName] = 1;
              row[protocolName] = allocation;
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

        let axisBottomIndex = 0;

        chartProps = {
          padding: 0.2,
          animate: false,
          indexBy: 'date',
          enableLabel: false,
          labelSkipWidth: 16,
          labelSkipHeight: 16,
          keys: Object.keys(keys),
          labelTextColor: 'inherit:darker(1.4)',
          margin: { top: 60, right: 80, bottom: 60, left: 80 },
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
              if (axisBottomIndex++ % 2 === 0){
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
      case 'ALL_LINE':
        this.props.tokenConfig.protocols.forEach((p,j) => {
          chartData.push({
            id:p.name,
            color: 'hsl('+globalConfigs.stats.protocols[p.name].color.hsl.join(',')+')',
            data: apiResults.map((d,i) => {
              return d.protocolsData.filter((protocolAllocation,x) => {
                  return protocolAllocation.protocolAddr.toLowerCase() === p.address.toLowerCase()
              })
              .map((protocolAllocation,z) => {
                const protocolPaused = this.functionsUtil.BNify(protocolAllocation.rate).eq(0);
                if (!protocolPaused){
                  const x = moment(d.timestamp*1000).format("YYYY/MM/DD HH:mm");
                  const y = parseInt(this.functionsUtil.fixTokenDecimals(protocolAllocation.allocation,this.props.tokenConfig.decimals));
                  return { x, y };
                }
                return undefined;
              })[0]
            }).filter((v) => { return v !== undefined; } )
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
            legendOffset: -70,
            legendPosition: 'middle'
          },
          axisBottom:{
            format: '%b %d',
            tickValues: 'every 2 days',
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
          enableArea:true,
          enableSlices:'x',
          enableGridX:true,
          enableGridY:false,
          pointBorderWidth:1,
          colors:d => d.color,
          pointLabelYOffset:-12,
          pointColor:{ from: 'color', modifiers: []},
          margin:{ top: 20, right: 20, bottom: 60, left: 80 }
        };
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
          margin: { top: 60, right: 80, bottom: 60, left: 80 },
          colors: ({ id, data }) => data[`${id}Color`],
          axisBottom:{
            legend: '',
            format: (value) => {
              if (axisBottomIndex++ % 2 === 0){
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
                    <td style={{padding:'3px 5px'}}><strong>{allocation}%</strong></td>
                  </tr>
                </tbody>
              </table>
            )
          }
        }
      break;
      case 'ALL_PERC_LINE':
        this.props.tokenConfig.protocols.forEach((p,j) => {
          chartData.push({
            id:p.name,
            color: 'hsl('+globalConfigs.stats.protocols[p.name].color.hsl.join(',')+')',
            data: apiResults.map((d,i) => {
              const totalAllocation = d.protocolsData.reduce((accumulator,protocolAllocation) => {
                const allocation = this.functionsUtil.fixTokenDecimals(protocolAllocation.allocation,this.props.tokenConfig.decimals);
                return this.functionsUtil.BNify(accumulator).plus(allocation);
              },0);

              return d.protocolsData.filter((protocolAllocation,x) => {
                  return protocolAllocation.protocolAddr.toLowerCase() === p.address.toLowerCase()
              })
              .map((protocolAllocation,z) => {
                const protocolPaused = this.functionsUtil.BNify(protocolAllocation.rate).eq(0);
                if (!protocolPaused){
                  const allocation = this.functionsUtil.fixTokenDecimals(protocolAllocation.allocation,this.props.tokenConfig.decimals);
                  const x = moment(d.timestamp*1000).format("YYYY/MM/DD HH:mm");
                  const y = parseFloat(allocation.div(totalAllocation).times(100));
                  return { x, y };
                }
                return undefined;
              })[0]
            }).filter((v) => { return v !== undefined; } )
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
          yFormat: value => value.toFixed(2)+'%',
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
            tickValues: 'every 2 days',
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
          margin:{ top: 20, right: 20, bottom: 60, left: 80 }
        };
      break;
      case 'APR':
        this.props.tokenConfig.protocols.forEach((p,j) => {
          chartData.push({
            id:p.name,
            color: 'hsl('+globalConfigs.stats.protocols[p.name].color.hsl.join(',')+')',
            data: apiResults.map((d,i) => {
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
            format: value => parseInt(value),
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
            tickValues: 'every 2 days',
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
          margin:{ top: 20, right: 20, bottom: 60, left: 80 }
        };
      break;
      case 'PRICE':
        this.props.tokenConfig.protocols.forEach((p,j) => {
          // let lastRate = 0;
          // const initBalance = 1;
          let firstRate = null;
          chartData.push({
            id:p.name,
            color: 'hsl('+globalConfigs.stats.protocols[p.name].color.hsl.join(',')+')',
            data: apiResults.map((d,i) => {
              return d.protocolsData.filter((protocolAllocation,x) => {
                  return protocolAllocation.protocolAddr.toLowerCase() === p.address.toLowerCase()
              })
              .map((protocolAllocation,z) => {
                const protocolPaused = this.functionsUtil.BNify(protocolAllocation.rate).eq(0);
                if (!protocolPaused){
                  const x = moment(d.timestamp*1000).format("YYYY/MM/DD HH:mm");
                  // const rate = parseFloat(this.functionsUtil.fixTokenDecimals(protocolAllocation.price,p.functions.exchangeRate.decimals));
                  // const diff = lastRate ? rate/lastRate-1 : 0;
                  // const y = initBalance+diff;
                  // lastRate = lastRate ? lastRate : rate;

                  const rate = this.functionsUtil.fixTokenDecimals(protocolAllocation.price,p.functions.exchangeRate.decimals);
                  let y = 0;

                  if (!firstRate){
                    firstRate = rate;
                  } else {
                    y = parseFloat(rate.div(firstRate).minus(1).times(100));
                  }
                  return { x, y };
                }
                return undefined;
              })[0]
            }).filter((v) => { return v !== undefined; } )
          })
        });

        // let lastRate = 0;
        // const initBalance = 1;
        let firstRate = null;
        chartData.push({
          id:'Idle',
          color: 'hsl('+globalConfigs.stats.protocols.idle.color.hsl.join(',')+')',
          data: apiResults.map((d,i) => {
            const x = moment(d.timestamp*1000).format("YYYY/MM/DD HH:mm");
            // const rate = parseFloat(this.functionsUtil.fixTokenDecimals(d.idlePrice,this.props.tokenConfig.decimals));
            // const diff = lastRate ? rate/lastRate-1 : 0;
            // const y = initBalance+diff;
            // if (!lastRate){
            //   lastRate = rate;
            // }
            const rate = this.functionsUtil.fixTokenDecimals(d.idlePrice,this.props.tokenConfig.decimals);
            let y = 0;

            if (!firstRate){
              firstRate = rate;
            } else {
              y = parseFloat(rate.div(firstRate).minus(1).times(100));
            }


            return { x, y };
          })
        });

        // debugger;

        // Set chart type
        chartType = Line;

        chartProps = {
          xScale:{
            type: 'time',
            format: '%Y/%m/%d %H:%M',
            // precision: 'day',
          },
          xFormat:'time:%b %d %H:%M',
          yFormat:value => parseFloat(value).toFixed(2)+'%',
          yScale:{
            type: 'linear',
            stacked: false,
            // min: 1
          },
          axisLeft:{
            format: value => parseFloat(value).toFixed(2),
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
            tickValues: 'every 2 days',
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
          margin:{ top: 20, right: 20, bottom: 60, left: 80 }
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
    if (!this.state.chartType || !this.state.chartData || !this.state.chartProps){
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