import React, { Component } from 'react';
import { Box, Flex, Text, Heading, Link } from 'rimble-ui'
// import styles from './Faq.module.scss';
import Faquestion from '../Faquestion/Faquestion';

class Faq extends Component {
  state = {
    openedAnswer:null,
    selectedSection: 'general',
    generalQuestions: [
      {
        q: 'How does Idle works under the hood?',
        a: `Idle gathers data from different Ethereum lending protocols, calculating the best possibile allocation to have the highest available interest rate. Your funds are put into asset pools (managed by the underlying lending protocols), from there borrowers can use the funds in pools to open up a loan. Those borrowers pay interest into the fund, increasing the size of the fund. When you withdraw your funds, you are entitled to a proportional amount of the interest accrued.`
      },
      {
        q: 'How long do I have to use Idle to earn interest?',
        a: `You can use Idle for as short as one block; there are no requirements on how long an asset must be lended. Because interest accrues every block, you’re free to redeem your funds at any time.`
      },
      {
        q: 'Can you walk me through an example?',
        a: `When entering in Idle the current best APR is automatically shown, if you decide to lend 10 DAI, you should only insert the amount and click on 'Lend'. We will forward your funds to the protocols offering the aggregated best rate, and gives you back tokens representing your position in Idle.`
      }
    ],
    guidelinesQuestions: [
      {
        q: 'How do I get the supplied asset back?',
        a: `You can redeem your assets back using Idle at any time. You just have to connect your wallet and choose to redeem the assets. Idle will send the tokens lended and the interest earned back directly into your wallet.
          There may be rare cases when your assets are not immediatly available because borrowers borrowed all the capital supplied by lenders. In this case borrowers are incetivized to repay the loan (with an high interest rate) and you are incentivized to keep lending tokens because you will receive an higher APR. You can wait until the liquidity is available or you can redeem the protocol tokens of the underlying lending protocols (eg. cToken, iToken) and redeem your lended assets through their platform.`
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
          When you lend assets in Idle, our smart contract forward them to different lending protocols and give you back IdleTokens representing your position in such protocols, all in the same transaction.`
      },
      {
        q: 'Is Idle safe to use?',
        a: `Our contract have been audited by Quantstamp, you can read the audit report here https://certificate.quantstamp.com/full/idle-finance.
          We're operating with different trustfully platforms and their smart contracts (all of them are audited and secured).
          Our contract code is public and have been extensively tested, but the possibility of a bug always exists.
          Use at your own risk.`
      },
      {
        q: 'How does the decentralized rebalance process work?',
        a: `For every lend or redeem action, of every user, the smart contract checks if the pool needs to be rebalanced, in that case it liquidates the entire pool position and allocates funds into various protocols in order to have the highest interest rate.
          If at anytime the rates offered by the protocols are changed and no interactions are made to the contract, then any user can choose to rebalance the pool on their own, rebalancing therefore the position of everyone. To always have the highest interest rate we constantly monitors the lending market at the moment and we trigger the rebalance if needed.`
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
