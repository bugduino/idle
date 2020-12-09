import moment from 'moment';
import Title from '../Title/Title';
import StatsChart from './StatsChart';
import React, { Component } from 'react';
import Rebalance from '../Rebalance/Rebalance';
import StatsCard from '../StatsCard/StatsCard';
import AssetsList from '../AssetsList/AssetsList';
import FlexLoader from '../FlexLoader/FlexLoader';
import Breadcrumb from '../Breadcrumb/Breadcrumb';
import globalConfigs from '../configs/globalConfigs';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';
import AssetSelector from '../AssetSelector/AssetSelector';
import GenericSelector from '../GenericSelector/GenericSelector';
import RoundIconButton from '../RoundIconButton/RoundIconButton';
import VariationNumber from '../VariationNumber/VariationNumber';
import AllocationChart from '../AllocationChart/AllocationChart';
import DateRangeModal from '../utilities/components/DateRangeModal';
import { Flex, Text, Heading, Box, Icon, Button, Link } from 'rimble-ui';
import ExecuteTransaction from '../ExecuteTransaction/ExecuteTransaction';
import AssetsUnderManagement from '../AssetsUnderManagement/AssetsUnderManagement';

class Stats extends Component {
  state = {
    aum:null,
    apr:null,
    days:'-',
    delta:null,
    earning:null,
    minDate:null,
    maxDate:null,
    carouselMax:1,
    rebalances:'-',
    buttonGroups:[],
    apiResults:null,
    carouselIndex:0,
    idleVersion:null,
    statsVersions:{},
    minStartTime:null,
    endTimestamp:null,
    showAdvanced:true,
    govTokensPool:null,
    unlentBalance:null,
    quickSelection:null,
    startTimestamp:null,
    endTimestampObj:null,
    shouldRebalance:null,
    carouselOffsetLeft:0,
    startTimestampObj:null,
    showRefreshIdleSpeed:false,
    apiResults_unfiltered:null,
    dateRangeModalOpened:false
  };

  quickSelections = {
    day:'Last day',
    week:'Last week',
    weeks:'Last 2 weeks',
    month:'Last month'
  };

  // Utils
  functionsUtil = null;
  componentUnmounted = null;
  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  async componentWillMount() {
    this.loadUtils();
    await this.loadParams();
  }

  componentWillUnmount(){
    this.componentUnmounted = true;
  }

  async setStateSafe(newState,callback=null) {
    if (!this.componentUnmounted){
      return this.setState(newState,callback);
    }
    return null;
  }

  showRefreshIdleSpeed(){
    this.setState({
      showRefreshIdleSpeed:true
    });
  }

  getLatestAvailableVersion(){
    const statsVersions = globalConfigs.stats.versions;
    let latestVersion = null;
    Object.keys(statsVersions).forEach( version => {
      const versionInfo = statsVersions[version];
      if (versionInfo.enabledStrategies.includes(this.props.selectedStrategy)){
        latestVersion = version;
      }
    });

    return latestVersion;
  }

  getVersionInfo(version){
    if (!version){
      version = this.state.idleVersion;
    }

    if (!globalConfigs.stats.versions[version]){
      return null;
    }

    const versionInfo = Object.assign({},globalConfigs.stats.versions[version]);

    if (versionInfo.strategiesParams && versionInfo.strategiesParams[this.props.selectedStrategy]){
      const versionInfoExtra = versionInfo.strategiesParams[this.props.selectedStrategy];
      Object.keys(versionInfoExtra).forEach( param => {
        versionInfo[param] = versionInfoExtra[param];
      });
    }

    return versionInfo;
  }

  async loadParams() {

    if (!this.props.selectedToken || !this.props.tokenConfig){
      return false;
    }

    const newState = {};
    const { match: { params } } = this.props;

    const currentNetworkAvailableTokens = Object.keys(this.props.availableTokens);

    if (!!params.customToken && currentNetworkAvailableTokens.indexOf(params.customToken.toUpperCase()) !== -1 ){
      newState.selectedToken = params.customToken.toUpperCase();
    } else {
      newState.selectedToken = this.props.selectedToken.toUpperCase();
    }

    newState.tokenConfig = this.props.availableTokens[newState.selectedToken];
    newState.minStartTime = moment(globalConfigs.stats.tokens[this.props.selectedToken].startTimestamp,'YYYY-MM-DD');
    newState.maxEndDate = moment();

    newState.endTimestampObj = moment(moment().format('YYYY-MM-DD 23:59'),'YYYY-MM-DD HH:mm');

    newState.latestVersion = this.getLatestAvailableVersion();
    newState.idleVersion = this.state.idleVersion === null ? newState.latestVersion : this.state.idleVersion;

    const versionInfo = this.getVersionInfo(newState.idleVersion);

    // console.log('loadParams',newState.latestVersion,newState.idleVersion,versionInfo);

    if (newState.idleVersion && versionInfo.endTimestamp){
      const newEndTimestampObj = moment(moment(versionInfo.endTimestamp*1000).format('YYYY-MM-DD HH:mm'),'YYYY-MM-DD HH:mm');
      if (newState.endTimestampObj.isAfter(newEndTimestampObj)){
        newState.endTimestampObj = newEndTimestampObj;
        newState.endTimestamp = parseInt(newState.endTimestampObj._d.getTime()/1000);
      }

      if (!newState.maxEndDate || newState.maxEndDate.isAfter(newEndTimestampObj)){
        newState.maxEndDate = newEndTimestampObj;
      }
    }

    newState.endTimestamp = parseInt(newState.endTimestampObj._d.getTime()/1000);

    // Set start date
    newState.startTimestampObj = newState.endTimestampObj.clone().subtract(1,'month');
    newState.startTimestamp = parseInt(newState.startTimestampObj._d.getTime()/1000);

    if (newState.idleVersion && versionInfo.startTimestamp){
      const newStartTimestampObj = moment(moment(versionInfo.startTimestamp*1000).format('YYYY-MM-DD HH:mm'),'YYYY-MM-DD HH:mm');
      if (newState.startTimestampObj.isBefore(newStartTimestampObj)){
        newState.startTimestampObj = newStartTimestampObj;
        newState.startTimestamp = parseInt(newState.startTimestampObj._d.getTime()/1000);
      }

      if (newState.minStartTime.isBefore(newStartTimestampObj)){
        newState.minStartTime = newStartTimestampObj;
      }
    }

    newState.minDate = newState.minStartTime._d;
    newState.maxDate = newState.maxEndDate._d;

    if (newState !== this.state){
      await this.setStateSafe(newState);
    }
  }

