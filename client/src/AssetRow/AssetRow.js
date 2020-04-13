import React, { Component } from 'react';
import { Card, Flex } from "rimble-ui";
import AssetField from '../AssetField/AssetField';

class AssetRow extends Component {
  render() {
    return (
      <Card
        pr={0}
        my={1}
        width={1}
        px={[3,4]}
        py={[2,3]}
        boxShadow={1}
        borderRadius={2}
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
                  key={`field-container-${colIndex}`}
                >
                  {
                  colInfo.fields.map((fieldInfo,fieldIndex) => (
                    <AssetField
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

export default AssetRow;
