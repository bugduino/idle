import { Flex, Icon } from "rimble-ui";
import React, { Component } from 'react';

class VariationNumber extends Component {

  render() {
    return (
      <Flex
        width={1}
        alignItems={'center'}
        flexDirection={'row'}
      >
        <Icon
          size={'2.2em'}
          color={ this.props.direction === 'up' ?  '#6dd400' : '#f7b500' }
          name={ this.props.direction === 'up' ?  'ArrowDropUp' : 'ArrowDropDown' }
        />
        {this.props.children}
      </Flex>
    );
  }
}

export default VariationNumber;
