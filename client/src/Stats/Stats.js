import moment from 'moment';
import StatsChart from './StatsChart';
import React, { Component } from 'react';
import ButtonGroup from '../ButtonGroup/ButtonGroup';
import globalConfigs from '../configs/globalConfigs';
import { Link as RouterLink } from "react-router-dom";
import FunctionsUtil from '../utilities/FunctionsUtil';
import TokenSelector from '../TokenSelector/TokenSelector';
import DateRangeModal from '../utilities/components/DateRangeModal';
import { Box, Flex, Card, Text, Heading, Image, Button, Link } from 'rimble-ui';

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
    minStartTime:null,
    endTimestamp:null,
    showAdvanced:false,
    startTimestamp:null,
    endTimestampObj:null,
    startTimestampObj:null,
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
    newState.startTimestampObj = newState.minStartTime;
    newState.startTimestamp = parseInt(newState.startTimestampObj._d.getTime()/1000);
    newState.endTimestampObj = moment();
    newState.endTimestamp = parseInt(newState.endTimestampObj._d.getTime()/1000);

    newState.minDate = newState.startTimestampObj._d;
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
    if (prevProps !== this.props){
      await this.componentDidMount();
    } else {
      const dateChanged = prevState.startTimestamp !== this.state.startTimestamp || prevState.endTimestamp !== this.state.endTimestamp;
      if (dateChanged){
        this.loadApiData();
        this.updateButtonGroup()
      }
    }
  }

  getTokenData = async (address,filter=true) => {
    const apiInfo = globalConfigs.stats.rates;
    const endpoint = `${apiInfo.endpoint}${address}`;
    const TTL = apiInfo.TTL ? apiInfo.TTL : 0;
    let output = await this.functionsUtil.makeCachedRequest(endpoint,TTL,true);
    if (!filter){
      return output;
    }
    return output.filter((r,i) => {
      return (!this.state.startTimestamp || r.timestamp >= this.state.startTimestamp) && (!this.state.endTimestamp || r.timestamp <= this.state.endTimestamp);
    });
  }

  loadApiData = async () => {
    const apiResults = await this.getTokenData(this.state.tokenConfig.address);

    if (!apiResults){
      return false;
    }

    const firstResult = apiResults[0];
    const lastResult = apiResults.pop();

    let days = moment(lastResult.timestamp*1000).diff(moment(firstResult.timestamp*1000),'days');
    days = Math.max(days,1);

    const idleTokens = this.functionsUtil.fixTokenDecimals(lastResult.idleSupply,18);
    const firstIdlePrice = this.functionsUtil.fixTokenDecimals(firstResult.idlePrice,this.state.tokenConfig.decimals);
    const lastIdlePrice = this.functionsUtil.fixTokenDecimals(lastResult.idlePrice,this.state.tokenConfig.decimals);
    const aum = this.functionsUtil.formatMoney(parseFloat(idleTokens.times(lastIdlePrice)));
    const earning = lastIdlePrice.div(firstIdlePrice).minus(1).times(100);
    const apr = earning.times(365).div(days).toFixed(2);

    const compoundInfo = this.state.tokenConfig.protocols.filter((p) => { return p.name === 'compound' })[0];
    const firstCompoundData = firstResult.protocolsData.filter((p) => { return p.protocolAddr.toLowerCase() === compoundInfo.address.toLowerCase() })[0];
    const lastCompoundData = lastResult.protocolsData.filter((p) => { return p.protocolAddr.toLowerCase() === compoundInfo.address.toLowerCase() })[0];
    const firstCompoundPrice = this.functionsUtil.fixTokenDecimals(firstCompoundData.price,this.state.tokenConfig.decimals);
    const lastCompoundPrice = this.functionsUtil.fixTokenDecimals(lastCompoundData.price,this.state.tokenConfig.decimals);
    const compoundApr = lastCompoundPrice.div(firstCompoundPrice).minus(1).times(100);
    const delta = earning.minus(compoundApr).times(365).div(days).toFixed(2);

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
        const allocationPerc = allocation.div(totalAllocation).toFixed(this.state.tokenConfig.decimals);

        const prevFirstProtocol = prevRow.protocolsData.filter(prevProtocol => { return prevProtocol.protocolAddr === firstProtocol.protocolAddr })[0];
        const prevAllocation = this.functionsUtil.fixTokenDecimals(prevFirstProtocol.allocation,this.state.tokenConfig.decimals);
        const prevAllocationPerc = prevAllocation.div(prevTotalAllocation).toFixed(this.state.tokenConfig.decimals);


        if (allocationPerc !== prevAllocationPerc){
          rebalances++;
        }
      }
    });

    /*
    const contractTxs = await this.functionsUtil.getEtherscanTxs(this.state.tokenConfig.idle.address,60);
    if (contractTxs){
      const protocolsAddresses = this.state.tokenConfig.protocols.map(p => { return p.address.toLowerCase() });
      const rebalancesTxs = {};
      const processedTxs = {};
      contractTxs.forEach(tx => {
        if (!processedTxs[tx.hash] && !rebalancesTxs[tx.hash]){
          // Filter txs
          const txs = contractTxs.filter(r => r.hash === tx.hash && protocolsAddresses.includes(r.contractAddress.toLowerCase()));
          if (txs.length > 1){
            const firstTx = txs[0];
            const lastTx = txs[txs.length-1];
            // First tx contract differs to the last tx one
            if (firstTx.contractAddress.toLowerCase() !== lastTx.contractAddress.toLowerCase()){
              rebalancesTxs[firstTx.hash] = txs;
            }
          }
          processedTxs[tx.hash] = 1;
        }
      });
      console.log(contractTxs,rebalancesTxs);

      // Take rebalances count
      rebalances = Object.keys(rebalancesTxs).length;
    }
    */

    this.setState({
      aum,
      apr,
      days,
      delta,
      rebalances
    });
  }

  render() {
    return (
      <Flex flexDirection={'column'} p={[3,4]}>
        <Flex width={1} flexDirection={'row'} position={['relative','absolute']} zIndex={10} height={['60px','auto']} left={['auto','0']} px={[0,4]}>
          <Box width={1/2}>
            <RouterLink to="/">
              <Image src="images/logo-gradient.svg"
                height={['35px','48px']}
                position={'relative'} />
            </RouterLink>
          </Box>
          <Flex flexDirection={'row'} width={1/2} justifyContent={'flex-end'}>
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
        <Flex flexDirection={'column'} alignItems={'center'} justifyContent={'center'} mb={[3,3]}>
          <Heading.h3 color={'dark-gray'} textAlign={'center'} fontWeight={4} lineHeight={'initial'} fontSize={[4,5]} mb={[1,2]}>
            Idle Stats - {this.state.selectedToken}
          </Heading.h3>
        </Flex>
        <Flex flexDirection={['column','row']} width={1} mb={[2,3]}>
          <Flex width={[1,1/4]} flexDirection={'column'} pr={[0,2]}>
            <Card my={[2,2]} py={3} pl={0} pr={'10px'} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text.span color={'copyColor'} fontWeight={2} fontSize={'90%'}>AUM</Text.span>
                <Text lineHeight={1} mt={1} color={'copyColor'} fontSize={[4,'26px']} fontWeight={3} textAlign={'center'}>
                  {this.state.aum}
                  <Text.span color={'copyColor'} fontWeight={3} fontSize={['90%','70%']} pl={2}>{this.state.selectedToken}</Text.span>
                </Text>
              </Flex>
            </Card>
          </Flex>
          <Flex width={[1,1/4]} flexDirection={'column'} px={[0,2]}>
            <Card my={[2,2]} py={3} pl={0} pr={'10px'} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text.span color={'copyColor'} fontWeight={2} fontSize={'90%'}>Avg APR</Text.span>
                <Text lineHeight={1} mt={1} color={'copyColor'} fontSize={[4,'26px']} fontWeight={3} textAlign={'center'}>
                  {this.state.apr}
                  <Text.span color={'copyColor'} fontWeight={3} fontSize={['90%','70%']}>%</Text.span>
                </Text>
              </Flex>
            </Card>
          </Flex>
          {
          /*
          <Flex width={[1,1/4]} flexDirection={'column'} px={[0,2]}>
            <Card my={[2,2]} py={3} pl={0} pr={'10px'} borderRadius={'10px'}>
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
            <Card my={[2,2]} py={3} pl={0} pr={'10px'} borderRadius={'10px'}>
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
          <Flex width={[1,1/4]} flexDirection={'column'} px={[0,2]}>
            <Card my={[2,2]} py={3} pl={0} pr={'10px'} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text.span color={'copyColor'} fontWeight={2} fontSize={'90%'}>Rebalances</Text.span>
                <Text lineHeight={1} mt={1} color={'copyColor'} fontSize={[4,'26px']} fontWeight={3} textAlign={'center'}>
                  {this.state.rebalances}
                </Text>
              </Flex>
            </Card>
          </Flex>
          <Flex width={[1,1/4]} flexDirection={'column'} pl={[0,2]}>
            <Card my={[2,2]} py={3} pl={0} pr={'10px'} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text.span color={'copyColor'} fontWeight={2} fontSize={'90%'}>Overperformance on Compound</Text.span>
                <Text lineHeight={1} mt={1} color={'copyColor'} fontSize={[4,'26px']} fontWeight={3} textAlign={'center'}>
                  {this.state.delta}
                  <Text.span color={'copyColor'} fontWeight={3} fontSize={['90%','70%']}>%</Text.span>
                </Text>
              </Flex>
            </Card>
          </Flex>
        </Flex>
        <Flex justifyContent={'space-between'} style={{flexWrap:'wrap'}}>
          <Flex id='chart-AUM' width={[1,0.49]} mb={3}>
            <Card p={[2,3]} pb={0} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                  AUM
                </Text>
                <StatsChart isMobile={this.props.isMobile} web3={this.props.web3} getTokenData={this.getTokenData} chartMode={'AUM'} {...this.state} parentId={'chart-AUM'} height={ 350 } />
              </Flex>
            </Card>
          </Flex>
          <Flex id='chart-PRICE' width={[1,0.49]} mb={3}>
            <Card p={[2,3]} pb={0} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                  Performance
                </Text>
                <StatsChart isMobile={this.props.isMobile} web3={this.props.web3} getTokenData={this.getTokenData} chartMode={'PRICE'} {...this.state} parentId={'chart-PRICE'} height={ 350 } />
              </Flex>
            </Card>
          </Flex>
        </Flex>
        {
          this.state.showAdvanced &&
            <Flex justifyContent={'space-between'} style={{flexWrap:'wrap'}}>
              <Flex id='chart-ALL' width={[1,0.49]} mb={3}>
                <Card p={[2,3]} pb={0} borderRadius={'10px'}>
                  <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                    <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                      Allocation
                    </Text>
                    <StatsChart isMobile={this.props.isMobile} web3={this.props.web3} getTokenData={this.getTokenData} chartMode={'ALL'} {...this.state} parentId={'chart-ALL'} height={ 350 } />
                  </Flex>
                </Card>
              </Flex>
              <Flex id='chart-ALL_PERC' width={[1,0.49]} mb={3}>
                <Card p={[2,3]} pb={0} borderRadius={'10px'}>
                  <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                    <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                      Allocation Percentage
                    </Text>
                    <StatsChart isMobile={this.props.isMobile} web3={this.props.web3} getTokenData={this.getTokenData} chartMode={'ALL_PERC'} {...this.state} parentId={'chart-ALL_PERC'} height={ 350 } />
                  </Flex>
                </Card>
              </Flex>
              <Flex id='chart-APR' width={[1,0.49]} mb={3}>
                <Card p={[2,3]} pb={0} borderRadius={'10px'}>
                  <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                    <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                      APRs
                    </Text>
                    <StatsChart isMobile={this.props.isMobile} web3={this.props.web3} getTokenData={this.getTokenData} chartMode={'APR'} {...this.state} parentId={'chart-APR'} height={ 350 } />
                  </Flex>
                </Card>
              </Flex>
              <Flex id='chart-VOL' width={[1,0.49]} mb={3}>
                <Card p={[2,3]} pb={0} borderRadius={'10px'}>
                  <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                    <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                      Volume
                    </Text>
                    <StatsChart isMobile={this.props.isMobile} web3={this.props.web3} getTokenData={this.getTokenData} chartMode={'VOL'} {...this.state} parentId={'chart-VOL'} height={ 350 } />
                  </Flex>
                </Card>
              </Flex>
            </Flex>
        }

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
            <Card width={1} p={3} borderRadius={'10px'}>
              <Flex justifyContent={'center'}>
                { this.state.showAdvanced ? 'hide' : 'show' } more stats
              </Flex>
            </Card>
          </Link>
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

export default Stats;