import theme from '../theme';
import { Pie } from '@nivo/pie';
import { Flex, Text } from "rimble-ui";
import React, { Component } from 'react';
import AssetField from '../AssetField/AssetField';
import SmartNumber from '../SmartNumber/SmartNumber';
import globalConfigs from '../configs/globalConfigs';
import FunctionsUtil from '../utilities/FunctionsUtil';
import GenericChart from '../GenericChart/GenericChart';

class PortfolioDonut extends Component {
  state = {
    chartData:null,
    totalFunds:null,
    parentWidth:null,
    selectedToken:null
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

  componentWillMount() {
  }

  componentWillUnmount() {
  }

  async componentDidMount(){
    this.loadUtils();
    this.loadPortfolio();
  }

  loadIcons(prevState){
    const iconSize = parseInt(this.state.parentWidth*0.065)

    if (prevState.chartData !== this.state.chartData){
      const $radialLabels = window.jQuery(`#${this.props.parentId} text`).filter((index,label) => { return !isNaN(label.innerHTML); });
      $radialLabels.each((index,label) => {
        const token = Object.keys(this.props.availableTokens)[parseInt(label.innerHTML)];
        const $g = window.jQuery(label).parent('g');
        if (token && $g.length){
          $g.get(0).innerHTML = `<image href="images/tokens/${token}.svg" x="-${iconSize/2}" y="-${iconSize/2}" width="${iconSize}" height="${iconSize}" />`;
        }
      });
    }
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();
  }

  async loadPortfolio() {

    const portfolio = {};
    let totalFunds = this.functionsUtil.BNify(0);

    await this.functionsUtil.asyncForEach(Object.keys(this.props.availableTokens),async (token) => {
      const tokenConfig = this.props.availableTokens[token];
      const idleTokenBalance = await this.functionsUtil.getTokenBalance(tokenConfig.idle.token,this.props.account);
      if (idleTokenBalance){
        const tokenPrice = await this.functionsUtil.getIdleTokenPrice(tokenConfig);
        const tokenBalance = idleTokenBalance.times(tokenPrice);

        portfolio[token] = tokenBalance;

        // Increment total balance
        totalFunds = totalFunds.plus(tokenBalance);
      }
    });

    const chartData = [];

    Object.keys(portfolio).forEach(token => {
      const tokenBalance = portfolio[token];
      if (tokenBalance.gt(0)){
        const tokenPercentage = tokenBalance.div(totalFunds).times(100);
        chartData.push({
          id:token,
          label:token.substr(0,1).toUpperCase()+token.substr(1),
          value:Math.round(tokenPercentage),
          color:'hsl('+globalConfigs.stats.tokens[token.toUpperCase()].color.hsl.join(',')+')'
        });
      }
    });

    this.setState({
      portfolio,
      chartData,
      totalFunds
    });
  }

  render() {

    const chartProps = {
      padAngle:0,
      animate:true,
      borderWidth:0,
      cornerRadius:0,
      innerRadius:0.65,
      motionDamping:15,
      motionStiffness:90,
      colors:d => d.color,
      tooltipFormat: v => v+'%',
      sliceLabel: d => {
        if (parseFloat(d.value)>=5){
          return d.value+'%';
        } else {
          return null;
        }
      },
      radialLabel: d => {
        return null;//Object.keys(this.props.availableTokens).indexOf(d.label.toUpperCase());
      },
      theme:{
        tooltip: {
          container: {
            display: 'none'
          },
        },
        labels:{
          text:{
            fontSize:16,
            fontWeight:500,
            fontFamily: theme.fonts.sansSerif
          }
        },
        legends:{
          text:{
            fontSize:13,
            fontWeight:500,
            fontFamily: theme.fonts.sansSerif
          }
        }
      },
      slicesLabelsSkipAngle:5,
      slicesLabelsTextColor:'#fff',
      radialLabelsLinkStrokeWidth:0,
      radialLabelsTextColor:'#333',
      radialLabelsSkipAngle:10,
      radialLabelsTextXOffset:0,
      radialLabelsLinkOffset:-parseInt(this.state.parentWidth*0.2),
      radialLabelsLinkDiagonalLength:0,
      radialLabelsLinkHorizontalLength:0,
      radialLabelsLinkColor:{ from: 'color' },
      margin:{ top: 30, right: 50, bottom: 60, left: 50 },
      onMouseEnter:(data, e) => {
        this.setState({
          selectedToken:data.id
        });
      },
      onMouseLeave:(data, e) => {
        this.setState({
          selectedToken:null
        });
      },
      legends:[
        {
          itemWidth: 60,
          itemHeight: 18,
          translateY: 50,
          symbolSize: 10,
          anchor: 'bottom',
          direction: 'row',
          itemTextColor: theme.colors.legend,
          symbolShape: 'circle',
          effects: [
            {
              on: 'hover',
              style: {
                itemTextColor: '#000'
              }
            }
          ]
        }
      ]
    };

    const selectedToken = this.state.selectedToken !== null && this.state.portfolio[this.state.selectedToken] ? this.state.portfolio[this.state.selectedToken] : false;

    return (
      <Flex
        width={1}
      >
        { 
          (this.state.totalFunds || selectedToken) && 
            <Flex
              zIndex={0}
              top={'35%'}
              left={'27%'}
              width={'46%'}
              height={'35%'}
              textAlign={'center'}
              alignItems={'center'}
              position={'absolute'}
              flexDirection={'column'}
              justifyContent={'center'}
            >
              {
                selectedToken ? (
                  <>
                    <AssetField
                      token={this.state.selectedToken}
                      fieldInfo={{
                        name:'icon',
                        props:{
                          mb:1,
                          height:'2.2em'
                        }
                      }}
                    />
                    <SmartNumber
                      fontSize={4}
                      decimals={3}
                      fontWeight={4}
                      maxPrecision={5}
                      number={this.state.portfolio[this.state.selectedToken]}
                    />
                    <Text
                      fontSize={2}
                      fontWeight={3}
                      color={'cellTitle'}
                    >
                      {this.state.selectedToken}
                    </Text>
                  </>
                ) : (
                  <>
                    <SmartNumber
                      unit={'$'}
                      unitProps={{
                        ml:2,
                        fontSize:4,
                        fontWeight:3
                      }}
                      fontSize={4}
                      decimals={3}
                      fontWeight={4}
                      maxPrecision={5}
                      number={this.state.totalFunds}
                    />
                    <Text
                      fontSize={2}
                      fontWeight={3}
                      color={'cellTitle'}
                    >
                      Total funds
                    </Text>
                  </>
                )
              }
            </Flex>
        }
        <GenericChart
          type={Pie}
          {...chartProps}
          showLoader={true}
          parentId={this.props.parentId}
          parentIdHeight={this.props.parentId}
          data={this.state.chartData}
        />
      </Flex>
    );
  }
}

export default PortfolioDonut;
