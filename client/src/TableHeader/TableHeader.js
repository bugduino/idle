import React, { Component } from 'react';
import { Flex, Heading } from "rimble-ui";

class TableHeader extends Component {
  render() {

    const TableCellHeader = (props) => (
      <Flex width={props.width}>
        <Heading.h4 color={'cellTitle'} fontSize={2} fontWeight={4} py={3} {...props} style={{width:'100%'}}>
          {props.children}
        </Heading.h4>
      </Flex>
    );

    return (
      <Flex
        width={1}
        pl={[3,4]}
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
