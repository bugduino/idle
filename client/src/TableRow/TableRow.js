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
          width:1,
          px:[2,4],
          py:[2,'20px']
        }}
        id={this.props.cardId}
        {...this.props.rowProps}
        handleClick={ e => this.props.handleClick(this.props) }
        isInteractive={typeof this.props.handleClick === 'function'}
      >
        <Flex
          flexDirection={'row'}
          id={this.props.rowId}
        >
          {
            this.props.cols.map((colInfo,colIndex) => {
              if (colInfo.visible === false || (colInfo.mobile === false && this.props.isMobile)){
                return null;
              }
              return (
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
                      colInfo.fields.map((fieldInfo,fieldIndex) => {
                        if (fieldInfo.visible === false || (fieldInfo.mobile === false && this.props.isMobile)){
                          return null;
                        }
                        return (
                          <FieldComponent
                            {...this.props}
                            fieldInfo={fieldInfo}
                            colProps={colInfo.props}
                            parentId={`${this.props.rowId}-${colIndex}`}
                            key={`field-${colIndex}-${fieldIndex}-${fieldInfo.name}`}
                          />
                        );
                      })
                    }
                  </Flex>
                </Flex>
              )
            })
          }
        </Flex>
      </DashboardCard>
    );
  }
}

export default TableRow;
