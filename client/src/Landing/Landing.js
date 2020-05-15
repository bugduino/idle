import Faq from '../Faq/Faq';
import Footer from '../Footer/Footer';
import React, { Component } from 'react';
import styles from './Landing.module.scss';
import globalConfigs from '../configs/globalConfigs';
import StrategyBox from '../StrategyBox/StrategyBox';
import FunctionsUtil from '../utilities/FunctionsUtil';
import NewsletterForm from '../NewsletterForm/NewsletterForm';
// import AllocationChart from '../AllocationChart/AllocationChart';
import { Image, Flex, Box, Heading, Link, Text, Icon } from 'rimble-ui'
import FloatingToastMessage from '../FloatingToastMessage/FloatingToastMessage';

let scrolling = false;
let scrollTimeoutID;
let componentUnmounted;

class Landing extends Component {
  state = {
    avgApr:null,
    activeCarousel:1,
    runConfetti:false,
    activeBullet:null,
    protocolsAprs:null,
    startCarousel:null,
    testPerformed:false,
    totalAllocation:null,
    setActiveCarousel:null,
    carouselIntervalID:null,
    protocolsAllocations:null,
    randomAllocationEnabled:false,
  };

  // Clear all the timeouts
  async componentWillUnmount(){
    componentUnmounted = true;
    // console.log('Landing.js componentWillUnmount');
    var id = window.setTimeout(function() {}, 0);

    while (id--) {
        window.clearTimeout(id); // will do nothing if no timeout with id is present
    }
  }

  // Utils
  functionsUtil = null;

  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  startCarousel = async () => {
    /*
    if (!this.props.isMobile){
      if (this.state.carouselIntervalID){
        window.clearTimeout(this.state.carouselIntervalID);
      }
      const carouselIntervalID = window.setTimeout( async () => setActiveCarousel(this.state.activeCarousel+1) ,6500);
      this.setState({
        carouselIntervalID
      });
    }
    */
    if (this.state.carouselIntervalID){
      window.clearInterval(this.state.carouselIntervalID);
    }
    const carouselIntervalID = window.setInterval(() => { !componentUnmounted && this.setActiveCarousel(this.state.activeCarousel+1) },9000);
    this.setState({
      carouselIntervalID
    });
  }

  setActiveCarousel = (activeCarousel) => {
    activeCarousel = activeCarousel<=3 ? activeCarousel : 1;
    this.setState({activeCarousel});
  }

  async componentDidMount(){

    this.loadUtils();
    this.props.processCustomParam(this.props);

    componentUnmounted = false;
    scrollTimeoutID = null;

    window.onscroll = async () => {
      if (componentUnmounted){
        return false;
      }
      if (scrollTimeoutID){
        window.clearTimeout(scrollTimeoutID);
      }
      scrollTimeoutID = window.setTimeout( async () => {
        scrolling = true;
        this.processScrolling();
      },150);
    };

    if (!this.props.isMobile && !this.state.carouselIntervalID){
      this.startCarousel();
    }

    if (this.props.contractsInitialized){
      // await Promise.all([
      //   this.getAprs(),
      //   this.getAllocations()
      // ]);
    }
  }

  async componentDidUpdate(prevProps, prevState) {

    this.loadUtils();
    this.props.processCustomParam(this.props,prevProps);

    const contractsInitialized = this.props.contractsInitialized && prevProps.contractsInitialized !== this.props.contractsInitialized;

    if (contractsInitialized) {
      // await Promise.all([
      //   this.getAprs(),
      //   this.getAllocations()
      // ]);
    }
  }

  processScrolling = () => {
    if (scrolling){

      const bulletCards = document.getElementsByClassName('bulletCard');
      let activeBullet = 0;

      for (let i=0;i<bulletCards.length;i++){
        const bulletCard = bulletCards[i];
        if (bulletCard && bulletCard.offsetParent){
          const offsetY = bulletCard.offsetTop ? bulletCard.offsetTop : bulletCard.offsetParent.offsetTop;
          if (window.scrollY >= offsetY-200){
            activeBullet = i+2;
          }
        }
      }
      scrolling = false;

      if (parseInt(activeBullet) !== parseInt(this.state.activeBullet)){
        this.setState({activeBullet});
      }
    }
  };

