import { Card, Flex } from "rimble-ui";
import React, { Component } from 'react';

class TableRow extends Component {
  render() {
    const FieldComponent = this.props.fieldComponent;
    return (
      <Card
        pr={0}
        my={1}
        px={[3,4]}
        py={[2,3]}
        width={1}
        borderRadius={2}
        boxShadow={1}
      >
        <Flex
          flexDirection={'row'}
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
                >
                  {
                  colInfo.fields.map((fieldInfo,fieldIndex) => (
                    <FieldComponent
                      {...this.props}
                      fieldInfo={fieldInfo}
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