  setDateRange = (ranges,quickSelection=null) => {

    const minStartTime = moment(globalConfigs.stats.tokens[this.props.selectedToken].startTimestamp);

    let startTimestampObj = moment(ranges.startDate).isSameOrAfter(minStartTime) ? moment(ranges.startDate) : minStartTime;
    let endTimestampObj = moment(ranges.endDate);

    if (startTimestampObj.isSame(endTimestampObj)){
      endTimestampObj.add(1,'day');
    }

    endTimestampObj = moment(endTimestampObj.format('YYYY-MM-DD 23:59'),'YYYY-MM-DD HH:mm');

    if (startTimestampObj.isBefore(this.state.minStartTime)){
      startTimestampObj = this.state.minStartTime;
    }

    if (endTimestampObj.isAfter(this.state.maxEndDate)){
      endTimestampObj = this.state.maxEndDate;
    }

    const startTimestamp = parseInt(startTimestampObj._d.getTime()/1000);
    const endTimestamp = parseInt(endTimestampObj._d.getTime()/1000);

    const newState = {
      minStartTime,
      endTimestamp,
      quickSelection,
      startTimestamp,
      endTimestampObj,
      startTimestampObj
    };

    this.setStateSafe(newState);

    return newState;
  }

  toggleAdvancedCharts = (e) => {
    e.preventDefault();
    this.setStateSafe({
      showAdvanced:!this.state.showAdvanced
    });
  }

  setDateRangeModal = (dateRangeModalOpened) => {
    if (dateRangeModalOpened !== this.state.dateRangeModalOpened){
      this.setStateSafe({
        dateRangeModalOpened
      });
    }
  }

  async componentDidMount() {

    if (!this.props.web3){
      this.props.initWeb3();
      return false;
    }

    const style = document.createElement('style');
    style.id = 'crisp-custom-style';
    style.type = 'text/css';
    style.innerHTML = `
    .crisp-client{
      display:none !important;
    }`;
    document.body.appendChild(style);

    this.loadUtils();
    await this.loadParams();
    this.loadApiData();
    this.loadCarousel();
  }

  loadCarousel(){
    const carouselMax = this.props.isMobile ? 3 : 2;
    this.setStateSafe({
      carouselMax
    });
  }

  async componentDidUpdate(prevProps,prevState) {
    const contractsInitialized = prevProps.contractsInitialized !== this.props.contractsInitialized;
    const strategyChanged = prevProps.selectedStrategy !== this.props.selectedStrategy;
    const tokenChanged = prevProps.selectedToken !== this.props.selectedToken || JSON.stringify(prevProps.tokenConfig) !== JSON.stringify(this.props.tokenConfig);
    const dateChanged = prevState.startTimestamp !== this.state.startTimestamp || prevState.endTimestamp !== this.state.endTimestamp;
    const versionChanged = prevState.idleVersion !== this.state.idleVersion;
    const mobileChanged = prevProps.isMobile !== this.props.isMobile;

    if (mobileChanged){
      this.loadCarousel();
    }

    if (contractsInitialized || tokenChanged || strategyChanged || versionChanged){
      // console.log('componentDidUpdate',this.props.selectedStrategy,this.props.selectedToken);
      await this.componentDidMount();
    } else if (dateChanged){
      this.loadApiData();
    }
  }

  filterTokenData = (apiResults) => {
    return apiResults.filter((r,i) => {
      return (!this.state.startTimestamp || r.timestamp >= this.state.startTimestamp) && (!this.state.endTimestamp || r.timestamp <= this.state.endTimestamp);
    });
  }

  setIdleVersion = idleVersion => {
    this.setStateSafe({
      idleVersion
    });
  }

