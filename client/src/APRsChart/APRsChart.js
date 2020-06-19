import React, { Component } from 'react';
import { ResponsiveLine } from '@nivo/line';
import request from 'request';
import axios from 'axios';
import moment from 'moment';

const env = process.env;

const IdleAddress = '0xAcf651Aad1CBB0fd2c7973E2510d6F63b7e440c9';
const cDAIAddress = '0xf5dce57282a584d2746faf1593d3121fcac444dc';
const iDAIAddress = '0x14094949152eddbfcd073717200da82fed8dc960';

class APRsChart extends Component {
  state = {
    graphData: null,
    minValue: null,
    maxValue: null,
  };
  setSection(section) {
    this.setState(state => ({...state, selectedSection: section}));
  }

  async componentDidMount(){
    await this.getAprs();
  }

  async getContractTransactions(){
    const txs = await axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${IdleAddress}&startblock=8119247&endblock=999999999&sort=asc&apikey=${env.REACT_APP_ETHERSCAN_KEY}`).catch(err => {
      console.log('Error getting internal txs');
    });
    return txs ? txs.data.result : null;
  }

  async getAprs() {

    const timeMonthAgo = parseInt(new Date().getTime()/1000)-(60*60*24*31*1);
    const timeWeekAgo = parseInt(new Date().getTime()/1000)-(60*60*24*7);
    const timestamp = timeMonthAgo;
    const graphData = [
      {
        "id": "Compound",
        'address' : cDAIAddress,
        "color": "hsl(162, 100%, 41%)",
        "data": [],
        'endpoint':'https://defiportfolio-backend.herokuapp.com/api/v1/markets/compound_v2/dai?start_date='+timestamp
      },
      {
        "id": "bZx",
        'address' : iDAIAddress,
        "color": "hsl(197, 98%, 38%)",
        "data": [],
        'endpoint':'https://defiportfolio-backend.herokuapp.com/api/v1/markets/fulcrum/dai?start_date='+timestamp
      }
    ];
    let minValue = null;
    let maxValue = null;
    let maxLen = 0;

    const asyncForEach = async(array, callback) => {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
      }
    }

    const loadGraphData = async () => {
      await asyncForEach(graphData, async (info,key) => {
        if (info.endpoint){
          let remote_data = await axios.get(info.endpoint);

          if (!remote_data || !remote_data.data) {
            return;
          }

          remote_data = remote_data.data;

          maxLen = Math.max(maxLen,remote_data.chart.length);
          remote_data.chart.forEach((v,i) => {
            const date = moment(v.timestamp*1000).format('DD/MM/YYYY');
            const timestamp = getDayTimestamp(v.timestamp*1000);
            const rate = v.supply_rate;

            minValue = minValue ? Math.min(minValue,rate) : rate;
            maxValue = maxValue ? Math.max(maxValue,rate) : rate;

            graphData[key].data.push({t:timestamp,x:date,y:rate});
          });
        }

        // Sort the array by Date
        graphData[key].data.sort(function(a,b){
          return moment(a.x,'DD/MM/YYYY')._d - moment(b.x,'DD/MM/YYYY')._d;
        });

      });
    }

    const getProtocolByAddress = (address) => {
      let output = null;
      graphData.forEach((v,i) => {
        if (v.address === address){
          output = v;
          return false;
        }
      });
      return output;
    }

    const getProtocolDataByAddress = (address) => {
      let output = null;
      graphData.forEach((v,i) => {
        if (v.address === address){
          output = v.data;
          return false;
        }
      });
      return output;
    }

    const getDayTimestamp = (timestamp) => {
      return parseInt(moment(moment(timestamp).format('DD/MM/YYYY'),'DD/MM/YYYY')._d.getTime()/1000);
    }

    const getClosestProtocolAprByTimestamp = (address,timestamp,maxTimestamp) => {
      let output = null;
      const protocolData = getProtocolDataByAddress(address);
      protocolData.forEach((apr,i) => {
        const baseTimestamp = getDayTimestamp(apr.t*1000);
        if (!output && baseTimestamp>=parseInt(timestamp) && (!maxTimestamp || baseTimestamp<=parseInt(maxTimestamp))){
          output = apr;
          output.address = address;
          // console.log(address,moment(timestamp*1000).format('DD/MM/YYYY'),moment(baseTimestamp*1000).format('DD/MM/YYYY'),baseTimestamp>=parseInt(timestamp),apr.y);
          return true;
        }
      });
      return output;
    };

    await loadGraphData();

    const internalTxs = await this.getContractTransactions();

    if (!internalTxs){
      return false;
    }

    const idleBlocks = {};
    internalTxs.forEach((v,i) => {
      if (v.to === cDAIAddress || v.to === iDAIAddress){
        const txTimestamp = parseInt(v.timeStamp)*1000;
        const m = moment(txTimestamp);
        const blockDate = m.format('DD/MM/YYYY');
        const blockTime = getDayTimestamp(txTimestamp);
        idleBlocks[blockTime] = {
          to:v.to,
          timeStamp:blockTime,
          date:blockDate
        };
      }
    });

    const idleBlocksOrdered = {};
    Object.keys(idleBlocks).sort().forEach(function(key) {
      if (idleBlocks[key]){
        idleBlocksOrdered[key] = idleBlocks[key];
      }
    });

    // debugger;

    const idleData = [];
    const blockTimes = Object.keys(idleBlocksOrdered);
    let nextTimestamp = null;
    blockTimes.forEach((blockTime,i) => {
      if (blockTime<=nextTimestamp){
        return;
      }

      const tx = idleBlocksOrdered[blockTime];

      // Set the max timestamp to look for
      const nextBlockTime = blockTimes[i+1];
      const nextTx = nextBlockTime ? idleBlocksOrdered[nextBlockTime] : null;
      const maxTimestamp = nextTx ? nextTx.timeStamp : null;
      const apr = getClosestProtocolAprByTimestamp(tx.to,blockTime,maxTimestamp);

      // console.log('getProtocolApr',getProtocolByAddress(tx.to).id,moment(blockTime*1000).format('DD/MM/YYYY'));

      if (apr){
        idleData.push(apr);

        nextTimestamp = apr.t;

        const protocolID = getProtocolByAddress(apr.address).id;
        const latestIdleApr = idleData.length>1 ? idleData[idleData.length-2] : null;

        console.log(moment(blockTime*1000).format('DD/MM/YYYY'),moment(apr.t*1000).format('DD/MM/YYYY'),protocolID,apr.y);

        // Check if skipped some days between last and current apr
        if (latestIdleApr){
          const lastTimestamp = latestIdleApr.t;
          const timestampDiff = apr.t-latestIdleApr.t;
          const secondsPerDay = 60*60*24;
          const daysBetweenTimestamps = parseInt(timestampDiff/secondsPerDay)-1;

          if (daysBetweenTimestamps>1){
            let timestamp = lastTimestamp+secondsPerDay;
            for (timestamp;timestamp<blockTime;timestamp+=secondsPerDay){
              const maxTimestamp = timestamp+secondsPerDay;
              const apr = getClosestProtocolAprByTimestamp(latestIdleApr.address,timestamp,maxTimestamp);
              if (apr){
                console.log('Filling skipped day',getProtocolByAddress(latestIdleApr.address).id,moment(timestamp*1000).format('DD/MM/YYYY'),' => ',moment(apr.t*1000).format('DD/MM/YYYY'),getProtocolByAddress(latestIdleApr.address).id,apr.y);
                idleData.push(apr);
                timestamp = apr.t;
              }
            }
          }
        }

        idleData.sort(function(a,b){
          return moment(a.x,'DD/MM/YYYY')._d - moment(b.x,'DD/MM/YYYY')._d;
        });
      }
    });

    graphData.push(
      {
        "id": "Idle",
        "color": "hsl(227, 100%, 50%)",
        "data": idleData
      }
    );

    this.setState({
      graphData,
      minValue,
      maxValue,
    });
  }

  render() {

    const MyResponsiveLine = (data) => (
        <ResponsiveLine
            data={data}
            margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
            xScale={{
              type: 'time',
              format: '%d/%m/%Y',
              precision: 'day'
            }}
            curve="catmullRom"
            xFormat="time:%d/%m/%Y"
            yScale={{
              type: 'linear',
              stacked: false,
              min: Math.max(0,this.state.minValue-100),
              max: Math.ceil(this.state.maxValue+100),
            }}
            axisLeft={{
              legend: 'APR',
              legendOffset: -40,
              legendPosition: 'middle'
            }}
            axisBottom={{
              format: '%b %d',
              // tickValues: 'every 2 days',
              // tickValues: 'every 13 days',
              // legend: 'TIME',
              legendOffset: 36,
              legendPosition: 'middle'

            }}
            yFormat={value =>
              parseFloat(value).toFixed(2)+'%'
            }
            enableGridX={false}
            enableGridY={false}
            colors={d => d.color}
            pointSize={7}
            pointColor={{ from: 'color', modifiers: [] }}
            pointBorderWidth={2}
            pointLabel="y"
            pointLabelYOffset={-12}
            useMesh={true}
            legends={[
                {
                    anchor: 'bottom-right',
                    direction: 'column',
                    justify: false,
                    translateX: 100,
                    translateY: 0,
                    itemsSpacing: 0,
                    itemDirection: 'left-to-right',
                    itemWidth: 80,
                    itemHeight: 20,
                    itemOpacity: 0.75,
                    symbolSize: 12,
                    symbolShape: 'circle',
                    symbolBorderColor: 'rgba(0, 0, 0, .5)',
                    effects: [
                        {
                            on: 'hover',
                            style: {
                                itemBackground: 'rgba(0, 0, 0, .03)',
                                itemOpacity: 1
                            }
                        }
                    ]
                }
            ]}
        />
    )

    if (this.state.graphData){
      return MyResponsiveLine(this.state.graphData);
    } else {
      return null;
    }
  }
}

export default APRsChart;