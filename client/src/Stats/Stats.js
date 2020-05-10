import moment from 'moment';
import Title from '../Title/Title';
import StatsChart from './StatsChart';
import React, { Component } from 'react';
import Toggler from '../Toggler/Toggler';
import StatsCard from '../StatsCard/StatsCard';
import AssetsList from '../AssetsList/AssetsList';
import ButtonGroup from '../ButtonGroup/ButtonGroup';
import RoundButton from '../RoundButton/RoundButton';
import globalConfigs from '../configs/globalConfigs';
import { Link as RouterLink } from "react-router-dom";
import FunctionsUtil from '../utilities/FunctionsUtil';
import availableTokens from '../configs/availableTokens';
import TokenSelector from '../TokenSelector/TokenSelector';
import DashboardCard from '../DashboardCard/DashboardCard';
import AssetSelector from '../AssetSelector/AssetSelector';
import VariationNumber from '../VariationNumber/VariationNumber';
import AllocationChart from '../AllocationChart/AllocationChart';
import DateRangeModal from '../utilities/components/DateRangeModal';
import { Box, Flex, Card, Text, Heading, Image, Button, Icon } from 'rimble-ui';

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
    minStartTime:null,
    endTimestamp:null,
    showAdvanced:true,
    startTimestamp:null,
    endTimestampObj:null,
    carouselOffsetLeft:0,
    startTimestampObj:null,
    apiResults_unfiltered:null,
    dateRangeModalOpened:false
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

    const newState = Object.assign({},this.state);
    const { match: { params } } = this.props;

    const currentNetworkAvailableTokens = Object.keys(this.props.availableTokens);

    if (!!params.customToken && currentNetworkAvailableTokens.indexOf(params.customToken.toUpperCase()) !== -1 ){
      newState.selectedToken = params.customToken.toUpperCase();
    } else {
      newState.selectedToken = this.props.selectedToken.toUpperCase();
    }

    newState.tokenConfig = this.props.availableTokens[newState.selectedToken];
    newState.minStartTime = moment(globalConfigs.stats.tokens[this.props.selectedToken].startTimestamp,'YYYY-MM-DD');
    newState.endTimestampObj = moment(moment().format('YYYY-MM-DD 23:59'),'YYYY-MM-DD HH:mm');
    newState.endTimestamp = parseInt(newState.endTimestampObj._d.getTime()/1000);

    // Set start date
    newState.startTimestampObj = newState.endTimestampObj.clone().subtract(2,'week');
    newState.startTimestamp = parseInt(newState.startTimestampObj._d.getTime()/1000);

    newState.minDate = newState.minStartTime._d;
    newState.maxDate = moment()._d;

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

  setDateRange = ranges => {

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

  updateButtonGroup = async () => {

    if (!this.props.selectedToken || !this.props.tokenConfig){
      return false;
    }

    const buttonGroups = [
      [
        {
          component:Toggler,
          props:{
            checked:this.state.showAdvanced,
            handleClick:this.toggleAdvancedCharts,
            label:'Mode: Basic',
            labelChecked:'Mode: Advanced'
          },
        }
      ],
      [
        {
          component:Button,
          props:{
            icon:'Today',
            iconpos:'right',
            color:'dark-gray',
            mainColor:'transparent',
            contrastColor:'dark-gray',
            onClick: (e) => { this.setDateRangeModal(true) }
          },
          value:this.state.startTimestampObj.format('DD/MM/YYYY')+' - '+this.state.endTimestampObj.format('DD/MM/YYYY')
        }
      ],
      [
        {
          component:TokenSelector,
          props:{
            setSelectedToken:this.props.setSelectedToken,
            selectedToken:this.props.selectedToken,
            availableTokens:this.props.availableTokens,
            color:'dark-gray',
            size:'big'
          }
        }
      ]
    ];

    await this.setState({
      buttonGroups
    });
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
    await this.updateButtonGroup();
    this.loadApiData();
  }

  async componentDidUpdate(prevProps,prevState) {
    const contractsInitialized = prevProps.contractsInitialized !== this.props.contractsInitialized;
    const tokenChanged = prevProps.selectedToken !== this.props.selectedToken || prevProps.tokenConfig !== this.props.tokenConfig;
    const dateChanged = prevState.startTimestamp !== this.state.startTimestamp || prevState.endTimestamp !== this.state.endTimestamp;

    if (contractsInitialized || tokenChanged){
      await this.componentDidMount();
    } else {
      if (dateChanged){
        this.updateButtonGroup();
        this.loadApiData();
      } else if (prevState.showAdvanced !== this.state.showAdvanced){
        this.updateButtonGroup();
      }
    }
  }

  getTokenData = async (address,filter=true) => {
    const apiInfo = globalConfigs.stats.rates;
    let endpoint = `${apiInfo.endpoint}${address}`;
    if (this.state.startTimestamp || this.state.endTimestamp){
      const params = [];
      if (this.state.startTimestamp && parseInt(this.state.startTimestamp)){
        const start = this.state.startTimestamp-(60*60*24*2); // Minus 1 day for Volume graph
        params.push(`start=${start}`);
      }
      if (this.state.endTimestamp && parseInt(this.state.endTimestamp)){
        params.push(`end=${this.state.endTimestamp}`);
      }
      endpoint += '?'+params.join('&');
    }
    const TTL = apiInfo.TTL ? apiInfo.TTL : 0;
    let output = await this.functionsUtil.makeCachedRequest(endpoint,TTL,true);
    if (!output){
      return [];
    }
    if (!filter){
      return output;
    }
    return this.filterTokenData(output);
  }

  filterTokenData = (apiResults) => {
    return apiResults.filter((r,i) => {
      return (!this.state.startTimestamp || r.timestamp >= this.state.startTimestamp) && (!this.state.endTimestamp || r.timestamp <= this.state.endTimestamp);
    });
  }

  loadApiData = async () => {

    if (!this.props.selectedToken || !this.props.tokenConfig){
      return false;
    }

    const apiResults_unfiltered = await this.getTokenData(this.props.tokenConfig.address,false);
    const apiResults = this.filterTokenData(apiResults_unfiltered);

    if (!apiResults){
      return false;
    }

    const firstResult = apiResults[0];
    const lastResult = apiResults.pop();

    window.moment = moment;

    let days = (lastResult.timestamp-firstResult.timestamp)/86400;
    days = Math.max(days,1);

    const idleTokens = this.functionsUtil.fixTokenDecimals(lastResult.idleSupply,18);
    const firstIdlePrice = this.functionsUtil.fixTokenDecimals(firstResult.idlePrice,this.props.tokenConfig.decimals);
    const lastIdlePrice = this.functionsUtil.fixTokenDecimals(lastResult.idlePrice,this.props.tokenConfig.decimals);
    const aum = this.functionsUtil.formatMoney(parseFloat(idleTokens.times(lastIdlePrice)));
    const earning = lastIdlePrice.div(firstIdlePrice).minus(1).times(100);
    const apr = earning.times(365).div(days).toFixed(2);

    // console.log(moment(firstResult.timestamp*1000).format('YYYY-MM-DD HH:mm'),moment(lastResult.timestamp*1000).format('YYYY-MM-DD HH:mm'));

    const compoundInfo = this.props.tokenConfig.protocols.filter((p) => { return p.name === 'compound' })[0];
    const firstCompoundData = firstResult.protocolsData.filter((p) => { return p.protocolAddr.toLowerCase() === compoundInfo.address.toLowerCase() })[0];
    const lastCompoundData = lastResult.protocolsData.filter((p) => { return p.protocolAddr.toLowerCase() === compoundInfo.address.toLowerCase() })[0];

    let delta = null;
    if (firstCompoundData && lastCompoundData){
      const firstCompoundPrice = this.functionsUtil.fixTokenDecimals(firstCompoundData.price,this.props.tokenConfig.decimals);
      const lastCompoundPrice = this.functionsUtil.fixTokenDecimals(lastCompoundData.price,this.props.tokenConfig.decimals);
      const compoundApr = lastCompoundPrice.div(firstCompoundPrice).minus(1).times(100);
      delta = earning.minus(compoundApr).times(365).div(days).toFixed(2);
    }

    // Take rebalances
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

        const firstProtocol = row.protocolsData[0];
        const allocation = this.functionsUtil.fixTokenDecimals(firstProtocol.allocation,this.props.tokenConfig.decimals);
        const allocationPerc = parseInt(allocation.div(totalAllocation).times(10000).toFixed(0));

        const prevFirstProtocol = prevRow.protocolsData.find(prevProtocol => { return prevProtocol.protocolAddr === firstProtocol.protocolAddr });
        const prevAllocation = this.functionsUtil.fixTokenDecimals(prevFirstProtocol.allocation,this.props.tokenConfig.decimals);
        const prevAllocationPerc = parseInt(prevAllocation.div(prevTotalAllocation).times(10000).toFixed(0));

        if (allocationPerc !== prevAllocationPerc){
          rebalances++;
        }
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

    if (!this.props.selectedToken){
      const strategies = this.functionsUtil.getGlobalConfig(['strategies']);
      return (
        <Box width={1}>
          {
            Object.keys(strategies).map(strategy => {
              const strategyInfo = strategies[strategy];
              const availableTokens = this.props.availableStrategies[strategy];
              if (!availableTokens){
                return false;
              }
              return (
                <Flex
                  mb={3}
                  width={1}
                  flexDirection={'column'}
                  justifyContent={'center'}
                  key={`strategy-container-${strategy}`}
                >
                  <Title
                    mt={3}
                    mb={4}
                  >
                    {strategyInfo.title}
                  </Title>
                  <AssetsList
                    enabledTokens={[]}
                    cols={[
                      {
                        title:'CURRENCY',
                        props:{
                          width:0.15
                        },
                        fields:[
                          {
                            name:'icon',
                            props:{
                              mr:2,
                              height:'2.3em'
                            }
                          },
                          {
                            name:'tokenName'
                          }
                        ]
                      },
                      {
                        title:'BALANCE',
                        props:{
                          width:0.15,
                        },
                        fields:[
                          {
                            name:'tokenBalance'
                          }
                        ]
                      },
                      {
                        title:'POOL',
                        props:{
                          width:0.15,
                        },
                        fields:[
                          {
                            name:'pool'
                          }
                        ]
                      },
                      {
                        title:'APY',
                        props:{
                          width: this.state.depositedTokens.length>0 ? 0.11 : 0.14,
                        },
                        fields:[
                          {
                            name:'apy'
                          }
                        ]
                      },
                      {
                        title:'APR LAST WEEK',
                        props:{
                          width: this.state.depositedTokens.length>0 ? 0.28 : 0.25,
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
                          width:0.17,
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
                              handleClick:(props) => this.selectToken(strategy,props.token)
                            }
                          }
                        ]
                      }
                    ]}
                    {...this.props}
                    availableTokens={availableTokens}
                  />
                </Flex>
              );
            })
          }
        </Box>
      );
    } else {
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
              width={[1,0.6]}
              id={'breadcrumb'}
            >
            </Flex>
            <Flex
              width={[1,0.4]}
              flexDirection={['column','row']}
              justifyContent={['center','space-between']}
            >
              <Flex
                width={[1,0.48]}
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
                width={[1,0.48]}
                flexDirection={'column'}
              >
              </Flex>
            </Flex>
          </Flex>

          <Flex
            width={1}
            mt={[5,0]}
            mb={[3,4]}
            alignItems={'center'}
            justifyContent={'center'}
            flexDirection={['column','row']}
          >
            <Flex width={[1,1/4]} flexDirection={'column'} pr={[0,2]}>
              <StatsCard
                value={this.state.aum}
                title={'Asset Under Management'}
                label={this.props.selectedToken}
              />
            </Flex>
            <Flex width={[1,1/4]} flexDirection={'column'} pr={[0,2]}>
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
            <Flex width={[1,1/4]} flexDirection={'column'} pr={[0,2]}>
              <StatsCard
                title={'Overperformance on Compound'}
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
                    {this.state.delta}
                    <Text.span color={'statValue'} fontWeight={3} fontSize={['90%','70%']}>%</Text.span>
                  </Text>
                </VariationNumber>
              </StatsCard>
            </Flex>
            <Flex width={[1,1/4]} flexDirection={'column'} pr={[0,2]}>
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
              mb:[3,4]
            }}
          >
            <Flex
              flexDirection={'row'}
              justifyContent={'space-between'}
            >
            <Flex
              pt={[3,4]}
              width={[1,1/3]}
              id={'allocation-chart'}
              alignItems={'flex-start'}
            >
              <AllocationChart
                {...this.props}
                height={'350px'}
                parentId={'allocation-chart'}
              />
            </Flex>
            <Flex id='chart-ALL' width={[1,2/3]} mb={3}>
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
                <StatsChart contracts={this.props.contracts} apiResults_unfiltered={this.state.apiResults_unfiltered} apiResults={this.state.apiResults} isMobile={this.props.isMobile} chartMode={'ALL'} {...this.state} parentId={'chart-ALL'} height={ 350 } />
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
              <RoundButton
                buttonProps={{
                  p:0,
                  boxShadow:1,
                  width:'40px',
                  height:'40px',
                  minWidth:'40px',
                  mainColor:'white',
                  borderRadius:'50%',
                  disabled: this.state.carouselIndex === 0
                }}
                handleClick={ e => this.handleCarousel('back') }
              >
                <Icon
                  size={'1.3em'}
                  name={'ArrowBack'}
                  color={'copyColor'}
                />
              </RoundButton>
              <RoundButton
                buttonProps={{
                  p:0,
                  ml:3,
                  boxShadow:1,
                  width:'40px',
                  height:'40px',
                  minWidth:'40px',
                  mainColor:'white',
                  borderRadius:'50%',
                  disabled: this.state.carouselIndex === this.state.carouselMax
                }}
                handleClick={ e => this.handleCarousel('next') }
              >
                <Icon
                  size={'1.3em'}
                  color={'copyColor'}
                  name={'ArrowForward'}
                />
              </RoundButton>
            </Flex>
            <Flex
              mt={5}
              width={'150%'}
              height={'400px'}
              position={'absolute'}
              id={'carousel-cursor'}
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
            startDate={this.state.startTimestampObj ? this.state.startTimestampObj._d : null}
            endDate={this.state.endTimestampObj ? this.state.endTimestampObj._d : null}
            handleSelect={this.setDateRange}
            isOpen={this.state.dateRangeModalOpened}
            closeModal={e => this.setDateRangeModal(false)} />
        </Flex>
      );
    }
  }
}

export default Stats;