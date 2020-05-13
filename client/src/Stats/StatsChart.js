import moment from 'moment';
import theme from '../theme';
import { Bar } from '@nivo/bar';
import { Line } from '@nivo/line';
import React, { Component } from 'react';
import { Flex, Loader, Text, Box } from 'rimble-ui';
import globalConfigs from '../configs/globalConfigs';
import FunctionsUtil from '../utilities/FunctionsUtil';
import GenericChart from '../GenericChart/GenericChart';
import DashboardCard from '../DashboardCard/DashboardCard';

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

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowSizeChange);
  }

  async componentDidMount() {
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
    const showAdvancedChanged = prevProps.showAdvanced !== this.props.showAdvanced;
    const apiResultsChanged = prevProps.apiResults !== this.props.apiResults;
    if (apiResultsChanged || showAdvancedChanged){
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

  loadApiData = async () => {

    if (!this.props.tokenConfig || !this.props.selectedToken || !this.props.chartMode || !this.props.apiResults){
      return false;
    }

    const CustomTooltipRow = props => (
      <Flex
        mb={2}
        width={1}
        alignItems={'center'}
        flexDirection={'row'}
      >
        <Flex
          pr={2}
          style={{
            flexBasis:'0',
            flex:'1 1 0px'
          }}
          alignItems={'center'}
          justifyContent={'flex-start'}
        > 
          {
            props.color && 
            <Box
              mr={2}
              width={'10px'}
              height={'10px'}
              borderRadius={'50%'}
              backgroundColor={props.color}
            >
            </Box>
          }
          <Text
            fontSize={1}
            fontWeight={2}
            textAlign={'left'}
            color={'dark-gray'}
            style={{
              textTransform:'capitalize'
            }}
          >
            {props.label}
          </Text>
        </Flex>
        <Flex
          style={{
            flexBasis:'0',
            flex:'1 1 0px'
          }}
          alignItems={'center'}
          justifyContent={'flex-end'}
        >
          <Text
            fontSize={1}
            fontWeight={3}
            color={'cellText'}
            textAlign={'right'}
            style={{
              whiteSpace:'nowrap'
            }}
            dangerouslySetInnerHTML={{
              __html: props.value
            }}
          >
          </Text>
        </Flex>
      </Flex>
    );

    const CustomTooltip = props => (
      <DashboardCard
        key={props.point.id}
        cardProps={{
          py:2,
          px:3,
          width:1
        }}
      >
        <Flex
          width={1}
          flexDirection={'column'}
        >
          {
            props.point.data.xFormatted && 
              <Text
                mb={2}
                fontSize={1}
                fontWeight={3}
                color={'cellText'}
                textAlign={'left'}
              >
                {props.point.data.xFormatted}
              </Text>
          }
          {props.children}
        </Flex>
      </DashboardCard>
    );

    const maxGridLines = 4;
    const apiResults = this.props.apiResults;
    const apiResults_unfiltered = this.props.apiResults_unfiltered;

    let keys = {};
    let tempData = {};
    let gridYStep = 0;
    let chartData = [];
    let chartProps = {};
    let chartType = Line;
    let gridYValues = [];
    let maxChartValue = 0;
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
                maxChartValue = Math.max(maxChartValue,divergingData[date].deposits);
              } else {
                divergingData[date].redeems+=parseFloat(diff);
                maxChartValue = Math.max(maxChartValue,Math.abs(divergingData[date].deposits));
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

        gridYStep = parseFloat(maxChartValue/maxGridLines);
        gridYValues = [0];
        for (let i=1;i<=5;i++){
          gridYValues.push(i*gridYStep);
        }

        chartProps = {
          indexBy: 'date',
          enableLabel: false,
          minValue:-maxRange,
          maxValue:maxRange,
          label: d => {
            return Math.abs(d.value);
          },
          axisBottom:{
            tickSize: 0,
            legend: '',
            format: (value) => {
              if (axisBottomIndex++ % 3 === 0){
                return moment(value,'YYYY/MM/DD HH:mm').format('MMM DD')
              }
            },
            tickPadding: 15,
            orient: 'bottom',
            legendOffset: 0,
            legendPosition: 'middle',
            tickValues: 'every 3 days',
          },
          axisLeft: null,
          axisRight: {
            legend: '',
            tickSize: 0,
            orient: 'left',
            tickPadding: 10,
            tickRotation: 0,
            legendOffset: -70,
            tickValues:8,
            legendPosition: 'middle',
            format: v => this.functionsUtil.abbreviateNumber(Math.abs(v),0)
          },
          markers: [
            {
              axis: 'y',
              value: 0,
              lineStyle: { strokeOpacity: 0 },
              textStyle: { fill: theme.colors.transactions.action.deposit },
              legend: 'deposits',
              legendPosition: 'top-left',
              legendOrientation: 'vertical',
              // legendOffsetY: 120,
              legendOffsetX: -20
            },
            {
              axis: 'y',
              value: 0,
              lineStyle: { stroke: theme.colors['dark-gray'], strokeDasharray: '5 3' },
              textStyle: { fill: theme.colors.transactions.action.redeem },
              legend: 'redeems',
              legendPosition: 'bottom-left',
              legendOrientation: 'vertical',
              // legendOffsetY: 120,
              legendOffsetX: -20
            },
          ],
          keys:['deposits','redeems'],
          padding:0.4,
          colors:[theme.colors.transactions.action.deposit, theme.colors.transactions.action.redeem],
          labelTextColor: 'inherit:darker(1.4)',
          labelSkipWidth: 16,
          labelSkipHeight: 16,
          pointSize:0,
          useMesh:true,
          animate:false,
          pointLabel:"y",
          curve:'linear',
          enableArea:false,
          enableSlices:'x',
          enableGridX:false,
          enableGridY:true,
          pointBorderWidth:1,
          pointLabelYOffset:-12,
          legends:[
            {
              dataFrom:'keys',
              itemWidth: 100,
              itemHeight: 18,
              translateY: 65,
              symbolSize: 10,
              itemsSpacing: 0,
              direction: 'row',
              anchor: 'bottom-left',
              symbolShape: 'circle',
              itemTextColor: theme.colors.legend,
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemTextColor: '#000'
                  }
                }
              ]
            }
          ],
          theme:{
            axis: {
              ticks: {
                text: {
                  fontSize:14,
                  fontWeight:600,
                  fill:theme.colors.legend,
                  fontFamily: theme.fonts.sansSerif
                }
              }
            },
            grid: {
              line: {
                stroke: theme.colors.lineChartStroke, strokeDasharray: '10 6'
              }
            },
            legends:{
              text:{
                fontSize:14,
                fontWeight:500,
                fontFamily: theme.fonts.sansSerif
              }
            },
            tooltip:{
              container:{
                boxShadow:null,
                background:null
              }
            }
          },
          pointColor:{ from: 'color', modifiers: []},
          margin: this.props.isMobile ? { top: 20, right: 50, bottom: 70, left: 40 } : { top: 20, right: 70, bottom: 70, left: 40 },
          tooltip:(data) => {
            const xFormatted = this.functionsUtil.strToMoment(data.indexValue).format('MMM DD HH:mm');
            const point = {
              id:data.id,
              data:{
                xFormatted
              }
            };
            const depositFormatted = this.functionsUtil.abbreviateNumber(data.data.deposits,2)+' '+this.props.selectedToken;
            const redeemFormatted = this.functionsUtil.abbreviateNumber(data.data.redeems,2)+' '+this.props.selectedToken;
            return (
              <CustomTooltip
                point={point}
              >
                <CustomTooltipRow
                  label={'Deposits'}
                  color={theme.colors.deposit}
                  value={depositFormatted}
                />
                <CustomTooltipRow
                  label={'Redeem'}
                  color={theme.colors.redeem}
                  value={redeemFormatted}
                />
              </CustomTooltip>
            );
          }
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
            format: v => this.functionsUtil.abbreviateNumber(v),
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
            tickValues: this.props.isMobile ? 'every 4 days' : 'every 3 days',
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

        maxChartValue = 0;

        chartData.push({
          id:'AUM',
          color: 'hsl('+globalConfigs.stats.tokens[this.props.selectedToken].color.hsl.join(',')+')',
          data: apiResults.map((d,i) => {
            const idleTokens = this.functionsUtil.fixTokenDecimals(d.idleSupply,18);
            const idlePrice = this.functionsUtil.fixTokenDecimals(d.idlePrice,this.props.tokenConfig.decimals);
            const aum = idleTokens.times(idlePrice);
            const x = moment(d.timestamp*1000).format("YYYY/MM/DD HH:mm");
            const y = parseInt(aum.toString());

            maxChartValue = Math.max(maxChartValue,y);

            return { x,y };
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

                maxChartValue = Math.max(maxChartValue,y);

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

        gridYStep = parseFloat(maxChartValue/maxGridLines);
        gridYValues = [0];
        for (let i=1;i<=5;i++){
          gridYValues.push(i*gridYStep);
        }

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
            legend: '',
            tickSize: 0,
            orient: 'left',
            tickPadding: 10,
            tickRotation: 0,
            legendOffset: -70,
            tickValues:gridYValues,
            legendPosition: 'middle',
            format: v => this.functionsUtil.abbreviateNumber(v,0),
          },
          axisBottom:{
            tickSize: 0,
            format: '%b %d',
            tickPadding: 15,
            tickValues: this.props.isMobile ? 'every 4 days' : ( this.props.showAdvanced ? 'every 3 days' : 'every 2 days'),
            orient: 'bottom',
            legend: '',
            legendOffset: 0,
            legendPosition: 'middle'
          },
          gridYValues,
          pointSize:0,
          useMesh:true,
          animate:false,
          pointLabel:"y",
          curve:'linear',
          enableArea:true,
          enableSlices:'x',
          enableGridX:false,
          enableGridY:true,
          pointBorderWidth:1,
          colors:d => d.color,
          pointLabelYOffset:-12,
          legends:[
            {
              itemWidth: 80,
              itemHeight: 18,
              translateY: 65,
              symbolSize: 10,
              itemsSpacing: 5,
              direction: 'row',
              anchor: 'bottom-left',
              symbolShape: 'circle',
              itemTextColor: theme.colors.legend,
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemTextColor: '#000'
                  }
                }
              ]
            }
          ],
          theme:{
            axis: {
              ticks: {
                text: {
                  fontSize:14,
                  fontWeight:600,
                  fill:theme.colors.legend,
                  fontFamily: theme.fonts.sansSerif
                }
              }
            },
            grid: {
              line: {
                stroke: theme.colors.lineChartStroke, strokeDasharray: '10 6'
              }
            },
            legends:{
              text:{
                fontSize:14,
                fontWeight:500,
                fontFamily: theme.fonts.sansSerif
              }
            }
          },
          pointColor:{ from: 'color', modifiers: []},
          margin: this.props.isMobile ? { top: 20, right: 20, bottom: 70, left: 50 } : { top: 20, right: 40, bottom: 70, left: 70 },
          sliceTooltip:(slideData) => {
            const { slice } = slideData;
            const point = slice.points[0];
            if (typeof point === 'object' && typeof point.data === 'object'){
              return (
                <CustomTooltip
                  point={point}
                >
                  <CustomTooltipRow
                    label={point.serieId}
                    color={point.serieColor}
                    value={point.data.yFormatted}
                  />
                  {
                    point.data.allocations && typeof point.data.allocations === 'object' &&
                      Object.keys(point.data.allocations).map(protocolName => {
                        const protocolColor = 'hsl('+globalConfigs.stats.protocols[protocolName].color.hsl.join(',')+')';
                        const protocolAllocation = this.functionsUtil.formatMoney(point.data.allocations[protocolName],0);
                        const protocolAllocationPerc = this.functionsUtil.BNify(point.data.allocations[protocolName]).div(this.functionsUtil.BNify(point.data.y)).times(100).toFixed(0)+'%';
                        return (
                          <CustomTooltipRow
                            label={protocolName}
                            color={protocolColor}
                            key={`${point.id}_${protocolName}`}
                            value={`${protocolAllocation} (${protocolAllocationPerc})`}
                          />
                        );
                      })
                  }
                </CustomTooltip>
              );
              /*
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
              */
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

          d.protocolsData.forEach((protocolData) => {
            const protocolPaused = this.functionsUtil.BNify(protocolData.rate).eq(0);
            const protocolName = this.functionsUtil.capitalize(this.props.tokenConfig.protocols.filter((p) => { return p.address.toLowerCase() === protocolData.protocolAddr.toLowerCase() })[0].name);
            if (!protocolPaused){
              const allocation = parseInt(this.functionsUtil.fixTokenDecimals(protocolData.allocation,this.props.tokenConfig.decimals));
              keys[protocolName] = 1;
              row[protocolName] = allocation;
              row[`${protocolName}Color`] = 'hsl('+globalConfigs.stats.protocols[protocolName.toLowerCase()].color.hsl.join(',')+')';
              maxChartValue = Math.max(maxChartValue,allocation);
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

        gridYStep = parseFloat(maxChartValue/maxGridLines);
        gridYValues = [0];
        for (let i=1;i<=5;i++){
          gridYValues.push(i*gridYStep);
        }

        chartProps = {
          padding: 0.2,
          animate: false,
          indexBy: 'date',
          enableLabel: false,
          labelSkipWidth: 16,
          labelSkipHeight: 16,
          keys: Object.keys(keys),
          labelTextColor: 'inherit:darker(1.4)',
          colors: ({ id, data }) => data[`${id}Color`],
          axisLeft:{
            format: v => this.functionsUtil.abbreviateNumber(v,0),
            orient: 'left',
            tickSize: 0,
            tickPadding: 10,
            tickRotation: 0,
            legend: '',
            legendOffset: -65,
            tickValues:gridYValues,
            legendPosition: 'middle'
          },
          gridYValues,
          axisBottom:{
            legend: '',
            format: (value) => {
              if (axisBottomIndex++ % 3 === 0){
                return moment(value,'YYYY/MM/DD HH:mm').format('MMM DD')
              }
            },
            tickSize: 0,
            tickPadding: 10,
            orient: 'bottom-left',
            legendOffset: 36,
            legendPosition: 'middle',
            tickValues: 'every 3 days'
          },
          legends:[
            {
              dataFrom:'keys',
              itemWidth: 80,
              itemHeight: 18,
              translateY: 65,
              symbolSize: 10,
              itemsSpacing: 5,
              direction: 'row',
              anchor: 'bottom-left',
              symbolShape: 'circle',
              itemTextColor: theme.colors.legend,
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemTextColor: '#000'
                  }
                }
              ]
            }
          ],
          theme:{
            axis: {
              ticks: {
                text: {
                  fontSize:14,
                  fontWeight:600,
                  fill:theme.colors.legend,
                  fontFamily: theme.fonts.sansSerif
                }
              }
            },
            grid: {
              line: {
                stroke: theme.colors.lineChartStroke, strokeDasharray: '10 6'
              }
            },
            legends:{
              text:{
                fontSize:14,
                fontWeight:500,
                fontFamily: theme.fonts.sansSerif
              }
            }
          },
          pointColor:{ from: 'color', modifiers: []},
          margin: this.props.isMobile ? { top: 20, right: 20, bottom: 70, left: 50 } : { top: 20, right: 40, bottom: 70, left: 60 },
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
              if (axisBottomIndex++ % 3 === 0){
                return moment(value,'YYYY/MM/DD HH:mm').format('MMM DD')
              }
            },
            orient: 'bottom',
            legendOffset: 36,
            legendPosition: 'middle',
            tickValues: 'every 3 days'
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

        maxChartValue = 0;

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

                  maxChartValue = Math.max(maxChartValue,y);

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

            maxChartValue = Math.max(maxChartValue,y);

            return { x, y };
          })
        });

        // Set chart type
        chartType = Line;

        gridYStep = parseFloat(maxChartValue/maxGridLines);
        gridYValues = [0];
        for (let i=1;i<=5;i++){
          gridYValues.push(i*gridYStep);
        }

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
            legend: '',
            tickSize: 0,
            orient: 'left',
            tickPadding: 10,
            tickRotation: 0,
            legendOffset: -70,
            tickValues:gridYValues,
            legendPosition: 'middle',
            format:value => parseFloat(value).toFixed(1)+'%',
          },
          axisBottom:{
            tickSize: 0,
            format: '%b %d',
            tickPadding: 15,
            tickValues: this.props.isMobile ? 'every 4 days' : ( this.props.showAdvanced ? 'every 3 days' : 'every 2 days'),
            orient: 'bottom',
            legend: '',
            legendOffset: 0,
            legendPosition: 'middle'
          },
          gridYValues,
          pointSize:0,
          useMesh:true,
          animate:false,
          pointLabel:"y",
          curve:'linear',
          enableArea:false,
          enableSlices:'x',
          enableGridX:false,
          enableGridY:true,
          pointBorderWidth:1,
          colors:d => d.color,
          pointLabelYOffset:-12,
          legends:[
            {
              itemWidth: 80,
              itemHeight: 18,
              translateY: 65,
              symbolSize: 10,
              itemsSpacing: 0,
              direction: 'row',
              anchor: 'bottom-left',
              symbolShape: 'circle',
              itemTextColor: theme.colors.legend,
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemTextColor: '#000'
                  }
                }
              ]
            }
          ],
          theme:{
            axis: {
              ticks: {
                text: {
                  fontSize:14,
                  fontWeight:600,
                  fill:theme.colors.legend,
                  fontFamily: theme.fonts.sansSerif
                }
              }
            },
            grid: {
              line: {
                stroke: theme.colors.lineChartStroke, strokeDasharray: '10 6'
              }
            },
            legends:{
              text:{
                fontSize:14,
                fontWeight:500,
                fontFamily: theme.fonts.sansSerif
              }
            }
          },
          pointColor:{ from: 'color', modifiers: []},
          margin: this.props.isMobile ? { top: 20, right: 20, bottom: 70, left: 50 } : { top: 20, right: 40, bottom: 70, left: 70 },
          sliceTooltip:(slideData) => {
            const { slice } = slideData;
            const point = slice.points[0];
            return (
              <CustomTooltip
                point={point}
              >
                {
                typeof slice.points === 'object' && slice.points.length &&
                  slice.points.map(point => {
                    const protocolName = point.serieId;
                    const protocolEarning = point.data.yFormatted;
                    // const protocolApy = point.data.apy;
                    return (
                      <CustomTooltipRow
                        key={point.id}
                        color={point.color}
                        label={protocolName}
                        value={protocolEarning}
                      />
                    );
                  })
                }
              </CustomTooltip>
            );
          }
        };
      break;
      case 'PRICE':

        let firstTokenPrice = null;
        let firstIdleBlock = null;

        const idleChartData = apiResults.map((d,i) => {
          const x = moment(d.timestamp*1000).format("YYYY/MM/DD HH:mm");

          const tokenPrice = this.functionsUtil.fixTokenDecimals(d.idlePrice,this.props.tokenConfig.decimals);
          let y = 0;
          let apy = 0;

          if (!firstTokenPrice){
            firstTokenPrice = tokenPrice;
          } else {
            y = parseFloat(tokenPrice.div(firstTokenPrice).minus(1).times(100));

            const days = (d.timestamp-apiResults[0].timestamp)/86400;
            const earning = tokenPrice.div(firstTokenPrice).minus(1).times(100);
            apy = earning.times(365).div(days).toFixed(2);
          }

          if (firstIdleBlock === null){
            firstIdleBlock = parseInt(d.blocknumber);
          }

          maxChartValue = Math.max(maxChartValue,y);

          return { x, y, apy, blocknumber: d.blocknumber };
        });

        await this.functionsUtil.asyncForEach(this.props.tokenConfig.protocols,async (p) => {

          const chartRow = {
            id:this.functionsUtil.capitalize(p.name),
            color: 'hsl('+globalConfigs.stats.protocols[p.name].color.hsl.join(',')+')',
            data: []
          };

          firstTokenPrice = null;
          let firstProtocolData = null;
          let lastRowData = null;
          let lastTokenPrice = null;
          let baseProfit = 0;
          let firstProtocolBlock = null;

          await this.functionsUtil.asyncForEach(apiResults,async (d) => {

            const protocolData = d.protocolsData.find((pData,x) => {
              return pData.protocolAddr.toLowerCase() === p.address.toLowerCase()
            });

            if (protocolData){

              if (!firstProtocolData){
                firstProtocolData = protocolData;
              }

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
                let apy = 0;

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

                  const days = (d.timestamp-apiResults[0].timestamp)/86400;
                  const earning = tokenPriceFixed.div(firstTokenPrice).minus(1).times(100);
                  apy = earning.times(365).div(days).toFixed(2);
                }

                maxChartValue = Math.max(maxChartValue,y);

                rowData = {
                  x,
                  y,
                  apy
                };

                lastTokenPrice = tokenPriceFixed;
                lastRowData = rowData;
                chartRow.data.push(rowData);
              }
            }
          });

          chartData.push(chartRow);
        });

        gridYStep = parseFloat(maxChartValue/maxGridLines);
        gridYValues = [0];
        for (let i=1;i<=5;i++){
          gridYValues.push(i*gridYStep);
        }

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
            legend: '',
            tickSize: 0,
            orient: 'left',
            tickPadding: 10,
            tickRotation: 0,
            legendOffset: -70,
            tickValues:gridYValues,
            legendPosition: 'middle',
            format: value => parseFloat(value).toFixed(2)+'%',
          },
          axisBottom:{
            tickSize: 0,
            format: '%b %d',
            tickPadding: 10,
            tickValues: this.props.isMobile ? 'every 4 days' : ( this.props.showAdvanced ? 'every 3 days' : 'every 2 days'),
            orient: 'bottom',
            legend: '',
            legendOffset: 0,
            legendPosition: 'middle'
          },
          gridYValues,
          pointSize:0,
          useMesh:true,
          animate:false,
          pointLabel:"y",
          curve:'monotoneX',
          enableArea:false,
          enableSlices:'x',
          enableGridX:false,
          enableGridY:true,
          pointBorderWidth:1,
          colors:d => d.color,
          pointLabelYOffset:-12,
          legends:[
            {
              itemWidth: 80,
              itemHeight: 18,
              translateY: 65,
              symbolSize: 10,
              itemsSpacing: 5,
              direction: 'row',
              anchor: 'bottom-left',
              symbolShape: 'circle',
              itemTextColor: theme.colors.legend,
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemTextColor: '#000'
                  }
                }
              ]
            }
          ],
          theme:{
            axis: {
              ticks: {
                text: {
                  fontSize:14,
                  fontWeight:600,
                  fill:theme.colors.legend,
                  fontFamily: theme.fonts.sansSerif
                }
              }
            },
            grid: {
              line: {
                stroke: theme.colors.lineChartStroke, strokeDasharray: '10 6'
              }
            },
            legends:{
              text:{
                fontSize:14,
                fontWeight:500,
                fontFamily: theme.fonts.sansSerif
              }
            }
          },
          pointColor:{ from: 'color', modifiers: []},
          margin: this.props.isMobile ? { top: 20, right: 20, bottom: 80, left: 50 } : { top: 20, right: 40, bottom: 80, left: 80 },
          sliceTooltip:(slideData) => {
            const { slice } = slideData;
            const point = slice.points[0];
            return (
              <CustomTooltip
                point={point}
              >
                {
                typeof slice.points === 'object' && slice.points.length &&
                  slice.points.map(point => {
                    const protocolName = point.serieId;
                    const protocolEarning = point.data.yFormatted;
                    const protocolApy = point.data.apy;
                    return (
                      <CustomTooltipRow
                        key={point.id}
                        label={protocolName}
                        color={point.color}
                        value={`${protocolEarning} <small>(${protocolApy}% APY)</small>`}
                      />
                    );
                  })
                }
              </CustomTooltip>
            );
          }
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
    if (!this.state.chartType || !this.state.chartData || !this.state.chartProps || !this.props.apiResults){
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