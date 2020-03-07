import React, { Component } from 'react';
import styles from './Toggler.module.scss';
import { Flex, Link, Text, Checkbox } from 'rimble-ui'

class Toggler extends Component {

  render() {
    return (
      <Flex flexDirection={'row'} alignItems={'center'}>
        <Text mr={2} fontSize={2} fontWeight={2}>{ this.props.checked ? this.props.labelChecked : this.props.label }</Text>
        <Link className={[styles.switch,this.props.checked ? styles.checked : null]} onClick={ e => this.props.handleClick(e) }>
          <Checkbox />
          <Text.span className={[styles.slider,styles.round]}></Text.span>
        </Link>
      </Flex>
    );
  }
}

export default Toggler;