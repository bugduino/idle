import theme from '../theme';
import React, { Component } from 'react';
import FlexLoader from '../FlexLoader/FlexLoader';
import { Card, Flex, Image, Text } from "rimble-ui";
import FunctionsUtil from '../utilities/FunctionsUtil';

class EarningsEstimation extends Component {
  state = {
    tokensEarnings:null,
    estimationStepsPerc:null,
    estimationSteps:{
      0:{
        'Week':{
          width:1/12,
          perc:1/52
        },
        'Month':{
          width:3/12,
          perc:1/12
        },
        '3 months':{
          width:8/12,
          perc:3/12
        }
      },
      25:{
        '3 months':{
          width:3/12,
          perc:3/12
        },
        '8 months':{
          width:5/12,
          perc:8/12
        },
        'Year':{
          width:4/12,
          perc:1
        }
      },
      90:{
        'Year':{
          width:1/3,
          perc:1
        },
        '2 Years':{
          width:1/3,
          perc:2
        },
        '5 Years':{
          width:3/5,
          perc:5
        }
      }
    }
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
    this.loadEarnings();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
  }

  async loadEarnings(){
    const tokensEarnings = {};
    let estimationStepsPerc = 0;

    const amountLents = await this.functionsUtil.getAmountLent(this.props.enabledTokens,this.props.account);
    await this.functionsUtil.asyncForEach(Object.keys(amountLents),async (token) => {
      const amountLent = amountLents[token];
      const tokenConfig = this.props.availableTokens[token];
      const avgBuyPrice = await this.functionsUtil.getAvgBuyPrice([token],this.props.account);
      const idleTokenPrice = await this.functionsUtil.getIdleTokenPrice(tokenConfig);
      const earningsPerc = idleTokenPrice.div(avgBuyPrice[token]).minus(1);
      const earnings = amountLent.times(earningsPerc);

      let earningsYear = 0;
      let tokenAPR = 0;
      let tokenAPY = 0;
      const tokenAprs = await this.functionsUtil.getTokenAprs(tokenConfig);
      if (tokenAprs && tokenAprs.avgApr !== null){
        tokenAPR = tokenAprs.avgApr;
        tokenAPY = this.functionsUtil.apr2apy(tokenAPR.div(100));
        earningsYear = amountLent.times(tokenAPY);
      }

      const earningsPercStep = Math.floor(earnings.div(earningsYear).times(100));
      
      const possibleSteps = Object.keys(this.state.estimationSteps).filter(perc => perc<earningsPercStep);
      const maxPossibleStep = parseInt(possibleSteps.pop());
      estimationStepsPerc = Math.max(estimationStepsPerc,maxPossibleStep);

      // console.log(token,amountLent.toFixed(5),earnings.toFixed(5),earningsYear.toFixed(5),tokenConfig,tokenAprs,tokenAPR.toFixed(5),tokenAPY.toFixed(5),earningsPercStep,maxPossibleStep,estimationStepsPerc);

      if (!amountLent.isNaN() && !idleTokenPrice.isNaN() && !earnings.isNaN()){
        tokensEarnings[token] = {
          earnings,
          amountLent,
          earningsYear,
          idleTokenPrice
        };
      }
    });

    // console.log(tokensEarnings);

    this.setState({
      estimationStepsPerc,
      tokensEarnings
    })
  }

