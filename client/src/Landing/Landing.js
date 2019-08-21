import React, { Component } from 'react';
import { Image, Flex, Box, Heading, Button, Link, Text } from 'rimble-ui'
import BigNumber from 'bignumber.js';
import styles from './Landing.module.scss';
import LandingForm from '../LandingForm/LandingForm';
import IconFlexRow from '../IconFlexRow/IconFlexRow';
import Faq from '../Faq/Faq';
import NewsletterForm from '../NewsletterForm/NewsletterForm';

class Landing extends Component {
  state = {};

  async componentDidUpdate(prevProps) {
    let prevContract = (prevProps.contracts.find(c => c.name === 'IdleDAI') || {}).contract;
    let contract = (this.props.contracts.find(c => c.name === 'IdleDAI') || {}).contract;

    if (contract && prevContract !== contract) {
      console.log('Getting APR');
      await this.getAprs();
    }
  }

  // utilities
  trimEth = eth => {
    return this.BNify(eth).toFixed(6);
  };
  BNify = s => new BigNumber(String(s));
  toEth(wei) {
    return this.props.web3.utils.fromWei(
      (wei || 0).toString(),
      "ether"
    );
  }
  toWei(eth) {
    return this.props.web3.utils.toWei(
      (eth || 0).toString(),
      "ether"
    );
  }

  getAprs = async () => {
    let aprs = await this.genericIdleCall('getAPRs');
    this.setState({
      [`compoundRate`]: aprs ? (+this.toEth(aprs[0])).toFixed(2) : '0.00',
      [`fulcrumRate`]: aprs ? (+this.toEth(aprs[1])).toFixed(2) : '0.00',
      [`maxRate`]: aprs ? (+this.toEth(Math.max(aprs[0],aprs[1]))).toFixed(2) : '0.00',
      needsUpdate: false
    });
  };

  genericContractCall = async (contractName, methodName, params = []) => {
    let contract = this.props.contracts.find(c => c.name === contractName);
    contract = contract && contract.contract;
    if (!contract) {
      console.log('Wrong contract name', contractName);
      return;
    }

    const value = await contract.methods[methodName](...params).call().catch(error => {
      console.log(`${contractName} contract method ${methodName} error: `, error);
      this.setState({ error });
    });
    return value;
  }

  // Idle
  genericIdleCall = async (methodName, params = []) => {
    return await this.genericContractCall('IdleDAI', methodName, params).catch(err => {
      console.error('Generic Idle call err:', err);
    });
  }

  startLending = async e => {
    this.props.updateSelectedTab(e, '1');
    window.location.href = '#invest';
  }

