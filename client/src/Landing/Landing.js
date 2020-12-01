import Faq from '../Faq/Faq';
import Title from '../Title/Title';
import Footer from '../Footer/Footer';
import React, { Component } from 'react';
import ExtLink from '../ExtLink/ExtLink';
import styles from './Landing.module.scss';
import FlexCards from '../FlexCards/FlexCards';
import AuditCard from '../AuditCard/AuditCard';
import HowItWorks from '../HowItWorks/HowItWorks';
import AssetField from '../AssetField/AssetField';
import RoundButton from '../RoundButton/RoundButton';
import StrategyBox from '../StrategyBox/StrategyBox';
import globalConfigs from '../configs/globalConfigs';
import FunctionsUtil from '../utilities/FunctionsUtil';
import NewsletterForm from '../NewsletterForm/NewsletterForm';
import RoundIconButton from '../RoundIconButton/RoundIconButton';
import { Image, Flex, Box, Heading, Link, Text, Icon } from 'rimble-ui';
import FloatingToastMessage from '../FloatingToastMessage/FloatingToastMessage';
import AssetsUnderManagement from '../AssetsUnderManagement/AssetsUnderManagement';

let scrolling = false;

class Landing extends Component {
  state = {
    avgApr:null,
    carouselMax:2,
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
    const availableTokens = [];
    Object.values(this.props.availableStrategies).forEach( tokens => {
      Object.keys(tokens).forEach( token => {
        if (availableTokens.indexOf(token) === -1){
          availableTokens.push(token);
        }
      });
    });
    return (
      <Box
        height={'100vh'}
        className={styles.mainViewport}
        style={{
          paddingBottom: !network.isCorrectNetwork ? "8em" : "0"
        }}
      >
        <Box
          pl={[3,5]}
          pr={[3,0]}
          pt={['2.5em', '3em']}
          className={styles.headerContainer}
          minHeight={ Math.max((this.props.innerHeight+this.props.innerHeight*0.025),768) }
        >
          <Box position={'relative'} zIndex={10}>
            <Flex
              overflow={'hidden'}
              alignItems={'flex-start'}
              flexDirection={['column','row']}
              mt={['7em',Math.max(window.innerHeight*0.225,145)+'px']}
            >
              <Flex
                width={[1,1/3]}
                justifyContent={['center','flex-end']}
              >
                <Flex
                  pb={3}
                  width={1}
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
                width={[1,2/3]}
                ml={[0,'100px']}
                textAlign={'center'}
                position={'relative'}
                flexDirection={'column'}
                height={['415px','460px']}
                justifyContent={['flex-start','flex-end']}
              >
                <Flex
                  left={0}
                  right={0}
                  width={'100%'}
                  height={'400px'}
                  top={['initial','0']}
                  position={'absolute'}
                  bottom={['0','initial']}
                  overflow={this.state.carouselIndex === 0 ? 'visible' : 'hidden'}
                >
                  <Flex
                    top={['initial',0]}
                    flexDirection={'row'}
                    position={'absolute'}
                    id={'carousel-cursor'}
                    width={[Object.keys(globalConfigs.strategies).length*100+'%','140%']}
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
          mb={[3,4]}
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
              mt={[3,4]}
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
              We take security very seriously, that's why our Smart-Contracts are fully Audited and battle-tested.
            </Text>
            <Flex
              width={1}
              px={[3,4]}
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={'center'}
            >
              <AssetsUnderManagement
                {...this.props}
                counterStyle={{
                  display:'block',
                  color:'dark-gray',
                  overflow: 'hidden',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  fontFamily:this.props.theme.fonts.counter,
                  fontWeight:this.props.theme.fontWeights[5],
                  fontSize: this.props.isMobile ? this.props.theme.fontSizes[5] : this.props.theme.fontSizes[8],
                }}
                subtitle={null}
                subtitleProps={{
                  textAlign:'center'
                }}
              />
              <Link
                mb={3}
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
                my={[2,3]}
                mt={[3,4]}
                fontWeight={3}
                fontSize={[3,4]}
                color={'dark-gray'}
                component={Heading.h4}
              >
                Full Audit Report:
              </Title>
              <Flex
                alignItems={'center'}
                justifyContent={'center'}
                flexDirection={['column','row']}
              >
                <AuditCard
                  title={'Idle Finance'}
                  date={'August 12th 2020 — Quantstamp Verified'}
                  link={'https://certificate.quantstamp.com/full/idle-finance'}
                />
                <AuditCard
                  title={'Idle Goverance'}
                  date={'November 17th 2020 — Quantstamp Verified'}
                  link={'https://certificate.quantstamp.com/full/idle-goverance'}
                />
              </Flex>
            </Flex>
          </Box>
        </Box>
        <Box
          mt={[4,5]}
          px={[3,4]}
          py={[4,5]}
          id={'integrators'}
          className={styles.gradientBackground}
        >
          <Box
            mx={'auto'}
            maxWidth={['50em','75em']}
          >
            <Title
              mb={3}
              fontWeight={5}
              fontSize={[5,6]}
              component={Heading.h4}
            >
              Build with Idle
            </Title>
            <Text
              mb={3}
              fontSize={[2,3]}
              fontWeight={500}
              color={'cellTitle'}
              textAlign={'center'}
            >
              Just few lines of code to integrate the power of Idle into your dApp
            </Text>
            <Flex
              mt={2}
              width={1}
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={['center','space-between']}
            >
              {
                /*
                <Flex
                  mb={3}
                  width={1}
                  flexDirection={'column'}
                  justifyContent={'center'}
                  alignItems={['center','flex-start']}
                >
                  <FlexCards
                    itemsPerRow={4}
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
                </Flex>
                */
              }
              <Flex
                mt={2}
                width={1}
                flexDirection={['column','row']}
                alignItems={['center','flex-start']}
                justifyContent={['center','flex-start']}
              >
                <Flex
                  mb={[3,0]}
                  width={[1,0.5]}
                  flexDirection={'column'}
                  alignItems={['center','flex-start']}
                  justifyContent={['center','flex-start']}
                >
                  <Title
                    mb={3}
                    fontWeight={5}
                    component={Heading.h5}
                    fontSize={[4,'1.75em']}
                  >
                    Designed for Developers
                  </Title>

                  <Text
                    mb={3}
                    pr={[0,5]}
                    textAlign={['center','justify']}
                  >
                    A fully integrated suite of DeFi yield products easy to integrate into your dApp so your teams don't need to stitch together disparate protocols or spend months integrating and updating yield functionality.<br />One integration to rule them all.
                  </Text>
                  <Text
                    mb={2}
                    fontWeight={500}
                  >
                    Supported Assets:
                  </Text>
                  <Flex
                    mb={3}
                    flexDirection={'row'}
                  >
                    {
                      availableTokens.map( token => (
                        <AssetField
                          token={token}
                          fieldInfo={{
                            name:'icon',
                            props:{
                              mr:2,
                              width:'2.2em',
                              height:'2.2em'
                            }
                          }}
                          key={`asset_${token}`}
                        />
                      ))
                    }
                  </Flex>
                  <Flex
                    mt={2}
                    width={1}
                    alignItems={'center'}
                    flexDirection={['column','row']}
                    justifyContent={['center','flex-start']}
                  >
                    <RoundButton
                      buttonProps={{
                        width:[1,'auto']
                      }}
                      handleClick={ (e) => {
                        window.open('https://developers.idle.finance')
                      }}
                    >
                      <Flex
                        width={1}
                        alignItems={'flex-end'}
                        justifyContent={'center'}
                      >
                        <Text
                          fontSize={2}
                          fontWeight={3}
                          color={'white'}
                        >
                          Read the docs
                        </Text>
                        <Icon
                          ml={2}
                          size={'1.2em'}
                          color={'white'}
                          name={'KeyboardArrowRight'}
                        />
                      </Flex>
                    </RoundButton>
                    <Text
                      mt={[2,0]}
                      ml={[0,2]}
                    >
                      or
                    </Text>
                    <ExtLink
                      mt={[2,0]}
                      ml={[0,2]}
                      fontSize={2}
                      hoverColor={'primary'}
                      href={'https://idlefinance.typeform.com/to/PUC7nO'}
                    >
                      Contact Us
                    </ExtLink>
                    {
                      /*
                      <RoundButton
                        buttonProps={{
                          ml:2,
                          mainColor:'red',
                          width:[1,'auto']
                        }}
                        handleClick={ (e) => {
                          window.open('https://idlefinance.typeform.com/to/PUC7nO')
                        }}
                      >
                        <Flex
                          width={1}
                          alignItems={'flex-end'}
                          justifyContent={'center'}
                        >
                          <Text
                            fontWeight={3}
                            color={'white'}
                            fontSize={[1,2]}
                          >
                            Contact us
                          </Text>
                          <Icon
                            ml={2}
                            name={'Send'}
                            size={'1.2em'}
                            color={'white'}
                          />
                        </Flex>
                      </RoundButton>
                      */
                    }
                  </Flex>
                </Flex>
                <Flex
                  width={[1,0.5]}
                >
                  <iframe
                    height={"350"}
                    title={'integrate'}
                    style={{
                      border:'0',
                      width: '100%',
                      height: '350px',
                      overflow:'hidden',
                      transform: 'scale(1)',
                    }}
                    sandbox={"allow-scripts allow-same-origin"}
                    src={"https://carbon.now.sh/embed?bg=rgba%28255%2C255%2C255%2C0%29&t=cobalt&wt=none&l=auto&ds=false&dsyoff=20px&dsblur=68px&wc=true&wa=true&pv=0px&ph=0px&ln=false&fl=1&fm=Fira+Code&fs=13.5px&lh=143%25&si=false&es=2x&wm=false&code=const%2520idleTokenAbi%2520%253D%2520require%28%27idleToken.json%27%29%253B%2520%252F%252F%2520Include%2520idleToken%2520ABI%250Aconst%2520user%2520%253D%2520%270x...%27%253B%2520%252F%252F%2520set%2520user%2520address%2520%250Aconst%2520idleDAI%2520%253D%2520%270x3fE7940616e5Bc47b0775a0dccf6237893353bB4%27%253B%2520%252F%252F%2520idleDAIYield%2520address%250A%250A%252F%252F%2520Initialize%2520web3%2520contract%250Aconst%2520idleToken%2520%253D%2520new%2520web3.eth.Contract%28idleTokenAbi%252C%2520idleDAI%29%253B%250A%250A%252F%252F%2520Approve%2520contract%250Aconst%2520_amount%2520%253D%2520%271000000000000000000%27%253B%2520%252F%252F%25201%2520DAI%250Aawait%2520idleToken.approve%28idleTokenAddress%252C%2520_amount%252C%2520%257B%2520from%253A%2520user%2520%257D%29%253B%250A%250A%252F%252F%2520Deposit%2520tokens%250Aawait%2520idleToken.mintIdleToken%28_amount%252C%2520true%252C%2520user%252C%2520%257B%2520from%253A%2520user%2520%257D%29%253B"}
                  >
                  </iframe>
                </Flex>
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
              mt={[3,4]}
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
              Idle has been funded by industry leaders
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
                  link:'https://www.greenfield.one',
                  image:'images/investors/greenfield.png'
                },
                /*
                {
                  link:'https://quantstamp.com',
                  image:'images/investors/quantstamp.png'
                },
                */
                {
                  link:'https://dialectic.ch',
                  image:'images/investors/dialectic.png'
                },
                {
                  link:'https://www.thelao.io',
                  image:'images/investors/the-lao.png'
                },
                {
                  link:'https://br.capital',
                  image:'images/investors/br-capital.png'
                },
                {
                  link:'https://www.longhashventures.com',
                  image:'images/investors/lh-ventures.png'
                },
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
              mt={[3,4]}
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
              Idle infrastructure rely on the most powerful DeFi protocols
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
