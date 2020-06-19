import axios from 'axios';
import moment from 'moment';
import { line } from 'd3-shape'
import { Line } from '@nivo/line';
import React, { Component } from 'react';
import FunctionsUtil from '../utilities/FunctionsUtil';
import { Flex, Box, Text, Card, Image, Heading, Link, Pill, Loader, Button } from "rimble-ui";
import SmartContractControls_styles from '../SmartContractControls/SmartContractControls.module.scss';

const env = process.env;

const IdleAddress = '0xAcf651Aad1CBB0fd2c7973E2510d6F63b7e440c9';
const cDAIAddress = '0xf5dce57282a584d2746faf1593d3121fcac444dc';
const iDAIAddress = '0x14094949152eddbfcd073717200da82fed8dc960';
const secondsInYear = 31556952;

class DefiPrimeEquityChart extends Component {
  state = {
    mode:'perc', // [equity,apr,perc]
    equityMode:'best', // [real,best]
    initialBalance:1000,
    graphData: null,
    minValue: null,
    maxValue: null,
    rebalanceTxs: null,
    graphError: false,
    chartWidth: null
  };
  setSection(section) {
    this.setState(state => ({...state, selectedSection: section}));
  }

  // Utils
  functionsUtil = null;
  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  async componentWillMount() {
    window.addEventListener('resize', this.handleWindowSizeChange);
  }

  handleWindowSizeChange = () => {
    const chartContainer = document.getElementById('chart-container');
    if (chartContainer && chartContainer.offsetWidth !== this.state.chartWidth){
      const chartWidth = chartContainer.offsetWidth;
      return this.setState({
        chartWidth
      });
    }
  };

  async componentDidMount(){
    this.loadUtils();

    this.handleWindowSizeChange();

    await this.getEquity();
  }

  async componentDidUpdate(){
    this.loadUtils();
  }

