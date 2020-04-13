import React, { Component } from 'react';
import { Flex, Heading } from "rimble-ui";

class TableHeader extends Component {
  render() {

    const TableCellHeader = (props) => (
      <Flex width={props.width}>
        <Heading.h4
          pb={3}
          {...props}
          fontSize={[2,3]}
          fontWeight={4}
          color={'cellTitle'}
          style={{width:'100%'}}
        >
          {props.children}
        </Heading.h4>
      </Flex>
    );

    return (
      <Flex
        width={1}
        px={[3,4]}
        flexDirection={'row'}
      >
        {
          this.props.cols.map((colInfo,colIndex) => {
            return (colInfo.title && colInfo.title.length) ? (
              <TableCellHeader key={`col-header-${colIndex}`} {...colInfo.props}>{colInfo.title}</TableCellHeader>
            ) : (
              <Flex key={`col-header-${colIndex}`} {...colInfo.props}></Flex>
            )
          })
        }
      </Flex>
    );
  }
}

export default TableHeader;
