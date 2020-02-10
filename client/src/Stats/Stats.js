import moment from 'moment';
import { Flex } from 'rimble-ui';
import { Line } from '@nivo/line';
import React, { Component } from 'react';
import globalConfigs from '../configs/globalConfigs';
import FunctionsUtil from '../utilities/FunctionsUtil';
import GenericChart from '../GenericChart/GenericChart';
import availableTokens from '../configs/availableTokens';

class Stats extends Component {
  state = {
    chartProps:{},
    chartType:null,
    chartData:null,
    chartMode:'ALL',
    tokenConfig:null,
    selectedToken:null,
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

  async loadParams() {
    const newState = Object.assign({},this.state);
    const { match: { params } } = this.props;

    const currentNetworkAvailableTokens = Object.keys(availableTokens[globalConfigs.network.requiredNetwork]);

    if (!!params.chartMode){
      newState.chartMode = params.chartMode;
    }
    if (!!params.customToken && currentNetworkAvailableTokens.indexOf(params.customToken.toUpperCase()) !== -1 ){
      newState.selectedToken = params.customToken.toUpperCase();
    } else {
      newState.selectedToken = this.props.selectedToken.toUpperCase();
    }
    newState.tokenConfig = availableTokens[globalConfigs.network.requiredNetwork][newState.selectedToken];

    if (newState !== this.state){
      this.setState(newState);
    }
  }

  componentWillMount() {
    this.loadUtils();
  }

  async componentDidMount() {
    this.loadUtils();
    await this.loadParams();
    this.loadApiData();
  }

  async componentDidUpdate(prevProps) {
    if (prevProps !== this.props){
      this.componentDidMount();
    }
  }

  loadApiData = async () => {

    if (!this.state.tokenConfig || !this.state.selectedToken || !this.state.chartMode){
      return false;
    }

    const apiInfo = globalConfigs.stats.rates;
    const endpoint = `${apiInfo.endpoint}${this.state.tokenConfig.address}`;
    const TTL = apiInfo.TTL ? apiInfo.TTL : 0;
    const apiResults = await this.functionsUtil.makeCachedRequest(endpoint,TTL,true);

    if (!apiResults){
      return false;
    }

    const chartData = [];
    let chartProps = {};
    let chartType = Line;

    switch (this.state.chartMode){
      case 'AUM':
        chartData.push({
          id:'AUM',
          color: "hsl(227, 100%, 50%)",
          data: apiResults.map((d,i) => {
            const idleTokens = this.functionsUtil.fixTokenDecimals(d.idleSupply,18);
            const idlePrice = this.functionsUtil.fixTokenDecimals(d.idlePrice,this.state.tokenConfig.decimals);
            const aum = idleTokens.times(idlePrice);
            return {
              x: moment(d.timestamp*1000).format("YYYY/MM/DD HH:mm"),
              y: parseInt(aum.toString())
            };
          })
        });

        // Set chart type
        chartType = Line;

        const abbreviateNumber = (value) => {
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

        const yFormat = (v) => {
          return abbreviateNumber(v)+' '+this.state.selectedToken
        }

        chartProps = {
          xScale:{
            type: 'time',
            format: '%Y/%m/%d %H:%M',
            // precision: 'hour',
          },
          xFormat:'time:%b %d %H:%M',
          yFormat:value => (parseInt(value)>=1000 ? parseFloat(value/1000).toFixed(1)+'K' : parseFloat(value) )+' '+this.state.selectedToken,
          yScale:{
            type: 'linear',
            stacked: false
          },
          axisLeft:{
            format: yFormat,
            orient: 'left',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: '',
            legendOffset: -65,
            legendPosition: 'middle'
          },
          axisBottom:{
            format: '%b %d %H:%M',
            orient: 'bottom',
            legend: '',
            legendOffset: 36,
            legendPosition: 'middle'
          },
          enableArea:true,
          curve:"catmullRom",
          enableSlices:false,
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
      case 'ALL':
        this.state.tokenConfig.protocols.forEach((p,j) => {
          chartData.push({
            id:p.name,
            color: globalConfigs.stats.protocols[p.name].color,
            data: apiResults.map((d,i) => {
              return d.protocolsData.filter((protocolAllocation,x) => {
                  return protocolAllocation.protocolAddr.toLowerCase() === p.address.toLowerCase()
              })
              .map((protocolAllocation,z) => {
                const x = moment(d.timestamp*1000).format("YYYY/MM/DD HH:mm");
                const y = parseInt(this.functionsUtil.fixTokenDecimals(protocolAllocation.allocation,this.state.tokenConfig.decimals));
                return { x, y };
              })[0]
            })
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
          yFormat:value => (parseInt(value)>=1000 ? parseFloat(value/1000).toFixed(1)+'K' : parseFloat(value) )+' '+this.state.selectedToken,
          yScale:{
            type: 'linear',
            stacked: false
          },
          axisLeft:{
            format: value => parseInt(value/1000)+'K '+this.state.selectedToken,
            orient: 'left',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: '',
            legendOffset: -70,
            legendPosition: 'middle'
          },
          axisBottom:{
            format: '%b %d %H:%M',
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
        this.state.tokenConfig.protocols.forEach((p,j) => {
          chartData.push({
            id:p.name,
            color: globalConfigs.stats.protocols[p.name].color,
            data: apiResults.map((d,i) => {
              const totalAllocation = d.protocolsData.reduce((accumulator,protocolAllocation) => {
                const allocation = this.functionsUtil.fixTokenDecimals(protocolAllocation.allocation,this.state.tokenConfig.decimals);
                return this.functionsUtil.BNify(accumulator).plus(allocation);
              },0);

              return d.protocolsData.filter((protocolAllocation,x) => {
                  return protocolAllocation.protocolAddr.toLowerCase() === p.address.toLowerCase()
              })
              .map((protocolAllocation,z) => {
                const allocation = this.functionsUtil.fixTokenDecimals(protocolAllocation.allocation,this.state.tokenConfig.decimals);
                const x = moment(d.timestamp*1000).format("YYYY/MM/DD HH:mm");
                const y = parseFloat(allocation.div(totalAllocation).times(100));
                return { x, y };
              })[0]
            })
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
            format: '%b %d %H:%M',
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
    if (this.state.chartType && this.state.chartData){
      return (
        <Flex p={4}>
          <GenericChart
            type={this.state.chartType}
            data={this.state.chartData}
            {...this.state.chartProps}
            width={document.body.offsetWidth*3/4}
            height={450}
          />
        </Flex>
      );
    }
    return null;
  }
}

export default Stats;
