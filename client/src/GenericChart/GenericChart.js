import { Line } from '@nivo/line';
import React, { Component } from 'react';

class GenericChart extends Component {
  state = {};

  render() {

    return (
      <Line
        {...this.props}
        enableGridX={true}
        enableGridY={false}
        colors={d => d.color}
        pointSize={0}
        pointColor={{ from: 'color', modifiers: [] }}
        pointBorderWidth={1}
        pointLabel="y"
        pointLabelYOffset={-12}
        useMesh={true}
        animate={false}
        legends={[
            {
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 100,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: 'left-to-right',
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: 'circle',
                symbolBorderColor: 'rgba(0, 0, 0, .5)',
                effects: [
                    {
                        on: 'hover',
                        style: {
                            itemBackground: 'rgba(0, 0, 0, .03)',
                            itemOpacity: 1
                        }
                    }
                ]
            }
        ]}
      />
    );
  }
}

export default GenericChart;