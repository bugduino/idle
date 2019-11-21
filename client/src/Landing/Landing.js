import React, { Component } from 'react';
import { Image, Flex, Box, Heading, Link, Text, Card, Icon } from 'rimble-ui'
import BigNumber from 'bignumber.js';
import styles from './Landing.module.scss';
import LandingForm from '../LandingForm/LandingForm';
import Faq from '../Faq/Faq';
import NewsletterForm from '../NewsletterForm/NewsletterForm';
import EquityChart from '../EquityChart/EquityChart';

let scrolling = false;

class Landing extends Component {
  state = {
    activeCarousel:1,
    carouselIntervalID:null,
    startCarousel:null,
    setActiveCarousel:null,
    activeBullet:null,
    testPerformed:false
  };

  async componentWillUnmount(){
    window.clearTimeout(this.state.carouselIntervalID);
  }

  async componentDidMount(){

    let scrollTimeoutID = null;
    window.onscroll = async () => {
      if (scrollTimeoutID){
        window.clearTimeout(scrollTimeoutID);
      }
      scrollTimeoutID = window.setTimeout( async () => {
        scrolling = true;
        this.processScrolling();
      },150);
    };

    const startCarousel = async () => {
      if (!this.props.isMobile){
        if (this.state.carouselIntervalID){
          window.clearTimeout(this.state.carouselIntervalID);
        }
        const intervalID = window.setTimeout( async () => setActiveCarousel(this.state.activeCarousel+1) ,6500);
        this.setState({carouselIntervalID:intervalID});
      }
    }

    const setActiveCarousel = (index) => {
      index = index<=3 ? index : 1;
      this.setState({activeCarousel:index});
      startCarousel();
    }

    this.setState({startCarousel,setActiveCarousel});

    if (!this.props.isMobile && !this.state.carouselIntervalID){
      startCarousel();
    }
  }

  async componentDidUpdate(prevProps) {

    let prevContract = (prevProps.contracts.find(c => c.name === 'idleDAI') || {}).contract;
    let contract = (this.props.contracts.find(c => c.name === 'idleDAI') || {}).contract;

    // console.log(this.props.contracts,prevContract,contract);

    if (contract && prevContract !== contract) {
      console.log('Getting APR');
      await this.getAprs();
    }
  }

  processScrolling = () => {
    if (scrolling){

      const bulletCards = document.getElementsByClassName('Landing_bulletCard__3num6');
      let activeBullet = 0;

      for (let i=0;i<bulletCards.length;i++){
        const bulletCard = bulletCards[i];
        const offsetY = bulletCard.offsetTop;
        if (window.scrollY >= offsetY-200){
          activeBullet = i+2;
        }
      }
      scrolling = false;
      if (parseInt(activeBullet) !== parseInt(this.state.activeBullet)){
        this.setState({activeBullet});
      }
    }
  };

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

  getCurrentProtocol = async (bestToken) => {
    bestToken = bestToken ? bestToken : await this.genericIdleCall('bestToken');
    if (bestToken){
      // console.log('getCurrentProtocol',bestToken,this.props.tokenConfig.protocols);
      const bestProtocol = this.props.tokenConfig.protocols.find(p => p.address.toString().toLowerCase() === bestToken.toString().toLowerCase());
      return bestProtocol ? bestProtocol.name : null;
    }
    return false;
  }

  getAprs = async () => {
    const aprs = await this.genericIdleCall('getAPRs');
    if (!aprs){
      setTimeout(() => {
        this.getAprs();
      },5000);
      return false;
    }
    const bestToken = await this.genericIdleCall('bestToken');
    const currentProtocol = await this.getCurrentProtocol(bestToken);
    const maxRate = this.toEth(Math.max(aprs[0],aprs[1]));
    const currentRate = bestToken ? (bestToken.toString().toLowerCase() === this.props.tokenConfig.protocols[0].address ? aprs[0] : aprs[1]) : null;
    // console.log('Landing.js getAprs',bestToken,currentRate.toString());
    const state = {
      [`compoundRate`]: aprs ? (+this.toEth(aprs[0])).toFixed(2) : '0.00',
      [`fulcrumRate`]: aprs ? (+this.toEth(aprs[1])).toFixed(2) : '0.00',
      [`maxRate`]: aprs ? ((+maxRate).toFixed(2)) : '0.00',
      currentProtocol,
      currentRate: currentRate ? (+this.toEth(currentRate)).toFixed(2) : null
    };
    this.setState(state);
    return state;
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
    return await this.genericContractCall('idleDAI', methodName, params).catch(err => {
      console.error('Generic Idle call err:', err);
    });
  }

  startLending = async e => {
    this.props.updateSelectedTab(e, '1');
    window.location.href = '#invest';
  }

