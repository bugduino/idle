import theme from '../theme';
import { Pie } from '@nivo/pie';
import React, { Component } from 'react';
import { Flex, Text, Image } from "rimble-ui";
import AssetField from '../AssetField/AssetField';
import SmartNumber from '../SmartNumber/SmartNumber';
import FunctionsUtil from '../utilities/FunctionsUtil';
import GenericChart from '../GenericChart/GenericChart';

class PortfolioDonut extends Component {
  state = {
    chartData:null,
    totalFunds:null,
    parentWidth:null,
    selectedToken:null,
    selectedTokenConfig:null
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
    this.loadUtils();
  }

  componentWillUnmount() {
    
  }

  async componentDidMount(){
    this.loadPortfolio();
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();
  }

  async loadPortfolio() {

    const portfolio = {};
    let totalFunds = this.functionsUtil.BNify(0);
    const isRisk = this.props.selectedStrategy === 'risk';

    await this.functionsUtil.asyncForEach(Object.keys(this.props.availableTokens),async (token) => {
      const tokenConfig = this.props.availableTokens[token];
      const idleTokenBalance = await this.functionsUtil.getTokenBalance(tokenConfig.idle.token,this.props.account);

      if (idleTokenBalance){
        const tokenPrice = await this.functionsUtil.getIdleTokenPrice(tokenConfig);
        const tokenBalance = await this.functionsUtil.convertTokenBalance(idleTokenBalance.times(tokenPrice),token,tokenConfig,isRisk);

        if (tokenBalance.gt(0)){
          portfolio[token] = tokenBalance;

          // Increment total balance
          totalFunds = totalFunds.plus(tokenBalance);
        }
      }
    });

    // Add Gov Tokens
    const govTokensUserBalances = await this.functionsUtil.getGovTokensUserBalances(this.props.account,this.props.availableTokens,'DAI',null,true);
    if (govTokensUserBalances){
      Object.keys(govTokensUserBalances).forEach( govToken => {
        const govTokenBalance = this.functionsUtil.BNify(govTokensUserBalances[govToken]);
        portfolio[govToken] = govTokenBalance;
        totalFunds = totalFunds.plus(govTokenBalance);
      });
    }

    const chartData = [];

    Object.keys(portfolio).forEach(token => {
      const tokenBalance = portfolio[token];
      if (tokenBalance.gt(0)){
        const tokenPercentage = tokenBalance.div(totalFunds).times(100);
        let tokenColorHsl = this.functionsUtil.getGlobalConfig(['stats','tokens',token.toUpperCase(),'color','hsl']);
        tokenColorHsl = tokenColorHsl ? tokenColorHsl.join(',') : '0,0%,0%';
        chartData.push({
          id:token,
          label:token.substr(0,1).toUpperCase()+token.substr(1),
          value:Math.round(tokenPercentage),
          color:'hsl('+tokenColorHsl+')'
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
      margin: this.props.isMobile ? { top: 15, right: 25, bottom: 30, left: 25 } : { top: 30, right: 50, bottom: 60, left: 50 },
      onMouseEnter:(data, e) => {
        const selectedToken = data.id;
        const selectedTokenConfig = selectedToken ? this.props.availableTokens[selectedToken] || this.functionsUtil.getGlobalConfig(['stats','tokens',selectedToken]) : null;
        this.setState({
          selectedToken,
          selectedTokenConfig
        });
      },
      onMouseLeave:(data, e) => {
        this.setState({
          selectedToken:null,
          selectedTokenConfig:null
        });
      },
      legends:[
        {
          itemWidth: 60,
          itemHeight: 18,
          translateY: this.props.isMobile ? 25 : 50,
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
    const strategyIcon = this.functionsUtil.getGlobalConfig(['strategies',this.props.selectedStrategy,'icon']);
    const convertToken = this.state.selectedToken ? this.functionsUtil.getGlobalConfig(['stats','tokens',this.state.selectedToken,'conversionRateField']) : false;

    return (
      <Flex
        width={1}
      >
        { 
          (this.state.totalFunds || selectedToken) && 
            <Flex
              zIndex={0}
              top={['32%','35%']}
              left={['23%','27%']}
              textAlign={'center'}
              alignItems={'center'}
              width={['55%','46%']}
              position={'absolute'}
              height={['40%','35%']}
              flexDirection={'column'}
              justifyContent={'center'}
            >
              {
                selectedToken ? (
                  <>
                    <AssetField
                      fieldInfo={{
                        name:'icon',
                        props:{
                          mb:1,
                          height:'2.2em'
                        }
                      }}
                      token={this.state.selectedToken}
                      tokenConfig={this.state.selectedTokenConfig}
                    />
                    <SmartNumber
                      unitProps={{
                        ml:2,
                        fontSize:4,
                        fontWeight:3
                      }}
                      decimals={2}
                      fontSize={[3,4]}
                      maxPrecision={5}
                      fontWeight={[3,4]}
                      unit={ convertToken ? '$' : null}
                      number={this.state.portfolio[this.state.selectedToken]}
                    />
                    <Text
                      fontWeight={3}
                      fontSize={[1,2]}
                      color={'cellTitle'}
                    >
                      {this.state.selectedToken}
                    </Text>
                  </>
                ) : (
                  <>
                    <Image
                      mb={1}
                      height={'2.2em'}
                      src={strategyIcon}
                    />
                    <SmartNumber
                      unit={'$'}
                      unitProps={{
                        ml:2,
                        fontSize:4,
                        fontWeight:3
                      }}
                      decimals={2}
                      fontSize={[3,4]}
                      maxPrecision={5}
                      fontWeight={[3,4]}
                      number={this.state.totalFunds}
                    />
                    <Text
                      fontWeight={3}
                      fontSize={[1,2]}
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
          data={this.state.chartData}
          parentId={this.props.parentId}
          parentIdHeight={this.props.parentId}
        />
      </Flex>
    );
  }
}

export default PortfolioDonut;
