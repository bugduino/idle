import theme from '../theme';
import { Bar } from '@nivo/bar';
import React, { Component } from 'react';
import AssetField from '../AssetField/AssetField';
import RoundButton from '../RoundButton/RoundButton';
import FunctionsUtil from '../utilities/FunctionsUtil';
import GenericChart from '../GenericChart/GenericChart';
import DashboardCard from '../DashboardCard/DashboardCard';
import { Flex, Text, Input, Icon, Tooltip } from "rimble-ui";

class EstimatedEarnings extends Component {

  state = {
    tokenApy:null,
    chartData:null,
    chartProps:null,
    inputValue:1000,
    maxInputValue:999999999999999
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

  async componentWillMount(){
    this.loadUtils();
  }

  async componentDidMount(){
    this.loadChart();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    const tokenChanged = prevProps.selectedToken !== this.props.selectedToken;
    if (tokenChanged){
      this.loadChart();
    }
  }

  async getTokenApy(){
    const tokenApy = this.state.tokenApy || await this.functionsUtil.getTokenApy(this.props.tokenConfig);
    if (this.state.tokenApy !== tokenApy){
      this.setState({
        tokenApy
      });
    }
    return tokenApy;
  }

  async loadChart(){

    const tokenApy = await this.getTokenApy();

    const amount = this.functionsUtil.BNify(this.state.inputValue);
    const earningsYear = amount.times(tokenApy.div(100));

    const amountMonth = parseFloat(earningsYear.div(12));
    const amount3Months = parseFloat(earningsYear.div(4));
    const amount6Months = parseFloat(earningsYear.div(2));
    const amountYear = parseFloat(earningsYear.div(1));

    const chartData = [
      {
        perc:1/12,
        label:'MONTH',
        value:amountMonth,
        month:amountMonth,
        color:this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.selectedToken,'color','rgb']).join(','),
        monthColor:'hsl('+this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.selectedToken,'color','hsl']).join(',')+')',
      },
      {
        perc:3/12,
        label:'3 MONTHS',
        value:amount3Months,
        month3:amount3Months,
        color:this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.selectedToken,'color','rgb']).join(','),
        month3Color:'hsl('+this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.selectedToken,'color','hsl']).join(',')+')',
      },
      {
        perc:6/12,
        label:'6 MONTHS',
        value:amount6Months,
        month6:amount6Months,
        color:this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.selectedToken,'color','rgb']).join(','),
        month6Color:'hsl('+this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.selectedToken,'color','hsl']).join(',')+')',
      },
      {
        perc:1,
        label:'YEAR',
        year:amountYear,
        value:amountYear,
        color:this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.selectedToken,'color','rgb']).join(','),
        yearColor:'hsl('+this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.selectedToken,'color','hsl']).join(',')+')',
      }
    ];

    let labelTextColorModifiers = this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.selectedToken,'chart','labelTextColorModifiers']);

    const maxGridLines = 4;
    const gridYStep = amountYear/maxGridLines;
    const gridYValues = [0];
    for (let i=1;i<=maxGridLines;i++){
      const gridYValue = i*gridYStep;
      gridYValues.push(gridYValue);
    }

    const chartProps = {
      padding: 0.2,
      animate: false,
      indexBy: 'label',
      // enableLabel: false,
      labelSkipWidth: 16,
      labelSkipHeight: 16,
      keys: ['month','month3','month6','year'],
      colors: ({ id, data }) => data[`${id}Color`],
      label: d => this.functionsUtil.abbreviateNumber(d.value,2,4)+' '+this.props.selectedToken,
      labelTextColor: labelTextColorModifiers ? { from: 'color', modifiers: [ labelTextColorModifiers ] } : null,
      isInteractive:false,
      minValue:0,
      gridYValues,
      // maxValue:amountYear,
      axisLeft:{
        format: v => this.functionsUtil.abbreviateNumber(v,1,3),
        tickValues:gridYValues,
        orient: 'left',
        tickSize: 0,
        tickPadding: 5,
        tickRotation: 0,
        legend: '',
        legendPosition: 'middle'
      },
      axisBottom:{
        legend: '',
        tickSize:0,
        tickPadding: 15,
        orient: 'bottom',
      },
      theme:{
        labels:{
          text:{
            fontSize:15,
            fontWeight:600,
            fill:theme.colors.counter,
            fontFamily: theme.fonts.sansSerif
          }
        },
        axis: {
          ticks: {
            text: {
              fontSize:14,
              fontWeight:600,
              fill:theme.colors.legend,
              fontFamily: theme.fonts.sansSerif
            }
          }
        },
        grid: {
          line: {
            stroke: '#dbdbdb', strokeDasharray: '9 5'
          }
        },
      },
      margin: this.props.isMobile ? { top: 0, right: 0, bottom: 30, left: 0 } : { top: 10, right: 0, bottom: 50, left: 65 }
    }

    this.setState({
      chartData,
      chartProps
    });
  }

  changeInputValue(e){
    let inputValue = e.target.value.length && !isNaN(e.target.value) ? Math.min(this.state.maxInputValue,parseFloat(e.target.value)) : 0;
    inputValue = this.functionsUtil.BNify(inputValue);
    this.setState({
      inputValue
    });
  }

  render() {

    if (!this.props.selectedToken || !this.props.tokenConfig){
      return null;
    }

    const idleTokenEnabled = this.functionsUtil.getGlobalConfig(['govTokens','IDLE','enabled']);
    const showAPYDisclaimer = idleTokenEnabled && this.functionsUtil.getGlobalConfig(['govTokens','IDLE','showAPR']);

    return (
      <DashboardCard
        cardProps={{
          p:[3,4]
        }}
      >
        <Flex
          width={1}
          flexDirection={['column','row']}
        >
          <Flex
            width={[1,0.3]}
            flexDirection={'column'}
            justifyContent={'flex-start'}
          >
            <Flex
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={'center'}
            >
              <AssetField
                token={this.props.selectedToken}
                fieldInfo={{
                  name:'icon',
                  props:{
                    mb:2,
                    height:'2.5em'
                  }
                }}
              />
              <Text
                fontSize={2}
                color={'cellText'}
                textAlign={'center'}
              >
                Set the amount and see your estimated earnings on time based on the current APY: { this.state.tokenApy ? `${this.state.tokenApy.toFixed(2)}%` : null}
                {
                  showAPYDisclaimer && 
                    <Flex
                      style={{
                        display:'inline-flex',
                        verticalAlign:'middle'
                      }}
                    >
                      <Tooltip
                        placement={'top'}
                        message={this.functionsUtil.getGlobalConfig(['messages','apyLong'])}
                      >
                        <Icon
                          ml={1}
                          name={"Info"}
                          size={'1em'}
                          color={'cellTitle'}
                        />
                      </Tooltip>
                    </Flex>
                }
              </Text>
            </Flex>
            <Flex
              mt={3}
              flexDirection={'column'}
            >
              <Input
                min={0}
                max={this.state.maxInputValue}
                type={"number"}
                required={true}
                height={['3em','3.4em']}
                borderRadius={2}
                fontWeight={500}
                textAlign={'center'}
                boxShadow={'none !important'}
                onChange={this.changeInputValue.bind(this)}
                border={`1px solid ${theme.colors.divider}`}
                placeholder={`Insert ${this.props.selectedToken.toUpperCase()} amount`}
                value={this.state.inputValue && !isNaN(this.state.inputValue) ? this.state.inputValue : ''}
              />
            </Flex>
            <Flex
              mt={3}
              justifyContent={'center'}
            >
              <RoundButton
                buttonProps={{
                  width:[1,1/2],
                }}
                handleClick={this.loadChart.bind(this)}
              >
                CALCULATE
              </RoundButton>
            </Flex>
          </Flex>
          <Flex
            mt={[3,0]}
            width={[1,0.7]}
            id={'estimated-earnings-chart'}
          >
            {
              this.props.isMobile ? (
                <Flex
                  width={1}
                  flexDirection={'column'}
                >
                  {
                    this.state.chartData !== null && this.state.chartData.map((v,index) => (
                      <Flex
                        py={2}
                        my={2}
                        width={1}
                        flexDirection={'row'}
                        key={`earnings_${index}`}
                      >
                        <Flex
                          width={0.35}
                          alignItems={'center'}
                          justifyContent={'flex-start'}
                        >
                          <Text
                            fontSize={1}
                            fontWeight={3}
                            color={'legend'}
                          >
                            {v.label}
                          </Text>
                        </Flex>
                        <Flex
                          width={0.65}
                          position={'relative'}
                          alignItems={'center'}
                          minHeight={['20px','35px']}
                          justifyContent={'center'}
                        >
                          <Flex
                            zIndex={1}
                            position={'relative'}
                            alignItems={'center'}
                            flexDirection={'column'}
                            justifyContent={'center'}
                          >
                            <Text
                              fontSize={1}
                              fontWeight={3}
                              color={'counter'}
                            >
                              {this.functionsUtil.abbreviateNumber(v.value,2,4)} {this.props.selectedToken}
                            </Text>
                          </Flex>
                          <Flex
                            right={0}
                            width={v.perc}
                            position={'absolute'}
                            height={['20px','35px']}
                            borderRadius={['20px 0 0 20px','35px 0 0 35px']}
                            style={{background:`linear-gradient(-90deg, rgba(${v.color},0) 0%, rgba(${v.color},1) 100%)`}}
                          ></Flex>
                        </Flex>
                      </Flex>
                    ))
                  }
                </Flex>
              ) : (
                <GenericChart
                  type={Bar}
                  height={250}
                  showLoader={true}
                  {...this.state.chartProps}
                  data={this.state.chartData}
                  parentId={'estimated-earnings-chart'}
                />
              )
            }
          </Flex>
        </Flex>
      </DashboardCard>
    );
  }
}

export default EstimatedEarnings;