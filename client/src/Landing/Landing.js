import Faq from '../Faq/Faq';
import Title from '../Title/Title';
import Footer from '../Footer/Footer';
import React, { Component } from 'react';
import styles from './Landing.module.scss';
import FlexCards from '../FlexCards/FlexCards';
import HowItWorks from '../HowItWorks/HowItWorks';
import RoundButton from '../RoundButton/RoundButton';
import globalConfigs from '../configs/globalConfigs';
import StrategyBox from '../StrategyBox/StrategyBox';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';
import NewsletterForm from '../NewsletterForm/NewsletterForm';
import RoundIconButton from '../RoundIconButton/RoundIconButton';
import { Image, Flex, Box, Heading, Link, Text, Icon } from 'rimble-ui';
import FloatingToastMessage from '../FloatingToastMessage/FloatingToastMessage';
import AssetsUnderManagement from '../AssetsUnderManagement/AssetsUnderManagement';

let scrolling = false;

class Landing extends Component {
  state = {
    avgApr:null,
    carouselMax:1,
    carouselIndex:0,
    activeCarousel:1,
    runConfetti:false,
    activeBullet:null,
    protocolsAprs:null,
    testPerformed:false,
    totalAllocation:null,
    carouselOffsetLeft:0,
    setActiveCarousel:null,
    carouselIntervalID:null,
    protocolsAllocations:null,
    randomAllocationEnabled:false,
  };

