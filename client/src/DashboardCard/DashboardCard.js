import React, { Component } from 'react';
import { Heading, Card } from "rimble-ui";
import styles from './DashboardCard.module.scss';

class DashboardCard extends Component {
  render() {
    const isDisabled = this.props.isDisabled;
    const isInteractive = this.props.isInteractive && !isDisabled;
    const isActive = this.props.isActive && !isDisabled;
    return (
      <Card
        p={0}
        boxShadow={1}
        borderRadius={2}
        position={'relative'}
        minHeight={'initial'}
        background={'cardBg'}
        {...this.props.cardProps}
        onClick={this.props.handleClick}
        className={[isDisabled ? styles.disabled : null,isInteractive ? styles.interactive : null,isActive ? styles.active : null]}
      >
        {
          this.props.title && this.props.title.length>0 &&
            <Heading.h4 mt={[3,4]} ml={[3,4]} color={'dark-gray'} fontWeight={4} lineHeight={'initial'} fontSize={[2,3]} textAlign={'left'}>
              {this.props.title}
            </Heading.h4>
        }
        {this.props.children}
      </Card>
    );
  }
}

export default DashboardCard;