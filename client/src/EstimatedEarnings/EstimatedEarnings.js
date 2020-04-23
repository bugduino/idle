import theme from '../theme';
import { Bar } from '@nivo/bar';
import React, { Component } from 'react';
import AssetField from '../AssetField/AssetField';
import RoundButton from '../RoundButton/RoundButton';
import { Flex, Text, Input } from "rimble-ui";
import FunctionsUtil from '../utilities/FunctionsUtil';
import GenericChart from '../GenericChart/GenericChart';
import DashboardCard from '../DashboardCard/DashboardCard';

class EstimatedEarnings extends Component {

  state = {
    tokenApy:null,
    chartData:null,
    chartProps:null,
    inputValue:100,
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
    const tokenApy = await this.functionsUtil.getTokenApy(this.props.tokenConfig);
    this.setState({
      tokenApy
    },() => {
      this.loadChart();
    });
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    const tokenChanged = prevProps.selectedToken !== this.props.selectedToken;
    if (tokenChanged){
      this.componentDidMount();
    }
  }

  loadChart(){

    const amount = this.functionsUtil.BNify(this.state.inputValue);
    const earningsYear = amount.times(this.state.tokenApy);

    const amountMonth = parseFloat(earningsYear.div(12));
    const amount3Months = parseFloat(earningsYear.div(4));
    const amount6Months = parseFloat(earningsYear.div(2));
    const amountYear = parseFloat(earningsYear.div(1));

    const chartData = [
      {
        label:'MONTH',
        month:amountMonth,
        monthColor:'hsl('+ this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.selectedToken,'color','hsl']).join(',')+')',
      },
      {
        label:'3 MONTHS',
        month3:amount3Months,
        month3Color:'hsl('+ this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.selectedToken,'color','hsl']).join(',')+')',
      },
      {
        label:'6 MONTHS',
        month6:amount6Months,
        month6Color:'hsl('+ this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.selectedToken,'color','hsl']).join(',')+')',
      },
      {
        label:'YEAR',
        year:amountYear,
        yearColor:'hsl('+ this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.selectedToken,'color','hsl']).join(',')+')',
      }
    ];

    let labelTextColorModifiers = this.functionsUtil.getGlobalConfig(['stats','tokens',this.props.selectedToken,'chart','labelTextColorModifiers']);

    const chartProps = {
      padding: 0.2,
      animate: false,
      indexBy: 'label',
      // enableLabel: false,
      labelSkipWidth: 16,
      labelSkipHeight: 16,
      keys: ['month','month3','month6','year'],
      labelTextColor: labelTextColorModifiers ? { from: 'color', modifiers: [ labelTextColorModifiers ] } : null,
      label: d => this.functionsUtil.abbreviateNumber(d.value,2,4)+' '+this.props.selectedToken,
      colors: ({ id, data }) => data[`${id}Color`],
      isInteractive:false,
      minValue:0,
      maxValue:amountYear,
      axisLeft:{
        format: v => this.functionsUtil.abbreviateNumber(v,1),
        tickValues:4,
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
      margin:{ top: 10, right: 0, bottom: 50, left: 65 },
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
    return (
      <DashboardCard
        cardProps={{
          px:4,
          py:4
        }}
      >
        <Flex
          width={1}
          flexDirection={'row'}
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
                Set the amount and see your estimated earnings on time
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
                height={'3.4em'}
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
            width={[1,0.7]}
            id="estimated-earnings-container"
          >
            <GenericChart
              type={Bar}
              height={250}
              showLoader={true}
              {...this.state.chartProps}
              data={this.state.chartData}
              parentId={'estimated-earnings-container'}
            />
          </Flex>
        </Flex>
      </DashboardCard>
    );
  }
}

export default EstimatedEarnings;