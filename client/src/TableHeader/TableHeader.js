import { Flex } from "rimble-ui";
import React, { Component } from 'react';
import TableCellHeader from '../TableCellHeader/TableCellHeader';

class TableHeader extends Component {
  render() {
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
