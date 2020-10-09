import React, { Component } from 'react';
import styles from './DashboardCard.module.scss';
import { Flex, Icon, Heading, Card, Tooltip } from "rimble-ui";

class DashboardCard extends Component {
  render() {
    const isDisabled = this.props.isDisabled;
    const isActive = this.props.isActive && !isDisabled;
    const isInteractive = this.props.isInteractive && !isDisabled;
    const isVisible = typeof this.props.isVisible !== 'undefined' ? this.props.isVisible : true;
    const isRainbow = typeof this.props.isRainbow !== 'undefined' ? this.props.isRainbow : false;

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

    const className = [
      styles.defaultOpacity,
      isActive ? styles.active : null,
      !isVisible ? styles.hidden : null,
      isRainbow ? styles.rainbow : null,
      isDisabled ? styles.disabled : null,
      isInteractive ? styles.interactive : null,
    ];

    if (this.props.className && styles[this.props.className]){
      className.push(styles[this.props.className]);
    }

    return (
      <Card
        {...cardProps}
        className={className}
        onClick={this.props.handleClick}
      >
        {
          this.props.title && this.props.title.length>0 &&
            <Flex
              mt={[3,4]}
              ml={[3,4]}
              alignItems={'center'}
              flexDirection={'row'}
              {...this.props.titleParentProps}
            >
              <Heading.h4
                fontWeight={4}
                fontSize={[2,3]}
                textAlign={'left'}
                color={'dark-gray'}
                lineHeight={'initial'}
                {...this.props.titleProps}
              >
                {this.props.title}
              </Heading.h4>
              {
                this.props.description && this.props.description.length>0 &&
                  <Tooltip
                    placement={'top'}
                    message={this.props.description}
                  >
                    <Icon
                      ml={2}
                      name={"Info"}
                      size={'1em'}
                      color={'cellTitle'}
                    />
                  </Tooltip>
              }
            </Flex>
        }
        {this.props.children}
      </Card>
    );
  }
}

export default DashboardCard;