import moment from 'moment';
import StatsChart from './StatsChart';
import React, { Component } from 'react';
import ButtonGroup from '../ButtonGroup/ButtonGroup';
import globalConfigs from '../configs/globalConfigs';
import { Link as RouterLink } from "react-router-dom";
import FunctionsUtil from '../utilities/FunctionsUtil';
import TokenSelector from '../TokenSelector/TokenSelector';
import DateRangeModal from '../utilities/components/DateRangeModal';
import { Box, Flex, Card, Text, Heading, Image, Button } from 'rimble-ui';

class Stats extends Component {
  state = {
    aum:null,
    apr:null,
    days:'-',
    delta:null,
    earning:null,
    buttonGroup:[],
    startTimestamp:null,
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

    newState.startTimestampObj = moment(globalConfigs.stats.tokens[newState.selectedToken].startTimestamp,'YYYY-MM-DD');
    newState.startTimestamp = parseInt(newState.startTimestampObj._d.getTime()/1000);

    if (newState !== this.state){
      await this.setState(newState);
    }
  }

  componentWillMount() {
    this.loadUtils();
    this.loadParams();
  }

  componentWillUnmount(){
    document.getElementById('crisp-custom-style').remove();
  }

  setDateRangeModal = (dateRangeModalOpened) => {
    if (dateRangeModalOpened !== this.state.dateRangeModalOpened){
      this.setState({
        dateRangeModalOpened
      });
    }
  }

  updateButtonGroup = async () => {

    const buttonGroup = [
      {
        component:Button,
        props:{
          icon:'Today',
          iconpos:'right',
          color:'dark-gray',
          mainColor:'transparent',
          contrastColor:'dark-gray',
          onClick: (e) => this.setDateRangeModal(true)
        },
        value:'SELECT DATE'
      },
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
    ];

    await this.setState({
      buttonGroup
    });
  }

  async componentDidMount() {

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

  async componentDidUpdate(prevProps) {
    if (prevProps !== this.props){
      await this.componentDidMount();
    }
  }

  getTokenData = async (address) => {
    const apiInfo = globalConfigs.stats.rates;
    const endpoint = `${apiInfo.endpoint}${address}`;
    const TTL = apiInfo.TTL ? apiInfo.TTL : 0;
    let output = await this.functionsUtil.makeCachedRequest(endpoint,TTL,true);
    return output.filter((r,i) => { return r.timestamp >= this.state.startTimestamp });
  }

  loadApiData = async () => {
    const apiResults = await this.getTokenData(this.state.tokenConfig.address);

    if (!apiResults){
      return false;
    }

    const firstResult = apiResults[0];
    const lastResult = apiResults.pop();

    const days = moment(lastResult.timestamp*1000).diff(moment(firstResult.timestamp*1000),'days');
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
    const compoundApr = lastCompoundPrice.div(firstCompoundPrice).minus(1).times(100).toFixed(2);
    const delta = (parseFloat(earning)-parseFloat(compoundApr)).toFixed(2);

    this.setState({
      aum,
      apr,
      days,
      delta
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
          <Flex width={1/2} justifyContent={'flex-end'}>
            <ButtonGroup
              isMobile={this.props.isMobile}
              components={this.state.buttonGroup}
              theme={'light'}
            />
          </Flex>
        </Flex>
        <Flex alignItems={'center'} justifyContent={'center'}>
          <Heading.h3 color={'dark-gray'} textAlign={'center'} fontWeight={4} lineHeight={'initial'} fontSize={[4,5]} mb={[3,4]}>
            {this.state.selectedToken} stats
          </Heading.h3>
        </Flex>
        <Flex flexDirection={['column','row']} width={1}>
          <Flex width={[1,1/4]} flexDirection={'column'}>
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
          <Flex width={[1,1/4]} flexDirection={'column'} pl={[0,2]}>
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
          <Flex width={[1,1/4]} flexDirection={'column'} pl={[0,2]}>
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
          */
          }
          <Flex width={[1,1/4]} flexDirection={'column'} pl={[0,2]}>
            <Card my={[2,2]} py={3} pl={0} pr={'10px'} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text.span color={'copyColor'} fontWeight={2} fontSize={'90%'}>Days Live</Text.span>
                <Text lineHeight={1} mt={1} color={'copyColor'} fontSize={[4,'26px']} fontWeight={3} textAlign={'center'}>
                  {this.state.days}
                </Text>
              </Flex>
            </Card>
          </Flex>
          <Flex width={[1,1/4]} flexDirection={'column'} pl={[0,2]}>
            <Card my={[2,2]} py={3} pl={0} pr={'10px'} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text.span color={'copyColor'} fontWeight={2} fontSize={'90%'}>Delta on Compound</Text.span>
                <Text lineHeight={1} mt={1} color={'copyColor'} fontSize={[4,'26px']} fontWeight={3} textAlign={'center'}>
                  {this.state.delta}
                  <Text.span color={'copyColor'} fontWeight={3} fontSize={['90%','70%']}>%</Text.span>
                </Text>
              </Flex>
            </Card>
          </Flex>
        </Flex>
        <Flex justifyContent={'space-between'} style={{flexWrap:'wrap'}}>
          <Flex id='chart-AUM' width={[1,0.49]} mb={[3,4]}>
            <Card p={[2,3]} pb={0} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                  AUM - {this.state.selectedToken}
                </Text>
                <StatsChart chartMode={'AUM'} {...this.state} parentId={'chart-AUM'} height={ 350 } />
              </Flex>
            </Card>
          </Flex>
          <Flex id='chart-PRICE' width={[1,0.49]} mb={[3,4]}>
            <Card p={[2,3]} pb={0} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                  Performance - {this.state.selectedToken}
                </Text>
                <StatsChart chartMode={'PRICE'} {...this.state} parentId={'chart-PRICE'} height={ 350 } />
              </Flex>
            </Card>
          </Flex>
          <Flex id='chart-ALL' width={[1,0.49]} mb={[3,4]}>
            <Card p={[2,3]} pb={0} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                  Allocation - {this.state.selectedToken}
                </Text>
                <StatsChart chartMode={'ALL'} {...this.state} parentId={'chart-ALL'} height={ 350 } />
              </Flex>
            </Card>
          </Flex>
          <Flex id='chart-ALL_PERC' width={[1,0.49]} mb={[3,4]}>
            <Card p={[2,3]} pb={0} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                  Allocation Percentage - {this.state.selectedToken}
                </Text>
                <StatsChart chartMode={'ALL_PERC'} {...this.state} parentId={'chart-ALL_PERC'} height={ 350 } />
              </Flex>
            </Card>
          </Flex>
          <Flex id='chart-APR' width={[1,0.49]} mb={[3,4]}>
            <Card p={[2,3]} pb={0} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                  APRs - {this.state.selectedToken}
                </Text>
                <StatsChart chartMode={'APR'} {...this.state} parentId={'chart-APR'} height={ 350 } />
              </Flex>
            </Card>
          </Flex>
          <Flex id='chart-VOL' width={[1,0.49]} mb={[3,4]}>
            <Card p={[2,3]} pb={0} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                  Volume - {this.state.selectedToken}
                </Text>
                <StatsChart chartMode={'VOL'} {...this.state} parentId={'chart-VOL'} height={ 350 } />
              </Flex>
            </Card>
          </Flex>
        </Flex>

        <DateRangeModal
          isOpen={this.props.dateRangeModalOpened}
          closeModal={this.setDateRangeModal(false)} />
      </Flex>
    );
  }
}

export default Stats;