  render() {

    if (!this.state.tokensEarnings){
      return (
        <FlexLoader
          flexProps={{
            flexDirection:'row',
            minHeight:this.props.height
          }}
          loaderProps={{
            size:'30px'
          }}
          textProps={{
            ml:2
          }}
          text={'Loading estimations...'}
        />
      );
    }

    const estimationSteps = this.state.estimationSteps[this.state.estimationStepsPerc] ? this.state.estimationSteps[this.state.estimationStepsPerc] : this.state.estimationSteps[0];

    return (
      <Card
        pr={0}
        my={1}
        width={1}
        px={[3,4]}
        py={[2,3]}
        boxShadow={1}
        borderRadius={2}
      >
        {
          Object.keys(this.state.tokensEarnings).map((token,tokenIndex) => {
            const tokenRGBColor = this.functionsUtil.getGlobalConfig(['stats','tokens',token,'color','rgb']).join(',');
            const tokenEarnings = this.state.tokensEarnings[token];
            const estimationStepPerc = this.functionsUtil.BNify(Object.values(estimationSteps).pop().perc);
            const finalEarnings = tokenEarnings.earningsYear.times(estimationStepPerc);
            const cursorPerc = Math.min(1,parseFloat(tokenEarnings.earnings.div(finalEarnings)));
            // console.log(tokenEarnings.earnings.toFixed(10),tokenEarnings.earningsYear.toFixed(10),finalEarnings.toFixed(10),cursorPerc.toFixed(10),estimationStepPerc.toFixed(10));
            return (
              <Flex
                key={`asset-${token}`}
                flexDirection={'row'}
              >
                <Flex
                  width={[1,0.93]}
                  position={'relative'}
                >
                  <Flex
                    width={1}
                    height={'100%'}
                    position={'absolute'}
                    alignItems={'center'}
                    flexDirection={'row'}
                    justifyContent={'center'}
                  >
                    <Flex
                      width={[0.15,0.1]}
                    >
                    </Flex>
                    <Flex
                      width={[0.85,0.9]}
                      height={'100%'}
                      flexDirection={'row'}
                    >
                      {
                        Object.keys(estimationSteps).map((label,estimateIndex) => {
                          const estimationStep = estimationSteps[label];
                          const estimationStepEarnings = tokenEarnings.earningsYear.times(this.functionsUtil.BNify(estimationStep.perc));
                          const estimationStepEarningsFormatted = this.functionsUtil.formatMoney(estimationStepEarnings,2);
                          return (
                            <Flex
                              pr={2}
                              justifyContent={'flex-end'}
                              width={estimationStep.width}
                              key={`asset-estimate-${token}-${estimateIndex}`}
                              borderRight={`1px solid ${theme.colors.divider}`}
                            >
                              <Text
                                fontWeight={[3,4]}
                                fontSize={[0,'1.2em']}
                                color={tokenEarnings.earnings.gte(estimationStepEarnings) ? 'copyColor' : 'legend'}
                              >
                                {estimationStepEarningsFormatted}
                              </Text>
                            </Flex>
                          );
                        })
                      }
                    </Flex>
                  </Flex>
                  <Flex
                    width={1}
                    pt={'2.2em'}
                    alignItems={'center'}
                    flexDirection={'row'}
                    justifyContent={'center'}
                    pb={ tokenIndex<Object.keys(this.state.tokensEarnings).length-1 ? '1.5em' : 0 }
                  >
                    <Flex
                      width={[0.15,0.1]}
                      justifyContent={['flex-start','flex-end']}
                    >
                      <Text
                        pr={[0,1]}
                        fontSize={[0,3]}
                        fontWeight={[3,4]}
                      >
                        {token}
                      </Text>
                    </Flex>
                    <Flex
                      width={[0.85,0.9]}
                      flexDirection={'row'}
                      height={['20px','35px']}
                      alignItems={'flex-start'}
                    >
                      <Flex
                        height={'100%'}
                        width={cursorPerc}
                        backgroundColor={'#ffffff'}
                      >
                        <Flex
                          height={'100%'}
                          width={'100%'}
                          borderRadius={['0 20px 20px 0','0 35px 35px 0']}
                          style={{background:`linear-gradient(90deg, rgba(${tokenRGBColor},0) 0%, rgba(${tokenRGBColor},0.1) 30%, rgba(${tokenRGBColor},1) 100%)`}}
                        ></Flex>
                      </Flex>
                      <Flex
                        pl={[2,3]}
                        width={'auto'}
                        height={'100%'}
                        alignItems={'center'}
                        justifyContent={'flex-start'}
                      >
                        <Image src={`images/tokens/${token}.svg`} height={['1.4em','2.4em']} />
                      </Flex>
                    </Flex>
                  </Flex>
                </Flex>
                {
                  !this.props.isMobile && 
                    <Flex width={0.07} alignItems={'flex-start'} justifyContent={'flex-end'}>
                    </Flex>
                }
              </Flex>
            )
          })
        }
        <Flex
          flexDirection={'row'}
        >
          <Flex
            width={[1,0.93]}
            position={'relative'}
          >
            <Flex
              width={1}
              alignItems={'center'}
              flexDirection={'row'}
              justifyContent={'center'}
            >
              <Flex width={[0.15,0.1]}></Flex>
              <Flex
                width={[0.85,0.9]}
                flexDirection={'row'}
              >
                {
                  Object.keys(estimationSteps).map((estimationLabel,estimateIndex) => {
                    const estimationStep = estimationSteps[estimationLabel];
                    return (
                      <Flex
                        pt={2}
                        pr={[1,2]}
                        justifyContent={'flex-end'}
                        width={estimationStep.width}
                        key={`estimate-label-${estimateIndex}`}
                        borderRight={`1px solid ${theme.colors.divider}`}
                      >
                        <Text
                          fontWeight={3}
                          fontSize={[0,2]}
                          color={'legend'}
                        >
                          {estimationLabel}
                        </Text>
                      </Flex>
                    );
                  })
                }
              </Flex>
            </Flex>
          </Flex>
          {
            !this.props.isMobile && 
              <Flex width={0.07} alignItems={'flex-start'} justifyContent={'center'}>
                <Text fontWeight={4} fontSize={3}></Text>
              </Flex>
          }
        </Flex>
      </Card>
    );
  }
}

export default EarningsEstimation;
