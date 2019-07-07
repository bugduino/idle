import React, { Component } from 'react';
import { Flex, Box, Heading, Button, Text } from 'rimble-ui'
import styles from './Landing.module.scss';
import LandingForm from '../LandingForm/LandingForm';
import IconFlexRow from '../IconFlexRow/IconFlexRow';
import Faq from '../Faq/Faq';

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
              Get the best out of your lend, with just one token.
            </Heading.h1>
            <Heading.h2 className={[styles.subtitle]} fontSize={[3,4]} textAlign={['center','left']}>
              Idle connects different lending protocols with a decentralized rebalance process in order to get the best rate.
            </Heading.h2>
            <Button className={[styles.button]} size={'large'} mainColor={'black'} fontSize={[2,3]} px={[4,5]} mt={[3,4]} mb={[5,7]}>START LENDING</Button>
          </Flex>
        </Box>

        <Box className={[styles.graySection]}>
          <Box id='invest' position={'relative'}>
            <Box position={'absolute'} zIndex={'0'} width={'100%'} height={'50%'} top={'0'} left={'0'} backgroundColor={'bgBlue'}></Box>
            <Box position={'absolute'} zIndex={'0'} width={'100%'} height={'50%'} top={'50%'} left={'0'} backgroundColor={'gray'}></Box>
            <Box position={'relative'} zIndex={'1'}>
              <LandingForm />
            </Box>
          </Box>
          <Box maxWidth={['50em','70em']} mx={'auto'} my={[4,6]}>
            <IconFlexRow image={'/images/feature-1.png'} title='100% non-custodial, thanks to our contract.' linkHref={'#'} linkText='Smart contract' />
            <IconFlexRow image={'/images/feature-2.png'} title='Fully decentralized, thanks to our users.' linkHref={'#'} linkText='Rebalance process' />
            <IconFlexRow image={'/images/feature-3.png'} title='No hidden fees, fully open source.' linkHref={'#'} linkText='See how it works' />
          </Box>
          <Flex maxWidth={'100%'} flexDirection={['column','row']}>
            <Box p={[5,6]} backgroundColor={'blue'} color={'white'}>
              <Heading.h3 fontFamily={'serif'} fontSize={[5,6]} mb={[3,4]}>Wealth Managers</Heading.h3>
              <Heading.h4 fontWeight={1} lineHeight={2}>IdleTokens can be used by wealth managers in order to optimize their customer’ portfolio returns.</Heading.h4>
              <Button onClick={e => window.location.href='#invest'} size={'large'} mainColor={'lightBlue'} contrastColor={'blue'} fontWeight={2} fontSize={[2,3]} px={[4,5]} mt={[3,4]}>START LENDING</Button>
            </Box>
            <Box p={[5,6]} backgroundColor={'white'} color={'blue'}>
              <Heading.h3 fontFamily={'serif'} fontSize={[5,6]} mb={[3,4]}>Retail Investors</Heading.h3>
              <Heading.h4 color={'black'} fontWeight={1} lineHeight={2}>IdleTokens can be owned by retail investors that want to seek the highest yield on their funds.</Heading.h4>
              <Button onClick={e => window.location.href='#invest'} size={'large'} mainColor={'blue'} contrastColor={'white'} fontWeight={2} fontSize={[2,3]} px={[4,5]} mt={[3,4]}>START LENDING</Button>
            </Box>
          </Flex>
        </Box>

        <Box id='how-it-works'>
          <Box my={[2,3]}>
            <Heading.h2 fontFamily={'serif'} fontSize={[5, 6]} textAlign={'center'} py={2} alignItems={'center'} my={0}>
              How it Works
            </Heading.h2>
            <Flex flexDirection={['column','row']}>
              <Box width={[1,2/5]}>

              </Box>
              <Flex flexDirection={'column'} width={[1,3/5]}>
                <Flex flexDirection={['column','row']}>
                  <Box p={[4,5]} backgroundColor={'white'} color={'black'} borderBottom={['1px solid #eee','none']}>
                    <Heading.h3 textAlign={['center','left']} fontFamily={'serif'} fontSize={[4,5]} mb={[2,3]} color={'blue'}>1. Lend your assets</Heading.h3>
                    <Heading.h4 textAlign={['center','left']} fontWeight={2} lineHeight={2} fontSize={[1,2]}>Connect your wallet and lend your crypto assets to get started. You will receive idleTokens, which represent your interest accruing funds.</Heading.h4>
                  </Box>
                  <Box p={[4,5]} backgroundColor={'white'} color={'black'} borderBottom={['1px solid #eee','none']}>
                    <Heading.h3 textAlign={['center','left']} fontFamily={'serif'} fontSize={[4,5]} mb={[2,3]} color={'blue'}>2. Earn interests</Heading.h3>
                    <Heading.h4 textAlign={['center','left']} fontWeight={2} lineHeight={2} fontSize={[1,2]}>Your assets will immediately start earning interest at the best available rate among different lending providers, with a block-per-block pace.</Heading.h4>
                  </Box>
                </Flex>
                <Flex flexDirection={['column','row']}>
                  <Box p={[4,5]} backgroundColor={'white'} color={'black'} borderBottom={['1px solid #eee','none']}>
                    <Heading.h3 textAlign={['center','left']} fontFamily={'serif'} fontSize={[4,5]} mb={[2,3]} color={'blue'}>3. Dbasedecentralized rebalance</Heading.h3>
                    <Heading.h4 textAlign={['center','left']} fontWeight={2} lineHeight={2} fontSize={[1,2]}>If needed, you have the power to rebalance the entire Idle user funds pool on behalf of all users. One for all, all for one.</Heading.h4>
                  </Box>
                  <Box p={[4,5]} backgroundColor={'white'} color={'black'}>
                    <Heading.h3 textAlign={['center','left']} fontFamily={'serif'} fontSize={[4,5]} mb={[2,3]} color={'blue'}>4. Redeem at anytime</Heading.h3>
                    <Heading.h4 textAlign={['center','left']} fontWeight={2} lineHeight={2} fontSize={[1,2]}>Anytime, you can redeem your idleTokens and get back your increased funds, rebalancing the pool if needed. Kudos for you.</Heading.h4>
                  </Box>
                </Flex>
              </Flex>
            </Flex>
          </Box>
        </Box>

        <Box className={[styles.graySection]}>
          <Box maxWidth={['35em','80em']} mx={'auto'} pt={[2,3]} pb={[4,6]}>
            <Heading.h2 fontFamily={'serif'} fontSize={[5, 6]} textAlign={'center'} py={3} alignItems={'center'} my={0}>
              Always the best Rate
            </Heading.h2>
            <Flex flexDirection={['column','row']}>
              <Box p={[4,5]} pb={0} backgroundColor={'white'} color={'black'} boxShadow={1} borderBottom={'15px solid'} borderColor={'blue'}>
                <Heading.h3 textAlign={['center','left']} fontFamily={'serif'} fontSize={[4,5]} mb={[2,3]} color={'blue'}>Compound</Heading.h3>
                <Heading.h4 textAlign={['center','left']} fontWeight={1} lineHeight={2} fontSize={[2,3]}>This is the current lending interest rate on Compound.</Heading.h4>
                <Heading.h2 fontFamily={'serif'} textAlign={'center'} fontWeight={2} fontSize={[6,8]} mb={[4,0]}>0.7%</Heading.h2>
              </Box>
              <Box p={[4,5]} pb={0} backgroundColor={'blue'} color={'white'} boxShadow={1} borderBottom={'15px solid'} borderColor={'white'}>
                <Heading.h3 textAlign={['center','left']} fontFamily={'serif'} fontSize={[4,5]} mb={[2,3]}>Idle</Heading.h3>
                <Heading.h4 textAlign={['center','left']} fontWeight={1} lineHeight={2} fontSize={[2,3]}>Idle will get the best rate, thanks to users and Adam Smith' invisible hand principle.</Heading.h4>
                <Heading.h2 fontFamily={'serif'} textAlign={'center'} fontWeight={2} fontSize={[9,10]} mb={[4,0]}>0.7%</Heading.h2>
              </Box>
              <Box p={[4,5]} pb={0} backgroundColor={'white'} color={'black'} boxShadow={1} borderBottom={'15px solid'} borderColor={'blue'}>
                <Heading.h3 textAlign={['center','left']} fontFamily={'serif'} fontSize={[4,5]} mb={[2,3]} color={'blue'}>Fulcrum</Heading.h3>
                <Heading.h4 textAlign={['center','left']} fontWeight={1} lineHeight={2} fontSize={[2,3]}>This is the current lending interest rate on Fulcrum.</Heading.h4>
                <Heading.h2 fontFamily={'serif'} textAlign={'center'} fontWeight={2} fontSize={[6,8]} mb={[4,0]}>0.5%</Heading.h2>
              </Box>
            </Flex>
          </Box>
        </Box>

        <Box>
          <Box maxWidth={['50em','70em']} mx={'auto'} my={[2,3]} px={[3,5]}>
            <Faq />
          </Box>
        </Box>
      </Box>
    );
  }
}

export default Landing;
