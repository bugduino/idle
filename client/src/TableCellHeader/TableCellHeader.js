import React, { Component } from 'react';
import { Flex, Heading } from "rimble-ui";

class TableCellHeader extends Component {
  render() {
    return (
      <Flex
        width={this.props.width}
      >
        <Heading.h4
          pb={[2,3]}
          fontSize={['10px',3]}
          fontWeight={[3,4]}
          color={'cellTitle'}
          lineHeight={'initial'}
          style={{
            width:'100%',
            whiteSpace:'nowrap'
          }}
          {...this.props}
        >
          {this.props.children}
        </Heading.h4>
      </Flex>
    );
  }
}

export default TableCellHeader;
