import { Flex } from "rimble-ui";
import React, { Component } from 'react';
import TableCellHeader from '../TableCellHeader/TableCellHeader';

class TableHeader extends Component {
  render() {
    return (
      <Flex
        width={1}
        px={[2,4]}
        pb={[2,3]}
        flexDirection={'row'}
      >
        {
          this.props.cols.map((colInfo,colIndex) => {
            // Skip non-mobile columns
            if (colInfo.visible === false || (colInfo.mobile === false && this.props.isMobile)){
              return null;
            }

            return (colInfo.title && colInfo.title.length) ? (
              <TableCellHeader
                {...this.props}
                {...colInfo.props}
                desc={colInfo.desc}
                title={colInfo.title}
                key={`col-header-${colIndex}`}
              >
                {colInfo.title}
              </TableCellHeader>
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
