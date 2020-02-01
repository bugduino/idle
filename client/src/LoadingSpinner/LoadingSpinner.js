import React, { Component } from 'react';
import {
  Flex, Box
} from "rimble-ui";
import styles from './LoadingSpinner.module.scss';

class LoadingSpinner extends Component {
  render() {
    return (
      <Flex
        alignItems={'center'}
        justifyContent={'center'}
      >
        <Box className={[styles["loading-dots"]]}>
          <Box className={[styles["loading-dots--dot"]]} mx={[1,2]}></Box>
          <Box className={[styles["loading-dots--dot"]]} mx={[1,2]}></Box>
          <Box className={[styles["loading-dots--dot"]]} mx={[1,2]}></Box>
        </Box>
      </Flex>
    );
  }
}

export default LoadingSpinner;
