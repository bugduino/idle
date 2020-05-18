import Title from '../Title/Title';
import React, { Component } from 'react';
import AssetField from '../AssetField/AssetField';
import FunctionsUtil from '../utilities/FunctionsUtil';
import { Flex, Text, Link, Icon, Image } from "rimble-ui";
import DashboardCard from '../DashboardCard/DashboardCard';

class StrategyBox extends Component {

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

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
  }

  render() {

    const strategyInfo = this.functionsUtil.getGlobalConfig(['strategies',this.props.strategy]);
    const tokenConfig = this.props.availableStrategies[this.props.strategy][strategyInfo.token];
    const strategyUrl = '/#'+this.functionsUtil.getGlobalConfig(['dashboard','baseRoute'])+'/'+this.props.strategy;

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
          <Text
            px={2}
            fontSize={3}
            fontWeight={4}
            color={'cellText'}
            textAlign={'right'}
          >
            Current APY
          </Text>
          <AssetField
            fieldInfo={{
              name:'apy',
              props:{
                px:2,
                fontSize:[3,4],
                fontWeight:4,
                textAlign:'left',
                color:'copyColor'
              }
            }}
            {...this.props}
            token={strategyInfo.token}
            tokenConfig={ tokenConfig }
          />
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
          <AssetField
            fieldInfo={{
              name:'aprChart'
            }}
            chartProps={{
              lineWidth:2
            }}
            {...this.props}
            token={strategyInfo.token}
            tokenConfig={ tokenConfig }
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
