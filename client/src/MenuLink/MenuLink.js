import React, { Component } from 'react';
import { Link } from 'rimble-ui'
import styles from './MenuLink.module.scss';

class MenuLink extends Component {
  state = {
  };
  render() {
    return (
      <Link className={[styles.link]} href="{this.props.src}" target="_blank" color={'white'} fontSize={[3,4]} pr={[3,4]} fontWeight={2}>{this.props.text}</Link>
    );
  }
}

export default MenuLink;
