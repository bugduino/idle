import Title from '../Title/Title';
import CountUp from 'react-countup';
import { Box, Text } from "rimble-ui";
import React, { Component } from 'react';
import FunctionsUtil from '../utilities/FunctionsUtil';

class AssetsUnderManagement extends Component {

  state = {
    totalAUM:null,
    totalAUMEndOfYear:null
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

  async componentWillMount(){
    this.loadUtils();
    this.loadTotalAUM();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
    const contractsInitialized = prevProps.contractsInitialized !== this.props.contractsInitialized;
    const availableStrategiesChanged = !prevProps.availableStrategies && JSON.stringify(prevProps.availableStrategies) !== JSON.stringify(this.props.availableStrategies);
    if (availableStrategiesChanged || contractsInitialized){
      this.loadTotalAUM();
    }
  }

  async loadTotalAUM(){

    if (!this.props.availableStrategies || !this.props.contractsInitialized){
      return true;
    }

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

  render() {
    return this.state.totalAUM ? (
      <Box
        width={1}
      >
        <CountUp
          delay={0}
          decimals={4}
          decimal={'.'}
          separator={''}
          useEasing={false}
          duration={31536000}
          start={parseFloat(this.state.totalAUM)}
          end={parseFloat(this.state.totalAUMEndOfYear)}
          formattingFn={ n => '$ '+this.functionsUtil.formatMoney(n,4) }
        >
          {({ countUpRef, start }) => (
            <span
              style={ this.props.counterStyle ? this.props.counterStyle : {
                display:'block',
                color:'dark-gray',
                whiteSpace:'nowrap',
                fontFamily:this.props.theme.fonts.counter,
                fontWeight:this.props.theme.fontWeights[5],
                textAlign: this.props.isMobile ? 'center' : 'right',
                fontSize: this.props.isMobile ? '1.6em' : this.props.theme.fontSizes[6]
              }}
              ref={countUpRef}
            />
          )}
        </CountUp>
        {
          (typeof this.props.subtitle === 'undefined' || this.props.subtitle) && (
            <Title
              fontWeight={3}
              fontSize={[2,2]}
              color={'cellTitle'}
              textAlign={['center','right']}
              {...this.props.subtitleProps}
            >
              {
                this.props.subtitle ? this.props.subtitle : (
                  <Text.span fontWeight={'inherit'} color={'inherit'} fontSize={'inherit'}>Assets Under Management <Text.span color={'cellTitle'} fontWeight={3} fontSize={'70%'}>(V3 + V4)</Text.span></Text.span>
                )
              }
            </Title>
          )
        }
      </Box>
    ) : null;
  }
}

export default AssetsUnderManagement;