  render() {
    const { network } = this.props;
    return (
      <Box
        style={{
          paddingBottom: !network.isCorrectNetwork ? "8em" : "0"
        }}
      >
        <Box className={[styles.headerContainer]} pt={['2em', '2em']}>
          <Box className={[styles.bgContainer,styles.bg1]} display={['none','block']}></Box>
          <Box className={[styles.bgContainer,styles.bg2]} display={['none','block']}></Box>
          <Box position={'relative'} zIndex={10}>
            <Flex flexDirection={'column'} alignItems={['center','flex-start']} maxWidth={["50em", "50em"]} mx={['auto', 6]} pb={3} px={[2,0]} textAlign={['center','left']} pt={['10vh', '20vh']}>
              <Heading.h1 fontFamily={'sansSerif'} lineHeight={'1.1em'} mb={'0.5em'} fontSize={['2.5em',7]} textAlign={['center','left']}>
                Get the best out of your lend, with just one token
              </Heading.h1>
              <Heading.h2 fontWeight={'400'} lineHeight={['1.4em', '2em']} fontSize={[3,4]} textAlign={['center','left']}>
                We connect different lending protocols with a decentralized rebalance process to always give you the best available rate
              </Heading.h2>
              <Button
                onClick={e => this.startLending(e)}
                className={[styles.button]}
                size={this.props.isMobile ? 'medium' : 'large'}
                contrastColor={'blue'}
                mainColor={'white'}
                fontSize={[2, 4]}
                px={[4, 5]}
                mt={[4, 4]}
                mb={[5, '70vh']}
              >
                START LENDING
              </Button>
            </Flex>
            <Box id='invest' position={'relative'} width={['auto','100%']} mt={['0','-250px']}>
              <Box position={'absolute'} zIndex={'0'} width={'100%'} height={'50%'} top={'50%'} left={'0'} backgroundColor={'#f7f7f7'}></Box>
              <Box position={'relative'} zIndex={'1'}>
                <LandingForm
                  isMobile={this.props.isMobile}
                  updateSelectedTab={this.props.updateSelectedTab}
                  selectedTab={this.props.selectedTab} />
              </Box>
            </Box>
          </Box>
        </Box>

        <Box className={[styles.graySection]} pt={0}>
          <Box maxWidth={['50em','70em']} mx={[3, 'auto']} pt={0} pb={[4, 0]}>
            <IconFlexRow image={'images/feature-1.png'} title='100% non-custodial, thanks to our contract.' linkHref={'https://etherscan.io/address/0xAcf651Aad1CBB0fd2c7973E2510d6F63b7e440c9#code'} linkText='Smart contract' />
            <IconFlexRow image={'images/feature-2.png'} title='Fully decentralized, thanks to our users.' handleClick={e => this.props.updateSelectedTab(e,'3')} linkHref={'#invest'} linkText='Rebalance process' />
            <IconFlexRow image={'images/feature-3.png'} title='No hidden fees, best things in life are free!' linkHref={'#how-it-works'} linkText='See how it works' />
          </Box>
        </Box>

        {
        /*
        <Box className={[styles.graySection]} pt={0}>
          <Flex maxWidth={'100%'} flexDirection={['column','row']}>
            <Box position={'relative'} width={[1, 1/2]} p={[4,6]} backgroundColor={'blue'} color={'white'}>
              <Heading.h3 fontFamily={'sansSerif'} fontSize={[5,6]} mb={[3,4]}>Asset Managers</Heading.h3>
              <Heading.h4 fontWeight={1} lineHeight={2}>
                Enhance profitability for your customers and optimize portfolio returns.
              </Heading.h4>
              <Box display={['none','block']}>
                <Button onClick={e => this.startLending(e)} borderRadius={4} size={'large'} mainColor={'lightBlue'} contrastColor={'blue'} fontWeight={2} fontSize={[2,3]} px={[4,5]} mt={[4,4]}>INVEST NOW</Button>
              </Box>
              <Box display={['block','none']}>
                <Button onClick={e => this.startLending(e)} borderRadius={4} size={'medium'} mainColor={'lightBlue'} contrastColor={'blue'} fontWeight={2} fontSize={[2,3]} px={[4,5]} mt={[4,4]}>INVEST NOW</Button>
              </Box>
            </Box>
            <Box position={'relative'} width={[1, 1/2]} overflow={['hidden','visible']} p={[4,6]} backgroundColor={'white'} color={'blue'}>
              <Box className={styles.skewBg}></Box>
              <Box position={'relative'} zIndex={2}>
                <Heading.h3 fontFamily={'sansSerif'} fontSize={[5,6]} mb={[3,4]}>Retail Investors</Heading.h3>
                <Heading.h4 color={'black'} fontWeight={1} lineHeight={2}>
                  Are you a yield seeker? Make your money grows at the fastest pace on the market.
                </Heading.h4>
                <Box display={['none','block']}>
                  <Button onClick={e => this.startLending(e)} borderRadius={4} size={'large'} mainColor={'blue'} contrastColor={'white'} fontWeight={2} fontSize={[2,3]} px={[4,5]} mt={[3,4]}>START EARNING</Button>
                </Box>
                <Box display={['block','none']}>
                  <Button onClick={e => this.startLending(e)} borderRadius={4} size={'medium'} mainColor={'blue'} contrastColor={'white'} fontWeight={2} fontSize={[2,3]} px={[4,5]} mt={[3,4]}>START EARNING</Button>
                </Box>
              </Box>
            </Box>
          </Flex>
        </Box>
        */
        }

        <Box id='how-it-works' pb={[0,6]}>
          <Box>
            <Heading.h2 fontFamily={'sansSerif'} fontSize={[5,6]} textAlign={'center'} py={[4,5]} alignItems={'center'} my={0}>
              How it Works
            </Heading.h2>
            <Flex flexDirection={['column','column']} alignItems={'center'}>
              <Flex alignItems={'center'} flexDirection={'column'} width={1}>
                <Flex flexDirection={['column','row']}>
                  <Flex width={[1,1/2]} justifyContent={'flex-end'} borderRight={[0,'1px solid #eee']}>
                    <Box position={'relative'} className={styles.bulletCard} width={[1,2/3]} mr={[0,'45px']} mb={[2,4]}>
                      <Text lineHeight={'50px'} fontSize={'22px'} color={'white'} position={'absolute'} display={'block'} className={[styles.bulletPoint,styles.bulletRight]}>1</Text>
                      <Heading.h3 pt={[2]} textAlign={['center','right']} fontFamily={'sansSerif'} fontSize={[4,5]} mb={[2,3]} color={'blue'}>
                        Lend your assets
                      </Heading.h3>
                      <Heading.h4 fontSize={[2,3]} px={[3,0]} textAlign={['center','right']} fontWeight={2} lineHeight={1.5}>
                        Connect your Ethereum wallet and lend some idle crypto assets to get started.
                        You will receive IdleTokens representing your contract pool share.
                      </Heading.h4>
                    </Box>
                  </Flex>
                  <Flex width={[1,1/2]}></Flex>
                </Flex>
                <Flex flexDirection={['column','row']}>
                  <Flex width={[1,1/2]} borderRight={[0,'1px solid #eee']}></Flex>
                  <Flex width={[1,1/2]} justifyContent={'flex-start'}>
                    <Box position={'relative'} className={styles.bulletCard} width={[1,2/3]} ml={[0,'45px']} mb={[2,4]}>
                      <Text lineHeight={'50px'} fontSize={'22px'} color={'white'} position={'absolute'} display={'block'} className={[styles.bulletPoint,styles.bulletLeft]}>2</Text>
                      <Heading.h3 pt={[2]} textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[4,5]} mb={[2,3]} color={'blue'}>
                        Earn interests
                      </Heading.h3>
                      <Heading.h4 fontSize={[2,3]} px={[3,0]} textAlign={['center','left']} fontWeight={2} lineHeight={1.5}>
                        Your funds will be automatically allocated among the best available interest bearing tokens.
                        You will immediately start earning compounded interest with a block-per-block pace.
                      </Heading.h4>
                    </Box>
                  </Flex>
                </Flex>
                <Flex flexDirection={['column','row']}>
                  <Flex width={[1,1/2]} justifyContent={'flex-end'} borderRight={[0,'1px solid #eee']}>
                    <Box position={'relative'} className={styles.bulletCard} width={[1,2/3]} mr={[0,'45px']} mb={[2,4]}>
                      <Text lineHeight={'50px'} fontSize={'22px'} color={'white'} position={'absolute'} display={'block'} className={[styles.bulletPoint,styles.bulletRight]}>3</Text>
                      <Heading.h3 pt={[2]} textAlign={['center','right']} fontFamily={'sansSerif'} fontSize={[4,5]} mb={[2,3]} color={'blue'}>
                        Decentralized rebalance
                      </Heading.h3>
                      <Heading.h4 fontSize={[2,3]} px={[3,0]} textAlign={['center','right']} fontWeight={2} lineHeight={1.5}>
                        Every interaction with Idle, made by any user, rebalances the entire pool if needed.
                        If the current tracked rate is not the actual best, you have the power to rebalance on behalf
                        of all users. One for all, all for one.
                      </Heading.h4>
                    </Box>
                  </Flex>
                  <Flex width={[1,1/2]}></Flex>
                </Flex>
                <Flex flexDirection={['column','row']}>
                  <Flex width={[1,1/2]} borderRight={[0,'1px solid #eee']} height={[0,'125px']}></Flex>
                  <Flex width={[1,1/2]} justifyContent={'flex-start'}>
                    <Box position={'relative'} className={styles.bulletCard} width={[1,2/3]} ml={[0,'45px']}>
                      <Text lineHeight={'50px'} fontSize={'22px'} color={'white'} position={'absolute'} display={'block'} className={[styles.bulletPoint,styles.bulletLeft]}>4</Text>
                      <Heading.h3 pt={[2]} textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[4,5]} mb={[2,3]} color={'blue'}>
                        Easy Redeem
                      </Heading.h3>
                      <Heading.h4 fontSize={[2,3]} px={[3,0]} textAlign={['center','left']} fontWeight={2} lineHeight={1.5}>
                        At anytime you can redeem your invested assets and get back your increased funds, automatically
                        rebalancing the pool if needed. Kudos for you.
                      </Heading.h4>
                    </Box>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
          </Box>
        </Box>