  // Clear all the timeouts
  async componentWillUnmount(){
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

  componentWillMount(){
    this.loadUtils();
  }

  setActiveCarousel = (activeCarousel) => {
    activeCarousel = activeCarousel<=3 ? activeCarousel : 1;
    this.setState({activeCarousel});
  }

  async componentDidMount(){
    this.props.processCustomParam(this.props);

    if (this.props.contractsInitialized){
      // await Promise.all([
      //   this.getAprs(),
      //   this.getAllocations()
      // ]);
    }
  }

  handleCarousel = action => {
    let carouselIndex = this.state.carouselIndex;
    if (action==='next' && carouselIndex<this.state.carouselMax){
      carouselIndex++;
    } else if (action==='back' && carouselIndex>0){
      carouselIndex--;
    }

    const multiplier = this.props.isMobile ? 1 : 0.75;
    const $element = window.jQuery(`#carousel-cursor > div:eq(${carouselIndex})`);
    const carouselOffsetLeft = -parseFloat($element.position().left*multiplier)+'px';

    this.setState({
      carouselIndex,
      carouselOffsetLeft
    });
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
        height={'100vh'}
        className={styles.mainViewport}
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
        <Box
          pl={[3,5]}
          pr={[3,0]}
          pt={['2.5em', '3em']}
          className={styles.headerContainer}
          minHeight={ Math.max((window.innerHeight+window.innerHeight*0.025),768) }
        >
          <Box position={'relative'} zIndex={10}>
            <Flex
              mt={'6vh'}
              alignItems={'flex-start'}
              flexDirection={['column','row']}
            >
              <Flex
                width={[1,1/3]}
                justifyContent={['center','flex-end']}
              >
                <Flex
                  pb={3}
                  width={1}
                  pt={['8vh', '9vh']}
                  textAlign={'center'}
                  flexDirection={'column'}
                  maxWidth={['50em', '24em']}
                  alignItems={['center','flex-start']}
                >
                  <Heading.h1
                    fontWeight={5}
                    color={'white'}
                    fontFamily={'sansSerif'}
                    fontSize={['2.2em','3.2rem']}
                    textAlign={['center','left']}
                    lineHeight={['initial','2.5rem']}
                    style={{
                      width:'100%',
                      textAlignLast: this.props.isMobile ? 'center' : 'justify'
                    }}
                  >
                    The best place
                  </Heading.h1>
                  <Heading.h1
                    mb={[2,3]}
                    color={'white'}
                    fontWeight={300}
                    lineHeight={'initial'}
                    fontFamily={'sansSerif'}
                    fontSize={['2.2em','3.2rem']}
                    textAlign={['center','left']}
                    style={{
                      width:'100%',
                      textAlignLast: this.props.isMobile ? 'center' : 'justify'
                    }}
                  >
                    for your money
                  </Heading.h1>
                  <Heading.h2
                    style={{
                      width:'100%',
                    }}
                    color={'white'}
                    fontWeight={400}
                    fontSize={[2,'1.2em']}
                    textAlign={['center','justify']}
                  >
                    Choose your strategy and earn the yield you deserve without worry about finding the best option, either if you want to optimize returns or risks.
                  </Heading.h2>
                  {
                    !this.props.isMobile && 
                      <Flex
                        mt={4}
                      >
                        <RoundButton
                          handleClick={ (e) => {
                            window.location.hash = this.functionsUtil.getGlobalConfig(['dashboard','baseRoute'])+'/'+Object.keys(this.functionsUtil.getGlobalConfig(['strategies']))[0];
                          }}
                        >
                          Go to Dashboard
                        </RoundButton>
                      </Flex>
                  }
                </Flex>
              </Flex>
              <Flex
                mr={['auto',0]}
                mt={[0,'10vh']}
                width={[1,2/3]}
                ml={[0,'100px']}
                textAlign={'center'}
                position={'relative'}
                flexDirection={'column'}
                height={['410px','460px']}
                justifyContent={['flex-start','flex-end']}
              >
                <Flex
                  left={0}
                  right={0}
                  width={'100%'}
                  height={'400px'}
                  overflow={'hidden'}
                  top={['initial','0']}
                  position={'absolute'}
                  bottom={['0','initial']}
                >
                  <Flex
                    top={['initial',0]}
                    flexDirection={'row'}
                    position={'absolute'}
                    id={'carousel-cursor'}
                    width={['300%','140%']}
                    height={['auto','400px']}
                    bottom={['5px','initial']}
                    justifyContent={'flex-start'}
                    left={this.state.carouselOffsetLeft}
                    style={{
                      overflowY:'visible',
                      transition:'left 0.3s ease-in-out'
                    }}
                  >
                    {
                      Object.keys(globalConfigs.strategies).map((strategy,strategyIndex) => (
                        <StrategyBox
                          {...this.props}
                          strategy={strategy}
                          key={`strategy_${strategy}`}
                        />
                      ))
                    }
                  </Flex>
                </Flex>
                <Flex
                  width={1}
                  mt={[0,'20px']}
                  id={'carousel-container'}
                  justifyContent={['center','flex-start']}
                >
                  <RoundIconButton
                    buttonProps={{
                      mr:[4,3]
                    }}
                    iconName={'ArrowBack'}
                    disabled={this.state.carouselIndex === 0}
                    handleClick={ e => this.handleCarousel('back') }
                  />
                  <RoundIconButton
                    iconName={'ArrowForward'}
                    handleClick={ e => this.handleCarousel('next') }
                    disabled={this.state.carouselIndex === this.state.carouselMax}
                  />
                </Flex>
              </Flex>
            </Flex>
          </Box>
        </Box>

        <HowItWorks />

        <Box
          pt={[4,5]}
          pb={[4,4]}
          id={'partners'}
        >
          <Box
            mx={'auto'}
            maxWidth={['50em','70em']}
          >
            <Title
              mb={3}
              fontWeight={5}
              fontSize={[5,6]}
              component={Heading.h4}
            >
              Audited and Battle-tested
            </Title>
            <Text
              fontSize={[2,3]}
              fontWeight={500}
              color={'cellTitle'}
              textAlign={'center'}
            >
              We take security very seriusly, that's why our Smart-Contracts are fully Audited and battle-tested.
            </Text>
            <Flex
              width={1}
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={'center'}
            >
              <AssetsUnderManagement
                {...this.props}
                counterStyle={{
                  display:'block',
                  color:'dark-gray',
                  textAlign: 'center',
                  fontFamily:this.props.theme.fonts.counter,
                  fontWeight:this.props.theme.fontWeights[5],
                  fontSize: this.props.isMobile ? this.props.theme.fontSizes[6] : this.props.theme.fontSizes[8],
                }}
                subtitle={null}
                subtitleProps={{
                  textAlign:'center'
                }}
              />
              <Link
                target={'_blank'}
                textAlign={'center'}
                rel={'nofollow noopener noreferrer'}
                href={'https://certificate.quantstamp.com/view/idle-finance'}
              >
                <Image
                  width={'15em'}
                  src={'images/quantstamp-badge.svg'}
                />
              </Link>
              <Title
                my={2}
                fontWeight={3}
                fontSize={[3,4]}
                color={'dark-gray'}
                component={Heading.h4}
              >
                Report History:
              </Title>
              <DashboardCard
                cardProps={{
                  p:3,
                  width:'auto'
                }}
                isInteractive={true}
                handleClick={ e => window.open('https://certificate.quantstamp.com/full/idle-finance') }
              >
                <Flex
                  flexDirection={'column'}
                >
                  <Text
                    mb={2}
                    color={'blue'}
                  >
                    August 12th 2020 — Quantstamp Verified
                  </Text>
                  <Text
                    mb={2}
                    fontSize={4}
                    fontWeight={500}
                  >
                    Security Assessment Certificate
                  </Text>
                  <Link
                    hoverColor={'blue'}
                    style={{
                      display:'flex',
                      borderRadius:'8px',
                      flexDirection:'row',
                      alignItems:'center'
                    }}
                  >
                    VIEW REPORT
                    <Icon
                      ml={1}
                      size={'1.3em'}
                      color={'blue'}
                      style={{
                        transform:'rotate(180deg)'
                      }}
                      name={'KeyboardBackspace'}
                    />
                  </Link>
                </Flex>
              </DashboardCard>
            </Flex>
          </Box>
        </Box>

        <Box
          px={[3,4]}
          pt={[4,5]}
          pb={[4,4]}
          id={'integrators'}
        >
          <Box
            mx={'auto'}
            maxWidth={['50em','90em']}
          >
            <Title
              mb={[3,4]}
              fontWeight={5}
              fontSize={[5,6]}
              component={Heading.h4}
            >
              Integrators & Partners
            </Title>
            <Text
              mb={3}
              fontSize={[2,3]}
              fontWeight={500}
              color={'cellTitle'}
              textAlign={'center'}
            >
              
            </Text>
            <Flex
              width={1}
              alignItems={'flex-start'}
              flexDirection={['column','row']}
              justifyContent={['center','space-between']}
            >
              <Flex
                mb={[3,0]}
                pr={[0,4]}
                width={[1,0.45]}
                flexDirection={'column'}
                justifyContent={'center'}
                alignItems={['center','flex-start']}
              >
                <FlexCards
                  itemsPerRow={2}
                  cards={[
                    {
                      link:'https://zerion.io',
                      image:'images/integrators/zerion.svg'
                    },
                    {
                      link:'https://gnosis.io',
                      image:'images/integrators/gnosis.png'
                    },
                    {
                      link:'https://cryptolocally.com',
                      image:'images/integrators/cryptolocally.png'
                    },
                    {
                      link:'https://www.peepsdemocracy.com',
                      image:'images/integrators/peeps.png'
                    }
                  ]}
                  {...this.props}
                />
                <Flex
                  px={[2,0]}
                  flexDirection={'column'}
                >
                  <Text
                    mt={3}
                    mb={2}
                    fontSize={[3,4]}
                    fontWeight={500}
                    color={'dark-gray'}
                  >
                    Boost your Dapp with Idle now:
                  </Text>
                  <RoundButton
                    buttonProps={{
                      width:[1,'auto']
                    }}
                    handleClick={ (e) => {
                      window.open('https://developers.idle.finance')
                    }}
                  >
                    Read the Documentation
                  </RoundButton>
                </Flex>
              </Flex>
              <Flex
                width={[1,0.55]}
                alignItems={'center'}
                flexDirection={'column'}
                justifyContent={'center'}
              >
                <iframe height="400" scrolling="no" title="Transak On/Off Ramp Widget (Website)" src="https://codepen.io/transak/embed/bGdNxBa?height=251&amp;theme-id=dark&amp;default-tab=html&amp;editable=true" frameBorder="no" allowtransparency="true" allowFullScreen={false} style={{width:'100%'}}>See the Pen <a href='https://codepen.io/transak/pen/bGdNxBa'>Transak On/Off Ramp Widget (Website)</a> by Transak (<a href='https://codepen.io/transak'>@transak</a>) on <a href='https://codepen.io'>CodePen</a>.</iframe>
              </Flex>
            </Flex>
          </Box>
        </Box>

        <Box
          pt={[4,5]}
          pb={[4,4]}
          id={'investors'}
        >
          <Box
            mx={'auto'}
            maxWidth={['50em','70em']}
          >
            <Title
              mb={3}
              fontWeight={5}
              fontSize={[5,6]}
              component={Heading.h4}
            >
              Backed By
            </Title>
            <Text
              mb={3}
              fontSize={[2,3]}
              fontWeight={500}
              color={'cellTitle'}
              textAlign={'center'}
            >
              Idle has been funded by word-class investors
            </Text>
            <FlexCards
              justifyContent={'center'}
              itemsPerRow={4}
              cards={[
                {
                  link:'https://consensys.net',
                  image:'images/investors/consensys.png'
                },
                {
                  link:'https://www.gumi-cryptos.com',
                  image:'images/investors/gumi.png'
                },
                {
                  link:'https://quantstamp.com',
                  image:'images/investors/quantstamp.png'
                },
                {
                  link:'https://www.linkedin.com/company/brcapital',
                  image:'images/investors/br-capital.png'
                },
                {
                  link:'https://www.volt.capital',
                  image:'images/investors/volt-capital.png'
                },
                {
                  link:'https://cmt.digital',
                  image:'images/investors/cmt-digital.png'
                },
                {
                  link:'https://www.thelao.io/',
                  image:'images/investors/the-lao.png'
                },
                /*
                {
                  link:'https://dydx.exchange',
                  image:'images/investors/ryan-zurrer.svg'
                },
                {
                  link:'https://oasis.app',
                  image:'images/investors/hannan.png'
                },
                {
                  link:'https://oasis.app',
                  image:'images/investors/herrick.png'
                },
                */
              ]}
              {...this.props}
            />
          </Box>
        </Box>

        <Box
          pt={[4,5]}
          pb={[4,4]}
          id={'protocols'}
        >
          <Box
            mx={'auto'}
            maxWidth={['50em','70em']}
          >
            <Title
              mb={3}
              fontWeight={5}
              fontSize={[5,6]}
              component={Heading.h4}
            >
              Built with the best
            </Title>
            <Text
              mb={3}
              fontSize={[2,3]}
              fontWeight={500}
              color={'cellTitle'}
              textAlign={'center'}
            >
              Idle infrastructure draw energy from the most powerful DeFi protocols
            </Text>
            <FlexCards
              cards={[
                {
                  link:'https://app.compound.finance',
                  image:'images/partners/compound.svg'
                },
                /*
                {
                  link:'https://fulcrum.trade',
                  image:'images/partners/fulcrum.svg'
                },
                */
                {
                  link:'https://aave.com',
                  image:'images/partners/aave.svg'
                },
                {
                  link:'https://dydx.exchange',
                  image:'images/partners/dydx.svg'
                },
                {
                  link:'https://oasis.app/',
                  image:'images/partners/oasis.png'
                },
              ]}
              {...this.props}
            />
          </Box>
        </Box>

        <Box id="faq" pt={[4,5]} pb={[4,6]}>
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
