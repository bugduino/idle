import { Pie } from '@nivo/pie';
import React, { Component } from 'react';
import globalConfigs from '../configs/globalConfigs';
import GenericChart from '../GenericChart/GenericChart';

class AllocationChart extends Component {
  state = {};

  render() {

    const chartProps = {
      padAngle:1,
      animate:true,
      borderWidth:0,
      cornerRadius:5,
      innerRadius:0.6,
      motionDamping:15,
      motionStiffness:90,
      colors:d => d.color,
      radialLabelsSkipAngle:10,
      radialLabelsLinkOffset:0,
      slicesLabelsSkipAngle:10,
      radialLabelsTextXOffset:5,
      sliceLabel: d => d.value+'%',
      tooltipFormat: v => v+'%',
      radialLabelsLinkStrokeWidth:2,
      radialLabelsTextColor:'#333333',
      slicesLabelsTextColor:'#333333',
      // radialLabel: d => d.value+'%',
      radialLabelsLinkDiagonalLength:10,
      radialLabelsLinkHorizontalLength:10,
      radialLabelsLinkColor:{ from: 'color' },
      margin:{ top: 30, right: 50, bottom: 30, left: 50 },
      borderColor:{ from: 'color', modifiers: [ [ 'darker', 0.2 ] ] },
    };

    const chartData = this.props.tokenConfig.protocols.map((protocolInfo,i)=>{
      const protocolName = protocolInfo.name;
      const protocolAddr = protocolInfo.address;
      const protocolLoaded = this.props.totalAllocation && this.props.protocolsAllocations && this.props.protocolsAllocations[protocolAddr];
      const protocolAllocation = protocolLoaded ? parseFloat(this.props.protocolsAllocations[protocolAddr].toString()) : null;
      const protocolAllocationPerc = protocolAllocation !== null ? parseFloat(protocolAllocation)/parseFloat(this.props.totalAllocation.toString()) : null;
      const protocolAllocationPercParsed = protocolAllocationPerc === null ? 0 : parseFloat((protocolAllocationPerc*100).toFixed(2));

      return {
        id:protocolName,
        label:protocolName.substr(0,1).toUpperCase()+protocolName.substr(1),
        value:protocolAllocationPercParsed,
        color:'hsl('+globalConfigs.stats.protocols[protocolName].color.hsl.join(',')+')'
      };
    });

    return (
      <GenericChart
        type={Pie}
        {...chartProps}
        data={chartData}
        height={this.props.height}
        width={this.props.width}
      />
    );
  }
}

export default AllocationChart;