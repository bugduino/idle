import React, { Component } from 'react';
import { Flex, Box, Heading, Button, Text } from 'rimble-ui'
import styles from './Landing.module.scss';
import LandingForm from '../LandingForm/LandingForm';
import IconFlexRow from '../IconFlexRow/IconFlexRow';

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
        <Box className={[styles.headerContainer]} px={[0, 2]} pt={['1em', '2em']}>
          <Flex flexDirection={'column'} alignItems={['center','flex-start']} maxWidth={["50em", "50em"]} mx={['auto',6]} pb={3} px={[3,0]} textAlign={['center','left']} pt={['15vh', '20vh']}>
            <Heading.h1 fontFamily={'serif'} className={[styles.title]} fontSize={[6,7]} textAlign={['center','left']}>
              Get the best lending rate, always
            </Heading.h1>
            <Heading.h2 className={[styles.subtitle]} fontSize={[3,4]} textAlign={['center','left']}>
              Idle leverage the best lending protocol with automagical decentralization to get the best rate. Every, single, time.
            </Heading.h2>
            <Button className={[styles.button]} size={'large'} mainColor={'black'} fontSize={[2,3]} px={[4,5]} mt={[3,4]} mb={[5,7]}>START LENDING</Button>
          </Flex>
        </Box>
        <Box className={[styles.graySection]}>
          <Box>
            <LandingForm />
          </Box>
          <Box maxWidth={['50em','70em']} mx={'auto'} my={[4,6]}>
            <IconFlexRow image={'/images/feature-1.png'} title='100% Return Guarantee by smart contract' linkHref={'#'} linkText='View the smart contract' />
            <IconFlexRow image={'/images/feature-2.png'} title='Fully decentralized thanks to our users' linkHref={'#'} linkText='Rebalance the rate' />
            <IconFlexRow image={'/images/feature-3.png'} title='No fees! Best things in life are free' linkHref={'#'} linkText='How do we earn money?' />
          </Box>
          <Flex maxWidth={'100%'} flexDirection={['column','row']}>
            <Box p={[5,6]} backgroundColor={'blue'} color={'white'}>
              <Heading.h3 fontFamily={'serif'} fontSize={[5,6]} mb={[3,4]}>Lorem ipsum gumbo beet tree</Heading.h3>
              <Heading.h4 fontWeight={1} lineHeight={2}>Idle leverage the best lending protocol automagically to reduce volatility.</Heading.h4>
              <Button size={'large'} mainColor={'lightBlue'} contrastColor={'blue'} fontWeight={2} fontSize={[2,3]} px={[4,5]} mt={[3,4]}>START LENDING</Button>
            </Box>
            <Box p={[5,6]} backgroundColor={'white'} color={'blue'}>
              <Heading.h3 fontFamily={'serif'} fontSize={[5,6]} mb={[3,4]}>Lorem ipsum gumbo beet tree</Heading.h3>
              <Heading.h4 color={'black'} fontWeight={1} lineHeight={2}>Idle leverage the best lending protocol automagically to reduce volatility.</Heading.h4>
              <Button size={'large'} mainColor={'blue'} contrastColor={'white'} fontWeight={2} fontSize={[2,3]} px={[4,5]} mt={[3,4]}>START LENDING</Button>
            </Box>
          </Flex>
        </Box>
        <Box className={[styles.graySection]}>
          <Box maxWidth={['35em','80em']} mx={'auto'} py={[4,6]}>
            <Flex flexDirection={['column','row']}>
              <Box p={[4,5]} pb={0} backgroundColor={'white'} color={'black'} boxShadow={1} borderBottom={'15px solid'} borderColor={'blue'}>
                <Heading.h3 textAlign={['center','left']} fontFamily={'serif'} fontSize={[4,5]} mb={[2,3]} color={'blue'}>Compound</Heading.h3>
                <Heading.h4 textAlign={['center','left']} fontWeight={1} lineHeight={2} fontSize={[2,3]}>Idle leverage the best lending protocol automagically to reduce volatility.</Heading.h4>
                <Heading.h2 fontFamily={'serif'} textAlign={'center'} fontWeight={2} fontSize={[7,8]} mb={[4,0]}>0.7%</Heading.h2>
              </Box>
              <Box p={[4,5]} pb={0} backgroundColor={'blue'} color={'white'} boxShadow={1} borderBottom={'15px solid'} borderColor={'white'}>
                <Heading.h3 textAlign={['center','left']} fontFamily={'serif'} fontSize={[4,5]} mb={[2,3]}>Idle DAI</Heading.h3>
                <Heading.h4 textAlign={['center','left']} fontWeight={1} lineHeight={2} fontSize={[2,3]}>Idle leverage the best lending protocol automagically to reduce volatility.</Heading.h4>
                <Heading.h2 fontFamily={'serif'} textAlign={'center'} fontWeight={2} fontSize={[9,10]} mb={[4,0]}>0.7%</Heading.h2>
              </Box>
              <Box p={[4,5]} pb={0} backgroundColor={'white'} color={'black'} boxShadow={1} borderBottom={'15px solid'} borderColor={'blue'}>
                <Heading.h3 textAlign={['center','left']} fontFamily={'serif'} fontSize={[4,5]} mb={[2,3]} color={'blue'}>Fulcrum</Heading.h3>
                <Heading.h4 textAlign={['center','left']} fontWeight={1} lineHeight={2} fontSize={[2,3]}>Idle leverage the best lending protocol automagically to reduce volatility.</Heading.h4>
                <Heading.h2 fontFamily={'serif'} textAlign={'center'} fontWeight={2} fontSize={[7,8]} mb={[4,0]}>0.5%</Heading.h2>
              </Box>
            </Flex>
          </Box>
        </Box>
      </Box>
    );
  }
}

export default Landing;
