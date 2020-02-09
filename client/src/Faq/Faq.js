import React, { Component } from 'react';
import { Box, Flex, Text, Heading } from 'rimble-ui'
// import styles from './Faq.module.scss';
import Faquestion from '../Faquestion/Faquestion';
import colors from '../colors';

class Faq extends Component {
  state = {
    openedAnswer:null,
    selectedSection: 'general',
    generalQuestions: [
      {
        q: 'How does Idle work under the hood?',
        a: `Idle gathers data from different Ethereum lending protocols, calculating the best possibile allocation to have the highest available interest rate. Your funds are put into asset pools (managed by the underlying lending protocols), from there borrowers can use the funds in pools to take out a loan. Those borrowers pay interest into the fund, increasing the size of the fund. When you withdraw your funds, you are entitled to a proportional amount of the interest accrued.`
      },
      {
        q: 'How long do I have to use Idle to earn interest?',
        a: `You can use Idle for as short as one block; there are no requirements on how long an asset must be loaned. Because interest accrues every block, you’re free to redeem your funds at any time.`
      },
      {
        q: 'Can you walk me through an example?',
        a: `When you use Idle, it automatically shows you the current best APR. If you decide to loan 10 DAI at that APR, simply enter that amount and click on 'Lend'. Idle will forward the funds to the protocol offering the aggregated best rate and give you tokens representing your position.`
      }
    ],
    guidelinesQuestions: [
      {
        q: 'How do I get my assets back?',
        a: `You can back your assets back from Idle at any time by connecting your wallet and choosing "redeem assets". Idle will return the tokens loaned and interest earned directly to your wallet. In rare situations, your assets may not be immediately available because all the capital supplied by lenders has been borrowed. When this happens, borrowers are incentivized to repay the loan because of increasing interest rates. Furthermore, lending additional tokens can be more attractive because you will receive a higher APR for lending additional assets. You can loan more or choose to wait until the liquidity is available. Another option is to redeem the tokens of the underlying lending protocols (e.g. cToken or iToken) to reacquire your assets through their platforms.`
      },
      {
        q: 'How could you provide such APR?',
        a: `APR or annual percentage rate is the return users would get if they lend their funds for a year based off the current utilization ratio of the token debt reserve of the underlying protocols.
          In Idle, APR is the best annual percentage rate available between various lending providers. Because APR is variable, it changes for every block in the Ethereum blockchain and is influenced by money market fluctuations, it’s worth to highlight that future returns may not reflect the current expected returns.`
      },
      {
        q: 'What lending providers are integrated?',
        a: `We are currently integrated with Compound and Fulcrum. More lending protocols will be added in the future`
      },
      {
        q: 'What assets can I lend?',
        a: `We currently support SAI, DAI and USDC. We plan to integrate other assets as well.`
      }
    ],
    ratesQuestions: [
      {
        q: 'Is Idle a non-custodial platform?',
        a: `Yes, only our smart contract can move pooled funds, we cannot directly move funds on your behalf.
          When you lend assets in Idle, our smart contract forwards them to different lending protocols and returns Idle tokens representing your position in such protocols, all in the same transaction.`
      },
      {
        q: 'Is Idle safe to use?',
        a: `Our contract has been audited by Quantstamp, you can read the audit report <a href='https://certificate.quantstamp.com/full/idle-finance' target="_blank" style="color:${colors.blue}">here</a>.
          Idle is built upon trustworthy platforms that all employ secured, audited smart contracts.
          Our contract code is public and has been extensively tested, but the possibility of a bug always exists.
          Use at your own risk.`
      },
      {
        q: 'How does the decentralized rebalancing process work?',
        a: `After every loan or redemption, the smart contract checks to see if the pool needs to be rebalanced. If rebalancing is required, the entire pool position is liquidated and reallocated into the protocols yielding the highest interest rate. When the interest rates offered by the protocols change but there have not been any loans or redemptions made, then any user can choose to rebalance the pool on their own. This has the effect of rebalancing the entire pool and the position of all Idle customers so that everyone has the highest interest rate. Idle also constantly monitors the lending market to trigger rebalancing id needed.`
      }
    ]
  };
  setSection(section) {
    this.setState(state => ({...state, selectedSection: section, openedAnswer: null}));
  }