  getAllocations = async () => {

    let totalAllocation = this.functionsUtil.BNify(0);

    const newState = {
      avgApr: null,
      totalAllocation:null,
      protocolsAllocations:null,
      protocolsAllocationsPerc:null
    };

    const exchangeRates = {};
    const protocolsBalances = {};
    const protocolsAllocations = {};
    const protocolsAllocationsPerc = {};

    await this.functionsUtil.asyncForEach(this.props.tokenConfig.protocols,async (protocolInfo,i) => {
      const contractName = protocolInfo.token;
      const protocolAddr = protocolInfo.address.toLowerCase();

      let [protocolBalance, tokenDecimals, exchangeRate] = await Promise.all([
        this.functionsUtil.getProtocolBalance(contractName),
        this.functionsUtil.getTokenDecimals(contractName),
        ( protocolInfo.functions.exchangeRate ? this.functionsUtil.genericContractCall(contractName,protocolInfo.functions.exchangeRate.name,protocolInfo.functions.exchangeRate.params) : null )
      ]);

      if (!protocolBalance){
        return;
      }


      if (exchangeRate && protocolInfo.decimals){
        exchangeRates[protocolAddr] = exchangeRate;
        exchangeRate = this.functionsUtil.fixTokenDecimals(exchangeRate,protocolInfo.decimals);
      }

      const protocolAllocation = this.functionsUtil.fixTokenDecimals(protocolBalance,tokenDecimals,exchangeRate);

      totalAllocation = totalAllocation.plus(protocolAllocation);

      protocolsBalances[protocolAddr] = protocolBalance;
      protocolsAllocations[protocolAddr] = protocolAllocation;
    });

    if (this.state.randomAllocationEnabled){
      let remainingAllocation = parseFloat(totalAllocation.toString());
      const totProtocols = Object.keys(protocolsAllocations).length;
      Object.keys(protocolsAllocations).forEach((protocolAddr,i) => {
        let alloc = parseFloat(protocolsAllocations[protocolAddr].toString());
        if (i === totProtocols-1){
          alloc = remainingAllocation;
        } else {
          alloc = parseFloat(Math.random()*(remainingAllocation-(remainingAllocation/3))+(remainingAllocation/3));
          remainingAllocation -= alloc;
        }
        protocolsAllocations[protocolAddr] = this.functionsUtil.BNify(alloc);
      });
    }

    Object.keys(protocolsAllocations).forEach((protocolAddr,i) => {
      const protocolAllocation = protocolsAllocations[protocolAddr];
      const protocolAllocationPerc = protocolAllocation.div(totalAllocation);
      protocolsAllocationsPerc[protocolAddr] = protocolAllocationPerc;
    });

    newState.totalAllocation = totalAllocation;
    newState.protocolsAllocations = protocolsAllocations;
    newState.protocolsAllocationsPerc = protocolsAllocationsPerc;

    if (this.state.protocolsAprs){
      newState.avgApr = this.functionsUtil.getAvgApr(this.state.protocolsAprs,protocolsAllocations,totalAllocation);
    }

    this.setState(newState);

    return newState;
  }

  getAprs = async () => {
    const Aprs = await this.functionsUtil.genericIdleCall('getAPRs');

    if (!Aprs){
      return false;
    }

    const addresses = Aprs.addresses.map((addr,i) => { return addr.toString().toLowerCase() });
    const aprs = Aprs.aprs;
    const protocolsAprs = {};

    this.props.tokenConfig.protocols.forEach((info,i) => {
      // const protocolName = info.name;
      const protocolAddr = info.address.toString().toLowerCase();
      const addrIndex = addresses.indexOf(protocolAddr);
      if ( addrIndex !== -1 ) {
        const protocolApr = aprs[addrIndex];
        protocolsAprs[protocolAddr] = this.functionsUtil.BNify(+this.functionsUtil.toEth(protocolApr));
      }
    });

    const newState = {
      avgApr: null,
      protocolsAprs
    };

    if (this.state.protocolsAllocations && this.state.totalAllocation){
      newState.avgApr = this.functionsUtil.getAvgApr(protocolsAprs,this.state.protocolsAllocations,this.state.totalAllocation);
    }

    this.setState(newState);
    return newState;
  };

  startLending = async e => {
    this.props.updateSelectedTab(e, '1');
    window.location.href = '#invest';
  }

  // VanillaJS function for smooth scroll
  scrollTo = (to, duration) => {
      const start = window.scrollY;
      const change = to - start;
      const increment = 20;
      let currentTime = 0;

      Math.easeInOutQuad = function (t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2*t*t + b;
        t--;
        return -c/2 * (t*(t-2) - 1) + b;
      };

      const animateScroll = () => {
          currentTime += increment;
          var val = Math.easeInOutQuad(currentTime, start, change, duration);
          window.scrollTo(0,val);
          if(currentTime < duration) {
            window.setTimeout(animateScroll, increment);
          }
      };

      animateScroll();
  }

  setConfetti = (runConfetti) => {
    this.setState({
      runConfetti
    })
  }

  connectAndGoToRoute = (route) => {

    const goToLocation = () => {
      window.location = "/#"+route;
    }

    if (this.props.account){
      goToLocation();
    } else {
      this.props.connectAndValidateAccount(goToLocation);
    }
  }

