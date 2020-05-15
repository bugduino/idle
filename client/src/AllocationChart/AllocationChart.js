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
    this.loadData();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    const tokenChanged = prevProps.selectedToken !== this.props.selectedToken;
    if (tokenChanged){
      this.setState({
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

  async loadData(){
    const {
      totalAllocation,
      protocolsAllocations,
      protocolsAllocationsPerc
    } = await this.functionsUtil.getTokenAllocation(this.props.tokenConfig);

    const chartProps = {
      padAngle:0,
      animate:true,
      borderWidth:0,
      cornerRadius:0,
      innerRadius:0.65,
      motionDamping:15,
      motionStiffness:90,
      colors:d => d.color,
      onMouseEnter:(data, e) => {
        this.setState({
          selectedSlice:data
        });
      },
      onMouseLeave:(data, e) => {
        this.setState({
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
          container: {
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
      radialLabelsTextXOffset:0,
      slicesLabelsTextColor:'#fff',
      radialLabelsTextColor:'#333',
      radialLabelsLinkStrokeWidth:0,
      radialLabelsLinkDiagonalLength:0,
      radialLabelsLinkHorizontalLength:0,
      radialLabelsLinkColor:{ from: 'color' },
      margin: this.props.isMobile ? { top: 10, right: 15, bottom: 0, left: 15 } : { top: 10, right: 35, bottom: 0, left: 35 },
      borderColor:{ from: 'color', modifiers: [ [ 'darker', 0.2 ] ] },
    };

    const chartData = this.props.tokenConfig.protocols.map((protocolInfo,i)=>{
      const protocolName = protocolInfo.name;
      const protocolAddr = protocolInfo.address.toLowerCase();
      const protocolLoaded = totalAllocation && protocolsAllocations && protocolsAllocations[protocolAddr];
      const protocolAllocation = protocolLoaded ? parseFloat(protocolsAllocations[protocolAddr].toString()) : null;
      const protocolAllocationPerc = protocolAllocation !== null ? parseFloat(protocolAllocation)/parseFloat(totalAllocation.toString()) : null;
      const protocolAllocationPercParsed = protocolAllocationPerc === null ? 0 : parseFloat((protocolAllocationPerc*100).toFixed(1));

      return {
        id:protocolAddr,
        value:protocolAllocationPercParsed,
        label:this.functionsUtil.capitalize(protocolName),
        color:'hsl('+globalConfigs.stats.protocols[protocolName].color.hsl.join(',')+')'
      };
    });

    this.setState({
      chartData,
      chartProps,
      totalAllocation,
      protocolsAllocations,
      protocolsAllocationsPerc
    });
  }

  render() {
    
    const selectedSlice = this.state.selectedSlice !== null && this.state.protocolsAllocations[this.state.selectedSlice.id] ? this.state.protocolsAllocations[this.state.selectedSlice.id] : false;

    return (
      <Flex
        width={1}
        position={'relative'}
      >
        {
          this.state.totalAllocation &&
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
                      src={`/images/protocols/${this.state.selectedSlice.label.toLowerCase()}.svg`}
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
          {...this.props}
          showLoader={true}
          {...this.state.chartProps}
          data={this.state.chartData}
        />
      </Flex>
    );
  }
}

export default AllocationChart;