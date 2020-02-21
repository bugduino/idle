import moment from 'moment';
import StatsChart from './StatsChart';
import React, { Component } from 'react';
import { Flex, Card, Text, Heading } from 'rimble-ui';
import globalConfigs from '../configs/globalConfigs';
import FunctionsUtil from '../utilities/FunctionsUtil';
import availableTokens from '../configs/availableTokens';

class Stats extends Component {
  state = {
    tokenConfig:null,
    selectedToken:null,
    // startTimestamp:parseInt(moment('2020-02-04','YYYY-MM-DD')._d.getTime()/1000)
    startTimestamp: parseInt(moment().subtract(7,'d')._d.getTime()/1000)
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
  }

  async componentDidUpdate(prevProps) {
    if (prevProps !== this.props){
      await this.componentDidMount();
    }
  }

  render() {
    return (
      <Flex flexDirection={'column'} p={4}>
        <Heading.h3 color={'dark-gray'} textAlign={'center'} fontWeight={4} lineHeight={'initial'} fontSize={[4,5]} mb={4}>
          Idle Finance - {this.state.selectedToken} stats
        </Heading.h3>
        {
          /*
          <Flex flexDirection={['column','row']} width={1}>
            <Flex width={[1,1/4]} flexDirection={'column'}>
              <Card my={[2,2]} py={3} pl={0} pr={'10px'} borderRadius={'10px'}>
                <Flex alignItems={'center'} borderLeft={'1px solid #eee'} justifyContent={'center'} flexDirection={'column'} width={1}>
                  <Text.span color={'copyColor'} fontWeight={2} fontSize={'70%'}>AVG APR</Text.span>
                  <Text lineHeight={1} pl={'10px'} mt={1} color={'copyColor'} fontSize={[4,'26px']} fontWeight={3} textAlign={'center'}>
                    ---
                    <Text.span color={'copyColor'} fontWeight={3} fontSize={['90%','70%']}>%</Text.span>
                  </Text>
                </Flex>
              </Card>
            </Flex>
          </Flex>
          */
        }
        <Flex justifyContent={'space-between'} style={{flexWrap:'wrap'}}>
          <Flex id='chart-AUM' width={[1,0.49]} mb={3}>
            <Card p={[2,3]} pb={0} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                  AUM - {this.state.selectedToken}
                </Text>
                <StatsChart chartMode={'AUM'} {...this.state} parentId={'chart-AUM'} height={ this.props.isMobile ? 450 : 350 } />
              </Flex>
            </Card>
          </Flex>
          <Flex id='chart-VOL' width={[1,0.49]} mb={3}>
            <Card p={[2,3]} pb={0} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                  Volume - {this.state.selectedToken}
                </Text>
                <StatsChart chartMode={'VOL'} {...this.state} parentId={'chart-VOL'} height={ this.props.isMobile ? 450 : 350 } />
              </Flex>
            </Card>
          </Flex>
          <Flex id='chart-VOL' width={[1,0.49]} mb={3}>
            <Card p={[2,3]} pb={0} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                  Allocation - {this.state.selectedToken}
                </Text>
                <StatsChart chartMode={'ALL'} {...this.state} parentId={'chart-VOL'} height={ this.props.isMobile ? 450 : 350 } />
              </Flex>
            </Card>
          </Flex>
          <Flex id='chart-VOL' width={[1,0.49]} mb={3}>
            <Card p={[2,3]} pb={0} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                  Allocation Percentage - {this.state.selectedToken}
                </Text>
                <StatsChart chartMode={'ALL_PERC'} {...this.state} parentId={'chart-VOL'} height={ this.props.isMobile ? 450 : 350 } />
              </Flex>
            </Card>
          </Flex>
          <Flex id='chart-VOL' width={[1,0.49]} mb={3}>
            <Card p={[2,3]} pb={0} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                  APRs - {this.state.selectedToken}
                </Text>
                <StatsChart chartMode={'APR'} {...this.state} parentId={'chart-VOL'} height={ this.props.isMobile ? 450 : 350 } />
              </Flex>
            </Card>
          </Flex>
          <Flex id='chart-VOL' width={[1,0.49]} mb={3}>
            <Card p={[2,3]} pb={0} borderRadius={'10px'}>
              <Flex alignItems={'center'} justifyContent={'center'} flexDirection={'column'} width={1}>
                <Text color={'copyColor'} fontWeight={2} fontSize={3}>
                  Equity Line - {this.state.selectedToken}
                </Text>
                <StatsChart chartMode={'PRICE'} {...this.state} parentId={'chart-VOL'} height={ this.props.isMobile ? 450 : 350 } />
              </Flex>
            </Card>
          </Flex>
        </Flex>
      </Flex>
    );
  }
}

export default Stats;