        <Box position={'relative'} className={[styles.graySection]} pb={[4,6]}>
          <Box className={[styles.bgContainer,styles.bgHeart]}></Box>
          <Box position={'relative'} maxWidth={['35em','80em']} mx={'auto'}>
            <Heading.h2 fontFamily={'sansSerif'} fontSize={[5, 6]} textAlign={'center'} py={[4,5]} alignItems={'center'} my={0}>
              Get the best APR, always.
            </Heading.h2>
            <Flex alignItems={['normal','flex-end']} flexDirection={['column','row']}>
              <Box width={[1,3/10]}>
                <Box p={[4,5]} pb={0} backgroundColor={'white'} color={'black'} boxShadow={1} borderBottom={'15px solid'} borderColor={'blue'}>
                  <Heading.h3 textAlign={['center']} fontFamily={'sansSerif'} fontSize={[3,4]} mb={[2,3]} color={'blue'}>
                    <Image src={'images/compound-mark-green.png'} className={styles.platformLogo} /> Compound DAI
                  </Heading.h3>
                  <Heading.h4 textAlign={['center']} fontWeight={1} lineHeight={2} fontSize={[2,3]}>
                    Current lending interest rate on Compound V2.
                  </Heading.h4>
                  <Heading.h2 fontFamily={'sansSerif'} textAlign={'center'} fontWeight={2} fontSize={[6,8]} mb={[4,0]}>{this.state.compoundRate}%</Heading.h2>
                </Box>
              </Box>
              <Box width={[1,4/10]} p={[4,5]} pb={0} backgroundColor={'blue'} color={'white'} boxShadow={1} borderBottom={'15px solid'} borderColor={'white'}>
                <Heading.h3 textAlign={['center']} fontFamily={'sansSerif'} fontSize={[4,5]} mb={[2,3]}>
                  <Image src={'images/idle-mark.png'} className={styles.platformLogo} /> Idle DAI
                </Heading.h3>
                <Heading.h4 textAlign={['center']} fontWeight={1} lineHeight={2} fontSize={[2,3]}>
                  We will always get the best rate, thanks to our users and the decentralized rebalance process.
                </Heading.h4>
                <Heading.h2 fontFamily={'sansSerif'} textAlign={'center'} fontWeight={2} fontSize={[8,10]} mb={[4,0]}>{this.state.maxRate}%</Heading.h2>
                <Box justifyContent={'center'} alignItems={'center'} textAlign={'center'} display={['none','flex']}>
                  <Button onClick={e => this.startLending(e)} borderRadius={4} size={'large'} mainColor={'lightBlue'} contrastColor={'blue'} fontWeight={2} fontSize={[2,3]} px={[4,5]} mt={[2,4]} mb={[3,3]}>START EARNING</Button>
                </Box>
                <Box justifyContent={'center'} alignItems={'center'} textAlign={'center'} display={['flex','none']}>
                  <Button onClick={e => this.startLending(e)} borderRadius={4} size={'medium'} mainColor={'lightBlue'} contrastColor={'blue'} fontWeight={2} fontSize={[2,3]} px={[4,5]} mt={[2,4]} mb={[3,3]}>START EARNING</Button>
                </Box>
              </Box>
              <Box width={[1,3/10]}>
                <Box p={[4,5]} pb={0} backgroundColor={'white'} color={'black'} boxShadow={1} borderBottom={'15px solid'} borderColor={'blue'}>
                  <Heading.h3 textAlign={['center']} fontFamily={'sansSerif'} fontSize={[3,4]} mb={[2,3]} color={'blue'}>
                    <Image src={'images/fulcrum-mark.png'} className={styles.platformLogo} /> Fulcrum DAI
                  </Heading.h3>
                  <Heading.h4 textAlign={['center']} fontWeight={1} lineHeight={2} fontSize={[2,3]}>
                    Current lending interest rate on Fulcrum.
                  </Heading.h4>
                  <Heading.h2 fontFamily={'sansSerif'} textAlign={'center'} fontWeight={2} fontSize={[6,8]} mb={[4,0]}>{this.state.fulcrumRate}%</Heading.h2>
                </Box>
              </Box>
            </Flex>
          </Box>
        </Box>

