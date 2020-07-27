import { Flex, Icon } from "rimble-ui";
import React, { Component } from 'react';

class VariationNumber extends Component {

  render() {

    const IconDirection = () => (
      <Icon
        color={ this.props.direction === 'up' ?  '#6dd400' : '#f7b500' }
        name={ this.props.direction === 'up' ?  'ArrowDropUp' : 'ArrowDropDown' }
        size={ this.props.iconSize ? this.props.iconSize : ( this.props.isMobile ? '1.4em' : '2em') }
      />
    );

    return (
      <Flex
        alignItems={'center'}
        flexDirection={'row'}
        width={ this.props.width ? this.props.width : 1 }
        justifyContent={this.props.justifyContent ? this.props.justifyContent : 'center'}
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
