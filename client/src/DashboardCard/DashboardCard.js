import React, { Component } from 'react';
import { Heading, Card } from "rimble-ui";
import styles from './DashboardCard.module.scss';

class DashboardCard extends Component {
  render() {
    const isDisabled = this.props.isDisabled;
    const isInteractive = this.props.isInteractive && !isDisabled;
    const isActive = this.props.isActive && !isDisabled;

    const cardProps = {
      p:0,
      boxShadow:1,
      borderRadius:2,
      position:'relative',
      minHeight:'initial',
      background:'cardBg'
    };

    // Replace props
    if (this.props.cardProps && Object.keys(this.props.cardProps).length){
      Object.keys(this.props.cardProps).forEach(p => {
        cardProps[p] = this.props.cardProps[p];
      });
    }
    return (
      <Card
        {...cardProps}
        onClick={this.props.handleClick}
        className={[isDisabled ? styles.disabled : null,isInteractive ? styles.interactive : null,isActive ? styles.active : null]}
      >
        {
          this.props.title && this.props.title.length>0 &&
            <Heading.h4
              mt={[3,4]}
              ml={[3,4]}
              fontWeight={4}
              fontSize={[2,3]}
              textAlign={'left'}
              color={'dark-gray'}
              lineHeight={'initial'}
              {...this.props.titleProps}
            >
              {this.props.title}
            </Heading.h4>
        }
        {this.props.children}
      </Card>
    );
  }
}

export default DashboardCard;