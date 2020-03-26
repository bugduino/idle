import moment from 'moment';
import StatsChart from './StatsChart';
import React, { Component } from 'react';
import Toggler from '../Toggler/Toggler';
import ButtonGroup from '../ButtonGroup/ButtonGroup';
import globalConfigs from '../configs/globalConfigs';
import { Link as RouterLink } from "react-router-dom";
import FunctionsUtil from '../utilities/FunctionsUtil';
import TokenSelector from '../TokenSelector/TokenSelector';
import DateRangeModal from '../utilities/components/DateRangeModal';
import { Flex, Card, Text, Heading, Image, Button } from 'rimble-ui';

class Stats extends Component {
  state = {
    aum:null,
    apr:null,
    days:'-',
    delta:null,
    earning:null,
    minDate:null,
    maxDate:null,
    rebalances:'-',
    buttonGroups:[],
    apiResults:null,
    minStartTime:null,
    endTimestamp:null,
    showAdvanced:false,
    startTimestamp:null,
    endTimestampObj:null,
    startTimestampObj:null,
    apiResults_unfiltered:null,
    dateRangeModalOpened:false,
    tokenConfig:this.props.tokenConfig,
    selectedToken:this.props.selectedToken
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

    const currentNetworkAvailableTokens = Object.keys(this.props.availableTokens);

    if (!!params.customToken && currentNetworkAvailableTokens.indexOf(params.customToken.toUpperCase()) !== -1 ){
      newState.selectedToken = params.customToken.toUpperCase();
    } else {
      newState.selectedToken = this.props.selectedToken.toUpperCase();
    }

    newState.tokenConfig = this.props.availableTokens[newState.selectedToken];
    newState.minStartTime = moment(globalConfigs.stats.tokens[this.state.selectedToken].startTimestamp,'YYYY-MM-DD');
    newState.endTimestampObj = moment(moment().format('YYYY-MM-DD 23:59'),'YYYY-MM-DD HH:mm');
    newState.endTimestamp = parseInt(newState.endTimestampObj._d.getTime()/1000);

    // Set start date
    newState.startTimestampObj = newState.endTimestampObj.clone().subtract(1,'month');
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

    const minStartTime = moment(globalConfigs.stats.tokens[this.state.selectedToken].startTimestamp);

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
            selectedToken:this.state.selectedToken,
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
    const tokenChanged = prevProps.tokenConfig !== this.props.tokenConfig;
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
    const apiResults_unfiltered = await this.getTokenData(this.state.tokenConfig.address,false);
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
    const firstIdlePrice = this.functionsUtil.fixTokenDecimals(firstResult.idlePrice,this.state.tokenConfig.decimals);
    const lastIdlePrice = this.functionsUtil.fixTokenDecimals(lastResult.idlePrice,this.state.tokenConfig.decimals);
    const aum = this.functionsUtil.formatMoney(parseFloat(idleTokens.times(lastIdlePrice)));
    const earning = lastIdlePrice.div(firstIdlePrice).minus(1).times(100);
    const apr = earning.times(365).div(days).toFixed(2);

    // console.log(moment(firstResult.timestamp*1000).format('YYYY-MM-DD HH:mm'),moment(lastResult.timestamp*1000).format('YYYY-MM-DD HH:mm'));

    const compoundInfo = this.state.tokenConfig.protocols.filter((p) => { return p.name === 'compound' })[0];
    const firstCompoundData = firstResult.protocolsData.filter((p) => { return p.protocolAddr.toLowerCase() === compoundInfo.address.toLowerCase() })[0];
    const lastCompoundData = lastResult.protocolsData.filter((p) => { return p.protocolAddr.toLowerCase() === compoundInfo.address.toLowerCase() })[0];

    let delta = null;
    if (firstCompoundData && lastCompoundData){
      const firstCompoundPrice = this.functionsUtil.fixTokenDecimals(firstCompoundData.price,this.state.tokenConfig.decimals);
      const lastCompoundPrice = this.functionsUtil.fixTokenDecimals(lastCompoundData.price,this.state.tokenConfig.decimals);
      const compoundApr = lastCompoundPrice.div(firstCompoundPrice).minus(1).times(100);
      delta = earning.minus(compoundApr).times(365).div(days).toFixed(2);
    }

    // Take rebalances
    let rebalances = 0;
    apiResults.forEach((row,index) => {
      if (index){
        const prevRow = apiResults[index-1];

        const totalAllocation = row.protocolsData.reduce((accumulator,protocolAllocation) => {
          const allocation = this.functionsUtil.fixTokenDecimals(protocolAllocation.allocation,this.state.tokenConfig.decimals);
          return this.functionsUtil.BNify(accumulator).plus(allocation);
        },0);

        const prevTotalAllocation = prevRow.protocolsData.reduce((accumulator,protocolAllocation) => {
          const allocation = this.functionsUtil.fixTokenDecimals(protocolAllocation.allocation,this.state.tokenConfig.decimals);
          return this.functionsUtil.BNify(accumulator).plus(allocation);
        },0);

        const firstProtocol = row.protocolsData[0];
        const allocation = this.functionsUtil.fixTokenDecimals(firstProtocol.allocation,this.state.tokenConfig.decimals);
        const allocationPerc = parseInt(allocation.div(totalAllocation).times(10000).toFixed(0));

        const prevFirstProtocol = prevRow.protocolsData.find(prevProtocol => { return prevProtocol.protocolAddr === firstProtocol.protocolAddr });
        const prevAllocation = this.functionsUtil.fixTokenDecimals(prevFirstProtocol.allocation,this.state.tokenConfig.decimals);
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

  render() {
    return (
      <Flex width={'100%'} flexDirection={'column'} px={[3,5]} py={[3,4]}>
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
        <Flex flexDirection={['column','row']} alignItems={'center'} justifyContent={'center'} width={1} mt={[5,0]} mb={[2,3]}>
          {
            this.state.showAdvanced &&
              <Flex width={[1,1/4]} flexDirection={'column'} pr={[0,2]}>
                <Card my={[2,2]} py={3} pl={0} pr={'10px'} borderRadius={'10px'} boxShadow={0}>
                  <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                    <Text.span color={'copyColor'} fontWeight={2} fontSize={'90%'}>Asset Under Management</Text.span>
                    <Text lineHeight={1} mt={1} color={'copyColor'} fontSize={[4,'26px']} fontWeight={3} textAlign={'center'}>
                      {this.state.aum}
                      <Text.span color={'copyColor'} fontWeight={3} fontSize={['90%','70%']} pl={2}>{this.state.selectedToken}</Text.span>
                    </Text>
                  </Flex>
                </Card>
              </Flex>
          }
          <Flex width={[1,this.state.showAdvanced ? 1/4 : 0.4]} flexDirection={'column'} pl={[0, this.state.showAdvanced ? 2 : 0]} pr={[0,2]}>
            <Card my={[2,2]} py={3} pl={0} pr={'10px'} borderRadius={'10px'} boxShadow={0}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text.span color={'copyColor'} fontWeight={2} fontSize={'90%'}>Avg APY</Text.span>
                <Text lineHeight={1} mt={1} color={'copyColor'} fontSize={[4,'26px']} fontWeight={3} textAlign={'center'}>
                  {this.state.apr}
                  <Text.span color={'copyColor'} fontWeight={3} fontSize={['90%','70%']}>%</Text.span>
                </Text>
              </Flex>
            </Card>
          </Flex>
          <Flex width={[1,this.state.showAdvanced ? 1/4 : 0.4]} flexDirection={'column'} pl={[0,2]} pr={[0,this.state.showAdvanced ? 2 : 0]}>
            <Card my={[2,2]} py={3} pl={0} pr={'10px'} borderRadius={'10px'} boxShadow={0}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text.span color={'copyColor'} fontWeight={2} fontSize={'90%'}>Overperformance on Compound</Text.span>
                <Text lineHeight={1} mt={1} color={'copyColor'} fontSize={[4,'26px']} fontWeight={3} textAlign={'center'}>
                  {this.state.delta}
                  <Text.span color={'copyColor'} fontWeight={3} fontSize={['90%','70%']}>%</Text.span>
                </Text>
              </Flex>
            </Card>
          </Flex>
          {
            this.state.showAdvanced &&
              <Flex width={[1,1/4]} flexDirection={'column'} pl={[0,2]}>
                <Card my={[2,2]} py={3} pl={0} pr={'10px'} borderRadius={'10px'} boxShadow={0}>
                  <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                    <Text.span color={'copyColor'} fontWeight={2} fontSize={'90%'}>Rebalances</Text.span>
                    <Text lineHeight={1} mt={1} color={'copyColor'} fontSize={[4,'26px']} fontWeight={3} textAlign={'center'}>
                      {this.state.rebalances}
                    </Text>
                  </Flex>
                </Card>
              </Flex>
          }
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
        <Flex justifyContent={this.state.showAdvanced ? 'space-between' : 'center'} style={{flexWrap:'wrap'}}>
          <Flex id='chart-PRICE' width={[1,this.state.showAdvanced ? 0.49 : 0.8]} mb={3}>
            <Card p={[2,3]} boxShadow={0} pb={0} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                  Historical Performance
                </Text>
                <StatsChart contracts={this.props.contracts} apiResults_unfiltered={this.state.apiResults_unfiltered} apiResults={this.state.apiResults} isMobile={this.props.isMobile} chartMode={'PRICE'} {...this.state} parentId={'chart-PRICE'} height={ 350 } />
              </Flex>
            </Card>
          </Flex>
          {
            this.state.showAdvanced &&
            <Flex id='chart-AUM' width={[1,0.49]} mb={3}>
              <Card p={[2,3]} boxShadow={0} pb={0} borderRadius={'10px'}>
                <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                  <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                    Asset Under Management
                  </Text>
                  <StatsChart contracts={this.props.contracts} apiResults_unfiltered={this.state.apiResults_unfiltered} apiResults={this.state.apiResults} isMobile={this.props.isMobile} chartMode={'AUM'} {...this.state} parentId={'chart-AUM'} height={ 350 } />
                </Flex>
              </Card>
            </Flex>
          }
        </Flex>
        {
          this.state.showAdvanced &&
            <Flex justifyContent={'space-between'} style={{flexWrap:'wrap'}}>
              <Flex id='chart-ALL' width={[1,0.49]} mb={3}>
                <Card p={[2,3]} boxShadow={0} pb={0} borderRadius={'10px'}>
                  <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                    <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                      Allocation
                    </Text>
                    <StatsChart contracts={this.props.contracts} apiResults_unfiltered={this.state.apiResults_unfiltered} apiResults={this.state.apiResults} isMobile={this.props.isMobile} chartMode={'ALL'} {...this.state} parentId={'chart-ALL'} height={ 350 } />
                  </Flex>
                </Card>
              </Flex>
              <Flex id='chart-ALL_PERC' width={[1,0.49]} mb={3}>
                <Card p={[2,3]} boxShadow={0} pb={0} borderRadius={'10px'}>
                  <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                    <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                      Allocation Percentage
                    </Text>
                    <StatsChart contracts={this.props.contracts} apiResults_unfiltered={this.state.apiResults_unfiltered} apiResults={this.state.apiResults} isMobile={this.props.isMobile} chartMode={'ALL_PERC'} {...this.state} parentId={'chart-ALL_PERC'} height={ 350 } />
                  </Flex>
                </Card>
              </Flex>
              <Flex id='chart-APR' width={[1,0.49]} mb={3}>
                <Card p={[2,3]} boxShadow={0} pb={0} borderRadius={'10px'}>
                  <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                    <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                      APRs
                    </Text>
                    <StatsChart contracts={this.props.contracts} apiResults_unfiltered={this.state.apiResults_unfiltered} apiResults={this.state.apiResults} isMobile={this.props.isMobile} chartMode={'APR'} {...this.state} parentId={'chart-APR'} height={ 350 } />
                  </Flex>
                </Card>
              </Flex>
              <Flex id='chart-VOL' width={[1,0.49]} mb={3}>
                <Card p={[2,3]} boxShadow={0} pb={0} borderRadius={'10px'}>
                  <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                    <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                      Volume
                    </Text>
                    <StatsChart contracts={this.props.contracts} apiResults_unfiltered={this.state.apiResults_unfiltered} apiResults={this.state.apiResults} isMobile={this.props.isMobile} chartMode={'VOL'} {...this.state} parentId={'chart-VOL'} height={ 350 } />
                  </Flex>
                </Card>
              </Flex>
            </Flex>
        }
        {
          /*
          <Flex flexDirection={'column'} mt={2} alignItems={'center'}>
            <Link
              href="#"
              fontSize={2}
              display={'flex'}
              color={'dark-gray'}
              hoverColor={'primary'}
              style={{width:'100%'}}
              onClick={e => this.toggleAdvancedCharts(e) }
            >
              <Flex width={1} justifyContent={'center'}>
                { this.state.showAdvanced ? 'hide' : 'show' } more stats
              </Flex>
            </Link>
          </Flex>
          */
        }

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

export default Stats;