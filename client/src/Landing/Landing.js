import React, { Component } from 'react';
import { Box, Heading } from 'rimble-ui'
import styles from './Landing.module.scss';

class Landing extends Component {
  state = {
  };
  render() {
    const { network } = this.props;
    return (
      <Box
        style={{
          paddingBottom: !network.isCorrectNetwork ? "8em" : "0"
        }}
      >
        <Box className={[styles.headerContainer]} px={[0, 2]} pt={['15vh', '20vh']}>
          <Box maxWidth={["50em", "64em"]} mx={"auto"} px={[2, 4]} pb={3}>
            <Heading.h1 className={[styles.title]} fontSize={[6,7]}>
              We are tokenizing the DIPOR
            </Heading.h1>
            <Heading.h2 className={[styles.subtitle]} fontSize={[3,4]}>
              Low volatility passive income
            </Heading.h2>
          </Box>
        </Box>
      </Box>
    );
  }
}

export default Landing;