  render() {
    const { network } = this.props;
    // const maxOpacity = 0.6;
    // const minOpacity = 0.2;
    // const idleOpacity = maxOpacity;
    // const protocolLen = this.props.tokenConfig.protocols.length;
    // const avgApr = this.state.avgApr ? parseFloat(this.state.avgApr).toFixed(2) : null;

    return (
      <Box
        style={{
          paddingBottom: !network.isCorrectNetwork ? "8em" : "0"
        }}
      >
        {
          /*
          <Confetti
            style={{ position: 'fixed','zIndex':9999 }}
            run={this.state.runConfetti}
            recycle={false}
            numberOfPieces={500}
            width={window.innerWidth}
            height={window.innerHeight}
            onConfettiComplete={confetti => {
              this.setConfetti(false);
              confetti.reset()
            }}
          />
          */
        }
        <Box className={[styles.headerContainer]} px={[3,5]} pt={['2.5em', '3em']}>
          <Box position={'relative'} zIndex={10}>
            <Flex flexDirection={'column'} alignItems={'center'} maxWidth={["50em", "70em"]} mx={'auto'} pb={3} textAlign={'center'} pt={['8vh', '8vh']}>
              <Heading.h1 fontFamily={'sansSerif'} lineHeight={'1.1em'} mb={'0.2em'} fontSize={['1.6em','3.5rem']} textAlign={'center'} color={'white'}>
                Always the best yield, with no effort
              </Heading.h1>
              <Heading.h2 fontWeight={'400'} lineHeight={['1.4em', '2em']} fontSize={[2,3]} textAlign={'center'} color={'white'}>
                Maximize your lending returns by investing in a single token
              </Heading.h2>
            </Flex>
            <Flex
              mx={'auto'}
              textAlign={'center'}
              maxWidth={["50em", "50em"]}
              flexDirection={['column','row']}
              justifyContent={'space-between'}
            >
              {
                Object.keys(globalConfigs.strategies).map(strategy => (
                  <StrategyBox
                    {...this.props}
                    strategy={strategy}
                    key={`strategy_${strategy}`}
                  />
                ))
              }
            </Flex>
            {
              /*
              <Flex flexDirection={'column'} alignItems={'center'} maxWidth={["50em", "50em"]} mx={'auto'} textAlign={'center'}>
                <LandingForm
                  getAprs={this.getAprs}
                  isMobile={this.props.isMobile}
                  simpleID={this.props.simpleID}
                  connecting={this.props.connecting}
                  selectedTab={this.props.selectedTab}
                  tokenConfig={this.props.tokenConfig}
                  getAllocations={this.getAllocations}
                  openBuyModal={this.props.openBuyModal}
                  selectedToken={this.props.selectedToken}
                  setSelectedToken={this.props.setSelectedToken}
                  getAccountBalance={this.props.getAccountBalance}
                  updateSelectedTab={this.props.updateSelectedTab}
                  accountBalanceToken={this.props.accountBalanceToken}
                />
              </Flex>
              */
            }
            <Flex flexDirection={'column'} py={[3,4]} mb={[3,5]} alignItems={'center'}>
              <Link onClick={(e) => {this.scrollTo(document.getElementById('how-it-works').offsetTop,300)}} textAlign={'center'} color={'dark-gray'} hoverColor={'dark-gray'} fontSize={2} fontWeight={3}>
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
                  <Flex flexDirection={['column','row']} position={'relative'} className={['bulletCard',styles.bulletCard,styles.bulletCardFirst,this.state.activeBullet>=1 ? styles.bulletCardActive :null]} width={[1,5/7]} p={[3,4]}>
                    {
                      !this.props.isMobile && (
                        <Flex width={1/4} p={[2,2]} alignItems={'center'} justifyContent={'center'}>
                          <Image width={1} src={'images/lend.png'} />
                        </Flex>
                      )
                    }
                    <Box width={[1,3/4]} pl={[0,2]}>
                      <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'blue'}>
                        Lend Your Idle Assets
                      </Heading.h3>
                      {
                        this.props.isMobile && (
                          <Flex width={1} p={[2,2]} alignItems={'center'} justifyContent={'center'}>
                            <Image width={1/5} src={'images/lend.png'} />
                          </Flex>
                        )
                      }
                      <Heading.h4 fontSize={[2,2]} px={[3,0]} textAlign={['center','left']} fontWeight={2} lineHeight={1.5}>
                        Connect your wallet and choose the amount that you want to lend.
                        You will get Idle tokens back which will track the best rate on the market.
                      </Heading.h4>
                    </Box>
                  </Flex>
                </Flex>
                <Flex position={'relative'} width={[1,1/2]} zIndex={'-1'}>
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
                  <Flex flexDirection={['column','row']} position={'relative'} className={['bulletCard',styles.bulletCard,this.state.activeBullet>=2 ? styles.bulletCardActive :null]} width={[1,5/7]} p={[3,4]}>
                    <Box width={[1,3/4]} pl={[0,2]}>
                      <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'blue'}>
                        Earn Interest Instantly
                      </Heading.h3>
                      {
                        this.props.isMobile && (
                          <Flex width={1} p={[2,2]} alignItems={'center'} justifyContent={'center'}>
                            <Image width={1/5} src={'images/earn-interests.png'} />
                          </Flex>
                        )
                      }
                      <Heading.h4 fontSize={[2,2]} px={[3,0]} textAlign={['center','left']} fontWeight={2} lineHeight={1.5}>
                        Your funds will get automatically allocated into multiple protocols to always give you the best available returns. You will immediately start earning compounded interest.
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
                  <Flex flexDirection={['column','row']} position={'relative'} className={['bulletCard',styles.bulletCard,this.state.activeBullet>=3 ? styles.bulletCardActive :null]} width={[1,5/7]} p={[3,4]}>
                    {
                      !this.props.isMobile && (
                        <Flex width={1/4} p={[2,2]} alignItems={'center'} justifyContent={'center'}>
                          <Image width={1} src={'images/decentralized-rebalance.png'} />
                        </Flex>
                      )
                    }
                    <Box width={[1,3/4]} pl={[0,2]}>
                      <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'blue'}>
                        Automated Rebalancing
                      </Heading.h3>
                      {
                        this.props.isMobile && (
                          <Flex width={1} p={[2,2]} alignItems={'center'} justifyContent={'center'}>
                            <Image width={1/5} src={'images/decentralized-rebalance.png'} />
                          </Flex>
                        )
                      }
                      <Heading.h4 fontSize={[2,2]} px={[3,0]} textAlign={['center','left']} fontWeight={2} lineHeight={1.5}>
                        Interest rates are constantly monitored to spot the best allocation. Also, thanks to its user-based architecture, the smart contracts do not rely on any specific pair of human hands.
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
                  <Flex flexDirection={['column','row']} position={'relative'} className={['bulletCard',styles.bulletCard,this.state.activeBullet>=4 ? styles.bulletCardActive :null]} width={[1,5/7]} p={[3,4]}>
                    <Box width={[1,3/4]} pl={[0,2]}>
                      <Heading.h3 textAlign={['center','left']} fontFamily={'sansSerif'} fontSize={[3,3]} mb={[2,2]} color={'blue'}>
                        Redeem At Any Time
                      </Heading.h3>
                      {
                        this.props.isMobile && (
                          <Flex width={1} p={2} alignItems={'center'} justifyContent={'center'}>
                            <Image width={1/5} src={'images/redeem.png'} />
                          </Flex>
                        )
                      }
                      <Heading.h4 fontSize={[2,2]} px={[3,0]} textAlign={['center','left']} fontWeight={2} lineHeight={1.5}>
                        Whenever you like, you can withdraw back your funds + earned interest. You can even redeem a fraction of your funds when you reach a desired amount of interest earned.
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

        {
          /*
          <Flex position={'relative'} justifyContent={'center'} alignItems={'center'} height={['auto','850px']} pt={0} pb={[4,6]}>
            <Flex id={'chart-container'} width={1} flexDirection={'column'} maxWidth={['35em','70em']}>
              <Heading.h4 color={'dark-gray'} fontWeight={4} lineHeight={'initial'} fontSize={[4,5]} textAlign={'center'} alignItems={'center'}>
                Maximize interest return
              </Heading.h4>
              <Flex width={1} alignItems={'center'} justifyContent={'center'} px={[3,0]}>
                <DefiPrimeEquityChart
                  tokenConfig={this.props.tokenConfig}
                  selectedToken={'SAI'}
                  isMobile={this.props.isMobile}
                  account={this.props.account}
                  web3={this.props.web3}
                />
              </Flex>
            </Flex>
          </Flex>
          */
        }

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
                    100% non-custodial, and secured by audit.
                  </Heading.h3>
                  <Heading.h4 fontSize={[2,2]} px={[3,0]} textAlign={['center','left']} fontWeight={2} lineHeight={1.5} color={'dark-gray'}>
                    Idle smart contract passed a security audit control. You can read the full report <Link key={1} fontSize={2} hoverColor={'blue'} href={'https://certificate.quantstamp.com/full/idle-finance'} target={'_blank'} rel="nofollow noopener noreferrer">here</Link>. We will never be able to touch your money while inside the smart contract. You are always in control of your money.
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
                    Just relax and watch your interest grows up
                  </Heading.h3>
                  <Heading.h4 fontSize={[2,2]} px={[3,0]} textAlign={['center','left']} fontWeight={2} lineHeight={1.5} color={'dark-gray'}>
                    Don't lose your mind following interest rates on different lending protocols, let Idle do the dirty work and save your time.
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
                    Save money while optimizing your interest rate returns
                  </Heading.h3>
                  <Heading.h4 fontSize={[2,2]} px={[3,0]} textAlign={['center','left']} fontWeight={2} lineHeight={1.5} color={'dark-gray'}>
                    Our "one-for-all" rebalance mechanism allows you to save money in terms of transaction fees, giving you the best available interest rate in the market.
                  </Heading.h4>
                </Box>
              </Box>
            </Flex>
            {
              !this.props.isMobile && (
                <Flex flexDirection={'column'} width={[1,1/2]} justifyContent={'flex-end'} alignItems={'flex-end'}>
                  <Box width={'550px'} position={'relative'} minHeight={'500px'}>
                    <Flex flexDirection={'column'} textAlign={'center'} alignItems={'center'} justifyContent={'center'} className={[styles.carouselItem,this.state.activeCarousel===1?  styles.pos1 : (this.state.activeCarousel===2 ? styles.pos3 : styles.pos2) ]} boxShadow={ this.state.activeCarousel===1 ? 4 : 1} m={[2,3]} onClick={e => this.setActiveCarousel(1)}>
                      <Image src={'images/smart-contract.png'} pb={2} />
                      <Text fontSize={3} fontWeight={3} color={'dark-gray'}>Non Custodial</Text>
                    </Flex>
                    <Flex flexDirection={'column'} textAlign={'center'} alignItems={'center'} justifyContent={'center'} className={[styles.carouselItem,this.state.activeCarousel===2 ? styles.pos1 : (this.state.activeCarousel===1 ? styles.pos2 : styles.pos3)]} boxShadow={ this.state.activeCarousel===2 ? 4 : 1} m={[2,3]} onClick={e => this.setActiveCarousel(2)}>
                      <Image src={'images/no-hidden-feeds.png'} pb={2} />
                      <Text fontSize={3} fontWeight={3} color={'dark-gray'}>No Stress</Text>
                    </Flex>
                    <Flex flexDirection={'column'} textAlign={'center'} alignItems={'center'} justifyContent={'center'} className={[styles.carouselItem,this.state.activeCarousel===3 ? styles.pos1 : (this.state.activeCarousel===2 ? styles.pos2 : styles.pos3)]} boxShadow={ this.state.activeCarousel===3 ? 4 : 1} m={[2,3]} onClick={e => this.setActiveCarousel(3)}>
                      <Image src={'images/decentralized.png'} pb={2} />
                      <Text fontSize={3} fontWeight={3} color={'dark-gray'}>Cost Efficent</Text>
                    </Flex>
                  </Box>
                  <Flex width={1} alignItems={'center'} justifyContent={'center'} position={'relative'} zIndex={'10'}>
                    <Link className={[styles.carouselNav,this.state.activeCarousel===1 ? styles.selected : '']} onClick={e => this.setActiveCarousel(1)}></Link>
                    <Link className={[styles.carouselNav,this.state.activeCarousel===2 ? styles.selected : '']} onClick={e => this.setActiveCarousel(2)}></Link>
                    <Link className={[styles.carouselNav,this.state.activeCarousel===3 ? styles.selected : '']} onClick={e => this.setActiveCarousel(3)}></Link>
                  </Flex>
                </Flex>
              )
            }
          </Flex>
        </Flex>

        {
        /*
        <Flex className={styles.gradientBackground} flexDirection={'column'} position={'relative'} justifyContent={'center'} alignItems={'center'} p={[3,6]} pb={[4,6]}>
          {
            this.props.isMobile ? (
              <Flex position={'relative'} zIndex={'10'} flexDirection={'column'} justifyContent={'center'} alignItems={'center'} width={1} maxWidth={['35em','70em']}>
                <Flex width={1} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
                  <Heading.h3 color={'dark-gray'} textAlign={'center'} fontWeight={4} lineHeight={'initial'} fontSize={[4,5]}>
                    Underlying protocol allocation
                  </Heading.h3>
                  <AllocationChart width={ Math.min(this.props.innerWidth*0.85,500) } height={Math.min(this.props.innerWidth*0.85,500)} tokenConfig={this.props.tokenConfig} protocolsAllocations={this.state.protocolsAllocations} totalAllocation={this.state.totalAllocation} />
                </Flex>
              </Flex>
            ) : (
              <Flex position={'relative'} zIndex={'10'} flexDirection={'column'} justifyContent={'flex-start'} alignItems={'flex-start'} width={1} maxWidth={['35em','70em']}>
                <Flex width={1} flexDirection={['column','row']} alignItems={'center'}>
                  {
                    !this.props.isMobile && (
                    <Box width={1/2}>
                      <Heading.h3 color={'dark-gray'} textAlign={'left'} fontWeight={4} lineHeight={'initial'} fontSize={[4,4]}>
                        Underlying protocol allocation
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
                    {
                      this.props.tokenConfig.protocols.map((protocolInfo,i)=>{
                        const protocolAddr = protocolInfo.address.toLowerCase();
                        const protocolName = protocolInfo.name;
                        const protocolToken = protocolInfo.token;
                        const protocolEnabled = protocolInfo.enabled;

                        const protocolApr = this.state.protocolsAprs && this.state.protocolsAprs[protocolAddr] ? this.state.protocolsAprs[protocolAddr].toFixed(2) : null;
                        const protocolLoaded = this.state.totalAllocation && this.state.protocolsAllocations && this.state.protocolsAllocations[protocolAddr];
                        const protocolAllocation = protocolLoaded ? parseFloat(this.state.protocolsAllocations[protocolAddr]) : null;
                        const protocolAllocationPerc = protocolAllocation !== null ? parseFloat(protocolAllocation)/parseFloat(this.state.totalAllocation.toString()) : null;
                        const protocolOpacity = !protocolEnabled ? 0.3 : (protocolAllocationPerc ? maxOpacity : minOpacity);
                        const protocolAllocationPercParsed = !protocolEnabled ? 'paused' : (protocolAllocationPerc === null ? '-' : (protocolAllocationPerc*100).toFixed(2));

                        let output = null;
                        const protocolColor = protocolEnabled ? globalConfigs.stats.protocols[protocolName].color.rgb.join(',') : '200,200,200';
                        const boxShadow = `0px 0px 16px 2px rgba(${protocolColor},${protocolOpacity})`;

                        switch (protocolLen){
                          case 2:
                            output = (
                              <Flex key={`allocation_${protocolName}`} width={[1/2,1]} flexDirection={['column','row']} mr={ !i ? [1,0] : null} mt={ i ? [0,4] : null} ml={ i ? [1,0] : null}>
                                <Flex width={[1,1/2]} flexDirection={'column'}>
                                  <Flex flexDirection={'row'} justifyContent={'center'} alignItems={'center'}>
                                    <Image src={`images/tokens/${protocolToken}.svg`} height={['1.3em', '2em']} mr={[1,2]} my={[2,0]} verticalAlign={['middle','bottom']} />
                                    <Text.span fontSize={[2,3]} textAlign={['center','left']} fontWeight={3} color={'dark-gray'}>
                                      {protocolToken}
                                    </Text.span>
                                  </Flex>
                                  <Box>
                                    <Card my={[2,2]} pt={protocolEnabled ? '10px' : 3} pb={protocolEnabled ? '21px' : 3} px={3} borderRadius={'10px'} boxShadow={protocolAllocationPerc>0 ? boxShadow : 1}>
                                      <Flex flexDirection={'column'}>
                                        <Text color={protocolEnabled ? 'copyColor' : 'darkGray' } fontSize={[4,5]} fontWeight={4} textAlign={'center'}>{protocolAllocationPercParsed}{ protocolEnabled ? <Text.span fontWeight={3} fontSize={['90%','70%']}>%</Text.span> : null }</Text>
                                        {
                                          protocolEnabled &&
                                            <Text position={'absolute'} color={'#777'} fontSize={'14px'} fontWeight={2} textAlign={'center'} style={{left:0,bottom:'5px',width:'100%'}}>{protocolApr ? protocolApr : '-'}<Text.span color={'#777'} fontWeight={2} fontSize={'80%'}>% APR</Text.span></Text>
                                        }
                                      </Flex>
                                    </Card>
                                  </Box>
                                </Flex>

                                {
                                  !i ? (
                                    <Box width={1/2} zIndex={'-1'} position={'relative'} height={'80px'} borderRadius={['0 0 0 30px','0 50px 0 0']} borderBottom={[`10px solid rgba(${protocolColor},${protocolOpacity})`,0]} borderLeft={[`10px solid rgba(${protocolColor},${protocolOpacity})`,0]}  borderTop={[0,`15px solid rgba(${protocolColor},${protocolOpacity})`]} borderRight={[0,`15px solid rgba(${protocolColor},${protocolOpacity})`]} top={['-10px','75px']} left={['48%',0]}>
                                      <Box position={'absolute'} display={'block'} borderColor={`rgb(${protocolColor}) !important`} className={[styles.bulletPoint,styles.bulletLeft,this.props.isMobile ? styles.bulletMobile : '']}></Box>
                                    </Box>
                                  ) : (
                                    <Box width={1/2} zIndex={'-1'} position={'relative'} height={['80px','72px']} borderRadius={['0 0 30px 0','0 0 50px 0']} borderBottom={[`10px solid rgba(${protocolColor},${protocolOpacity})`,`15px solid rgba(${protocolColor},${protocolOpacity})`]} borderRight={[`10px solid rgba(${protocolColor},${protocolOpacity})`,`15px solid rgba(${protocolColor},${protocolOpacity})`]} top={['-10px','18px']} left={['0%',0]}>
                                      <Box position={'absolute'} display={'block'} borderColor={`rgb(${protocolColor}) !important`} className={[styles.bulletPoint,styles.bulletBottomBottom,this.props.isMobile ? styles.bulletMobile : '']}></Box>
                                    </Box>
                                  )
                                }
                              </Flex>
                            );
                          break;
                          case 3:
                            switch (i){
                              case 0:
                                output = (
                                  <Flex key={`allocation_${protocolName}`} width={[1/2,1]} flexDirection={['column','row']} mr={[1,0]} position={'relative'}>
                                    <Flex width={[1,1/2]} flexDirection={'column'}>
                                      <Flex flexDirection={'row'} justifyContent={'center'} alignItems={'center'}>
                                        <Image src={`images/tokens/${protocolToken}.svg`} height={['1.3em', '2em']} mr={[1,2]} my={[2,0]} verticalAlign={['middle','bottom']} />
                                        <Text.span fontSize={[2,3]} textAlign={['center','left']} fontWeight={3} color={'dark-gray'}>
                                          {protocolToken}
                                        </Text.span>
                                      </Flex>
                                      <Box>
                                        <Card my={[2,2]} pt={protocolEnabled ? '10px' : 3} pb={protocolEnabled ? '21px' : 3} px={3} borderRadius={'10px'} boxShadow={protocolAllocationPerc>0 ? boxShadow : 1}>
                                          <Flex flexDirection={'column'}>
                                            <Text color={protocolEnabled ? 'copyColor' : 'darkGray' } fontSize={[4,5]} fontWeight={4} textAlign={'center'}>{protocolAllocationPercParsed}{ protocolEnabled ? <Text.span fontWeight={3} fontSize={['90%','70%']}>%</Text.span> : null }</Text>
                                            {
                                              protocolEnabled &&
                                                <Text position={'absolute'} color={'#777'} fontSize={'14px'} fontWeight={2} textAlign={'center'} style={{left:0,bottom:'5px',width:'100%'}}>{protocolApr ? protocolApr : '-'}<Text.span color={'#777'} fontWeight={2} fontSize={'80%'}>% APR</Text.span></Text>
                                            }
                                          </Flex>
                                        </Card>
                                      </Box>
                                    </Flex>
                                    <Box width={1/2} zIndex={'-1'} position={['relative','absolute']} height={['80px','150px']} borderRadius={['0 0 0 30px','0 50px 0 0']} borderBottom={[`10px solid rgba(${protocolColor},${protocolOpacity})`,0]} borderLeft={[`10px solid rgba(${protocolColor},${protocolOpacity})`,0]}  borderTop={[0,`15px solid rgba(${protocolColor},${protocolOpacity})`]} borderRight={[0,`15px solid rgba(${protocolColor},${protocolOpacity})`]} top={['-10px','75px']} left={['48%','50%']}>
                                      <Box position={'absolute'} display={'block'} borderColor={`rgb(${protocolColor}) !important`} className={[styles.bulletPoint,styles.bulletLeft,this.props.isMobile ? styles.bulletMobile : '']}></Box>
                                    </Box>
                                  </Flex>
                                );
                              break;
                              case 1:
                                output = (
                                  <Flex key={`allocation_${protocolName}`} width={[1/2,1]} flexDirection={['column','row']} mt={[0,4]} ml={[1,0]}>
                                    <Flex width={[1,1/2]} flexDirection={'column'}>
                                      <Flex flexDirection={'row'} justifyContent={'center'} alignItems={'center'}>
                                        <Image src={`images/tokens/${protocolToken}.svg`} height={['1.3em', '2em']} mr={[1,2]} my={[2,0]} verticalAlign={['middle','bottom']} />
                                        <Text.span fontSize={[2,3]} textAlign={['center','left']} fontWeight={3} color={'dark-gray'}>
                                          {protocolToken}
                                        </Text.span>
                                      </Flex>
                                      <Box>
                                        <Card my={[2,2]} pt={protocolEnabled ? '10px' : 3} pb={protocolEnabled ? '21px' : 3} px={3} borderRadius={'10px'} boxShadow={protocolAllocationPerc>0 ? boxShadow : 1}>
                                          <Text color={protocolEnabled ? 'copyColor' : 'darkGray' } fontSize={[4,5]} fontWeight={4} textAlign={'center'}>{protocolAllocationPercParsed}{ protocolEnabled ? <Text.span fontWeight={3} fontSize={['90%','70%']}>%</Text.span> : null }</Text>
                                          {
                                            protocolEnabled &&
                                              <Text position={'absolute'} color={'#777'} fontSize={'14px'} fontWeight={2} textAlign={'center'} style={{left:0,bottom:'5px',width:'100%'}}>{protocolApr ? protocolApr : '-'}<Text.span color={'#777'} fontWeight={2} fontSize={'80%'}>% APR</Text.span></Text>
                                          }
                                        </Card>
                                      </Box>
                                    </Flex>
                                    <Box width={1/2} zIndex={'-1'} position={'relative'} height={['80px','72px']} borderRadius={0} borderBottom={[`10px solid rgba(${protocolColor},${protocolOpacity})`,`15px solid rgba(${protocolColor},${protocolOpacity})`]} top={['-10px','18px']} left={['0%',0]}>
                                      <Box position={'absolute'} display={'block'} borderColor={`rgb(${protocolColor}) !important`} className={[styles.bulletPoint,styles.bulletBottomBottom,this.props.isMobile ? styles.bulletMobile : '']}></Box>
                                    </Box>
                                  </Flex>
                                );
                              break;
                              case 2:
                                output = (
                                  <Flex key={`allocation_${protocolName}`} width={[1/2,1]} flexDirection={['column','row']} mt={[0,4]} ml={[1,0]} position={'relative'}>
                                    <Flex width={[1,1/2]} flexDirection={'column'}>
                                      <Flex flexDirection={'row'} justifyContent={'center'} alignItems={'center'}>
                                        <Image src={`images/tokens/${protocolToken}.svg`} height={['1.3em', '2em']} mr={[1,2]} my={[2,0]} verticalAlign={['middle','bottom']} />
                                        <Text.span fontSize={[2,3]} textAlign={['center','left']} fontWeight={3} color={'dark-gray'}>
                                          {protocolToken}
                                        </Text.span>
                                      </Flex>
                                      <Box>
                                        <Card my={[2,2]} pt={protocolEnabled ? '10px' : 3} pb={protocolEnabled ? '21px' : 3} px={3} borderRadius={'10px'} boxShadow={protocolAllocationPerc>0 ? boxShadow : 1}>
                                          <Text color={protocolEnabled ? 'copyColor' : 'darkGray' } fontSize={[4,5]} fontWeight={4} textAlign={'center'}>{protocolAllocationPercParsed}{ protocolEnabled ? <Text.span fontWeight={3} fontSize={['90%','70%']}>%</Text.span> : null }</Text>
                                          {
                                            protocolEnabled &&
                                              <Text position={'absolute'} color={'#777'} fontSize={'14px'} fontWeight={2} textAlign={'center'} style={{left:0,bottom:'5px',width:'100%'}}>{protocolApr ? protocolApr : '-'}<Text.span color={'#777'} fontWeight={2} fontSize={'80%'}>% APR</Text.span></Text>
                                          }
                                        </Card>
                                      </Box>
                                    </Flex>
                                    <Box width={1/2} zIndex={'-1'} position={['relative','absolute']} height={['80px','150px']} borderRadius={['0 0 30px 0','0 0 50px 0']} borderBottom={[`10px solid rgba(${protocolColor},${protocolOpacity})`,`15px solid rgba(${protocolColor},${protocolOpacity})`]} borderRight={[`10px solid rgba(${protocolColor},${protocolOpacity})`,`15px solid rgba(${protocolColor},${protocolOpacity})`]} top={['-10px','-60px']} left={['0%','50%']}>
                                      <Box position={'absolute'} display={'block'} borderColor={`rgb(${protocolColor}) !important`} className={[styles.bulletPoint,styles.bulletBottomBottom,this.props.isMobile ? styles.bulletMobile : '']}></Box>
                                    </Box>
                                  </Flex>
                                );
                              break;
                              default:
                                output = null;
                              break;
                            }
                          break;
                          default:
                            output = null;
                          break;
                        }

                        return output;
                      })
                    }
                  </Flex>

                  <Flex width={[1,1/2]} flexDirection={['column','row']}>
                    <Flex zIndex={'-1'} width={[1,2/5]} flexDirection={['column','row']} position={'relative'} height={['50px','100%']}>
                      <Box className={styles.rebalanceCircle} position={'absolute'} zIndex={'2'} width={['50px','72px']} height={['50px','72px']} backgroundColor={'white'} borderRadius={'50%'} boxShadow={2} left={['50%','-44px']} top={['0','49%']} mt={['-41px','-14px']} ml={['-25px',0]}></Box>
                      <Box position={'absolute'} zIndex={'1'} width={['20%','100%']} height={['100px','auto']} top={[0, protocolLen === 3 ? '52%' : '54%' ]} left={['50%',0]} ml={['-5px',0]} borderLeft={[`10px solid rgba(0,54,255,${idleOpacity})`,'0']} borderTop={[0,`15px solid rgba(0,54,255,${idleOpacity})`]}></Box>
                      <Box position={'absolute'} display={['none','block']} className={styles.bulletPoint} borderLeft={'15px solid #0036ff'} top={ protocolLen === 3 ? '50%' : '51%' } right={'-15px'}></Box>
                    </Flex>
                    <Flex width={[1,3/5]} flexDirection={'column'} position={'relative'}>
                      <Flex width={1} flexDirection={'column'} height={'100%'} justifyContent={'center'}>
                        <Flex justifyContent={'center'} alignItems={'center'} mt={0}>
                          <Image src={`images/tokens/${this.props.tokenConfig.idle.token}.png`} height={['1.3em', '2em']} mr={[1,2]} verticalAlign={'middle'} />
                          <Text.span fontSize={[4,5]} textAlign={'center'} fontWeight={3} color={'dark-gray'}>
                            {this.props.tokenConfig.idle.token}
                          </Text.span>
                        </Flex>
                        <Box>
                          <Card my={[2,2]} p={4} borderRadius={'10px'} boxShadow={avgApr ? `0px 0px 16px 2px rgba(0,54,255,${maxOpacity})` : 0}>
                            <Text fontSize={[5,7]} fontWeight={4} textAlign={'center'}>
                              {avgApr ? avgApr : '-' }<Text.span fontWeight={3} fontSize={['90%','70%']}>%</Text.span>
                            </Text>
                          </Card>
                        </Box>
                      </Flex>
                    </Flex>
                  </Flex>
                </Flex>
              </Flex>
            )
          }
        </Flex>
        */
        }
        {
        /*
        <Flex flexDirection={'column'} position={'relative'} justifyContent={'center'} alignItems={'center'} p={[3,5]} pb={[4,5]}>
          <Flex position={'relative'} zIndex={'10'} flexDirection={'column'} justifyContent={'center'} alignItems={'center'} width={1} maxWidth={['35em','70em']}>
            <Heading.h4 color={'dark-gray'} fontWeight={4} lineHeight={'initial'} fontSize={[4,5]} textAlign={'center'} alignItems={'center'}>
              We just rely on the Best
            </Heading.h4>
            <Box width={1} mt={[3,4]}>
              <DefiScoreTable tokenConfig={this.props.tokenConfig} />
            </Box>
          </Flex>
        </Flex>

        */
        }

        <Box id="faq" pt={[4,6]} pb={[4,6]}>
          <Box maxWidth={['50em','60em']} mx={'auto'} px={[3,5]}>
            <Faq selectedToken={this.props.selectedToken} tokenConfig={this.props.tokenConfig} />
          </Box>
        </Box>

        <Flex id="contacts" flexDirection={'column'} position={'relative'} justifyContent={'center'} alignItems={'center'} pb={[3,6]} px={[3,6]}>
          <Flex flexDirection={'column'} justifyContent={['center','flex-start']} alignItems={['center','flex-start']} width={1} maxWidth={['35em','70em']}>
            <Heading.h3 color={'blue'} textAlign={['center','left']} fontWeight={4} lineHeight={'initial'} fontSize={[4,5]}>
              Don't be shy, let's talk.
            </Heading.h3>
            <Heading.h3 color={'dark-gray'} textAlign={['center','left']} fontWeight={4} lineHeight={'initial'} fontSize={[4,5]}>
              Let's build something great together.
            </Heading.h3>
            <NewsletterForm />
          </Flex>
        </Flex>

        <Footer tokenConfig={this.props.tokenConfig} />

        {
          this.props.toastMessageProps &&
            <FloatingToastMessage isMobile={this.props.isMobile} {...this.props.toastMessageProps} handleClose={this.props.closeToastMessage} />
        }
      </Box>
    );
  }
}

export default Landing;