  loadApiData = async () => {

    if (!this.props.selectedToken || !this.props.tokenConfig){
      return false;
    }

    // Get COMP APR
    // const compAPR = await this.functionsUtil.getCompAPR(this.props.tokenConfig);
    // console.log('compAPR',compAPR.toString());

    const startTimestamp = this.state.minDate ? parseInt(this.functionsUtil.strToMoment(this.functionsUtil.strToMoment(this.state.minDate).format('DD/MM/YYYY 00:00:00'),'DD/MM/YYYY HH:mm:ss')._d.getTime()/1000) : null;
    const endTimestamp = this.state.maxDate ? parseInt(this.functionsUtil.strToMoment(this.functionsUtil.strToMoment(this.state.maxDate).format('DD/MM/YYYY 23:59:59'),'DD/MM/YYYY HH:mm:ss')._d.getTime()/1000) : null;

    const isRisk = ['v3','v4'].includes(this.state.idleVersion) && this.props.selectedStrategy === 'risk';
    let apiResults_unfiltered = await this.functionsUtil.getTokenApiData(this.props.tokenConfig.address,isRisk,startTimestamp,endTimestamp,true,7200);

    const apiResults = this.filterTokenData(apiResults_unfiltered);

    // console.log('loadApiData',startTimestamp,endTimestamp,new Date(startTimestamp*1000),new Date(endTimestamp*1000),apiResults,apiResults_unfiltered);

    if (!apiResults || !apiResults_unfiltered || !apiResults.length || !apiResults_unfiltered.length){
      return false;
    }

    const firstResult = apiResults[0];
    const lastResult = Object.values(apiResults).pop();

    window.moment = moment;

    let days = (lastResult.timestamp-firstResult.timestamp)/86400;
    if (days === 0){
      days = 1;
    }

    let apr = null;
    let delta = 'N/A';

    const idleTokens = this.functionsUtil.fixTokenDecimals(lastResult.idleSupply,18);
    const firstIdlePrice = this.functionsUtil.fixTokenDecimals(firstResult.idlePrice,this.props.tokenConfig.decimals);
    const lastIdlePrice = this.functionsUtil.fixTokenDecimals(lastResult.idlePrice,this.props.tokenConfig.decimals);

    // Calculate AUM
    let aum = idleTokens.times(lastIdlePrice);
    // Convert Token balance
    aum = await this.functionsUtil.convertTokenBalance(aum,this.props.selectedToken,this.props.tokenConfig,isRisk);

    const compoundInfo = this.props.tokenConfig.protocols.filter((p) => { return p.name === 'compound' })[0];
    const firstCompoundData = compoundInfo ? firstResult.protocolsData.filter((p) => { return p.protocolAddr.toLowerCase() === compoundInfo.address.toLowerCase() })[0] : null;
    const lastCompoundData = compoundInfo ? lastResult.protocolsData.filter((p) => { return p.protocolAddr.toLowerCase() === compoundInfo.address.toLowerCase() })[0] : null;

    if (this.state.idleVersion === 'v4') {

      apr = apiResults.reduce( (sum,r) => {
        const idleRate = this.functionsUtil.fixTokenDecimals(r.idleRate,18);
        return this.functionsUtil.BNify(sum).plus(idleRate);
      },0);

      // Calculate average
      apr = apr.div(apiResults.length);

      if (compoundInfo){
        const compoundWithCOMPInfo = globalConfigs.stats.protocols.compoundWithCOMP;
        const rateField = compoundWithCOMPInfo.rateField ? compoundWithCOMPInfo.rateField : 'rate';

        let compoundAvgApr = apiResults.reduce( (sum,r) => {

          const compoundData = r.protocolsData.find((pData,x) => {
            return pData.protocolAddr.toLowerCase() === compoundInfo.address.toLowerCase()
          });

          let compoundRate = typeof rateField === 'object' && rateField.length ? rateField.reduce((acc,field) => {
            if (compoundData[field]){
              return this.functionsUtil.BNify(acc).plus(this.functionsUtil.BNify(compoundData[field]));
            }
            return this.functionsUtil.BNify(acc);
          },0) : this.functionsUtil.BNify(compoundData[rateField]);

          compoundRate = this.functionsUtil.fixTokenDecimals(compoundRate,18);

          return this.functionsUtil.BNify(sum).plus(compoundRate);
        },0);

        // Calculate average
        compoundAvgApr = compoundAvgApr.div(apiResults.length);

        // compoundAvgApr = this.functionsUtil.apr2apy(compoundAvgApr.div(100)).times(100);
        // apr = this.functionsUtil.apr2apy(apr.div(100)).times(100);

        delta = apr.minus(compoundAvgApr);
        if (parseFloat(delta)<0){
          delta = 0
        }
        delta = delta.toFixed(2);
      }

      apr = apr.toFixed(2);

    } else {
      const earning = lastIdlePrice.div(firstIdlePrice).minus(1).times(100);
      apr = earning.times(365).div(days).toFixed(2);
      if (firstCompoundData && lastCompoundData){
        const firstCompoundPrice = this.functionsUtil.fixTokenDecimals(firstCompoundData.price,this.props.tokenConfig.decimals);
        const lastCompoundPrice = this.functionsUtil.fixTokenDecimals(lastCompoundData.price,this.props.tokenConfig.decimals);
        const compoundApr = lastCompoundPrice.div(firstCompoundPrice).minus(1).times(100);
        delta = earning.minus(compoundApr).times(365).div(days);
        if (parseFloat(delta)<0){
          delta = 0
        }
        delta = delta.toFixed(2);
      }
    }

    // Count rebalances
    let rebalances = 0;
    apiResults.forEach((row,index) => {
      if (index){
        const prevRow = apiResults[index-1];

        const totalAllocation = row.protocolsData.reduce((accumulator,protocolAllocation) => {
          const allocation = this.functionsUtil.fixTokenDecimals(protocolAllocation.allocation,this.props.tokenConfig.decimals);
          return this.functionsUtil.BNify(accumulator).plus(allocation);
        },0);

        const prevTotalAllocation = prevRow.protocolsData.reduce((accumulator,protocolAllocation) => {
          const allocation = this.functionsUtil.fixTokenDecimals(protocolAllocation.allocation,this.props.tokenConfig.decimals);
          return this.functionsUtil.BNify(accumulator).plus(allocation);
        },0);

        let hasRebalanced = false;
        row.protocolsData.forEach( p => {
          if (hasRebalanced){
            return;
          }
          const prevP = prevRow.protocolsData.find( prevP => (prevP.protocolAddr.toLowerCase() === p.protocolAddr.toLowerCase()) );
          const allocation = this.functionsUtil.fixTokenDecimals(p.allocation,this.props.tokenConfig.decimals);
          const prevAllocation = this.functionsUtil.fixTokenDecimals(prevP.allocation,this.props.tokenConfig.decimals);
          const allocationPerc = parseInt(parseFloat(allocation.div(totalAllocation).times(100)));
          const prevAllocationPerc = parseInt(parseFloat(prevAllocation.div(prevTotalAllocation).times(100)));
          if (allocationPerc!==prevAllocationPerc){
            rebalances++;
            hasRebalanced = true;
          }
        });
      }
    });

    // Add gov tokens balance to AUM
    const govTokensPool = await this.functionsUtil.getGovTokenPool(null,null,'DAI');
    if (govTokensPool){
      aum = aum.plus(govTokensPool);
    }

    // Format AUM
    aum = this.functionsUtil.formatMoney(parseFloat(aum));

    let unlentBalance = await this.functionsUtil.getUnlentBalance(this.props.tokenConfig);
    if (unlentBalance){
      unlentBalance = this.functionsUtil.formatMoney(parseFloat(unlentBalance));
    }

    this.setStateSafe({
      aum,
      apr,
      days,
      delta,
      apiResults,
      rebalances,
      govTokensPool,
      unlentBalance,
      apiResults_unfiltered
    });
  }

