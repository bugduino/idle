import theme from '../theme';
import { Pie } from '@nivo/pie';
import React, { Component } from 'react';
import { Flex, Text, Image } from "rimble-ui";
import SmartNumber from '../SmartNumber/SmartNumber';
import globalConfigs from '../configs/globalConfigs';
import FunctionsUtil from '../utilities/FunctionsUtil';
import GenericChart from '../GenericChart/GenericChart';

class AllocationChart extends Component {
  state = {
    chartData:null,
    chartProps:null,
    selectedSlice:null,
    totalAllocation:null,
    protocolsAllocations:null,
    protocolsAllocationsPerc:null
  };

  // Utils
  functionsUtil = null;
  componentUnmounted = false;

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

  componentWillUnmount(){
    this.componentUnmounted = true;
  }

  async componentDidMount(){
    this.loadData();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    const tokenChanged = prevProps.selectedToken !== this.props.selectedToken;
    if (tokenChanged){
      this.setStateSafe({
        chartData:null,
        chartProps:null,
        selectedSlice:null,
        totalAllocation:null,
        protocolsAllocations:null,
        protocolsAllocationsPerc:null
      },() => {
        this.loadData();
      });
    } else if (prevProps.isMobile !== this.props.isMobile){
      this.loadData()
    }
  }

  async setStateSafe(newState,callback=null) {
    if (!this.componentUnmounted){
      return this.setState(newState,callback);
    }
    return null;
  }

  async loadData(){
    const {
      totalAllocation,
      protocolsAllocations,
      protocolsAllocationsPerc
    } = await this.functionsUtil.getTokenAllocation(this.props.tokenConfig);

    // console.log('AllocationChart',this.props.token,totalAllocation,protocolsAllocations,protocolsAllocationsPerc);

    const chartProps = {
      padAngle:0,
      animate:true,
      borderWidth: 0,
      cornerRadius:0,
      motionDamping:15,
      innerRadius: 0.65,
      motionStiffness:90,
      colors:d => d.color,
      onMouseEnter:(data, e) => {
        this.setStateSafe({
          selectedSlice:data
        });
      },
      onMouseLeave:(data, e) => {
        this.setStateSafe({
          selectedSlice:null
        });
      },
      sliceLabel: d => d.value+'%',
      tooltipFormat: v => v+'%',
      radialLabel: d => {
        return null;
      },
      theme:{
        tooltip: {
          container: this.props.inline ? {} : {
            display: 'none'
          }
        },
        labels:{
          text:{
            fontSize:this.props.isMobile ? 13 : 15,
            fontWeight:600,
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
      radialLabelsSkipAngle:10,
      enableRadialLabels:false,
      radialLabelsTextXOffset:0,
      slicesLabelsTextColor:'#fff',
      radialLabelsTextColor:'#333',
      radialLabelsLinkStrokeWidth:0,
      radialLabelsLinkDiagonalLength:0,
      radialLabelsLinkHorizontalLength:0,
      enableSlicesLabels: !this.props.inline,
      radialLabelsLinkColor:{ from: 'color' },
      borderColor:{ from: 'color', modifiers: [ [ 'darker', 0.2 ] ] },
      margin: this.props.inline ? {top:0,right:15,bottom:0,left:1} : (this.props.isMobile ? { top: 10, right: 15, bottom: 0, left: 15 } : { top: 10, right: 35, bottom: 0, left: 35 }),
    };

    const chartData = [];

    this.props.tokenConfig.protocols.forEach((protocolInfo,i)=>{
      const protocolName = protocolInfo.name;
      const protocolAddr = protocolInfo.address.toLowerCase();
      if (protocolsAllocationsPerc[protocolAddr]){
        const protocolAllocationPercParsed = parseFloat(protocolsAllocationsPerc[protocolAddr].times(100).toFixed(2));
        chartData.push({
          id:protocolAddr,
          value:protocolAllocationPercParsed,
          color:'hsl('+globalConfigs.stats.protocols[protocolName].color.hsl.join(',')+')',
          label: globalConfigs.stats.protocols[protocolName].label ? globalConfigs.stats.protocols[protocolName].label : this.functionsUtil.capitalize(protocolName)
        });
      }

    });

    this.setStateSafe({
      chartData,
      chartProps,
      totalAllocation,
      protocolsAllocations,
      protocolsAllocationsPerc
    });
  }

  render() {
    
    const selectedSlice = this.state.selectedSlice !== null && this.state.protocolsAllocations[this.state.selectedSlice.id] ? this.state.protocolsAllocations[this.state.selectedSlice.id] : false;
    const protocolIcon = this.state.selectedSlice !== null ? (globalConfigs.stats.protocols[this.state.selectedSlice.label.toLowerCase()] && globalConfigs.stats.protocols[this.state.selectedSlice.label.toLowerCase()].icon ? globalConfigs.stats.protocols[this.state.selectedSlice.label.toLowerCase()].icon : `${this.state.selectedSlice.label.toLowerCase()}.svg`) : null;

    return (
      <Flex
        width={1}
        position={'relative'}
      >
        {
          this.state.totalAllocation && !this.props.inline &&
            <Flex
              zIndex={0}
              top={['23%','25%']}
              left={['20%','27%']}
              textAlign={'center'}
              alignItems={'center'}
              position={'absolute'}
              width={['60%','46%']}
              height={['53%','46%']}
              flexDirection={'column'}
              justifyContent={'center'}
            >
              {
                selectedSlice ? (
                  <Flex
                    width={1}
                    alignItems={'center'}
                    flexDirection={'column'}
                    justifyContent={'center'}
                  >
                    <Image
                      mb={1}
                      width={['1.8em','2em']}
                      height={['1.8em','2em']}
                      src={`/images/protocols/${protocolIcon}`}
                    />
                    <SmartNumber
                      fontSize={[3,4]}
                      decimals={3}
                      fontWeight={4}
                      maxPrecision={5}
                      number={selectedSlice}
                    />
                    <Text
                      fontSize={[1,2]}
                      fontWeight={3}
                      color={'cellTitle'}
                    >
                      Funds in {this.state.selectedSlice.label}
                    </Text>
                  </Flex>
                ) : (
                  <Flex
                    width={1}
                    alignItems={'center'}
                    flexDirection={'column'}
                    justifyContent={'center'}
                  >
                    <Image
                      mb={1}
                      width={['1.8em','2em']}
                      height={['1.8em','2em']}
                      src={`/images/idle-mark.png`}
                    />
                    <SmartNumber
                      unitProps={{
                        ml:2,
                        fontWeight:3,
                        fontSize:[3,4]
                      }}
                      decimals={3}
                      fontWeight={4}
                      fontSize={[3,4]}
                      maxPrecision={5}
                      number={this.state.totalAllocation}
                    />
                    <Text
                      fontWeight={3}
                      fontSize={[1,2]}
                      color={'cellTitle'}
                    >
                      Total funds
                    </Text>
                  </Flex>
                )
              }
            </Flex>
        }
        <GenericChart
          type={Pie}
          showLoader={true}
          {...this.props}
          {...this.state.chartProps}
          data={this.state.chartData}
        />
      </Flex>
    );
  }
}

export default AllocationChart;