import { Flex } from "rimble-ui";
import React, { Component } from 'react';
import DashboardCard from '../DashboardCard/DashboardCard';

class TableRow extends Component {
  render() {
    const FieldComponent = this.props.fieldComponent;
    const isInteractive = typeof this.props.handleClick === 'function';
    return (
      <DashboardCard
        cardProps={{
          mb:2,
          width:1,
          px:[2,4],
          py:[2,'12px']
        }}
        id={this.props.cardId}
        {...this.props.rowProps}
        className={this.props.token}
        isInteractive={isInteractive}
        handleClick={ isInteractive ? e => this.props.handleClick(this.props) : null }
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
                    width={1}
                    alignItems={'center'}
                    flexDirection={'row'}
                    {...colInfo.parentProps}
                  >
                    {
                      colInfo.fields.map((fieldInfo,fieldIndex) => {
                        if (fieldInfo.visible === false || (fieldInfo.mobile === false && this.props.isMobile)){
                          return null;
                        }
                        return (
                          <Flex
                            height={'100%'}
                            flexDirection={'column'}
                            alignItems={'flex-start'}
                            justifyContent={'center'}
                            {...fieldInfo.parentProps}
                            style={ fieldInfo.style ? fieldInfo.style : {
                              overflow:'hidden'
                            }}
                            width={colInfo.fields.length>1 ? 'auto' : 1}
                            id={`field-${colIndex}-${fieldIndex}-${fieldInfo.name}`}
                            key={`field-${colIndex}-${fieldIndex}-${fieldInfo.name}`}
                          >
                            <FieldComponent
                              {...this.props}
                              fieldInfo={fieldInfo}
                              colProps={colInfo.props}
                              parentId={`field-${colIndex}-${fieldIndex}-${fieldInfo.name}`}
                            />
                          </Flex>
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
