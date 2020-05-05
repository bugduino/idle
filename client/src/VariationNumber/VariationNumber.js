import { Flex, Icon } from "rimble-ui";
import React, { Component } from 'react';

class VariationNumber extends Component {

  render() {

    const IconDirection = () => (
      <Icon
        size={ this.props.iconSize ? this.props.iconSize : '2.2em' }
        color={ this.props.direction === 'up' ?  '#6dd400' : '#f7b500' }
        name={ this.props.direction === 'up' ?  'ArrowDropUp' : 'ArrowDropDown' }
      />
    );

    return (
      <Flex
        width={1}
        alignItems={'center'}
        flexDirection={'row'}
        justifyContent={this.props.justifyContent ?this.props.justifyContent : 'center'}
      >
        {
          (!this.props.iconPos || this.props.iconPos==='left') &&
            <IconDirection />
        }
        {this.props.children}
        {
          this.props.iconPos==='right' &&
            <IconDirection />
        }
      </Flex>
    );
  }
}

export default VariationNumber;
