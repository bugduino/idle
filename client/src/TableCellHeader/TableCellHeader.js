import React, { Component } from 'react';
import { Flex, Heading } from "rimble-ui";

class TableCellHeader extends Component {
  render() {
    return (
      <Flex
        width={this.props.width}
      >
        <Heading.h4
          pb={3}
          fontSize={[2,3]}
          fontWeight={4}
          color={'cellTitle'}
          style={{width:'100%'}}
          {...this.props}
        >
          {this.props.children}
        </Heading.h4>
      </Flex>
    );
  }
}

export default TableCellHeader;
