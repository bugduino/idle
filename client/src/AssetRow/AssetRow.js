import React, { Component } from 'react';
import { Card, Flex } from "rimble-ui";
import AssetField from '../AssetField/AssetField';

class AssetRow extends Component {
  render() {
    return (
      <Card
        pr={0}
        my={1}
        pl={[3,4]}
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
                >
                  {
                  colInfo.fields.map(fieldInfo => (
                    <AssetField
                      {...this.props}
                      fieldInfo={fieldInfo}
                      key={`field-${colIndex}-${fieldInfo.name}`}
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