  scrollIt = (destination, duration = 200, easing = 'linear', callback) => {

    const easings = {
      linear(t) {
        return t;
      },
      easeInQuad(t) {
        return t * t;
      },
      easeOutQuad(t) {
        return t * (2 - t);
      },
      easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      },
      easeInCubic(t) {
        return t * t * t;
      },
      easeOutCubic(t) {
        return (--t) * t * t + 1;
      },
      easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      },
      easeInQuart(t) {
        return t * t * t * t;
      },
      easeOutQuart(t) {
        return 1 - (--t) * t * t * t;
      },
      easeInOutQuart(t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
      },
      easeInQuint(t) {
        return t * t * t * t * t;
      },
      easeOutQuint(t) {
        return 1 + (--t) * t * t * t * t;
      },
      easeInOutQuint(t) {
        return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
      }
    };

    const start = window.pageYOffset;
    const startTime = 'now' in window.performance ? performance.now() : new Date().getTime();

    const documentHeight = Math.max(document.body.scrollHeight, document.body.offsetHeight, document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight);
    const windowHeight = window.innerHeight || document.documentElement.clientHeight || document.getElementsByTagName('body')[0].clientHeight;
    const destinationOffset = typeof destination === 'number' ? destination : destination.offsetTop;
    const destinationOffsetToScroll = Math.round(documentHeight - destinationOffset < windowHeight ? documentHeight - windowHeight : destinationOffset);

    if ('requestAnimationFrame' in window === false) {
      window.scroll(0, destinationOffsetToScroll);
      if (callback) {
        callback();
      }
      return;
    }

    function scroll() {
      const now = 'now' in window.performance ? performance.now() : new Date().getTime();
      const time = Math.min(1, ((now - startTime) / duration));
      const timeFunction = easings[easing](time);
      window.scroll(0, Math.ceil((timeFunction * (destinationOffsetToScroll - start)) + start));

      if (window.pageYOffset === destinationOffsetToScroll) {
        if (callback) {
          callback();
        }
        return;
      }

      requestAnimationFrame(scroll);
    }

    scroll();
  }

  render() {
    const { network } = this.props;
    const maxOpacity = 0.5;
    const minOpacity = 0.1;
    const fulcrumIsBest = this.state.currentProtocol==='fulcrum';
    const compoundIsBest = this.state.currentProtocol==='compound';
    const compoundOpacity = compoundIsBest ? maxOpacity : minOpacity;
    const fulcrumOpacity = fulcrumIsBest ? maxOpacity : minOpacity;
    const idleOpacity = (this.state.maxRate && (fulcrumIsBest || compoundIsBest)) ? maxOpacity : minOpacity;
    return (
      <Box
        style={{
          paddingBottom: !network.isCorrectNetwork ? "8em" : "0"
        }}
      >
        <Box className={[styles.headerContainer]} px={[3,6]} pt={['2em', '3em']}>
          <Box position={'relative'} zIndex={10}>
            <Flex flexDirection={'column'} alignItems={'center'} maxWidth={["50em", "60em"]} mx={'auto'} pb={3} textAlign={'center'} pt={['8vh', '8vh']}>
              <Heading.h1 fontFamily={'sansSerif'} lineHeight={'1.1em'} mb={'0.2em'} fontSize={['2.5em',7]} textAlign={'center'} color={'white'}>
                Best yield for your lending
              </Heading.h1>
              <Heading.h2 fontWeight={'400'} lineHeight={['1.4em', '2em']} fontSize={[2,3]} textAlign={'center'} color={'white'}>
                Maximize your returns on different Ethereum lending protocol
              </Heading.h2>
            </Flex>
            <Flex flexDirection={'column'} alignItems={'center'} maxWidth={["50em", "50em"]} mx={'auto'} textAlign={'center'}>
              <LandingForm
                getAprs={this.getAprs}
                selectedToken={this.props.selectedToken}
                tokenConfig={this.props.tokenConfig}
                setSelectedToken={this.props.setSelectedToken}
                accountBalanceToken={this.props.accountBalanceToken}
                isMobile={this.props.isMobile}
                updateSelectedTab={this.props.updateSelectedTab}
                selectedTab={this.props.selectedTab} />
            </Flex>
            <Flex flexDirection={'column'} py={[3,5]} alignItems={'center'}>
              <Link onClick={(e) => {this.scrollIt(document.getElementById('how-it-works'))}} textAlign={'center'} color={'dark-gray'} hoverColor={'dark-gray'} fontSize={2} fontWeight={3}>
                <Flex flexDirection={'column'} py={[2,1]} alignItems={'center'}>
                  <Box>
                    How it works
                  </Box>
                  <Box>
                    <Icon
                      className={styles.bounceArrow}
                      align={'center'}
                      name={'KeyboardArrowDown'}
                      color={'dark-gray'}
                      size={"2em"}
                    />
                  </Box>
                </Flex>
              </Link>
            </Flex>
          </Box>
        </Box>

        <Box id='how-it-works' p={[3,0]}>
          <Flex flexDirection={['column','column']} alignItems={'center'} justifyContent={'center'}>
            <Flex alignItems={'center'} flexDirection={'column'} width={1} maxWidth={['24em','90em']}>
              <Flex flexDirection={['column','row']} height={['auto','275px']}>
                <Flex width={[1,1/2]} justifyContent={['center','flex-end']} alignItems={['center','start']}>
                  <Flex flexDirection={['column','row']} position={'relative'} className={[styles.bulletCard,styles.bulletCardFirst,this.state.activeBullet>=1 ? styles.bulletCardActive :null]} width={[1,5/7]} p={[3,4]}>
                    {
                      !this.props.isMobile && (
                        <Flex width={1/4} p={[2,2]} alignItems={'center'} justifyContent={'center'}>
                          <Image width={1} src={'images/lend.png'} />
                        </Flex>
                      )
                    }
                    <Box width={[1,3/4]} pl={[0,2]}>
                      <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'blue'}>
                        Lend your assets
                      </Heading.h3>
                      {
                        this.props.isMobile && (
                          <Flex width={1} p={[2,2]} alignItems={'center'} justifyContent={'center'}>
                            <Image width={1/5} src={'images/lend.png'} />
                          </Flex>
                        )
                      }
                      <Heading.h4 fontSize={[2,2]} px={[3,0]} textAlign={['center','left']} fontWeight={2} lineHeight={1.5}>
                        Connect your Ethereum wallet and <strong>lend some idle crypto assets to get started</strong>.
                        You will receive IdleTokens representing your contract pool share.
                      </Heading.h4>
                    </Box>
                  </Flex>
                </Flex>
                <Flex width={[1,1/2]} zIndex={'-1'}>
                  <Flex width={[1,6/8]} alignItems={['center','flex-end']}>
                    <Box className={[styles.bentTube,styles.bentTubeRight,this.state.activeBullet>=2 ? styles.bentTubeActive : null]} position={'relative'} width={1/2} height={['120px','175px']} borderRadius={[0,'0 50px 0 0']} borderTop={[0,'15px solid rgba(0,54,255,0.1)']} borderRight={['10px solid rgba(0,54,255,0.1)','15px solid rgba(0,54,255,0.1)']}>
                      <Text position={'absolute'} display={'block'} className={[styles.bulletPoint,!this.props.isMobile ? styles.bulletLeft : styles.bulletTop]}></Text>
                      <Text position={'absolute'} display={'block'} className={[styles.bulletPoint,styles.bulletBottom]}></Text>
                    </Box>
                  </Flex>
                </Flex>
              </Flex>

              <Flex flexDirection={['column','row']} justifyContent={'flex-end'} height={['auto','275px']}>
                {
                  !this.props.isMobile && (
                    <Flex width={[1,1/2]} justifyContent={['center','flex-end']} zIndex={'-1'}>
                      <Flex width={[1,6/8]} justifyContent={['center','flex-end']} alignItems={['center','flex-end']}>
                        <Box className={[styles.bentTube,styles.bentTubeLeft,this.state.activeBullet>=3 ? styles.bentTubeActive : null]} position={'relative'} width={1/2} height={['120px','175px']} borderRadius={'50px 0 0 0'} borderTop={'15px solid rgba(0,54,255,0.1)'} borderLeft={'15px solid rgba(0,54,255,0.1)'}>
                          <Text position={'absolute'} display={'block'} className={[styles.bulletPoint,!this.props.isMobile ? styles.bulletRight : styles.bulletTop]}></Text>
                          <Text position={'absolute'} display={'block'} className={[styles.bulletPoint,styles.bulletBottomLeft]}></Text>
                        </Box>
                      </Flex>
                    </Flex>
                  )
                }
                <Flex width={[1,1/2]} justifyContent={'flex-start'} alignItems={'start'}>
                  <Flex flexDirection={['column','row']} position={'relative'} className={[styles.bulletCard,this.state.activeBullet>=2 ? styles.bulletCardActive :null]} width={[1,5/7]} p={[3,4]}>
                    <Box width={[1,3/4]} pl={[0,2]}>
                      <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'blue'}>
                        Earn Interests
                      </Heading.h3>
                      {
                        this.props.isMobile && (
                          <Flex width={1} p={[2,2]} alignItems={'center'} justifyContent={'center'}>
                            <Image width={1/5} src={'images/earn-interests.png'} />
                          </Flex>
                        )
                      }
                      <Heading.h4 fontSize={[2,2]} px={[3,0]} textAlign={['center','left']} fontWeight={2} lineHeight={1.5}>
                        Your funds will be automatically allocated among <strong>the best available interest bearing tokens</strong>. You will immediately start earning compounded interest with a block-per-block pace.
                      </Heading.h4>
                    </Box>
                    {
                      !this.props.isMobile && (
                        <Flex width={1/4} p={[2,2]} alignItems={'center'} justifyContent={'center'}>
                          <Image width={1} src={'images/earn-interests.png'} />
                        </Flex>
                      )
                    }
                  </Flex>
                </Flex>
                {
                  this.props.isMobile && (
                    <Flex width={[1,1/2]}>
                      <Flex width={[1,6/8]} alignItems={['center','flex-end']}>
                        <Box className={[styles.bentTube,this.state.activeBullet>=3 ? styles.bentTubeActive : null]} position={'relative'} width={1/2} height={['120px','175px']} borderRadius={[0,'0 50px 0 0']} borderTop={[0,'15px solid rgba(0,54,255,0.1)']} borderRight={['10px solid rgba(0,54,255,0.1)','15px solid rgba(0,54,255,0.1)']}>
                          <Text position={'absolute'} display={'block'} className={[styles.bulletPoint,!this.props.isMobile ? styles.bulletLeft : styles.bulletTop]}></Text>
                          <Text position={'absolute'} display={'block'} className={[styles.bulletPoint,styles.bulletBottom]}></Text>
                        </Box>
                      </Flex>
                    </Flex>
                  )
                }
              </Flex>

              <Flex flexDirection={['column','row']} height={['auto','275px']}>
                <Flex width={[1,1/2]} justifyContent={['center','flex-end']} alignItems={['center','start']}>
                  <Flex flexDirection={['column','row']} position={'relative'} className={[styles.bulletCard,this.state.activeBullet>=3 ? styles.bulletCardActive :null]} width={[1,5/7]} p={[3,4]}>
                    {
                      !this.props.isMobile && (
                        <Flex width={1/4} p={[2,2]} alignItems={'center'} justifyContent={'center'}>
                          <Image width={1} src={'images/decentralized-rebalance.png'} />
                        </Flex>
                      )
                    }
                    <Box width={[1,3/4]} pl={[0,2]}>
                      <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'blue'}>
                        Decentralized rebalance
                      </Heading.h3>
                      {
                        this.props.isMobile && (
                          <Flex width={1} p={[2,2]} alignItems={'center'} justifyContent={'center'}>
                            <Image width={1/5} src={'images/decentralized-rebalance.png'} />
                          </Flex>
                        )
                      }
                      <Heading.h4 fontSize={[2,2]} px={[3,0]} textAlign={['center','left']} fontWeight={2} lineHeight={1.5}>
                        Every interaction with Idle, made by any user, <strong>rebalances the entire pool</strong> if needed.
                        If the current tracked rate is not the actual best, you have the power to rebalance on behalf
                        of all users. One for all, all for one.
                      </Heading.h4>
                    </Box>
                  </Flex>
                </Flex>
                <Flex width={[1,1/2]} zIndex={'-1'}>
                  <Flex width={[1,6/8]} alignItems={['center','flex-end']}>
                    <Box className={[styles.bentTube,styles.bentTubeRight,this.state.activeBullet>=4 ? styles.bentTubeActive : null]} position={'relative'} width={1/2} height={['120px','175px']} borderRadius={[0,'0 50px 0 0']} borderTop={[0,'15px solid rgba(0,54,255,0.1)']} borderRight={['10px solid rgba(0,54,255,0.1)','15px solid rgba(0,54,255,0.1)']}>
                      <Text position={'absolute'} display={'block'} className={[styles.bulletPoint,!this.props.isMobile ? styles.bulletLeft : styles.bulletTop]}></Text>
                      <Text position={'absolute'} display={'block'} className={[styles.bulletPoint,styles.bulletBottom]}></Text>
                    </Box>
                  </Flex>
                </Flex>
              </Flex>

              <Flex flexDirection={['column','row']} justifyContent={'flex-end'} height={['auto','275px']}>
                <Flex width={[1,1/2]} justifyContent={'flex-end'}>
                  
                </Flex>
                <Flex width={[1,1/2]} justifyContent={['center','flex-start']} alignItems={['center','start']}>
                  <Flex flexDirection={['column','row']} position={'relative'} className={[styles.bulletCard,this.state.activeBullet>=4 ? styles.bulletCardActive :null]} width={[1,5/7]} p={[3,4]}>
                    <Box width={[1,3/4]} pl={[0,2]}>
                      <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'blue'}>
                        Easy Redeem
                      </Heading.h3>
                      {
                        this.props.isMobile && (
                          <Flex width={1} p={2} alignItems={'center'} justifyContent={'center'}>
                            <Image width={1/5} src={'images/redeem.png'} />
                          </Flex>
                        )
                      }
                      <Heading.h4 fontSize={[2,2]} px={[3,0]} textAlign={['center','left']} fontWeight={2} lineHeight={1.5}>
                        At anytime you can <strong>redeem your invested assets and get back your increased funds</strong>, automatically
                        rebalancing the pool if needed. Kudos for you.
                      </Heading.h4>
                    </Box>
                    {
                      !this.props.isMobile && (
                        <Flex width={1/4} p={2} alignItems={'center'} justifyContent={'center'}>
                          <Image width={1} src={'images/redeem.png'} />
                        </Flex>
                      )
                    }
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Box>

        <Flex className={styles.gradientBackground} position={'relative'} justifyContent={'center'} alignItems={'center'} height={['auto','600px']} mt={[4,3]} p={[4,6]}>
          <Flex width={1} flexDirection={['column','row']} maxWidth={['35em','70em']}>
            <Flex width={[1,1/2]} justifyContent={'center'} flexDirection={'column'}>
              <Box>
                <Heading.h4 color={'dark-gray'} fontWeight={4} lineHeight={'initial'} fontSize={[4,5]} textAlign={['center','left']}>
                  What makes us unique?
                </Heading.h4>
              </Box>
              <Box>
                <Heading.h4 color={'blue'} fontWeight={4} lineHeight={'initial'} fontSize={[4,5]} textAlign={['center','left']}>
                  Our brand values
                </Heading.h4>
              </Box>
              <Box position={'relative'}>
                <Box className={[styles.carouselDesc,this.state.activeCarousel===1 || this.props.isMobile ? styles.selected : '']} py={[3,0]} my={[3,0]}>
                  {
                    this.props.isMobile && (
                      <Flex justifyContent={'center'}>
                        <Image src={'images/smart-contract.png'} pb={2} width={1/4} />
                      </Flex>
                    )
                  }
                  <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} my={[3,4]} color={'dark-gray'}>
                    100% non-custodial, thanks to our Smart Contract
                  </Heading.h3>
                  <Heading.h4 fontSize={[2,2]} px={[3,0]} textAlign={['center','left']} fontWeight={2} lineHeight={1.5} color={'dark-gray'}>
                    At anytime you can redeem your invested assets and get back your increased funds, automatically rebalancing the pool if needed. Kudos for you.
                  </Heading.h4>
                </Box>
                <Box className={[styles.carouselDesc,this.state.activeCarousel===2 || this.props.isMobile ? styles.selected : '']} py={[3,0]} my={[3,0]}>
                  {
                    this.props.isMobile && (
                      <Flex justifyContent={'center'}>
                        <Image src={'images/no-hidden-feeds.png'} pb={2} width={1/4} />
                      </Flex>
                    )
                  }
                  <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} my={[3,4]} color={'dark-gray'}>
                    Fully decentralized, thanks to our users.
                  </Heading.h3>
                  <Heading.h4 fontSize={[2,2]} px={[3,0]} textAlign={['center','left']} fontWeight={2} lineHeight={1.5} color={'dark-gray'}>
                    At anytime you can redeem your invested assets and get back your increased funds, automatically rebalancing the pool if needed. Kudos for you.
                  </Heading.h4>
                </Box>
                <Box className={[styles.carouselDesc,this.state.activeCarousel===3 || this.props.isMobile ? styles.selected : '']} py={[3,0]} my={[3,0]}>
                  {
                    this.props.isMobile && (
                      <Flex justifyContent={'center'}>
                        <Image src={'images/decentralized.png'} pb={2} width={1/4} />
                      </Flex>
                    )
                  }
                  <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} my={[3,4]} color={'dark-gray'}>
                    No hidden fees, best things in life are free!
                  </Heading.h3>
                  <Heading.h4 fontSize={[2,2]} px={[3,0]} textAlign={['center','left']} fontWeight={2} lineHeight={1.5} color={'dark-gray'}>
                    At anytime you can redeem your invested assets and get back your increased funds, automatically rebalancing the pool if needed. Kudos for you.
                  </Heading.h4>
                </Box> 
              </Box>
            </Flex>
            {
              !this.props.isMobile && (
                <Flex flexDirection={'column'} width={[1,1/2]} justifyContent={'flex-end'} alignItems={'flex-end'}>
                  <Box width={'550px'} position={'relative'} minHeight={'500px'}>
                    <Flex flexDirection={'column'} textAlign={'center'} alignItems={'center'} justifyContent={'center'} className={[styles.carouselItem,this.state.activeCarousel===1?  styles.pos1 : (this.state.activeCarousel===2 ? styles.pos3 : styles.pos2) ]} boxShadow={ this.state.activeCarousel===1 ? 4 : 1} m={[2,3]} onClick={e => this.state.setActiveCarousel(1)}>
                      <Image src={'images/smart-contract.png'} pb={2} />
                      <Text fontSize={3} fontWeight={3} color={'dark-gray'}>Smart Contract</Text>
                    </Flex>
                    <Flex flexDirection={'column'} textAlign={'center'} alignItems={'center'} justifyContent={'center'} className={[styles.carouselItem,this.state.activeCarousel===2 ? styles.pos1 : (this.state.activeCarousel===1 ? styles.pos2 : styles.pos3)]} boxShadow={ this.state.activeCarousel===2 ? 4 : 1} m={[2,3]} onClick={e => this.state.setActiveCarousel(2)}>
                      <Image src={'images/no-hidden-feeds.png'} pb={2} />
                      <Text fontSize={3} fontWeight={3} color={'dark-gray'}>Decentralized</Text>
                    </Flex>
                    <Flex flexDirection={'column'} textAlign={'center'} alignItems={'center'} justifyContent={'center'} className={[styles.carouselItem,this.state.activeCarousel===3 ? styles.pos1 : (this.state.activeCarousel===2 ? styles.pos2 : styles.pos3)]} boxShadow={ this.state.activeCarousel===3 ? 4 : 1} m={[2,3]} onClick={e => this.state.setActiveCarousel(3)}>
                      <Image src={'images/decentralized.png'} pb={2} />
                      <Text fontSize={3} fontWeight={3} color={'dark-gray'}>No hidden fees</Text>
                    </Flex>
                  </Box>
                  <Flex width={1} alignItems={'center'} justifyContent={'center'} position={'relative'} zIndex={'10'}>
                    <Link className={[styles.carouselNav,this.state.activeCarousel===1 ? styles.selected : '']} onClick={e => this.state.setActiveCarousel(1)}></Link>
                    <Link className={[styles.carouselNav,this.state.activeCarousel===2 ? styles.selected : '']} onClick={e => this.state.setActiveCarousel(2)}></Link>
                    <Link className={[styles.carouselNav,this.state.activeCarousel===3 ? styles.selected : '']} onClick={e => this.state.setActiveCarousel(3)}></Link>
                  </Flex>
                </Flex>
              )
            }
          </Flex>
        </Flex>

        <Flex className={styles.gradientBackground} flexDirection={'column'} position={'relative'} justifyContent={'center'} alignItems={'center'} p={[3,6]} pb={[4,6]}>
          <Flex position={'relative'} zIndex={'10'} flexDirection={'column'} justifyContent={'flex-start'} alignItems={'flex-start'} width={1} maxWidth={['35em','70em']}>
            <Flex width={1} flexDirection={['column','row']} alignItems={'center'}>
              {
                !this.props.isMobile && (
                <Box width={1/2}>
                    <Heading.h3 color={'dark-gray'} textAlign={'left'} fontWeight={4} lineHeight={'initial'} fontSize={[4,4]}>
                      Current lending interest rate
                    </Heading.h3>
                </Box>
                )
              }
              <Flex width={[1,1/2]} flexDirection={'column'}>
                <Heading.h3 color={'dark-gray'} textAlign={'center'} fontWeight={4} lineHeight={'initial'} fontSize={[4,5]}>
                  Get the best APR, always.
                </Heading.h3>
              </Flex>
            </Flex>
            <Flex flexDirection={['column','row']} width={[1,7/8]} mt={4}>
              <Flex width={[1,1/2]} flexDirection={['row','column']}>
                <Flex width={[1/2,1]} flexDirection={['column','row']} mr={[1,0]}>
                  <Flex width={[1,1/2]} flexDirection={'column'}>
                    <Flex flexDirection={'row'} justifyContent={'center'} alignItems={'center'}>
                      <Image src="images/compound-mark-green.png" height={['1.3em', '2em']} mr={[1,2]} my={[2,0]} verticalAlign={['middle','bottom']} />
                      <Text.span fontSize={[2,3]} textAlign={['center','left']} fontWeight={3} color={'dark-gray'}>
                        {this.props.tokenConfig.protocols[0].token}
                      </Text.span>
                    </Flex>
                    <Box>
                      <Card my={[2,2]} p={3} borderRadius={'10px'} boxShadow={compoundIsBest ? 4 : 1}>
                        <Text fontSize={[4,5]} fontWeight={4} textAlign={'center'}>
                          {this.state.compoundRate}<Text.span fontWeight={3} fontSize={['90%','70%']}>%</Text.span>
                        </Text>
                      </Card>
                    </Box>
                  </Flex>
                  <Box width={1/2} zIndex={'-1'} position={'relative'} height={'80px'} borderRadius={['0 0 0 30px','0 50px 0 0']} borderBottom={[`10px solid rgba(0,54,255,${compoundOpacity})`,0]} borderLeft={[`10px solid rgba(0,54,255,${compoundOpacity})`,0]}  borderTop={[0,`15px solid rgba(0,54,255,${compoundOpacity})`]} borderRight={[0,`15px solid rgba(0,54,255,${compoundOpacity})`]} top={['-10px','55%']} left={['48%',0]}>
                    <Box position={'absolute'} display={'block'} className={[styles.bulletPoint,styles.bulletLeft,this.props.isMobile ? styles.bulletMobile : '']}></Box>
                  </Box>
                </Flex>
                <Flex width={[1/2,1]} flexDirection={['column','row']} mt={[0,4]} ml={[1,0]}>
                  <Flex width={[1,1/2]} flexDirection={'column'}>
                    <Flex flexDirection={'row'} justifyContent={'center'} alignItems={'center'}>
                      <Image src="images/fulcrum-mark.png" height={['1.3em', '2em']} mr={[1,2]} my={[2,0]} verticalAlign={['middle','bottom']} />
                      <Text.span fontSize={[2,3]} textAlign={['center','left']} fontWeight={3} color={'dark-gray'}>
                        {this.props.tokenConfig.protocols[1].token}
                      </Text.span>
                    </Flex>
                    <Box>
                      <Card my={[2,2]} p={3} borderRadius={'10px'} boxShadow={fulcrumIsBest ? 4 : 1}>
                        <Text fontSize={[4,5]} fontWeight={4} textAlign={'center'}>
                          {this.state.fulcrumRate}<Text.span fontWeight={3} fontSize={['90%','70%']}>%</Text.span>
                        </Text>
                      </Card>
                    </Box>
                  </Flex>
                  <Box width={1/2} zIndex={'-1'} position={'relative'} height={['80px','72px']} borderRadius={['0 0 30px 0','0 0 50px 0']} borderBottom={[`10px solid rgba(0,54,255,${fulcrumOpacity})`,`15px solid rgba(0,54,255,${fulcrumOpacity})`]} borderRight={[`10px solid rgba(0,54,255,${fulcrumOpacity})`,`15px solid rgba(0,54,255,${fulcrumOpacity})`]} top={['-10px','15%']} left={['0%',0]}>
                    <Box position={'absolute'} display={'block'} className={[styles.bulletPoint,styles.bulletBottomBottom,this.props.isMobile ? styles.bulletMobile : '']}></Box>
                  </Box>
                </Flex>
              </Flex>

              <Flex width={[1,1/2]} flexDirection={['column','row']}>
                <Flex zIndex={'-1'} width={[1,2/5]} flexDirection={['column','row']} position={'relative'} height={['50px','100%']}>
                  <Box className={styles.rebalanceCircle} position={'absolute'} zIndex={'2'} width={['50px','72px']} height={['50px','72px']} backgroundColor={'white'} borderRadius={'50%'} boxShadow={2} left={['50%','-44px']} top={['0','50%']} mt={['-41px','-14px']} ml={['-25px',0]}></Box>
                  <Box position={'absolute'} zIndex={'1'} width={['20%','100%']} height={['100px','auto']} top={[0,'55%']} left={['50%',0]} ml={['-5px',0]} borderLeft={[`10px solid rgba(0,54,255,${idleOpacity})`,'0']} borderTop={[0,`15px solid rgba(0,54,255,${idleOpacity})`]}></Box>
                  <Box position={'absolute'} display={['none','block']} className={styles.bulletPoint} borderLeft={'15px solid #0036ff'} top={'52%'} right={'-15px'}></Box>
                </Flex>
                <Flex width={[1,3/5]} flexDirection={'column'} position={'relative'}>
                  <Flex width={1} flexDirection={'column'} height={'100%'} justifyContent={'center'}>
                    <Flex justifyContent={'center'} alignItems={'center'}>
                      <Image src="images/idle-mark.png" height={['1.3em', '2em']} mr={[1,2]} verticalAlign={'middle'} />
                      <Text.span fontSize={[4,5]} textAlign={'center'} fontWeight={3} color={'dark-gray'}>
                        {this.props.tokenConfig.idle.token}
                      </Text.span>
                    </Flex>
                    <Box>
                      <Card my={[2,2]} p={4} borderRadius={'10px'} boxShadow={this.state.currentRate ? 4 : 0}>
                        <Text fontSize={[5,7]} fontWeight={4} textAlign={'center'}>
                          {this.state.currentRate}<Text.span fontWeight={3} fontSize={['90%','70%']}>%</Text.span>
                        </Text>
                      </Card>
                    </Box>
                  </Flex>
                </Flex>
              </Flex>
            </Flex>
            <Flex width={1} flexDirection={['column','row']} alignItems={'center'}>
              <Box width={[1,1/2]}></Box>
              <Flex width={[1,1/2]} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
                <Flex width={[1,4/7]}>
                  <Heading.h3 color={'dark-gray'} textAlign={'center'} fontWeight={2} lineHeight={'initial'} fontSize={[2,2]} pt={[2,0]}>
                    We will <strong>always get the best rate</strong>, thanks to our users and the decentralized rebalance process.
                  </Heading.h3>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>

        {
        /*
        <Flex position={'relative'} justifyContent={'center'} alignItems={'center'} height={['auto','600px']} mt={[4,3]} p={[4,6]}>
          <Flex width={1} flexDirection={'column'} maxWidth={['35em','70em']}>
            <Heading.h4 color={'dark-gray'} fontWeight={4} lineHeight={'initial'} fontSize={[4,5]} textAlign={'center'} alignItems={'center'}>
              APRs performance comparison
            </Heading.h4>
            <Flex height={'500px'}>
              <APRsChart
                account={this.props.account}
                web3={this.props.web3}
              />
            </Flex>
          </Flex>
        </Flex>
        */
        }

        <Flex position={'relative'} justifyContent={'center'} alignItems={'center'} height={['auto','700px']} pt={[4,6]} pb={[4,6]}>
          <Flex width={1} flexDirection={'column'} maxWidth={['35em','70em']} px={[3,5]}>
            <Heading.h4 color={'dark-gray'} fontWeight={4} lineHeight={'initial'} fontSize={[4,5]} textAlign={'center'} alignItems={'center'}>
              Maximize interest return
            </Heading.h4>
            <Flex height={['auto','500px']}>
              <EquityChart
                tokenConfig={this.props.tokenConfig}
                selectedToken={this.props.selectedToken}
                isMobile={this.props.isMobile}
                account={this.props.account}
                web3={this.props.web3}
              />
            </Flex>
          </Flex>
        </Flex>

        <Box id="faq" pt={[4,6]} pb={[4,6]}>
          <Box maxWidth={['50em','60em']} mx={'auto'} px={[3,5]}>
            <Faq />
          </Box>
        </Box>

        <Flex id="newsletter" flexDirection={'column'} position={'relative'} justifyContent={'center'} alignItems={'center'} pb={[3,6]} px={[3,6]}>
          <Flex flexDirection={'column'} justifyContent={['center','flex-start']} alignItems={['center','flex-start']} width={1} maxWidth={['35em','70em']}>
            <Heading.h3 color={'blue'} textAlign={['center','left']} fontWeight={4} lineHeight={'initial'} fontSize={[4,5]}>
              Don't be shy. Let's talk.
            </Heading.h3>
            <Heading.h3 color={'dark-gray'} textAlign={['center','left']} fontWeight={4} lineHeight={'initial'} fontSize={[4,5]}>
              Let's build something great together.
            </Heading.h3>
            <NewsletterForm />
          </Flex>
        </Flex>

        <Flex id="footer" className={styles.footer} backgroundColor={'white'} alignItems={'flex-start'} justifyContent={'center'} pl={0}>
          <Flex flexDirection={['column','row']} justifyContent={'flex-start'} alignItems={'flex-start'} width={1} maxWidth={['35em','70em']} height={['auto','100%']}>

            <Flex width={[1,3/10]} flexDirection={'column'} height={['auto','100%']}>
              <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} my={3} color={'dark-gray'}>
                Start a Conversation
              </Heading.h3>
              <Link textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={2} color={'dark-gray'} hoverColor={'blue'}>idlefinance.info@gmail.com</Link>
            </Flex>

            <Flex width={[1,3/10]} flexDirection={'column'} height={['auto','100%']}>
              <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} my={3} color={'dark-gray'}>
                Explore
              </Heading.h3>
              <Flex flexDirection={'row'} justifyContent={['space-evenly','flex-start']}>
                <Link href="https://twitter.com/idlefinance" target="_blank">
                  <Image src="images/twitter-logo.png" height={'2.4em'} mr={[2,3]} my={[2,0]} className={styles.socialIcon} />
                </Link>
                <Link href="https://t.me/idlefinance" target="_blank">
                  <Image src="images/telegram-logo.png" height={'2.4em'} mr={[2,3]} my={[2,0]} className={styles.socialIcon} />
                </Link>
                <Link href="https://discord.gg/mpySAJp" target="_blank">
                  <Image src="images/discord-logo.png" height={'2.4em'} mr={[2,3]} my={[2,0]} className={styles.socialIcon} />
                </Link>
                <Link href="https://medium.com/@idlefinance" target="_blank">
                  <Image src="images/medium-logo.png" height={'2.4em'} mr={[2,3]} my={[2,0]} className={styles.socialIcon} />
                </Link>
                <Link href="https://github.com/bugduino/idle" target="_blank">
                  <Image src="images/github-logo.png" height={'2.4em'} mr={[2,3]} my={[2,0]} className={styles.socialIcon} />
                </Link>
                <Link href="https://etherscan.io/address/0xAcf651Aad1CBB0fd2c7973E2510d6F63b7e440c9#code" target="_blank">
                  <Image src="images/etherscan.png" height={'2.4em'} mr={[2,3]} my={[2,0]} className={styles.socialIcon} />
                </Link>
              </Flex>
            </Flex>

            <Flex width={[1,4/10]} flexDirection={'column'} height={['auto','100%']} justifyContent={'flex-end'} pb={[2,3]}>
              <Flex flexDirection={['column']} mt={[2, 0]}>
                <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={2} my={3} color={'white'}>
                  Built on
                </Heading.h3>
                <Flex flexDirection={['column','row']} alignItems={'center'} justifyContent={['center','flex-start']}>
                  <Link width={1/3} pr={[0,3]} href="https://www.ethereum.org/" target="_blank">
                    <Image src="images/ethereum.png" height={['1.8em', '2.5em']} mr={[0,3]} my={[2,0]} />
                  </Link>
                  <Link width={1/3} pr={[0,3]} href="https://app.compound.finance" target="_blank">
                    <Image src="images/compound-light.png" height={['1.8em', '2.5em']} mr={[0,3]} my={[2,0]} />
                  </Link>
                  <Link width={1/3} pr={[0,3]} href="https://fulcrum.trade" target="_blank">
                    <Image src="images/fulcrum.svg" height={['1.8em', '2.5em']} mr={[0,3]} my={[2,0]} />
                  </Link>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Flex>
      </Box>
    );
  }
}

export default Landing;