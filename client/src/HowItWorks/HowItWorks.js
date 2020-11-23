import Title from '../Title/Title';
import React, { Component } from 'react';
import styles from './HowItWorks.module.scss';
import { Box, Flex, Heading, Image } from "rimble-ui";

class HowItWorks extends Component {

  async componentWillMount(){
    
  }

  async componentDidUpdate(prevProps,prevState){

  }

  render() {
    return (
      <Box
        p={[3,4]}
        id={'how-it-works'}
      >
        <Flex flexDirection={['column','column']} alignItems={'center'} justifyContent={'center'}>
          <Title
            mt={[3,4]}
            mb={[3,4]}
            fontWeight={5}
            fontSize={[5,6]}
            component={Heading.h4}
          >
            How it works
          </Title>
          <Flex
            width={1}
            alignItems={'center'}
            maxWidth={['24em','90em']}
            flexDirection={['column','row']}
          >
            <Flex
              p={[3,3]}
              mx={[0,2]}
              my={[2,0]}
              width={[1,1/4]}
              position={'relative'}
              flexDirection={'column'}
              className={styles.bulletCard}
            >
              <Flex
                mb={2}
                width={1}
                alignItems={'center'}
                justifyContent={'center'}
              >
                <Image width={['2.5em','3.3em']} src={'images/how-it-works/choose-strategy.svg'} />
              </Flex>
              <Box width={1}>
                <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[1,2]} color={'blue'}>
                  Choose your strategy
                </Heading.h3>
                <Heading.h4 fontSize={1} px={[1,0]} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                  Build your portfolio with different allocation strategies that aim to maximize your returns and keeping you in your risk comfort zone
                </Heading.h4>
              </Box>
            </Flex>

            <Flex
              p={[3,3]}
              mx={[0,2]}
              my={[2,0]}
              width={[1,1/4]}
              position={'relative'}
              flexDirection={'column'}
              className={styles.bulletCard}
            >
              <Flex
                mb={2}
                width={1}
                alignItems={'center'}
                justifyContent={'center'}
              >
                <Image width={['2.5em','3.3em']} src={'images/how-it-works/deposit-stablecoins.svg'} />
              </Flex>
              <Box width={1}>
                <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[1,2]} color={'blue'}>
                  Deposit your crypto-assets
                </Heading.h3>
                <Heading.h4 fontSize={1} px={[1,0]} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                  Just deposit and relax. Your funds will be automatically allocated among DeFi protocols and you will immediately start earning interest.
                </Heading.h4>
              </Box>
            </Flex>

            <Flex
              p={[3,3]}
              mx={[0,2]}
              my={[2,0]}
              width={[1,1/4]}
              position={'relative'}
              flexDirection={'column'}
              className={styles.bulletCard}
            >
              <Flex
                mb={2}
                width={1}
                alignItems={'center'}
                justifyContent={'center'}
              >
                <Image width={['2.5em','3.3em']} src={'images/how-it-works/rebalance.svg'} />
              </Flex>
              <Box width={1}>
                <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[1,2]} color={'blue'}>
                  Automated Rebalancing
                </Heading.h3>
                <Heading.h4 fontSize={1} px={[1,0]} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                  Idle automatically keeps the appropriate allocation mix, depending on the strategy. Idle consistently checks for better opportunities.
                </Heading.h4>
              </Box>
            </Flex>
            <Flex
              p={[3,3]}
              mx={[0,2]}
              my={[2,0]}
              width={[1,1/4]}
              position={'relative'}
              flexDirection={'column'}
              className={styles.bulletCard}
            >
              <Flex
                mb={2}
                width={1}
                alignItems={'center'}
                justifyContent={'center'}
              >
                <Image width={['2.5em','3.3em']} src={'images/how-it-works/insights-redeem.svg'} />
              </Flex>
              <Box width={1}>
                <Heading.h3 textAlign={'center'} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[1,2]} color={'blue'}>
                  Easy insights and redeem
                </Heading.h3>
                <Heading.h4 fontSize={1} px={[1,0]} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                  Monitor your funds’ performance and rebalance events, see your estimated earnings and easlily redeem back your funds + interest.
                </Heading.h4>
              </Box>
            </Flex>
          </Flex>
        </Flex>
      </Box>
    );
  }
}

export default HowItWorks;