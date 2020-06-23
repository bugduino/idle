import Footer from '../Footer/Footer';
import React, { Component } from 'react';
import styles from './PageNotFound.module.scss';
import { Box, Flex, Heading, Button } from 'rimble-ui'
import Header_styles from '../utilities/components/Header.module.scss';
import {
  Link as RouterLink,
} from "react-router-dom";

class PageNotFound extends Component {
  state = {};

  render() {
    return (
      <Box>
        <Box className={styles.headerContainer} px={[3,6]} pt={['2em', '3em']}>
          <Box className={styles.headerBgFiller}></Box>
          <Box position={'relative'} zIndex={10}>
            <Flex flexDirection={'column'} alignItems={'center'} maxWidth={["50em", "60em"]} mx={'auto'} textAlign={'center'} pt={['8vh', '8vh']}>
              <Heading.h1 fontFamily={'sansSerif'} lineHeight={'1.1em'} mb={'0.3em'} fontSize={['2.5em',7]} textAlign={'center'} color={'white'}>
                This page doesn't exist!
              </Heading.h1>
              <Heading.h3 fontFamily={'sansSerif'} lineHeight={'1.1em'} mb={'0.6em'} fontWeight={2} fontSize={['1.5em',4]} textAlign={'center'} color={'white'}>
                Sorry, the page you are looking for cannot be found.
              </Heading.h3>
              <RouterLink to="/" style={{textDecoration:'none'}}>
                <Button
                  className={Header_styles.gradientButton}
                  borderRadius={4}
                  size={this.props.isMobile ? 'medium' : 'medium'}
                  mainColor={'blue'}
                  contrastColor={'white'}
                  fontWeight={3}
                  fontSize={[2,2]}
                  mx={'auto'}
                  px={[4,5]}
                  mt={2}
                >
                  GO TO HOMEPAGE
                </Button>
              </RouterLink>
            </Flex>
          </Box>
        </Box>
        <Footer />
      </Box>
    );
  }
}

export default PageNotFound;
