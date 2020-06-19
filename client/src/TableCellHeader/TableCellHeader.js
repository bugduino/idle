import React, { Component } from 'react';
import { Flex, Heading, Tooltip, Icon } from "rimble-ui";

class TableCellHeader extends Component {
  render() {

    const ColTitle = (props) => (
      <Heading.h4
        pb={[2,3]}
        fontSize={['10px',3]}
        fontWeight={[3,4]}
        color={'cellTitle'}
        lineHeight={'initial'}
        style={{
          width:'100%',
          whiteSpace:'nowrap'
        }}
        {...props}
      >
        {props.children}
      </Heading.h4>
    );

    return (
      <Flex
        width={this.props.width}
      >
        {
          (this.props.desc && this.props.desc.length>1) ? (
            <Tooltip
              placement={"top"}
              message={this.props.desc}
            >
              <Flex
                alignItems={'flex-start'}
              >
                <ColTitle
                  {...this.props}
                />
                <Icon
                  ml={1}
                  name={"Info"}
                  size={'1.2em'}
                  color={'cellTitle'}
                />
              </Flex>
            </Tooltip>
          ) : (
            <ColTitle
              {...this.props}
            />
          )
        }
      </Flex>
    );
  }
}

export default TableCellHeader;
