import theme from '../theme';
import { Pie } from '@nivo/pie';
import React, { Component } from 'react';
import globalConfigs from '../configs/globalConfigs';
import FunctionsUtil from '../utilities/FunctionsUtil';
import GenericChart from '../GenericChart/GenericChart';

class PortfolioDonut extends Component {
  state = {
    chartData:null,
    parentWidth:null
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
    window.addEventListener('resize', this.handleWindowSizeChange.bind(this));
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowSizeChange);
  }

  async componentDidMount(){
    this.loadUtils();
    this.loadPortfolio();
    this.handleWindowSizeChange();
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();
    this.handleWindowSizeChange();

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

  handleWindowSizeChange(){
    if (this.props.parentId){
      const chartContainer = document.getElementById(this.props.parentId);
      if (chartContainer && chartContainer.offsetWidth !== this.state.parentWidth){
        const parentWidth = parseFloat(chartContainer.offsetWidth)>0 ? chartContainer.offsetWidth : 0;
        return this.setState({
          parentWidth
        });
      }
    }
  };

  async loadPortfolio() {

    const portfolio = {};
    let totalBalance = this.functionsUtil.BNify(0);

    await this.functionsUtil.asyncForEach(Object.keys(this.props.availableTokens),async (token) => {
      const tokenConfig = this.props.availableTokens[token];
      const idleTokenBalance = await this.functionsUtil.getTokenBalance(tokenConfig.idle.token,this.props.account);
      if (idleTokenBalance){
        portfolio[token] = idleTokenBalance;
        // Increment total balance
        totalBalance = totalBalance.plus(idleTokenBalance);
      }
    });

    const chartData = [];

    Object.keys(portfolio).forEach(token => {
      const tokenBalance = portfolio[token];
      if (tokenBalance.gt(0)){
        const tokenPercentage = tokenBalance.div(totalBalance).times(100);
        chartData.push({
          id:token,
          label:token.substr(0,1).toUpperCase()+token.substr(1),
          value:Math.round(tokenPercentage),
          color:'hsl('+globalConfigs.stats.tokens[token.toUpperCase()].color.hsl.join(',')+')'
        });
      }
    });
      
    /*
    const chartData = [
      {
        id:'DAI',
        label:'DAI'.substr(0,1).toUpperCase()+'DAI'.substr(1),
        value:parseFloat(5),
        color:'hsl('+globalConfigs.stats.tokens['DAI'.toUpperCase()].color.hsl.join(',')+')'
      },
      {
        id:'USDC',
        label:'USDC'.substr(0,1).toUpperCase()+'USDC'.substr(1),
        value:parseFloat(95),
        color:'hsl('+globalConfigs.stats.tokens['USDC'.toUpperCase()].color.hsl.join(',')+')'
      }
    ];
    */

    this.setState({
      portfolio,
      chartData
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
        return Object.keys(this.props.availableTokens).indexOf(d.label.toUpperCase());
      },
      theme:{
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
      legends:[
        {
          itemWidth: 60,
          itemHeight: 18,
          translateY: 50,
          symbolSize: 10,
          anchor: 'bottom',
          direction: 'row',
          itemTextColor: '#c9c9c9',
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

    return (
      <GenericChart
        type={Pie}
        {...chartProps}
        showLoader={true}
        width={this.state.parentWidth}
        height={this.state.parentWidth}
        data={this.state.chartData}
      />
    );
  }
}

export default PortfolioDonut;
