import React, { Component } from 'react';
import styles from './TableCellHeader.module.scss';
import { Flex, Heading, Icon, Link, Tooltip } from "rimble-ui";

class TableCellHeader extends Component {
  render() {

    const ColTitle = (props) => (
      <Heading.h4
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
              alignItems={'center'}
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
                <Tooltip
                  placement={'top'}
                  message={'Click to read the description'}
                >
                  <Icon
                    ml={1}
                    name={"Info"}
                    color={'cellTitle'}
                    className={styles.tooltip}
                    size={ this.props.isMobile ? '1em' : '1.2em'}
                  />
                </Tooltip>
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
