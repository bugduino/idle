import moment from 'moment';
import StatsChart from './StatsChart';
import React, { Component } from 'react';
import { Flex, Card, Text, Heading } from 'rimble-ui';
import globalConfigs from '../configs/globalConfigs';
import FunctionsUtil from '../utilities/FunctionsUtil';
import availableTokens from '../configs/availableTokens';

class Stats extends Component {
  state = {
    aum:null,
    earning:null,
    tokenConfig:null,
    selectedToken:null,
    startTimestamp:parseInt(moment('2020-02-04','YYYY-MM-DD')._d.getTime()/1000)
    // startTimestamp: parseInt(moment().subtract(7,'d')._d.getTime()/1000)
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

    if (!!params.customToken && currentNetworkAvailableTokens.indexOf(params.customToken.toUpperCase()) !== -1 ){
      newState.selectedToken = params.customToken.toUpperCase();
    } else {
      newState.selectedToken = this.props.selectedToken.toUpperCase();
    }
    newState.tokenConfig = availableTokens[globalConfigs.network.requiredNetwork][newState.selectedToken];

    if (newState !== this.state){
      await this.setState(newState);
    }
  }

  componentWillMount() {
    this.loadUtils();
  }

  componentWillUnmount(){
    document.getElementById('crisp-custom-style').remove();
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

    const idleTokens = this.functionsUtil.fixTokenDecimals(lastResult.idleSupply,18);
    const firstIdlePrice = this.functionsUtil.fixTokenDecimals(firstResult.idlePrice,this.state.tokenConfig.decimals);
    const lastIdlePrice = this.functionsUtil.fixTokenDecimals(lastResult.idlePrice,this.state.tokenConfig.decimals);
    const aum = parseInt(idleTokens.times(lastIdlePrice));
    const apr = lastIdlePrice.div(firstIdlePrice).minus(1).times(100).toFixed(2);
    const days = moment(lastResult.timestamp*1000).diff(moment(firstResult.timestamp*1000),'days');

    const compoundInfo = this.state.tokenConfig.protocols.filter((p) => { return p.name === 'compound' })[0];
    const firstCompoundData = firstResult.protocolsData.filter((p) => { return p.protocolAddr.toLowerCase() === compoundInfo.address.toLowerCase() })[0];
    const lastCompoundData = lastResult.protocolsData.filter((p) => { return p.protocolAddr.toLowerCase() === compoundInfo.address.toLowerCase() })[0];
    const firstCompoundPrice = this.functionsUtil.fixTokenDecimals(firstCompoundData.price,this.state.tokenConfig.decimals);
    const lastCompoundPrice = this.functionsUtil.fixTokenDecimals(lastCompoundData.price,this.state.tokenConfig.decimals);
    const compoundApr = lastCompoundPrice.div(firstCompoundPrice).minus(1).times(100).toFixed(2);
    const delta = (parseFloat(apr)-parseFloat(compoundApr)).toFixed(2);

    this.setState({
      aum,
      apr,
      days,
      delta
    });
  }

  render() {
    return (
      <Flex flexDirection={'column'} p={4}>
        <Heading.h3 color={'dark-gray'} textAlign={'center'} fontWeight={4} lineHeight={'initial'} fontSize={[4,5]} mb={4}>
          Idle Finance - {this.state.selectedToken} stats
        </Heading.h3>
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
                <Text.span color={'copyColor'} fontWeight={2} fontSize={'90%'}>Earnings</Text.span>
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
                <Text.span color={'copyColor'} fontWeight={2} fontSize={'90%'}>Delta</Text.span>
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
                <StatsChart chartMode={'AUM'} {...this.state} parentId={'chart-AUM'} height={ this.props.isMobile ? 450 : 350 } />
              </Flex>
            </Card>
          </Flex>
          <Flex id='chart-VOL' width={[1,0.49]} mb={[3,4]}>
            <Card p={[2,3]} pb={0} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                  Volume - {this.state.selectedToken}
                </Text>
                <StatsChart chartMode={'VOL'} {...this.state} parentId={'chart-VOL'} height={ this.props.isMobile ? 450 : 350 } />
              </Flex>
            </Card>
          </Flex>
          <Flex id='chart-ALL' width={[1,0.49]} mb={[3,4]}>
            <Card p={[2,3]} pb={0} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                  Allocation - {this.state.selectedToken}
                </Text>
                <StatsChart chartMode={'ALL'} {...this.state} parentId={'chart-ALL'} height={ this.props.isMobile ? 450 : 350 } />
              </Flex>
            </Card>
          </Flex>
          <Flex id='chart-ALL_PERC' width={[1,0.49]} mb={[3,4]}>
            <Card p={[2,3]} pb={0} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                  Allocation Percentage - {this.state.selectedToken}
                </Text>
                <StatsChart chartMode={'ALL_PERC'} {...this.state} parentId={'chart-ALL_PERC'} height={ this.props.isMobile ? 450 : 350 } />
              </Flex>
            </Card>
          </Flex>
          <Flex id='chart-APR' width={[1,0.49]} mb={[3,4]}>
            <Card p={[2,3]} pb={0} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                  APRs - {this.state.selectedToken}
                </Text>
                <StatsChart chartMode={'APR'} {...this.state} parentId={'chart-APR'} height={ this.props.isMobile ? 450 : 350 } />
              </Flex>
            </Card>
          </Flex>
          <Flex id='chart-PRICE' width={[1,0.49]} mb={[3,4]}>
            <Card p={[2,3]} pb={0} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                  Equity Line - {this.state.selectedToken}
                </Text>
                <StatsChart chartMode={'PRICE'} {...this.state} parentId={'chart-PRICE'} height={ this.props.isMobile ? 450 : 350 } />
              </Flex>
            </Card>
          </Flex>
        </Flex>
      </Flex>
    );
  }
}

export default Stats;