        <Box id="faq" pb={[4,6]}>
          <Box maxWidth={'50em'} mx={'auto'} px={[3,5]}>
            <Heading.h2 fontFamily={'sansSerif'} fontSize={[5, 6]} textAlign={'center'} pt={[4,5]} pb={[2,3]} alignItems={'center'} my={0}>
              Stay up to date
            </Heading.h2>
            <Heading.h4 textAlign={['center']} fontWeight={1} lineHeight={2} fontSize={[2,3]} mb={[3,4]}>
              Sign up for the newsletter to get the latest Idle news
            </Heading.h4>
            <NewsletterForm />
          </Box>
        </Box>

        <Box id="faq" pb={[4,6]} className={[styles.graySection]}>
          <Box maxWidth={['50em','70em']} mx={'auto'} px={[3,5]}>
            <Faq />
          </Box>
        </Box>

        <Box backgroundColor={'darkBlue'} py={[2,3]} px={[2,3]}>
          <Flex flexDirection={['column','row']} alignItems={'center'} justifyContent={'space-between'}>
            <Flex flexDirection={['column']} mt={[2, 0]} alignItems={['center','baseline']} justifyContent={'flex-end'}>
              <Box ml={[0,3]} mb={[0,2]}>
                <Text color={'white'} textAlign={['center','left']}>Built on:</Text>
              </Box>
              <Flex flexDirection={['row']}>
                <Link href="https://www.ethereum.org/" target="_blank">
                  <Image src="images/ethereum.png" height={['1.3em', '2em']} mx={[1,3]} my={[2,0]} />
                </Link>
                <Link href="https://app.compound.finance" target="_blank">
                  <Image src="images/compound-light.png" height={['1.3em', '2em']} mx={[1,3]} my={[2,0]} />
                </Link>
                <Link href="https://fulcrum.trade" target="_blank">
                  <Image src="images/fulcrum.svg" height={['1.3em', '2em']} mx={[1,3]} my={[2,0]} />
                </Link>
              </Flex>
            </Flex>
            <Flex flexDirection={['column']} mt={[2, 0]} alignItems={['center','flex-end']} justifyContent={'flex-end'}>
              <Box mr={[0,3]} mb={[0,2]}>
                <Text color={'white'} textAlign={['center','right']}>Explore:</Text>
              </Box>
              <Flex flexDirection={['row']}>
                <Link href="https://twitter.com/idlefinance" target="_blank">
                  <Image src="images/twitter-logo.png" height={'2em'} mx={[2,3]} my={[2,0]} />
                </Link>
                <Link href="https://t.me/idlefinance" target="_blank">
                  <Image src="images/telegram-logo.png" height={'2em'} mx={[2,3]} my={[2,0]} />
                </Link>
                <Link href="https://discord.gg/mpySAJp" target="_blank">
                  <Image src="images/discord-logo.png" height={'2em'} mx={[2,3]} my={[2,0]} />
                </Link>
                <Link href="https://medium.com/@idlefinance" target="_blank">
                  <Image src="images/medium-logo.png" height={'2em'} mx={[2,3]} my={[2,0]} />
                </Link>
                <Link href="https://github.com/bugduino/idle" target="_blank">
                  <Image src="images/github-logo.png" height={'2em'} mx={[2,3]} my={[2,0]} />
                </Link>
                <Link href="https://etherscan.io/address/0xAcf651Aad1CBB0fd2c7973E2510d6F63b7e440c9#code" target="_blank">
                  <Image src="images/etherscan.png" height={'2em'} mx={[2,3]} my={[2,0]} />
                </Link>
              </Flex>
            </Flex>
          </Flex>
        </Box>
      </Box>
    );
  }
}

export default Landing;