  selectToken = async (strategy,token) => {
    await this.props.setStrategyToken(strategy,token);
    this.props.changeToken(token);
  }

  handleCarousel = action => {
    let carouselIndex = this.state.carouselIndex;
    if (action==='next' && carouselIndex<this.state.carouselMax){
      carouselIndex++;
    } else if (action==='back' && carouselIndex>0){
      carouselIndex--;
    }

    const $element = window.jQuery(`#carousel-cursor > div:eq(${carouselIndex})`);
    const carouselOffsetLeft = -parseFloat($element.position().left)+'px';

    this.setStateSafe({
      carouselIndex,
      carouselOffsetLeft
    });
  }

  render() {

    const idleTokenEnabled = this.functionsUtil.getGlobalConfig(['govTokens','IDLE','enabled']);
    const apyLong = this.functionsUtil.getGlobalConfig(['messages','apyLong']);

    if (!this.props.availableStrategies){
      return (
        <FlexLoader
          textProps={{
            textSize:4,
            fontWeight:2
          }}
          loaderProps={{
            mb:3,
            size:'40px'
          }}
          flexProps={{
            minHeight:'50vh',
            flexDirection:'column'
          }}
          text={'Loading assets...'}
        />
      );
    }

    if (!this.props.selectedToken){
      const strategies = this.functionsUtil.getGlobalConfig(['strategies']);
      const enabledTokens = [];
      const statsTokens = this.functionsUtil.getGlobalConfig(['stats','tokens']);
      const statsProtocols = this.functionsUtil.getGlobalConfig(['stats','protocols']);
      Object.keys(statsTokens).forEach(token => {
        const tokenInfo = statsTokens[token];
        if (tokenInfo.enabled){
          enabledTokens.push(token);
        }
      });
      return (
        <Flex
          mb={3}
          width={1}
          flexDirection={'column'}
        >
          <AssetsUnderManagement
            {...this.props}
          />
          {
            Object.keys(strategies).map(strategy => {
              const strategyInfo = strategies[strategy];
              const availableTokens = this.props.availableStrategies[strategy];
              if (!availableTokens){
                return false;
              }
              return (
                <Box
                  mb={2}
                  width={1}
                  flexDirection={'column'}
                  justifyContent={'center'}
                  key={`strategy-container-${strategy}`}
                >
                  <Title
                    mt={3}
                    mb={[3,4]}
                  >
                    <Flex
                      flexDirection={'row'}
                      alignItems={'baseline'}
                      justifyContent={'center'}
                    >
                      {strategyInfo.title}
                      {
                        strategyInfo.titlePostfix &&
                          <Text
                            ml={2}
                            fontWeight={3}
                            fontSize={[2,4]}
                            color={'dark-gray'}
                          >
                            {strategyInfo.titlePostfix}
                          </Text>
                      }
                    </Flex>
                  </Title>
                  <AssetsList
                    enabledTokens={enabledTokens}
                    handleClick={(props) => this.selectToken(strategy,props.token)}
                    cols={[
                      {
                        title:'CURRENCY',
                        props:{
                          width:[0.26,0.15]
                        },
                        fields:[
                          {
                            name:'icon',
                            props:{
                              mr:2,
                              height:['1.4em','2.3em']
                            }
                          },
                          {
                            name:'tokenName'
                          }
                        ]
                      },
                      {
                        title:'POOL',
                        props:{
                          width:[0.22,0.14],
                        },
                        fields:[
                          {
                            name:'allocationChart',
                            mobile:false,
                            parentProps:{
                              width:0.3
                            },
                            style:{
                              overflow:'visible'
                            },
                            showLoader:false,
                          },
                          {
                            name:'pool',
                            props:{
                              ml:1
                            },
                            parentProps:{
                              width:[1,0.7]
                            }
                          }
                        ]
                      },
                      {
                        title:'APY',
                        desc:apyLong,
                        props:{
                          width: [0.29,0.14],
                        },
                        parentProps:{
                          flexDirection:'column',
                          alignItems:'flex-start',
                        },
                        fields:[
                          {
                            name:'apy',
                            showTooltip:true
                          },
                          {
                            name:'idleDistribution',
                            showLoader:false,
                            props:{
                              decimals:this.props.isMobile ? 1 : 2,
                              fontSize:this.props.isMobile ? '9px' : 0
                            }
                          },
                        ]
                      },
                      {
                        title:'RISK SCORE',
                        desc:this.functionsUtil.getGlobalConfig(['messages','riskScore']),
                        mobile:false,
                        props:{
                          width:[0.27,0.16],
                        },
                        fields:[
                          {
                            name:'score'
                          }
                        ]
                      },
                      {
                        title:'APR LAST WEEK',
                        mobile:false,
                        props:{
                          width: 0.25,
                        },
                        parentProps:{
                          width:1,
                          pr:[2,4]
                        },
                        fields:[
                          {
                            name:'aprChart',
                          }
                        ]
                      },
                      {
                        title:'',
                        props:{
                          width:[0.23,0.16],
                        },
                        parentProps:{
                          width:1
                        },
                        fields:[
                          {
                            name:'button',
                            label:this.props.isMobile ? 'View' : 'View stats',
                            props:{
                              width:1,
                              fontSize:3,
                              fontWeight:3,
                              height:'45px',
                              borderRadius:4,
                              boxShadow:null,
                              mainColor:'redeem',
                              size: this.props.isMobile ? 'small' : 'medium',
                              handleClick:(props) => this.selectToken(strategy,props.token)
                            }
                          }
                        ]
                      }
                    ]}
                    {...this.props}
                    selectedStrategy={strategy}
                    availableTokens={availableTokens}
                  />
                  {
                    !this.props.isMobile &&
                      <Flex
                        mt={2}
                        alignItems={'center'}
                        flexDirection={'row'}
                        justifyContent={'flex-end'}
                      >
                        {
                          Object.values(statsProtocols).filter( p => (p.legend) ).map( (p,index) => (
                            <Flex
                              mr={3}
                              alignItems={'center'}
                              flexDirection={'row'}
                              key={`legend_${index}`}
                            >
                              <Box
                                mr={1}
                                width={'10px'}
                                height={'10px'}
                                borderRadius={'50%'}
                                backgroundColor={`rgb(${p.color.rgb.join(',')})`}
                              >
                              </Box>
                              <Text.span
                                fontSize={1}
                                color={'cellText'}
                              >
                                {p.label}
                              </Text.span>
                            </Flex>
                          ))
                        }
                      </Flex>
                  }
                </Box>
              );
            })
          }
          {
            idleTokenEnabled && !this.state.showRefreshIdleSpeed ? (
              <Flex
                width={1}
                my={[2,3]}
                alignItems={'center'}
                flexDirection={'row'}
                justifyContent={'center'}
              >
                <Link
                  hoverColor={'primary'}
                  onClick={this.showRefreshIdleSpeed.bind(this)}
                >
                  Refresh Idle Speed
                </Link>
              </Flex>
            ) : idleTokenEnabled && this.state.showRefreshIdleSpeed &&
              <Flex
                p={2}
                width={1}
                my={[2,3]}
                borderRadius={1}
                alignItems={'center'}
                flexDirection={'column'}
                justifyContent={'center'}
                backgroundColor={'#f3f6ff'}
                boxShadow={'0px 0px 0px 1px rgba(0,54,255,0.3)'}
              >
                <Text
                  fontWeight={500}
                  color={'#3f4e9a'}
                  textAlign={'center'}
                  fontSize={[1,'15px']}
                >
                  By executing this transaction you can adjust the IDLE distribution speed among the pools.
                </Text>
                <ExecuteTransaction
                  action={'Refresh'}
                  Component={Button}
                  parentProps={{
                    mt:1
                  }}
                  componentProps={{
                    size:'small',
                    value:'REFRESH IDLE SPEED'
                  }}
                  params={[]}
                  contractName={'IdleController'}
                  methodName={'refreshIdleSpeeds'}
                  {...this.props}
                >
                  <Flex
                    flexDirection={'row'}
                    alignItems={'center'}
                    justifyContent={'center'}
                  >
                    <Icon
                      mr={1}
                      name={'Done'}
                      size={'1.4em'}
                      color={this.props.theme.colors.transactions.status.completed}
                    />
                    <Text
                      fontWeight={500}
                      fontSize={'15px'}
                      color={'copyColor'}
                      textAlign={'center'}
                    >
                      Idle Speed Refreshed
                    </Text>
                  </Flex>
                </ExecuteTransaction>
              </Flex>
          }
        </Flex>
      );
    } else {
      const versionsOptions = Object.keys(globalConfigs.stats.versions).filter( version => {
        const versionInfo = this.getVersionInfo(version);
        return versionInfo.enabledTokens.includes(this.props.selectedToken) && versionInfo.enabledStrategies.includes(this.props.selectedStrategy);
      }).map( version => {
        const versionInfo = this.getVersionInfo(version);
        return {
          value:version,
          label:versionInfo.label
        }
      });

      const versionInfo = this.getVersionInfo(this.state.idleVersion);

      let performanceTooltip = null;
      if (this.state.idleVersion && versionInfo){
        const showPerformanceTooltip = this.functionsUtil.getGlobalConfig(['stats','versions',this.state.idleVersion,'showPerformanceTooltip']);
        performanceTooltip = showPerformanceTooltip ? this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.selectedToken,'performanceTooltip']) : null;
      }

