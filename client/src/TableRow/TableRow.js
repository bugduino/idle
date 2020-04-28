import { Flex } from "rimble-ui";
import React, { Component } from 'react';
import DashboardCard from '../DashboardCard/DashboardCard';

class TableRow extends Component {
  render() {
    const FieldComponent = this.props.fieldComponent;
    return (
      <DashboardCard
        cardProps={{
          mb:2,
          px:[3,4],
          py:[2,'20px'],
          width:1
        }}
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
      </DashboardCard>
    );
  }
}

export default TableRow;
