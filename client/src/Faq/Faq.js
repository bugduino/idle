import React, { Component } from 'react';
import { Box, Flex, Text, Heading } from 'rimble-ui'
// import styles from './Faq.module.scss';
import Faquestion from '../Faquestion/Faquestion';

class Faq extends Component {
  state = {
    selectedSection: 'general',
    generalQuestions: [
      {
        q: 'How does `Idle` work under the hood?',
        a: `Idle gathers data from different lending protocols, seeking the highest available interest rate. Your funds are put into an asset pool (managed by the underlying protocol automatically choosen), from there borrowers can use the funds in pool to open up a loan. Those borrowers pay interest into the fund, increasing the size of the fund. When you withdraw your funds, you are entitled to a proportional amount of the interest accrued.
        `
      },
      {
        q: 'How long do I have to use Idle to earn interest?',
        a: `You can use Idle for as short as one block; there are no requirements on how long an asset must be lended. Because interest accrues every block, you’re free to redeem your funds at any time.`
      },
      {
        q: 'Can you walk me through an example?',
        a: `When entering in Idle the best APR is automatically shown, and the best lending provider is already selected for you so if you decide to lend 1 ETH, you should only select the ETH crypto button, insert the amount and click on Lend.
        We will forward your funds to the protocol offering the best rate, and gives you back tokens representing your position in such protocols.`
      }
    ],
    guidelinesQuestions: [
      {
        q: 'How do I get the supplied asset back?',
        a: `You can redeem your assets back using Idle at any time. You just have to connect your wallet and choose to redeem the assets. Idle will send the tokens lended and the interest earned back directly into your wallet.`
      },
      {
        q: 'How could you provide such APR?',
        a: `APR or annual premium rate is the return users would get if they lend their fund for a year based off the current utilization ratio of the token debt reserve of the underlying protocol. In Idle, APR is the best annual premium rate available between various lending providers. Because APR is variable, it changes for every block in the Ethereum blockchain and influenced by money market fluctuations, it’s worth to highlight that future returns may not reflect the current expected returns.`
      },
      {
        q: 'What lending providers are integrated?',
        a: `We are currently integrated with Compound v2 and Fulcrum. Ideally we would integrate only protocols which gives tokens representing your lended assets back to the user so be completly trustless and non custodial.`
      }
    ],
    ratesQuestions: [
      {
        q: 'Is `Idle` a non-custodial platform?',
        a: `Yes, we never have your tokens ownership, when you lend assets in Idle, we forward them to the best lending protocol and gives you back tokens (eg cDAI for Compound or iDAI for Fulcrum) representing your position in that protocol, all in the same transaction.`
      },
      {
        q: 'Is Idle safe to use?',
        a: `Our contract have not been audited yet, but we are managing to get our smart contract audited as soon as possible. We're operating with different trustfully platforms and their smart contracts (all of them are audited and secured), our contract code is public and have been extensively tested, but the possibility of a bug always exists.`
      },
      {
        q: 'How does the decentralized rebalancing process work?',
        a: `TODO`
      }
    ]
  };
  setSection(section) {
    this.setState(state => ({...state, selectedSection: section}));
  }
  render() {
    const {generalQuestions, selectedSection, guidelinesQuestions, ratesQuestions} = this.state;
    const generalDivs = generalQuestions.map((question, i) => (
      <Faquestion key={`general-${i}`} question={question.q} answer={question.a} pt={i === 0 ? 0 : ''} />
    ));
    const guidelinesDivs = guidelinesQuestions.map((question, i) => (
      <Faquestion key={`guidelines-${i}`} question={question.q} answer={question.a} pt={i === 0 ? 0 : ''} />
    ));
    const ratesDivs = ratesQuestions.map((question, i) => (
      <Faquestion key={`rates-${i}`} question={question.q} answer={question.a} pt={i === 0 ? 0 : ''} />
    ));
    const isGeneralSelected = selectedSection === 'general';
    const isGuidelinesSelected = selectedSection === 'guidelines';
    const isRatesSelected = selectedSection === 'rates';
    return (
      <Flex
        flexDirection={['column']}>

        <Heading.h2 fontFamily={'sansSerif'} fontSize={[5,6]} textAlign={'center'} py={[4,5]} alignItems={'center'}>
          Faq
        </Heading.h2>

        <Flex
          flexDirection={['column', 'row']}
          justifyContent={["flex-start", "space-between"]}
        >
          <Flex width={[1,2/10]} px={[2,0]} flexDirection={['row', 'column']} justifyContent={['space-between', 'flex-start']}>
            <Text
              textAlign={'right'}
              fontSize={[3, 4]}
              mb={[1, 3]}
              color={isGeneralSelected ? 'blue' : 'copyColor'}
              onClick={() => this.setSection('general')}
              className={['pointer', isGeneralSelected ? 'selected' : '']}>
              General
            </Text>
            <Text
              textAlign={'right'}
              fontSize={[3, 4]}
              mb={[1, 3]}
              color={isGuidelinesSelected ? 'blue' : 'copyColor'}
              onClick={() => this.setSection('guidelines')}
              className={['pointer', isGuidelinesSelected ? 'selected' : '']}>
              Investors
            </Text>
            <Text
              textAlign={'right'}
              fontSize={[3, 4]}
              mb={[1, 3]}
              color={isRatesSelected ? 'blue' : 'copyColor'}
              onClick={() => this.setSection('rates')}
              className={['pointer', isRatesSelected ? 'selected' : '']}>
              Security
            </Text>
          </Flex>
          <Box width={[1,8/10]} mt={[3, 0]} mb={[4, 0]} mr={4} pl={[0,6]}>
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