      const versionDefaultValue = versionsOptions.find( v => (v.value === this.state.idleVersion) );

      return (
        <Flex
          p={0}
          width={1}
          flexDirection={'column'}
        >
          {
          /*
          }
          <Flex position={['absolute','relative']} left={0} px={[3,0]} zIndex={10} width={1} flexDirection={'row'} mb={[0,3]}>
            <Flex alignItems={'center'} width={[2/3,1/2]}>
              <RouterLink to="/">
                <Image src="images/logo-gradient.svg"
                  height={['35px','48px']}
                  position={'relative'} />
              </RouterLink>
              <Heading.h3 color={'dark-gray'} textAlign={'left'} fontWeight={3} lineHeight={'initial'} fontSize={[4,5]} ml={[1,2]}>
                <Text.span fontSize={'80%'}>|</Text.span> Stats
              </Heading.h3>
            </Flex>
            <Flex flexDirection={'row'} width={[1/3,1/2]} justifyContent={'flex-end'} alignItems={'center'}>
              {
                this.state.buttonGroups && 
                  this.props.isMobile ? (
                    <ButtonGroup
                      isMobile={this.props.isMobile}
                      components={ this.state.buttonGroups.reduce((components,array) => components.concat(array),[]) }
                      theme={'light'}
                    />
                  ) :
                  this.state.buttonGroups.map((buttonGroup,i) => (
                    <ButtonGroup
                      key={`buttonGroup_${i}`}
                      isMobile={this.props.isMobile}
                      components={buttonGroup}
                      theme={'light'}
                    />
                  ))
              }
            </Flex>
          </Flex>
          */
          }
          <Box
            mb={[3,4]}
          >
            <Flex
              flexDirection={['column','row']}
            >
              <Flex
                width={[1,0.4]}
              >
                <Breadcrumb
                  showPathMobile={true}
                  text={'ASSETS OVERVIEW'}
                  isMobile={this.props.isMobile}
                  handleClick={ e => this.props.goToSection('stats') }
                  path={[this.functionsUtil.getGlobalConfig(['strategies',this.props.selectedStrategy,'title'])]}
                />
              </Flex>
              <Flex
                mt={[3,0]}
                width={[1,0.6]}
                flexDirection={['column','row']}
                justifyContent={['center','space-between']}
              >
                <Flex
                  width={[1,0.26]}
                  flexDirection={'column'}
                >
                  <GenericSelector
                    innerProps={{
                      p:1,
                      height:['100%','46px'],
                    }}
                    name={'idle-version'}
                    options={versionsOptions}
                    defaultValue={versionDefaultValue}
                    onChange={ v => this.setIdleVersion(v) }
                  />
                </Flex>
                <Flex
                  mt={[3,0]}
                  width={[1,0.3]}
                  flexDirection={'column'}
                >
                  <AssetSelector
                    innerProps={{
                      p:1
                    }}
                    {...this.props}
                  />
                </Flex>
                <Flex
                  mt={[3,0]}
                  width={[1,0.39]}
                  flexDirection={'column'}
                >
                  <DashboardCard
                    cardProps={{
                      p:1,
                      display:'flex',
                      alignItems:'center',
                      height:['46px','100%'],
                      justifyContent:'center'
                    }}
                    isInteractive={true}
                    handleClick={ e => this.setDateRangeModal(true) }
                  >
                    <Text
                      fontWeight={3}
                      color={'copyColor'}
                    >
                    {
                      this.state.quickSelection
                      ?
                        this.quickSelections[this.state.quickSelection]
                      : this.state.startTimestampObj && this.state.endTimestampObj &&
                        `${this.state.startTimestampObj.format('DD/MM/YY')} - ${this.state.endTimestampObj.format('DD/MM/YY')}`
                    }
                    </Text>
                  </DashboardCard>
                </Flex>
              </Flex>
            </Flex>
          </Box>

          {
            this.state.idleVersion && (versionInfo.startTimestamp>parseInt(new Date().getTime()/1000)) ? (
              <Flex
                width={1}
                alignItems={'center'}
                flexDirection={'row'}
                justifyContent={'center'}
              >
                <DashboardCard
                  cardProps={{
                    p:3,
                    width:[1,0.5],
                  }}
                >
                  <Flex
                    alignItems={'center'}
                    flexDirection={'column'}
                  >
                    <Icon
                      size={'2.3em'}
                      color={'cellText'}
                      name={'AccessTime'}
                    />
                    <Text
                      mt={2}
                      fontSize={2}
                      color={'cellText'}
                      textAlign={'center'}
                    >
                      Idle Stats {this.state.idleVersion} will be available shortly!
                    </Text>
                  </Flex>
                </DashboardCard>
              </Flex>
            ) : (
              <Box
                width={1}
              >
                <Box
                  mt={[3,0]}
                  mb={[3,4]}
                >
                  <Flex
                    width={1}
                    alignItems={'center'}
                    justifyContent={'center'}
                    flexDirection={['column','row']}
                  >
                    <Flex
                      mb={[2,0]}
                      pr={[0,2]}
                      width={[1,1/4]}
                      flexDirection={'column'}
                    >
                      <StatsCard
                        value={this.state.aum}
                        title={'Asset Under Management'}
                        label={ this.state.unlentBalance ? `Unlent funds: ${this.state.unlentBalance} ${this.props.selectedToken}` : this.props.selectedToken }
                        labelTooltip={ this.state.unlentBalance ? this.functionsUtil.getGlobalConfig(['messages','cheapRedeem']) : null}
                      />
                    </Flex>
                    <Flex
                      mb={[2,0]}
                      pr={[0,2]}
                      width={[1,1/4]}
                      flexDirection={'column'}
                    >
                      <StatsCard
                        title={'Avg APY'}
                        label={'Annualized'}
                      >
                        <Flex
                          width={1}
                          alignItems={'center'}
                          flexDirection={['column','row']}
                        >
                          <VariationNumber
                            direction={'up'}
                            iconPos={'right'}
                            iconSize={'1.8em'}
                            justifyContent={'flex-start'}
                            width={1}
                            >
                            <Text
                              lineHeight={1}
                              fontWeight={[3,4]}
                              color={'statValue'}
                              fontSize={[4,5]}
                            >
                              {this.state.apr}
                              <Text.span color={'statValue'} fontWeight={3} fontSize={['90%','70%']}>%</Text.span>
                            </Text>
                          </VariationNumber>
                        </Flex>
                      </StatsCard>
                    </Flex>
                    <Flex
                      mb={[2,0]}
                      pr={[0,2]}
                      width={[1,1/4]}
                      flexDirection={'column'}
                    >
                      <StatsCard
                        title={'Overperformance on Compound'}
                        label={'Annualized'}
                      >
                        {
                          this.state.delta && !isNaN(this.state.delta) ? (
                            <VariationNumber
                              direction={'up'}
                              iconPos={'right'}
                              iconSize={'1.8em'}
                              justifyContent={'flex-start'}
                              >
                              <Text
                                lineHeight={1}
                                fontSize={[4,5]}
                                fontWeight={[3,4]}
                                color={'statValue'}
                              >
                                {this.state.delta}
                                <Text.span color={'statValue'} fontWeight={3} fontSize={['90%','70%']}>%</Text.span>
                              </Text>
                            </VariationNumber>
                          ) : (
                            <Text
                              lineHeight={1}
                              fontSize={[4,5]}
                              fontWeight={[3,4]}
                              color={'statValue'}
                            >
                              {this.state.delta}
                            </Text>
                          )
                        }
                      </StatsCard>
                    </Flex>
                    <Flex
                      mb={[2,0]}
                      pr={[0,2]}
                      width={[1,1/4]}
                      flexDirection={'column'}
                    >
                      <StatsCard
                        label={' '}
                        title={'Rebalances'}
                        value={this.state.rebalances.toString()}
                      />
                    </Flex>
                    {
                    /*
                    <Flex width={[1,1/4]} flexDirection={'column'} px={[0,2]}>
                      <Card my={[2,2]} py={3} pl={0} pr={'10px'} borderRadius={'10px'} boxShadow={0}>
                        <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                          <Text.span color={'copyColor'} fontWeight={2} fontSize={'90%'}>Current APR</Text.span>
                          <Text lineHeight={1} mt={1} color={'copyColor'} fontSize={[4,'26px']} fontWeight={3} textAlign={'center'}>
                            {this.state.currApr}
                            <Text.span color={'copyColor'} fontWeight={3} fontSize={['90%','70%']}>%</Text.span>
                          </Text>
                        </Flex>
                      </Card>
                    </Flex>
                    <Flex width={[1,1/4]} flexDirection={'column'} px={[0,2]}>
                      <Card my={[2,2]} py={3} pl={0} pr={'10px'} borderRadius={'10px'} boxShadow={0}>
                        <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                          <Text.span color={'copyColor'} fontWeight={2} fontSize={'90%'}>Days Live</Text.span>
                          <Text lineHeight={1} mt={1} color={'copyColor'} fontSize={[4,'26px']} fontWeight={3} textAlign={'center'}>
                            {this.state.days}
                          </Text>
                        </Flex>
                      </Card>
                    </Flex>
                    */
                    }
                  </Flex>
                </Box>

                <DashboardCard
                  title={'Historical Performance'}
                  description={performanceTooltip}
                  cardProps={{
                    mb:[3,4]
                  }}
                >
                  <Flex id='chart-PRICE' width={1} mb={3}>
                    <StatsChart
                      height={ 350 }
                      {...this.state}
                      parentId={'chart-PRICE'}
                      isMobile={this.props.isMobile}
                      contracts={this.props.contracts}
                      apiResults={this.state.apiResults}
                      idleVersion={this.state.idleVersion}
                      apiResults_unfiltered={this.state.apiResults_unfiltered}
                      chartMode={this.state.idleVersion === this.state.latestVersion ? 'PRICE_V4' : 'PRICE'}
                    />
                  </Flex>
                </DashboardCard>

                <DashboardCard
                  cardProps={{
                    pb:3,
                    mb:[3,4]
                  }}
                >
                  <Flex
                    flexDirection={['column','row']}
                    justifyContent={'space-between'}
                  >
                    {
                      this.state.idleVersion === this.state.latestVersion && 
                      <Flex
                        pt={2}
                        width={[1,1/3]}
                        id={'allocation-chart'}
                        flexDirection={'column'}
                        alignItems={'flex-start'}
                        justifyContent={'flex-start'}
                      >
                        <AllocationChart
                          height={310}
                          {...this.props}
                          parentId={'allocation-chart'}
                        />
                        <Rebalance
                          {...this.props}
                        />
                      </Flex>
                    }
                    <Flex
                      mb={[0,3]}
                      id={'chart-ALL'}
                      pl={[0,this.state.idleVersion === this.state.latestVersion ? 0 : 3]}
                      width={[1, this.state.idleVersion === this.state.latestVersion ? 2/3 : 1]}
                    >
                      <Flex alignItems={'flex-start'} justifyContent={'flex-start'} flexDirection={'column'} width={1}>
                        <Heading.h4
                          mb={2}
                          ml={3}
                          mt={[3,4]}
                          fontWeight={4}
                          fontSize={[2,3]}
                          textAlign={'left'}
                          color={'dark-gray'}
                          lineHeight={'initial'}
                        >
                          Allocations over time
                        </Heading.h4>
                        <StatsChart
                          height={350}
                          {...this.state}
                          chartMode={'ALL'}
                          parentId={'chart-ALL'}
                          isMobile={this.props.isMobile}
                          contracts={this.props.contracts}
                          apiResults={this.state.apiResults}
                          idleVersion={this.state.idleVersion}
                          apiResults_unfiltered={this.state.apiResults_unfiltered}
                        />
                      </Flex>
                    </Flex>
                  </Flex>
                </DashboardCard>

                <Flex
                  position={'relative'}
                >
                  <Flex
                    width={1}
                    id={'carousel-container'}
                    justifyContent={'flex-end'}
                  >
                    <RoundIconButton
                      buttonProps={{
                        mr:3
                      }}
                      iconName={'ArrowBack'}
                      disabled={this.state.carouselIndex === 0}
                      handleClick={ e => this.handleCarousel('back') }
                    />
                    <RoundIconButton
                      iconName={'ArrowForward'}
                      handleClick={ e => this.handleCarousel('next') }
                      disabled={this.state.carouselIndex === this.state.carouselMax}
                    />
                  </Flex>
                  <Flex
                    mt={5}
                    height={'400px'}
                    position={'absolute'}
                    id={'carousel-cursor'}
                    width={['444%','200%']}
                    justifyContent={'flex-start'}
                    left={this.state.carouselOffsetLeft}
                    style={{
                      transition:'left 0.3s ease-in-out'
                    }}
                  >
                    <DashboardCard
                      cardProps={{
                        mr:4,
                        height:'fit-content',
                        style:this.props.isMobile ? {width:'100%'} : {width:'32vw'}
                      }}
                    >
                      <Flex
                        width={1}
                        id='chart-AUM'
                      >
                        <Flex
                          mb={3}
                          width={1}
                          flexDirection={'column'}
                          alignItems={'flex-start'}
                          justifyContent={'center'}
                        >
                          <Heading.h4
                            ml={3}
                            mt={3}
                            mb={2}
                            fontWeight={4}
                            fontSize={[2,3]}
                            textAlign={'left'}
                            color={'dark-gray'}
                            lineHeight={'initial'}
                          >
                            Asset Under Management
                          </Heading.h4>
                          <StatsChart
                            height={300}
                            {...this.state}
                            chartMode={'AUM'}
                            parentId={'chart-AUM'}
                            isMobile={this.props.isMobile}
                            contracts={this.props.contracts}
                            apiResults={this.state.apiResults}
                            idleVersion={this.state.idleVersion}
                            apiResults_unfiltered={this.state.apiResults_unfiltered}
                          />
                        </Flex>
                      </Flex>
                    </DashboardCard>
                    <DashboardCard
                      cardProps={{
                        mr:4,
                        height:'fit-content',
                        style:this.props.isMobile ? {width:'100%'} : {width:'32vw'}
                      }}
                    >
                      <Flex id='chart-APR' width={1}>
                        <Flex
                          mb={3}
                          width={1}
                          flexDirection={'column'}
                          alignItems={'flex-start'}
                          justifyContent={'center'}
                        >
                          <Heading.h4
                            mb={2}
                            ml={3}
                            mt={3}
                            fontWeight={4}
                            fontSize={[2,3]}
                            textAlign={'left'}
                            color={'dark-gray'}
                            lineHeight={'initial'}
                          >
                            APRs
                          </Heading.h4>
                          <StatsChart
                            height={300}
                            {...this.state}
                            chartMode={'APR'}
                            parentId={'chart-APR'}
                            isMobile={this.props.isMobile}
                            contracts={this.props.contracts}
                            apiResults={this.state.apiResults}
                            idleVersion={this.state.idleVersion}
                            apiResults_unfiltered={this.state.apiResults_unfiltered}
                          />
                        </Flex>
                      </Flex>
                    </DashboardCard>
                    <DashboardCard
                      cardProps={{
                        mr:4,
                        height:'fit-content',
                        style:this.props.isMobile ? {width:'100%'} : {width:'32vw'}
                      }}
                      title={'Risk Score'}
                      description={'Idle Risk Score is a weighted average of the underlying protocols risks assessed by DeFi Score'}
                      titleParentProps={{
                        ml:16,
                        mt:16
                      }}
                    >
                      <Flex id='chart-SCORE' width={1}>
                        <Flex
                          mb={3}
                          width={1}
                          flexDirection={'column'}
                          alignItems={'flex-start'}
                          justifyContent={'center'}
                        >
                          <StatsChart
                            height={300}
                            {...this.state}
                            chartMode={'SCORE'}
                            parentId={'chart-SCORE'}
                            isMobile={this.props.isMobile}
                            contracts={this.props.contracts}
                            apiResults={this.state.apiResults}
                            idleVersion={this.state.idleVersion}
                            apiResults_unfiltered={this.state.apiResults_unfiltered}
                          />
                        </Flex>
                      </Flex>
                    </DashboardCard>
                    <DashboardCard
                      cardProps={{
                        mr:4,
                        height:'fit-content',
                        style:this.props.isMobile ? {width:'100%'} : {width:'32vw'}
                      }}
                    >
                      <Flex id='chart-VOL' width={1}>
                        <Flex
                          mb={3}
                          width={1}
                          flexDirection={'column'}
                          alignItems={'flex-start'}
                          justifyContent={'center'}
                        >
                          <Heading.h4
                            mb={2}
                            ml={3}
                            mt={3}
                            fontWeight={4}
                            fontSize={[2,3]}
                            textAlign={'left'}
                            color={'dark-gray'}
                            lineHeight={'initial'}
                          >
                            Volume
                          </Heading.h4>
                          <StatsChart
                            height={300}
                            {...this.state}
                            chartMode={'VOL'}
                            parentId={'chart-VOL'}
                            isMobile={this.props.isMobile}
                            contracts={this.props.contracts}
                            apiResults={this.state.apiResults}
                            idleVersion={this.state.idleVersion}
                            apiResults_unfiltered={this.state.apiResults_unfiltered}
                          />
                        </Flex>
                      </Flex>
                    </DashboardCard>
                  </Flex>
                </Flex>
              </Box>
            )
          }

          <DateRangeModal
            minDate={this.state.minDate}
            maxDate={this.state.maxDate}
            handleSelect={this.setDateRange}
            isOpen={this.state.dateRangeModalOpened}
            closeModal={e => this.setDateRangeModal(false)}
            startDate={this.state.startTimestampObj ? this.state.startTimestampObj._d : null}
            endDate={this.state.endTimestampObj ? this.state.endTimestampObj._d : null}
          />
        </Flex>
      );
    }
  }
}

export default Stats;