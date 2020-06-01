import Title from '../Title/Title';
import React, { Component } from 'react';
import AssetField from '../AssetField/AssetField';
import FunctionsUtil from '../utilities/FunctionsUtil';
import { Flex, Text, Link, Icon, Image } from "rimble-ui";
import DashboardCard from '../DashboardCard/DashboardCard';

class StrategyBox extends Component {

  state = {
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

  async componentWillMount(){
    this.loadUtils();
  }

  componentDidMount(){
    this.getHighestAprToken();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    const contractsInitialized = prevProps.contractsInitialized !== this.props.contractsInitialized && this.props.contractsInitialized;
    if (contractsInitialized){
      this.getHighestAprToken();
    }
  }

  getHighestAprToken = async () => {

    if (!this.props.contractsInitialized){
      return false;
    }

    let selectedToken = null;
    let highestValue = null;
    const tokensAprs = {};
    const availableTokens = this.props.availableStrategies[this.props.strategy];
    await this.functionsUtil.asyncForEach(Object.keys(availableTokens),async (token) => {
      const tokenConfig = availableTokens[token];
      switch (this.props.strategy){
        case 'best':
        default:
          const tokenAPR = await this.functionsUtil.getTokenAprs(tokenConfig);
          if (tokenAPR && tokenAPR.avgApr !== null){
            tokensAprs[token] = tokenAPR.avgApr;
            if (!highestValue || highestValue.lt(tokenAPR.avgApr)){
              highestValue = tokenAPR.avgApr;
              selectedToken = token;
            }
          }
        break;
        case 'risk':
        const tokenScore = await this.functionsUtil.getTokenScore(tokenConfig,true);
          if (!highestValue || highestValue.lt(tokenScore)){
            highestValue = tokenScore;
            selectedToken = token;
          }
        break;
      }
    });

    this.setState({
      selectedToken
    });
  }

  render() {
    const strategyInfo = this.functionsUtil.getGlobalConfig(['strategies',this.props.strategy]);
    const strategyUrl = '/#'+this.functionsUtil.getGlobalConfig(['dashboard','baseRoute'])+'/'+this.props.strategy;
    const chartColor = strategyInfo.chartColor ? strategyInfo.chartColor : null;
    const tokenConfig = this.state.selectedToken ? this.props.availableStrategies[this.props.strategy][this.state.selectedToken] : null;
    // console.log(this.props.strategy,this.state.selectedToken,tokenConfig);
    return (
      <DashboardCard
        cardProps={{
          pt:[3,4],
          mb:[3,0],
          mx:[0,'1em'],
          alignItems:'center',
          flexDirection:'column',
          justifyContent:'flex-start'
        }}
      >
        <Flex
          justifyContent={'center'}
        >
          <Image
            src={strategyInfo.icon}
            height={['2.2em','3.2em']}
          />
        </Flex>
        <Flex
          my={2}
          alignItems={'center'}
          justifyContent={'center'}
        >
          <Title
            fontWeight={5}
            fontSize={[4,'1.7em']}
          >
            {strategyInfo.title}
          </Title>
        </Flex>
        <Flex
          mt={2}
          mb={[2,3]}
          minHeight={'50px'}
          alignItems={'flex-start'}
          justifyContent={'center'}
        >
          <Text
            px={[3,4]}
            fontWeight={500}
            textAlign={'center'}
          >
            {strategyInfo.desc}
          </Text>
        </Flex>
        <Flex
          my={3}
          flexDirection={'row'}
          alignItems={'center'}
          justifyContent={'center'}
        >
          <Flex
            width={0.5}
            alignItems={'center'}
            flexDirection={'column'}
            justifyContent={'center'}
            borderRight={`1px solid ${this.props.theme.colors.divider}`}
          >
            <AssetField
              fieldInfo={{
                name:'apy',
                props:{
                  decimals:2,
                  fontWeight:4,
                  color:'copyColor',
                  textAlign:'center',
                  fontSize:[3,'1.8em'],
                }
              }}
              {...this.props}
              tokenConfig={ tokenConfig }
              token={this.state.selectedToken}
              selectedStrategy={this.props.strategy}
            />
            <Text
              fontSize={2}
              fontWeight={4}
              color={'cellText'}
              textAlign={'center'}
            >
              APY
            </Text>
          </Flex>
          <Flex
            width={0.5}
            alignItems={'center'}
            flexDirection={'column'}
            justifyContent={'center'}
          >
            <AssetField
              fieldInfo={{
                name:'score',
                props:{
                  fontWeight:4,
                  color:'copyColor',
                  textAlign:'center',
                  fontSize:[3,'1.8em'],
                }
              }}
              {...this.props}
              tokenConfig={ tokenConfig }
              token={this.state.selectedToken}
              selectedStrategy={this.props.strategy}
            />
            <Text
              fontSize={2}
              fontWeight={4}
              color={'cellText'}
              textAlign={'center'}
            >
              SCORE
            </Text>
          </Flex>
        </Flex>
        <Flex
          mt={2}
          width={1}
          height={'60px'}
          flexDirection={'row'}
          alignItems={'center'}
          justifyContent={'center'}
          id={`${this.props.strategy}_performance_chart`}
        >
          {
            /*
            <Image
              width={1}
              height={'60px'}
              src={`/images/strategies/${this.props.strategy}-chart.png`} />
            */
          }
          <AssetField
            fieldInfo={{
              name:'aprChart'
            }}
            chartProps={{
              lineWidth:2
            }}
            {...this.props}
            color={chartColor}
            tokenConfig={tokenConfig}
            token={this.state.selectedToken}
            rowId={`${this.props.strategy}_performance_chart`}
          />
        </Flex>
        <Flex
          width={1}
          height={'70px'}
          boxShadow={'0px -6px 6px -4px rgba(0,0,0,0.15)'}
        >
          <Link
            href={strategyUrl}
            style={{display:'flex',width:'100%'}}
            >
              <Flex
                width={1}
                alignItems={'center'}
                flexDirection={'row'}
                justifyContent={'center'}
              >
                <Text
                  mr={2}
                  fontSize={3}
                  fontWeight={4}
                  color={'copyColor'}
                  hoverColor={'copyColor'}
                >
                  Start with {strategyInfo.title}
                </Text>
                <Icon
                  size={'1.2em'}
                  color={'copyColor'}
                  name={'ArrowForward'}
                />
              </Flex>
          </Link>
        </Flex>
      </DashboardCard>
    );
  }
}

export default StrategyBox;
