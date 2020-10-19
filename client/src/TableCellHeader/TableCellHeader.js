import React, { Component } from 'react';
import { Flex, Heading, Icon, Link } from "rimble-ui";

class TableCellHeader extends Component {
  render() {

    const ColTitle = (props) => (
      <Heading.h4
        pb={[2,3]}
        fontWeight={[3,4]}
        color={'cellTitle'}
        style={{
          width:'100%',
          whiteSpace:'nowrap'
        }}
        fontSize={['10px',3]}
        lineHeight={'initial'}
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
            <Flex
              alignItems={'flex-start'}
            >
              <ColTitle
                {...this.props}
              />
              <Link
                style={{
                  cursor:'pointer'
                }}
                onClick={ e => this.props.openTooltipModal(this.props.title,this.props.desc) }
              >
                <Icon
                  ml={1}
                  name={"Info"}
                  size={'1.2em'}
                  color={'cellTitle'}
                />
              </Link>
            </Flex>
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
