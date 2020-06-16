import moment from 'moment';
import Title from '../Title/Title';
import CountUp from 'react-countup';
import StatsChart from './StatsChart';
import React, { Component } from 'react';
// import Toggler from '../Toggler/Toggler';
import Rebalance from '../Rebalance/Rebalance';
import StatsCard from '../StatsCard/StatsCard';
import { Flex, Text, Heading } from 'rimble-ui';
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
    totalAUM:null,
    rebalances:'-',
    buttonGroups:[],
    apiResults:null,
    carouselIndex:0,
    idleVersion:'v3',
    minStartTime:null,
    endTimestamp:null,
    showAdvanced:true,
    quickSelection:null,
    startTimestamp:null,
    endTimestampObj:null,
    shouldRebalance:null,
    carouselOffsetLeft:0,
    startTimestampObj:null,
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
  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
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

    const statsVersions = globalConfigs.stats.versions;

    if (this.state.idleVersion && statsVersions[this.state.idleVersion].endTimestamp){
      const newEndTimestampObj = moment(moment(statsVersions[this.state.idleVersion].endTimestamp*1000).format('YYYY-MM-DD HH:mm'),'YYYY-MM-DD HH:mm');
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
    newState.startTimestampObj = newState.endTimestampObj.clone().subtract(2,'week');
    newState.startTimestamp = parseInt(newState.startTimestampObj._d.getTime()/1000);

    if (this.state.idleVersion && statsVersions[this.state.idleVersion].startTimestamp){
      const newStartTimestampObj = moment(moment(statsVersions[this.state.idleVersion].startTimestamp*1000).format('YYYY-MM-DD HH:mm'),'YYYY-MM-DD HH:mm');
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
      await this.setState(newState);
    }
  }

  componentWillMount() {
    this.loadUtils();
    this.loadParams();
  }

  componentWillUnmount(){
    if (document.getElementById('crisp-custom-style')){
      document.getElementById('crisp-custom-style').remove();
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

    this.setState(newState);

    return newState;
  }

  toggleAdvancedCharts = (e) => {
    e.preventDefault();
    this.setState({
      showAdvanced:!this.state.showAdvanced
    });
  }

  setDateRangeModal = (dateRangeModalOpened) => {
    if (dateRangeModalOpened !== this.state.dateRangeModalOpened){
      this.setState({
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

    if (!this.props.selectedToken){
      this.loadTotalAUM();
    }
  }

  loadTotalAUM = async () => {
    const {
      avgAPY,
      totalAUM
    } = await this.functionsUtil.getAggregatedStats();

    const totalAUMEndOfYear = totalAUM.plus(totalAUM.times(avgAPY.div(100)));

    this.setState({
      totalAUM,
      totalAUMEndOfYear
    });
  }

  loadCarousel(){
    const carouselMax = this.props.isMobile ? 3 : 2;
    this.setState({
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
    this.setState({
      idleVersion
    });
  }

  loadApiData = async () => {

    if (!this.props.selectedToken || !this.props.tokenConfig){
      return false;
    }

    const startTimestamp = this.state.minDate ? parseInt(this.state.minDate.getTime()/1000) : null;
    const endTimestamp = this.state.maxDate ? parseInt(this.state.maxDate.getTime()/1000) : null;


    let apiResults_unfiltered = await this.functionsUtil.getTokenApiData(this.props.tokenConfig.address,startTimestamp,endTimestamp,true);

    // Filter for isRisk
    if (this.state.idleVersion === 'v3'){
      const isRisk = this.props.selectedStrategy === 'risk';
      apiResults_unfiltered = apiResults_unfiltered.filter( d => ( d.isRisk === isRisk ) );
    }

    const apiResults = this.filterTokenData(apiResults_unfiltered);

    // console.log('loadApiData',startTimestamp,endTimestamp,apiResults_unfiltered,apiResults);

    if (!apiResults || !apiResults_unfiltered || !apiResults.length || !apiResults_unfiltered.length){
      return false;
    }

    const firstResult = apiResults[0];
    const lastResult = Object.values(apiResults).pop();

    window.moment = moment;

    let days = (lastResult.timestamp-firstResult.timestamp)/86400;
    // days = Math.max(days,1);

    const idleTokens = this.functionsUtil.fixTokenDecimals(lastResult.idleSupply,18);
    const firstIdlePrice = this.functionsUtil.fixTokenDecimals(firstResult.idlePrice,this.props.tokenConfig.decimals);
    const lastIdlePrice = this.functionsUtil.fixTokenDecimals(lastResult.idlePrice,this.props.tokenConfig.decimals);
    const aum = this.functionsUtil.formatMoney(parseFloat(idleTokens.times(lastIdlePrice)));
    const earning = lastIdlePrice.div(firstIdlePrice).minus(1).times(100);
    const apr = earning.times(365).div(days).toFixed(2);

    const compoundInfo = this.props.tokenConfig.protocols.filter((p) => { return p.name === 'compound' })[0];
    const firstCompoundData = compoundInfo ? firstResult.protocolsData.filter((p) => { return p.protocolAddr.toLowerCase() === compoundInfo.address.toLowerCase() })[0] : null;
    const lastCompoundData = compoundInfo ? lastResult.protocolsData.filter((p) => { return p.protocolAddr.toLowerCase() === compoundInfo.address.toLowerCase() })[0] : null;

    let delta = 'N/A';
    if (firstCompoundData && lastCompoundData){
      const firstCompoundPrice = this.functionsUtil.fixTokenDecimals(firstCompoundData.price,this.props.tokenConfig.decimals);
      const lastCompoundPrice = this.functionsUtil.fixTokenDecimals(lastCompoundData.price,this.props.tokenConfig.decimals);
      const compoundApr = lastCompoundPrice.div(firstCompoundPrice).minus(1).times(100);
      delta = earning.minus(compoundApr).times(365).div(days).toFixed(2);
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

    this.setState({
      aum,
      apr,
      days,
      delta,
      apiResults,
      rebalances,
      apiResults_unfiltered
    });
  }

  selectToken = async (strategy,token) => {
    await this.props.setStrategy(strategy);
    await this.props.setToken(token);
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

    this.setState({
      carouselIndex,
      carouselOffsetLeft
    });
  }

  render() {

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
      Object.keys(statsTokens).forEach(token => {
        const tokenInfo = statsTokens[token];
        if (tokenInfo.enabled){
          enabledTokens.push(token);
        }
      });
      return (
        <Flex
          width={1}
          flexDirection={'column'}
        >
          {
            this.state.totalAUM && this.state.totalAUMEndOfYear && 
              <Flex
                width={1}
                flexDirection={'column'}
                alignItems={['center','flex-end']}
              >
                <CountUp
                  delay={0}
                  decimals={5}
                  decimal={'.'}
                  separator={''}
                  useEasing={false}
                  duration={31536000}
                  start={parseFloat(this.state.totalAUM)}
                  end={parseFloat(this.state.totalAUMEndOfYear)}
                  formattingFn={ n => '$ '+this.functionsUtil.formatMoney(n,5) }
                >
                  {({ countUpRef, start }) => (
                    <span
                      style={{
                        color:'dark-gray',
                        fontFamily:this.props.theme.fonts.counter,
                        fontWeight:this.props.theme.fontWeights[5],
                        fontSize: this.props.isMobile ? '1.6em' : this.props.theme.fontSizes[6]
                      }}
                      ref={countUpRef}
                    />
                  )}
                </CountUp>
                <Title
                  fontWeight={3}
                  fontSize={[2,3]}
                  color={'cellTitle'}
                >
                  Assets Under Management
                </Title>
              </Flex>
          }
          {
            Object.keys(strategies).map(strategy => {
              const strategyInfo = strategies[strategy];
              const availableTokens = this.props.availableStrategies[strategy];
              if (!availableTokens){
                return false;
              }
              return (
                <Flex
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
                    {strategyInfo.title}
                  </Title>
                  <AssetsList
                    enabledTokens={enabledTokens}
                    handleClick={(props) => this.selectToken(strategy,props.token)}
                    cols={[
                      {
                        title:'CURRENCY',
                        props:{
                          width:[0.3,0.15]
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
                          width:[0.21,0.17],
                        },
                        fields:[
                          {
                            name:'allocationChart',
                            mobile:false,
                            parentProps:{
                              width:0.3
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
                        props:{
                          width: [0.19,0.12],
                        },
                        fields:[
                          {
                            name:'apy'
                          }
                        ]
                      },
                      {
                        title:'RISK SCORE',
                        mobile:false,
                        props:{
                          width:[0.27,0.14],
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
                          width:[0.3,0.17],
                        },
                        parentProps:{
                          width:1
                        },
                        fields:[
                          {
                            name:'button',
                            label:'View stats',
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
                </Flex>
              );
            })
          }
        </Flex>
      );
    } else {

      const versionsOptions = Object.keys(globalConfigs.stats.versions).filter( version => {
        const versionInfo = globalConfigs.stats.versions[version];
        return versionInfo.enabledTokens.includes(this.props.selectedToken) && versionInfo.enabledStrategies.includes(this.props.selectedStrategy);
      }).map( version => {
        const versionInfo = globalConfigs.stats.versions[version];
        return {
          value:version,
          label:versionInfo.label
        }
      });

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
          <Flex
            mb={[3,4]}
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
                  defaultValue={
                    {value:'v3',label:'Idle V3'}
                  }
                  options={versionsOptions}
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
          <Flex
            width={1}
            mt={[3,0]}
            mb={[3,4]}
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
                label={this.props.selectedToken}
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
                <VariationNumber
                  direction={'up'}
                  iconPos={'right'}
                  iconSize={'1.8em'}
                  justifyContent={'flex-start'}
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


          <DashboardCard
            title={'Historical Performance'}
            titleProps={{
              mb:2
            }}
            cardProps={{
              mb:[3,4]
            }}
          >
            <Flex id='chart-PRICE' width={1} mb={3}>
              <StatsChart
                height={ 350 }
                {...this.state}
                chartMode={'PRICE'}
                parentId={'chart-PRICE'}
                isMobile={this.props.isMobile}
                contracts={this.props.contracts}
                apiResults={this.state.apiResults}
                apiResults_unfiltered={this.state.apiResults_unfiltered}
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
                this.state.idleVersion === 'v3' && 
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
              <Flex id={'chart-ALL'} width={[1, this.state.idleVersion === 'v3' ? 2/3 : 1]} mb={[0,3]}>
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
                    height={ 350 }
                    {...this.state}
                    chartMode={'ALL'}
                    parentId={'chart-ALL'}
                    isMobile={this.props.isMobile}
                    contracts={this.props.contracts}
                    apiResults={this.state.apiResults}
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
                <Flex id='chart-SCORE' width={1}>
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
                      Risk Score
                    </Heading.h4>
                    <StatsChart
                      height={300}
                      {...this.state}
                      chartMode={'SCORE'}
                      parentId={'chart-SCORE'}
                      isMobile={this.props.isMobile}
                      contracts={this.props.contracts}
                      apiResults={this.state.apiResults}
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
                      apiResults_unfiltered={this.state.apiResults_unfiltered}
                    />
                  </Flex>
                </Flex>
              </DashboardCard>
            </Flex>
          </Flex>

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