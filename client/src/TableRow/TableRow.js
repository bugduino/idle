import { Card, Flex } from "rimble-ui";
import React, { Component } from 'react';

class TableRow extends Component {
  render() {
    const FieldComponent = this.props.fieldComponent;
    return (
      <Card
        pr={0}
        mb={2}
        px={[3,4]}
        py={[2,'20px']}
        width={1}
        boxShadow={1}
        borderRadius={2}
        id={this.props.cardId}
        {...this.props.rowProps}
      >
        <Flex
          flexDirection={'row'}
          id={this.props.rowId}
        >
          {
            this.props.cols.map((colInfo,colIndex) => (
              <Flex
                key={`col-${colIndex}`}
                {...colInfo.props}
              >
                <Flex
                  alignItems={'center'}
                  flexDirection={'row'}
                  {...colInfo.parentProps}
                  id={`${this.props.rowId}-${colIndex}`}
                >
                  {
                  colInfo.fields.map((fieldInfo,fieldIndex) => (
                    <FieldComponent
                      {...this.props}
                      fieldInfo={fieldInfo}
                      colProps={colInfo.props}
                      parentId={`${this.props.rowId}-${colIndex}`}
                      key={`field-${colIndex}-${fieldIndex}-${fieldInfo.name}`}
                    />
                  ))
                  }
                </Flex>
              </Flex>
            ))
          }
        </Flex>
      </Card>
    );
  }
}

export default TableRow;