  async asyncForEach(array, callback){
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  async getContractTransactions(){
    const txs = await this.makeCachedRequest(`https://api.etherscan.io/api?module=account&action=tokentx&address=${IdleAddress}&startblock=8119247&endblock=999999999&sort=asc&apikey=${env.REACT_APP_ETHERSCAN_KEY}`,43200).catch(err => {
      // console.log('Error getting internal txs');
    });
    return txs ? txs.data.result : null;
  }

  reloadData = async(e) => {
    e.preventDefault();
    await this.getEquity();
  }

  filterGraphData(graphData,startTimestamp){
    // console.log('Filter graph from',startTimestamp,moment(startTimestamp*1000).format('DD/MM/YYYY'));
    graphData.forEach((v,i)=>{
      for (var j = 0; j < v.data.length; j++) {
        const d = v.data[j];
        // console.log(i,j,d.t,startTimestamp,d.x,moment(d.t*1000).format('DD/MM/YYYY'),moment(startTimestamp*1000).format('DD/MM/YYYY'),d.t<startTimestamp);
        if (d.t<startTimestamp){
          graphData[i].data.splice(j,1);
          j--;
        }
      }
    });
    // console.log(graphData);
    return graphData;
  }

  getGraphDataMinMax(graphData){
    let min = null;
    let max = null;
    graphData.forEach((v,i)=>{
      v.data.forEach((apr,j)=>{
        if (!min || apr.y<min){
          min = apr.y;
        }
        if (!max || apr.y>max){
          max = apr.y;
        }
      });
    });
    return [min,max];
  }

  getGraphDays(graphData){
    return parseInt((graphData[0].data[graphData[0].data.length-1].t-graphData[0].data[0].t)/(60*60*24));
  }

  getEquity_static(){
    const graphData = [{"id":"Compound",'p':1,'pos':2,"address":"0xf5dce57282a584d2746faf1593d3121fcac444dc","icon":"compound-mark-green.png","color":"hsl(162, 100%, 41%)","aprs":[{"t":1565841600,"x":"15/08/2019","y":11.1814246279,"address":"0xf5dce57282a584d2746faf1593d3121fcac444dc"},{"t":1566187200,"x":"19/08/2019","y":11.2574768226},{"t":1566532800,"x":"23/08/2019","y":10.524299471},{"t":1566964800,"x":"28/08/2019","y":9.889625284},{"t":1567310400,"x":"01/09/2019","y":10.0920870812},{"t":1567656000,"x":"05/09/2019","y":9.5143638809},{"t":1568088000,"x":"10/09/2019","y":7.17614515},{"t":1568433600,"x":"14/09/2019","y":7.2869755401},{"t":1568779200,"x":"18/09/2019","y":7.2847125058},{"t":1569211200,"x":"23/09/2019","y":8.5927022122},{"t":1569556800,"x":"27/09/2019","y":8.258009679},{"t":1569902400,"x":"01/10/2019","y":8.1846270271,"address":"0xf5dce57282a584d2746faf1593d3121fcac444dc"},{"t":1570334400,"x":"06/10/2019","y":7.7331059741,"address":"0xf5dce57282a584d2746faf1593d3121fcac444dc"},{"t":1570680000,"x":"10/10/2019","y":7.4281545568,"address":"0xf5dce57282a584d2746faf1593d3121fcac444dc"},{"t":1571025600,"x":"14/10/2019","y":7.4491409258},{"t":1571457600,"x":"19/10/2019","y":7.3153018689,"address":"0xf5dce57282a584d2746faf1593d3121fcac444dc"},{"t":1571803200,"x":"23/10/2019","y":6.8672401353,"address":"0xf5dce57282a584d2746faf1593d3121fcac444dc"},{"t":1572235200,"x":"28/10/2019","y":6.2244060043},{"t":1572580800,"x":"01/11/2019","y":6.7140658119},{"t":1572930000,"x":"05/11/2019","y":4.2932645509},{"t":1573275600,"x":"09/11/2019","y":4.0003061174}],"data":[{"t":1565841600,"x":"15/08/2019","y":"0.0000"},{"t":1566187200,"x":"19/08/2019","y":"0.1225"},{"t":1566532800,"x":"23/08/2019","y":"0.2458"},{"t":1566964800,"x":"28/08/2019","y":"0.3899"},{"t":1567310400,"x":"01/09/2019","y":"0.4982"},{"t":1567656000,"x":"05/09/2019","y":"0.6088"},{"t":1568088000,"x":"10/09/2019","y":"0.7391"},{"t":1568433600,"x":"14/09/2019","y":"0.8178"},{"t":1568779200,"x":"18/09/2019","y":"0.8976"},{"t":1569211200,"x":"23/09/2019","y":"0.9975"},{"t":1569556800,"x":"27/09/2019","y":"1.0917"},{"t":1569902400,"x":"01/10/2019","y":"1.1822"},{"t":1570334400,"x":"06/10/2019","y":"1.2944"},{"t":1570680000,"x":"10/10/2019","y":"1.3792"},{"t":1571025600,"x":"14/10/2019","y":"1.4606"},{"t":1571457600,"x":"19/10/2019","y":"1.5628"},{"t":1571803200,"x":"23/10/2019","y":"1.6430"},{"t":1572235200,"x":"28/10/2019","y":"1.7372"},{"t":1572580800,"x":"01/11/2019","y":"1.8054"},{"t":1572930000,"x":"05/11/2019","y":"1.8799"},{"t":1573275600,"x":"09/11/2019","y":"1.9270"}],"endpoint":"https://defiportfolio-backend.herokuapp.com/api/v1/markets/compound_v2/dai?start_date=1565866741"},{"id":"Fulcrum",'p':3,'pos':3,"address":"0x14094949152eddbfcd073717200da82fed8dc960","icon":"fulcrum-mark.png","color":"hsl(197, 98%, 38%)","aprs":[{"t":1565841600,"x":"15/08/2019","y":12.0012999748,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1566187200,"x":"19/08/2019","y":11.9071898338,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1566532800,"x":"23/08/2019","y":10.9043702637,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1566964800,"x":"28/08/2019","y":10.898848905,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1567310400,"x":"01/09/2019","y":11.0713746174,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1567656000,"x":"05/09/2019","y":7.0411276517,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1568088000,"x":"10/09/2019","y":9.0967959005,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1568433600,"x":"14/09/2019","y":8.2304366531,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1568779200,"x":"18/09/2019","y":8.3610064414,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1569211200,"x":"23/09/2019","y":8.8595258625,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1569556800,"x":"27/09/2019","y":6.9153156339,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1569902400,"x":"01/10/2019","y":7.7938638833},{"t":1570334400,"x":"06/10/2019","y":4.0921954068},{"t":1570680000,"x":"10/10/2019","y":7.5403471655},{"t":1571025600,"x":"14/10/2019","y":7.2633040984,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1571457600,"x":"19/10/2019","y":7.3605016941},{"t":1571803200,"x":"23/10/2019","y":6.8471006648},{"t":1572235200,"x":"28/10/2019","y":6.6498551182,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1572580800,"x":"01/11/2019","y":6.8810257801,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1572930000,"x":"05/11/2019","y":5.4327273052,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1573275600,"x":"09/11/2019","y":5.1890604418,"address":"0x14094949152eddbfcd073717200da82fed8dc960"}],"data":[{"t":1565841600,"x":"15/08/2019","y":"0.0000"},{"t":1566187200,"x":"19/08/2019","y":"0.1314"},{"t":1566532800,"x":"23/08/2019","y":"0.2619"},{"t":1566964800,"x":"28/08/2019","y":"0.4112"},{"t":1567310400,"x":"01/09/2019","y":"0.5306"},{"t":1567656000,"x":"05/09/2019","y":"0.6519"},{"t":1568088000,"x":"10/09/2019","y":"0.7483"},{"t":1568433600,"x":"14/09/2019","y":"0.8480"},{"t":1568779200,"x":"18/09/2019","y":"0.9383"},{"t":1569211200,"x":"23/09/2019","y":"1.0528"},{"t":1569556800,"x":"27/09/2019","y":"1.1500"},{"t":1569902400,"x":"01/10/2019","y":"1.2258"},{"t":1570334400,"x":"06/10/2019","y":"1.3326"},{"t":1570680000,"x":"10/10/2019","y":"1.3775"},{"t":1571025600,"x":"14/10/2019","y":"1.4602"},{"t":1571457600,"x":"19/10/2019","y":"1.5597"},{"t":1571803200,"x":"23/10/2019","y":"1.6405"},{"t":1572235200,"x":"28/10/2019","y":"1.7344"},{"t":1572580800,"x":"01/11/2019","y":"1.8073"},{"t":1572930000,"x":"05/11/2019","y":"1.8836"},{"t":1573275600,"x":"09/11/2019","y":"1.9432"}],"endpoint":"https://defiportfolio-backend.herokuapp.com/api/v1/markets/fulcrum/dai?start_date=1565866741"},{"id":"Idle",'p':2,'pos':1,"icon":"idle-mark.png","color":"hsl(227, 100%, 50%)","aprs":[{"t":1565841600,"x":"15/08/2019","y":12.0012999748,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1565841600,"x":"15/08/2019","y":12.0012999748,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1566187200,"x":"19/08/2019","y":11.9071898338,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1566532800,"x":"23/08/2019","y":10.9043702637,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1566964800,"x":"28/08/2019","y":10.898848905,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1567310400,"x":"01/09/2019","y":11.0713746174,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1567656000,"x":"05/09/2019","y":7.0411276517,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1568088000,"x":"10/09/2019","y":9.0967959005,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1568433600,"x":"14/09/2019","y":8.2304366531,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1568779200,"x":"18/09/2019","y":8.3610064414,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1569211200,"x":"23/09/2019","y":8.8595258625,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1569556800,"x":"27/09/2019","y":6.9153156339,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1569902400,"x":"01/10/2019","y":8.1846270271,"address":"0xf5dce57282a584d2746faf1593d3121fcac444dc"},{"t":1570334400,"x":"06/10/2019","y":7.7331059741,"address":"0xf5dce57282a584d2746faf1593d3121fcac444dc"},{"t":1570680000,"x":"10/10/2019","y":7.4281545568,"address":"0xf5dce57282a584d2746faf1593d3121fcac444dc"},{"t":1571025600,"x":"14/10/2019","y":7.2633040984,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1571457600,"x":"19/10/2019","y":7.3153018689,"address":"0xf5dce57282a584d2746faf1593d3121fcac444dc"},{"t":1571803200,"x":"23/10/2019","y":6.8672401353,"address":"0xf5dce57282a584d2746faf1593d3121fcac444dc"},{"t":1572235200,"x":"28/10/2019","y":6.6498551182,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1572580800,"x":"01/11/2019","y":6.8810257801,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1572930000,"x":"05/11/2019","y":5.4327273052,"address":"0x14094949152eddbfcd073717200da82fed8dc960"},{"t":1573275600,"x":"09/11/2019","y":5.1890604418,"address":"0x14094949152eddbfcd073717200da82fed8dc960"}],"data":[{"t":1565841600,"x":"15/08/2019","y":"0.0000"},{"t":1565841600,"x":"15/08/2019","y":"0.0000"},{"t":1566187200,"x":"19/08/2019","y":"0.1314"},{"t":1566532800,"x":"23/08/2019","y":"0.2619"},{"t":1566964800,"x":"28/08/2019","y":"0.4112"},{"t":1567310400,"x":"01/09/2019","y":"0.5306"},{"t":1567656000,"x":"05/09/2019","y":"0.6519"},{"t":1568088000,"x":"10/09/2019","y":"0.7483"},{"t":1568433600,"x":"14/09/2019","y":"0.8480"},{"t":1568779200,"x":"18/09/2019","y":"0.9383"},{"t":1569211200,"x":"23/09/2019","y":"1.0528"},{"t":1569556800,"x":"27/09/2019","y":"1.1500"},{"t":1569902400,"x":"01/10/2019","y":"1.2258"},{"t":1570334400,"x":"06/10/2019","y":"1.3380"},{"t":1570680000,"x":"10/10/2019","y":"1.4228"},{"t":1571025600,"x":"14/10/2019","y":"1.5042"},{"t":1571457600,"x":"19/10/2019","y":"1.6038"},{"t":1571803200,"x":"23/10/2019","y":"1.6840"},{"t":1572235200,"x":"28/10/2019","y":"1.7782"},{"t":1572580800,"x":"01/11/2019","y":"1.8512"},{"t":1572930000,"x":"05/11/2019","y":"1.9275"},{"t":1573275600,"x":"09/11/2019","y":"1.9871"}]}];
    let minValue;
    let maxValue;
    let days = this.getGraphDays(graphData);

    [minValue,maxValue] = this.getGraphDataMinMax(graphData);
    this.setState({
      graphData,
      minValue,
      maxValue,
      days
    });
  }

  async getEquity(){

    this.setState({
      graphError:false,
      graphData:null
    })

    let graphData = await this.getAprs();

    let minValue = null;
    let maxValue = null;
    let minDataLength = null;

    // console.log('graphData',graphData);

    graphData.forEach((v,i) => {
      let balance = this.state.initialBalance;
      let lastAprInfo = null;
      v.aprs.forEach((aprInfo,j) => {
        let totalEarned = 0;
        if (j){
          // Calculate earnings between 2 segments
          const apr = lastAprInfo.y;
          const earningPerYear = balance*(apr/100);
          const earningPerSecond = earningPerYear/secondsInYear;

          // const aprTime = aprInfo.blockTime ? parseInt(aprInfo.blockTime) : parseInt(aprInfo.t);
          // const lastAprTime = lastAprInfo.blockTime ? parseInt(lastAprInfo.blockTime) : parseInt(lastAprInfo.t);
          // aprInfo.x = moment(aprTime*1000).format('DD/MM/YYYY');

          const aprTime = parseInt(aprInfo.t);
          const lastAprTime = parseInt(lastAprInfo.t);

          if (aprTime === lastAprTime){
            return;
          }

          const secondsPassed = aprTime-lastAprTime;

          totalEarned = secondsPassed*earningPerSecond;

          // console.log(v.id,moment(aprTime*1000).format('DD/MM/YYYY'),moment(lastAprTime*1000).format('DD/MM/YYYY'),apr,balance,earningPerYear,totalEarned);

          balance += totalEarned;
        }

        const graphPoint = {
          a:aprInfo,
          t:aprInfo.t,
          x:aprInfo.x,
          b:balance,
          g:(balance-this.state.initialBalance),
          y: null
        }

        switch (this.state.mode){
          case 'perc':
            graphPoint.y = ((balance/this.state.initialBalance-1)*100).toFixed(2);
          break;
          case 'apr':
            graphPoint.y = aprInfo.y;
          break;
          case 'equity':
          default:
            graphPoint.y = graphPoint.g.toFixed(4);
          break;
        }

        graphData[i].data.push(graphPoint);

        lastAprInfo = aprInfo;
      });

      minDataLength = minDataLength===null ? graphData[i].data.length : Math.min(minDataLength,graphData[i].data.length);

      // maxValue = maxValue ? Math.max(maxValue,balance) : balance;
    });

    
    // CSV estraction
    /*
    const super_log = [];
    const log_headers = ['Date'];
    for (var z=0;z<graphData.length;z++){
      log_headers.push(graphData[z].id+' Apr');
      log_headers.push(graphData[z].id+' Balance');
    }
    super_log.push(log_headers.join("\t"));

    // Loop through data
    for (var j=0;j<minDataLength;j++){

      // Push date first
      let log = [graphData[0].data[j].x];

      // Loop through protocols
      for (var i=0;i<graphData.length;i++){
        const protocolData = graphData[i].data[j];
        // if (protocolData.x === log[0]){
        const protocolApr = protocolData.a.y.toString().replace('.',',');
        const protocolBalance = protocolData.b.toString().replace('.',',');
        log.push(protocolApr,protocolBalance);
        // } else {
        //   log.push('','');
        // }
      }
      super_log.push(log.join("\t"));
    }

    console.log(super_log.join("\n"));
    console.log('graphData',graphData);
    */

    // const startTimestamp = parseInt(moment('01/09/2019','DD/MM/YYYY')._d.getTime()/1000);
    // graphData = this.filterGraphData(graphData,startTimestamp);
    [minValue,maxValue] = this.getGraphDataMinMax(graphData);
    let days = this.getGraphDays(graphData);

    graphData.sort(function(a,b){
      return a.pos - b.pos;
    });

    this.setState({
      graphData,
      minValue,
      maxValue,
      days
    });
  }

  async makeCachedRequest(endpoint,TTL){
    const timestamp = parseInt(new Date().getTime()/1000);

    let cachedRequests = {};
    
    // Check if already exists
    if (localStorage && localStorage.getItem('cachedRequests')){
      cachedRequests = JSON.parse(localStorage.getItem('cachedRequests'));
      // Check if it's not expired
      if (cachedRequests && cachedRequests[endpoint] && cachedRequests[endpoint].timestamp && timestamp-cachedRequests[endpoint].timestamp<TTL){
        return cachedRequests[endpoint].data;
      }
    }

    const data = await axios
                        .get(endpoint)
                        .catch(err => {
                          console.error('Error getting request');
                        });
    if (localStorage) {
      cachedRequests[endpoint] = {
        data,
        timestamp
      };
      this.functionsUtil.setLocalStorage('cachedRequests',JSON.stringify(cachedRequests));
    }
    return data;
  }

  getProtocolByAddress(graphData,address){
    let output = null;
    graphData.forEach((v,i) => {
      if (v.address === address){
        output = v;
        return false;
      }
    });
    return output;
  }

  getProtocolDataByAddress(graphData,address){
    let output = null;
    graphData.forEach((v,i) => {
      if (v.address === address){
        output = v.aprs;
        return false;
      }
    });
    return output;
  }

  async getAprs() {
    // const graphEndTimestamp = parseInt(moment('05-11-2019','DD-MM-YYYY')._d.getTime()/1000);
    // const graphStartTimestamp = parseInt(moment('15-09-2019','DD-MM-YYYY')._d.getTime()/1000);
    const graphStartTimestamp = 1565866741; // First Idle block mined
    const graphEndTimestamp = parseInt(moment()._d.getTime()/1000);
    const graphData = [
      {
        "id": "Compound",
        'pos_box':2,
        'pos':2,
        'fee':0,
        'address' : cDAIAddress,
        'icon' : 'compound-mark-green.png',
        "color": "hsl(162, 100%, 41%)",
        "aprs": [],
        "data": [],
        "style" : {
          strokeDasharray: '3, 3',
          strokeWidth: '2px',
        },
        'endpoint':'https://defiportfolio-backend.herokuapp.com/api/v1/markets/compound_v2/'
      },
      {
        "id": "Fulcrum",
        'pos_box':1,
        'pos':1,
        'fee':0,
        'address' : iDAIAddress,
        'icon' : 'fulcrum-mark.svg',
        "color": "hsl(197, 98%, 38%)",
        "aprs": [],
        "data": [],
        "style" : {
          strokeDasharray: '3, 3',
          strokeWidth: '2px',
        },
        'endpoint':'https://defiportfolio-backend.herokuapp.com/api/v1/markets/fulcrum/'
      }/*,
      {
        "id": "DyDx",
        'pos_box':4,
        'pos':4,
        'address' : '0x000000000000000000000',
        'icon' : 'dydx-mark.png',
        "color": "hsl(210, 13%, 18%)",
        "aprs": [],
        "data": [],
        'endpoint':'https://defiportfolio-backend.herokuapp.com/api/v1/markets/dydx/'
      }*/
    ];

    let maxLen = 0;

    const loadGraphData = async () => {
      let graphError = false;
      await this.asyncForEach(graphData, async (info,key) => {
        if (info.endpoint){
          let t;
          const monthTime = parseInt(60*60*24*31);
          for (t=graphStartTimestamp;t<graphEndTimestamp;t+=monthTime){
            const endpoint = info.endpoint+this.props.tokenConfig.defiPrime.token.toLowerCase()+'?start_date='+parseInt(t)+'&end_date='+(parseInt(t)+parseInt(monthTime));

            let remote_data = await this.makeCachedRequest(endpoint,43200);

            if (!remote_data || !remote_data.data) {
              graphError = true;
              return true;
            }

            remote_data = remote_data.data;

            maxLen = Math.max(maxLen,remote_data.chart.length);
            remote_data.chart.forEach((v,i) => {
              const date = moment(v.timestamp*1000).format('DD/MM/YYYY');
              const timestamp = getDayTimestamp(v.timestamp*1000);

              // if (timestamp>graphEndTimestamp){
              //   return;
              // }

              let rate = v.supply_rate;

              if (graphData[key].fee){
                rate -= rate*graphData[key].fee;
              }

              graphData[key].aprs.push({t:timestamp,x:date,y:rate});
            });
          }
        }

        // Sort the array by Date
        graphData[key].aprs.sort(function(a,b){
          return moment(a.x,'DD/MM/YYYY')._d - moment(b.x,'DD/MM/YYYY')._d;
        });

      });

      this.setState({
        graphError
      });
    }

    const getDayTimestamp = (timestamp) => {
      return parseInt(moment(moment(timestamp).format('DD/MM/YYYY'),'DD/MM/YYYY')._d.getTime()/1000);
    }

    const getClosestProtocolAprByTimestamp = (address,timestamp,maxTimestamp) => {
      let output = null;
      const protocolData = this.getProtocolDataByAddress(graphData,address);
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

    const getHighestAprByTimestamp = (timestamp,maxTimestamp) => {
      let maxApr = null;
      graphData.forEach((v,i) => {
        if (v.address){
          const apr = getClosestProtocolAprByTimestamp(v.address,timestamp,maxTimestamp);
          if (apr){
            // console.log('Find Apr ',v.address,moment(timestamp*1000).format('DD/MM/YYYY'),moment(maxTimestamp*1000).format('DD/MM/YYYY'),apr.y);
            if (!maxApr || apr.y>maxApr.y){
              maxApr = apr;
            }
          }
        }
      });
      return maxApr;
    };

    await loadGraphData();

    const internalTxs = await this.getContractTransactions();

    if (!internalTxs){
      return false;
    }

    const idleCharts = [
      {
        "id": "Idle v1",
        'pos_box':3,
        'pos':3,
        'chartMode':'real',
        'icon' : 'idle-mark-old.png',
        "color": "hsl(227, 100%, 50%)",
        "aprs": [],
        "data": [],
        "style" : {
          strokeWidth: '2px',
        },
      },
      {
        "id": "Idle v2",
        'pos_box':4,
        'pos':4,
        'chartMode':'best',
        'icon' : 'idle-mark.png',
        "color": "hsl(227, 100%, 50%)",
        "aprs": [],
        "data": [],
        "style" : {
          strokeWidth: '2px',
        },
      }
    ];

    idleCharts.forEach((idleChart,chartVersion) => {

      const chartMode = idleChart.chartMode;

      // Get Aprs
      const idleData = [];

      // Load missing days
      const firstTxTimestamp = internalTxs[0].timeStamp;
      // const missingDays = parseInt((firstTxTimestamp-graphStartTimestamp)/60*60*24);

      let timestamp = graphStartTimestamp-60*60*24;
      for (timestamp;timestamp<firstTxTimestamp;timestamp+=60*60*24){
        // console.log('Find missing days',moment(timestamp*1000).format('DD/MM/YYYY'));
        const apr = getHighestAprByTimestamp(timestamp,timestamp+=60*60*24);
        if (apr){
          // console.log('Highest Apr',moment(timestamp*1000).format('DD/MM/YYYY'),apr.y);
          idleData.push(apr);
          timestamp = apr.t;
        }
      }

      // Group transaction by BlockTime
      const secondsPerDay = 60*60*24;
      const rebalancesTxs = [];
      let rebalancesGasUsed = this.functionsUtil.BNify(0);
      const idleBlocks = {};

      internalTxs.forEach((v,i) => {
        if (v.to === cDAIAddress || v.to === iDAIAddress){
          const txTimestamp = parseInt(v.timeStamp)*1000;
          const m = moment(txTimestamp);
          const blockDate = m.format('DD/MM/YYYY');
          const blockTime = getDayTimestamp(txTimestamp);

          let apr = null;
          switch (chartMode){
            case 'best':
              apr = getHighestAprByTimestamp(blockTime,parseInt(blockTime)+secondsPerDay);
            break;
            case 'real':
              apr = getClosestProtocolAprByTimestamp(v.to,blockTime,parseInt(blockTime)+secondsPerDay);
            break;
            default:
            break;
          }

          if (!idleBlocks[blockTime] || (apr && idleBlocks[blockTime].to !== v.to && parseFloat(apr.y)>idleBlocks[blockTime].apr)){
            idleBlocks[blockTime] = {
              to:v.to,
              timeStamp:blockTime,
              date:blockDate,
              apr:(apr ? parseFloat(apr.y) : null)
            };
          }

          if (!rebalancesTxs.length || (rebalancesTxs.length>0 && rebalancesTxs[rebalancesTxs.length-1].to !== v.to)){
            rebalancesTxs.push(v);
            const txCost = this.functionsUtil.BNify(v.gasPrice).times(this.functionsUtil.BNify(v.gasUsed));
            rebalancesGasUsed = rebalancesGasUsed.plus(txCost);
          }
        }
      });

      this.setState({
        rebalancesTxs,
        rebalancesGasUsed
      });

      const idleBlocksOrdered = {};
      Object.keys(idleBlocks).sort().forEach(function(key) {
        if (idleBlocks[key]){
          idleBlocksOrdered[key] = idleBlocks[key];
        }
      });

      // Get Aprs based by rebalancing 
      const blockTimes = Object.keys(idleBlocksOrdered);
      let nextTimestamp = null;

      blockTimes.forEach((blockTime,i) => {
      // let blockTime = null;
      // for (blockTime=blockTimes[0];blockTime<=blockTimes[blockTimes.length];blockTime+=secondsPerDay){
        if (blockTime<=nextTimestamp){
          // console.log(moment(blockTime*1000).format('DD/MM/YYYY'),'SKIP TO ',moment(nextTimestamp*1000).format('DD/MM/YYYY'));
          return;
        }

        const tx = idleBlocksOrdered[blockTime];

        // Set the max timestamp to look for
        const nextBlockTime = blockTimes[i+1];
        const nextTx = nextBlockTime ? idleBlocksOrdered[nextBlockTime] : null;
        const maxTimestamp = nextTx ? nextTx.timeStamp : null;
        let apr = null;
        switch (chartMode){
          case 'best':
            apr = getHighestAprByTimestamp(blockTime,maxTimestamp); // Use this to obtain always the best APR
          break;
          case 'real':
            apr = getClosestProtocolAprByTimestamp(tx.to,blockTime,maxTimestamp); // Use this to obtain the real APR
          break;
          default:
          break;
        }

        if (apr){
          nextTimestamp = apr.t;
          // Set the real rebalance timestamp
          apr.blockTime = blockTime;
          idleData.push(apr);

          const prevIdleApr = idleData.length>1 ? idleData[idleData.length-2] : null;

          // const protocolID = this.getProtocolByAddress(graphData,apr.address).id;
          // console.log(moment(blockTime*1000).format('DD/MM/YYYY'),moment(apr.t*1000).format('DD/MM/YYYY'),protocolID,apr.y,moment(max_apr.t*1000).format('DD/MM/YYYY'),max_apr.y);
          // console.log(moment(blockTime*1000).format('DD/MM/YYYY'),apr,moment(nextTimestamp*1000).format('DD/MM/YYYY'));

          // Check if skipped some days between last and current apr
          if (prevIdleApr){
            const lastTimestamp = prevIdleApr.t;
            const timestampDiff = apr.t-prevIdleApr.t;
            const daysBetweenTimestamps = parseInt(timestampDiff/secondsPerDay)-1;

            // console.log('Check skipped days:',moment(apr.t*1000).format('DD/MM/YYYY'),moment(prevIdleApr.t*1000).format('DD/MM/YYYY'),daysBetweenTimestamps);

            if (daysBetweenTimestamps){
              let timestamp = lastTimestamp+secondsPerDay;
              for (timestamp;timestamp<blockTime;timestamp+=secondsPerDay){
                const maxTimestamp = timestamp+secondsPerDay;
                let apr = null;
                switch (chartMode){
                  case 'best':
                    apr = getHighestAprByTimestamp(timestamp,maxTimestamp); // Use this to obtain always the best APR
                  break;
                  case 'real':
                    apr = getClosestProtocolAprByTimestamp(prevIdleApr.address,timestamp,maxTimestamp); // Use this to obtain the real APR
                  break;
                  default:
                  break;
                }

                // console.log('Checking skipped day ',moment(timestamp*1000).format('DD/MM/YYYY'),moment(maxTimestamp*1000).format('DD/MM/YYYY'),apr);

                if (apr){
                  // console.log('Filling skipped day',moment(timestamp*1000).format('DD/MM/YYYY'),' => ',moment(apr.t*1000).format('DD/MM/YYYY'),this.getProtocolByAddress(graphData,prevIdleApr.address).id,apr.y);
                  apr.blockTime = timestamp;
                  idleData.push(apr);
                  timestamp = apr.t;
                } else {
                  // console.log('Skipped day not found',moment(timestamp*1000).format('DD/MM/YYYY'));
                }
              }
            }
          }

          idleData.sort(function(a,b){
            return moment(a.x,'DD/MM/YYYY')._d - moment(b.x,'DD/MM/YYYY')._d;
          });
        }
      });


      // Take missing days
      const latestIdleApr = idleData[idleData.length-1];
      // Take the last available time
      // window.graphData = graphData;

      const lastTimestampAvailable = Math.max(...graphData.map((v,i) => { return v.aprs.pop().t; }));
      // Math.max(parseInt(graphData[0].aprs[graphData[0].aprs.length-1].t),parseInt(graphData[1].aprs[graphData[1].aprs.length-1].t));

      // console.log('Taking missing days:',moment(latestIdleApr.t*1000).format('DD/MM/YYYY'),moment(lastTimestampAvailable*1000).format('DD/MM/YYYY'));

      if (latestIdleApr.t<lastTimestampAvailable){
        const lastTimestamp = parseInt(latestIdleApr.t);
        let timestamp = parseInt(lastTimestamp)+secondsPerDay;

        for (timestamp;timestamp<=lastTimestampAvailable;timestamp+=secondsPerDay){
          const maxTimestamp = timestamp+secondsPerDay;
          let apr = null;
          switch (chartMode){
            case 'best':
              apr = getHighestAprByTimestamp(timestamp,maxTimestamp); // Use this to obtain always the best APR
            break;
            case 'real':
              apr = getClosestProtocolAprByTimestamp(latestIdleApr.address,timestamp,maxTimestamp); // Use this to obtain the real APR
            break;
            default:
            break;
          }
          // console.log('Taking missing day',latestIdleApr.address,moment(timestamp*1000).format('DD/MM/YYYY'),moment(maxTimestamp*1000).format('DD/MM/YYYY'),apr);
          if (apr){
            apr.blockTime = timestamp;
            idleData.push(apr);
            timestamp = apr.t;
          }
        }
      }

      idleChart.aprs = idleData;
      graphData.push(idleChart);
    });

    return graphData;
  }

  renderTxs(graphData) {
    const rebalanceTxs = this.state.rebalancesTxs || {};

    if (!Object.keys(rebalanceTxs).length) {
      return null;
    }

    // console.log('renderTxs',rebalanceTxs);

    const txs = Object.keys(rebalanceTxs).reverse().map((key, i) => {
      const tx = rebalanceTxs[key];
      const procotolInfo = this.getProtocolByAddress(graphData,tx.to.toLowerCase());
      const date = new Date(tx.timeStamp*1000);
      const value = parseFloat(tx.value) ? (this.props.isMobile ? parseFloat(tx.value).toFixed(4) : parseFloat(tx.value).toFixed(8)) : '-';
      const formattedDate = moment(date).fromNow();
      return (
        <Link key={'tx_'+i} display={'block'} href={`https://etherscan.io/tx/${tx.hash}`} target={'_blank'} rel="nofollow noopener noreferrer">
          <Flex alignItems={'center'} flexDirection={['row','row']} width={'100%'} p={[2,3]} borderBottom={'1px solid #D6D6D6'}>
            <Box width={[4/10,3/10]} textAlign={'center'}>
              <Text textAlign={'center'} fontSize={[2,2]} fontWeight={2}>{formattedDate}</Text>
            </Box>
            <Box width={[2/10,2/10]} display={['none','block']} textAlign={'center'}>
              <Pill color={procotolInfo.color}>
                {procotolInfo.id}
              </Pill>
            </Box>
            <Box width={[4/10]}>
              <Text textAlign={'center'} fontSize={[2,2]} fontWeight={2}>{value} {tx.tokenSymbol}</Text>
            </Box>
          </Flex>
        </Link>
      )});

    return (
      <Flex flexDirection={'column'} width={[1,'90%']} m={'0 auto'}>
        <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'dark-gray'}>
          Last transactions
        </Heading.h3>
        {txs}
      </Flex>
    );
  }

  render() {

    const DashedLine = ({xScale, yScale, series}) => {

        const lineGenerator = line()
            .x(({ data }) => xScale(data.x))
            .y(({ data }) => yScale(data.y));

        return series.map(({ id, data, color, style }) => (
            <path
                key={`${id}_${color}`}
                d={lineGenerator(data)}
                fill="none"
                stroke={color}
                style={style}
            />
          )
        )
    }

    const MyResponsiveLine = (data,interestBoxes,txs) => (
      <Flex width={'100%'} flexDirection={'column'}>
        <Heading.h4 fontSize={[2,2]} py={[2,3]} px={[3,0]} textAlign={'center'} fontWeight={2} lineHeight={1.5} color={'dark-gray'}>
          Interest earned with Idle on a <strong>{this.state.initialBalance} {this.props.selectedToken}</strong> lend for <strong>{this.state.days} days</strong>.
        </Heading.h4>
        <Flex width={'100%'} flexDirection={['column','row']} mt={[2,3]}>
          { interestBoxes }
        </Flex>
        {
          !this.props.isMobile && (
            <Line
              data={data}
              width={this.state.chartWidth}
              height={500}
              margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
              xScale={{
                type: 'time',
                format: '%d/%m/%Y',
                precision: 'day'
              }}
              curve="catmullRom"
              xFormat="time:%d/%m/%Y"
              // yScale={{
              //   type: 'log',
              //   base: 10,
              //   max: 'auto',
              // }}
              yScale={{
                type: 'linear',
                stacked: false,
                // min: this.state.minValue,
                // max: this.state.maxValue,
              }}
              axisLeft={{
                legend: ( this.state.mode === 'perc' ? '%' : this.props.selectedToken)+' earned',
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
                parseFloat(value).toFixed(2)+' '+( this.state.mode === 'perc' ? '%' : this.props.selectedToken)
              }
              enableGridX={true}
              enableGridY={false}
              colors={d => d.color}
              pointSize={0}
              pointColor={{ from: 'color', modifiers: [] }}
              pointBorderWidth={1}
              pointLabel="y"
              pointLabelYOffset={-12}
              enableSlices="x"
              useMesh={true}
              animate={false}
              layers={['grid', 'markers', 'axes', 'areas', 'crosshair', DashedLine, 'points', 'slices', 'mesh', 'legends']}
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
        }
      </Flex>
    )
    // {
    //   txs && (
    //     <Flex width={'100%'} flexDirection={['column','row']} mt={[2,3]}>
    //       { txs }
    //     </Flex>
    //   )
    // }
    if (this.state.graphError){
      return (
        <Flex
          flexDirection={'column'}
          justifyContent={'center'}
          alignItems={'center'}
          textAlign={'center'}
          width={1}>
            <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontWeight={2} fontSize={[2,3]} color={'dark-gray'}>
              Error while retrieving graph data...
            </Heading.h3>
            <Button
              className={SmartContractControls_styles.gradientButton}
              onClick={e => this.reloadData(e) }
              size={'medium'}
              borderRadius={4}
              mainColor={'blue'}
              contrastColor={'white'}
              fontWeight={3}
              fontSize={[2,2]}
              mx={'auto'}
              px={[4,5]}
              mt={[3,4]}
            >
              TRY AGAIN
            </Button>
        </Flex>
      );
    } else {
      if (this.state.graphData){

        const graphData = Object.assign([],this.state.graphData);

        /*
        // Add rebalances
        const rebalancesChart = {
          id: "rebalances",
          color: "hsl(0, 100%, 50%)",
          pos_box:0,
          pos:0,
          data: [],
          style : {
            strokeWidth: '2px',
          },
        };

        this.state.rebalancesTxs.forEach((r,i) => {
          rebalancesChart.data.push({
            x:moment(r.timeStamp*1000).format('DD/MM/YYYY'),
            y:this.state.minValue
          });
          rebalancesChart.data.push({
            x:moment(r.timeStamp*1000).format('DD/MM/YYYY'),
            y:30
          });
        });

        graphData.push(rebalancesChart);
        */

        graphData.sort(function(a,b){
          return a.pos_box - b.pos_box;
        });

        const interestBoxes = graphData.map(v=>{
          if (!v.pos){
            return false;
          }
          const isIdle = v.id==='Idle v2';
          const interestEarned = parseFloat(v.data[v.data.length-1].g);
          const secondsPassed = parseInt(v.data[v.data.length-1].t)-parseInt(v.data[0].t);
          const interestEarnedPerSecond = interestEarned/secondsPassed;
          const finalBalanceAfterYear = this.state.initialBalance+(interestEarnedPerSecond*secondsInYear);
          const annualReturn = parseFloat((finalBalanceAfterYear/this.state.initialBalance-1)*100).toFixed(2);
          
          // const finalBalance = this.state.initialBalance+interestEarned;
          // const percentageEarned = (finalBalance/this.state.initialBalance-1);
          // const percentageEarnedPerSecond = percentageEarned/secondsPassed;
          // console.log(v.id,moment(v.data[0].t*1000).format('DD/MM/YYYY'),moment(v.data[v.data.length-1].t*1000).format('DD/MM/YYYY'),interestEarned,finalBalance,percentageEarned,secondsPassed,interestEarnedPerSecond,finalBalanceAfterYear,annualReturn);

          return (
            <Flex key={'graph_'+v.id} width={[1,1/3]} mx={[0,2]} flexDirection={'column'}>
              <Box>
                <Card my={[2,2]} py={3} pl={0} pr={'10px'} borderRadius={'10px'} boxShadow={ isIdle ? '0px 0px 16px 2px rgba(0,54,255,0.3)' : 0 }>
                  <Flex flexDirection={'row'} alignItems={'center'}>
                    <Flex width={[1/4,1/3]} justifyContent={'center'}>
                      <Image src={`images/${v.icon}`} height={['1.7em', '2em']} verticalAlign={'middle'} />
                    </Flex>
                    <Flex alignItems={'center'} borderLeft={'1px solid #eee'} justifyContent={'center'} flexDirection={'column'} width={[3/4,2/3]}>
                      <Text.span color={'copyColor'} fontWeight={2} fontSize={'70%'}>AVG APR</Text.span>
                      <Text lineHeight={1} pl={'10px'} mt={1} color={'copyColor'} fontSize={[4,'26px']} fontWeight={3} textAlign={'center'}>
                        {annualReturn}<Text.span color={'copyColor'} fontWeight={3} fontSize={['90%','70%']}>%</Text.span>
                      </Text>
                    </Flex>
                    {
                      /*
                      <Box width={6/12} borderRight={'1px solid #eee'}>
                        <Text color={isIdle ? 'white' : 'copyColor'} fontSize={[3,'28px']} fontWeight={4} textAlign={'center'}>
                          {interestEarned.toFixed(2)} <Text.span color={isIdle ? 'white' : 'copyColor'} fontWeight={2} fontSize={['90%','60%']}>{this.props.selectedToken}</Text.span>
                        </Text>
                      </Box>
                    <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={3/4}>
                      <Text.span color={isIdle ? 'white' : 'copyColor'} fontWeight={[1,2]} fontSize={['90%','70%']}>AVG APR</Text.span>
                      <Text lineHeight={1} pl={'10px'} color={isIdle ? 'white' : 'copyColor'} fontSize={[2,3]} fontWeight={3} textAlign={'center'}>
                        {annualReturn}<Text.span color={isIdle ? 'white' : 'copyColor'} fontWeight={3} fontSize={['90%','70%']}>%</Text.span>
                      </Text>
                    </Flex>
                      */
                    }
                  </Flex>
                </Card>
              </Box>
            </Flex>
          )
        });

        graphData.sort(function(a,b){
          return a.pos - b.pos;
        });
        // debugger;

        return MyResponsiveLine(graphData,interestBoxes/*,this.renderTxs(graphData)*/);
      } else {
        return (
          <Flex
            justifyContent={'center'}
            alignItems={'center'}
            textAlign={'center'}
            width={1}
            minHeight={'500px'}
          >
            <Loader size="40px" /> <Text ml={2}>Loading graph data...</Text>
          </Flex>
        );
      }
    }
  }
}

export default DefiPrimeEquityChart;