  toggleAnswer(e,i) {
    e.preventDefault();
    this.setState(state => ({...state, openedAnswer: state.openedAnswer===i ? null : i }));
  };

  render() {
    const {generalQuestions, selectedSection, guidelinesQuestions, ratesQuestions} = this.state;
    const generalDivs = generalQuestions.map((question, i) => (
      <Faquestion handleClick={ e => this.toggleAnswer(e,i) } isOpened={this.state.openedAnswer === i} key={`general-${i}`} question={question.q} answer={question.a} pt={i === 0 ? 0 : ''} />
    ));
    const guidelinesDivs = guidelinesQuestions.map((question, i) => (
      <Faquestion handleClick={ e => this.toggleAnswer(e,i) } isOpened={this.state.openedAnswer === i} key={`guidelines-${i}`} question={question.q} answer={question.a} pt={i === 0 ? 0 : ''} />
    ));
    const ratesDivs = ratesQuestions.map((question, i) => (
      <Faquestion handleClick={ e => this.toggleAnswer(e,i) } isOpened={this.state.openedAnswer === i} key={`rates-${i}`} question={question.q} answer={question.a} pt={i === 0 ? 0 : ''} />
    ));
    const isGeneralSelected = selectedSection === 'general';
    const isGuidelinesSelected = selectedSection === 'guidelines';
    const isRatesSelected = selectedSection === 'rates';
    return (
      <Flex
        flexDirection={['column']}>
        <Heading.h4 color={'dark-gray'} fontWeight={4} lineHeight={'initial'} fontSize={[4,5]} textAlign={'center'} pb={[4,5]} alignItems={'center'}>
          Frequently asked questions
        </Heading.h4>

        <Flex
          flexDirection={'column'}
          justifyContent={"center"}
          alignItems={'center'}
        >
          <Flex width={[1,3/5]} px={[2,0]} flexDirection={'row'} justifyContent={'space-between'}>
            <Flex width={1/3} textAlign={'center'} justifyContent={'center'} borderBottom={ isGeneralSelected ? '3px solid #0036ff' : 'none'}>
              <Text
                textAlign={'center'}
                fontSize={[3, 3]}
                fontWeight={3}
                mb={1}
                color={isGeneralSelected ? 'blue' : 'copyColor'}
                onClick={() => this.setSection('general')}
                className={['pointer', isGeneralSelected ? 'selected' : '']}>
                General
              </Text>
            </Flex>
            <Flex width={1/3} textAlign={'center'} justifyContent={'center'} borderBottom={ isGuidelinesSelected ? '3px solid #0036ff' : 'none'}>
              <Text
                textAlign={'center'}
                fontSize={[3, 3]}
                fontWeight={3}
                mb={1}
                color={isGuidelinesSelected ? 'blue' : 'copyColor'}
                onClick={() => this.setSection('guidelines')}
                className={['pointer', isGuidelinesSelected ? 'selected' : '']}>
                Lenders
              </Text>
            </Flex>
            <Flex width={1/3} textAlign={'center'} justifyContent={'center'} borderBottom={ isRatesSelected ? '3px solid #0036ff' : 'none'}>
              <Text
                textAlign={'center'}
                fontSize={[3, 3]}
                fontWeight={3}
                mb={1}
                color={isRatesSelected ? 'blue' : 'copyColor'}
                onClick={() => this.setSection('rates')}
                className={['pointer', isRatesSelected ? 'selected' : '']}>
                Security
              </Text>
            </Flex>
          </Flex>
          <Box width={1} mt={[3, 4]} mb={[4, 0]}>
            {isGeneralSelected && generalDivs}
            {isGuidelinesSelected && guidelinesDivs}
            {isRatesSelected && ratesDivs}
          </Box>
        </Flex>
      </Flex>
    );
  }
}

export default Faq;
