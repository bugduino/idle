import Title from '../Title/Title';
import React, { Component } from 'react';
import Faquestion from '../Faquestion/Faquestion';
import { Box, Flex, Text, Heading } from 'rimble-ui'

class Faq extends Component {
  state = {
    openedAnswer:null,
    selectedSection: 'general',
    generalQuestions: [
      {
        q: 'What is Idle?',
        a: `Idle is a decentralized rebalancing protocol that allows users to automatically and algorithmically manage their digital asset allocation among different third-party DeFi protocols. You can choose to maximize your interest rate returns through our MaxYield strategy or minimize your risk exposure through our RiskAdjusted allocation strategy.`
      },
      {
        q: 'What third-party protocols and assets does Idle support?',
        a: `Idle connects with Compound, Aave, dYdX, Fulcrum, and DSR, and supports DAI, USDC and USDT.  Security is fundamental at Idle, meaning that our products will only connect to protocols that are audited by a top security firm and battle-tested in terms of time in market and digital assets locked. To add more security, we passed through multiple audit reviews and we use <a href="https://defiscore.io/" target="_blank" rel="nofollow noopener noreferrer">DeFiScore</a> risk assessment to evaluate the risk across DeFi protocols.`
      },
      {
        q: 'Can you walk me through an example?',
        a: `When utilizing the Idle protocol, a user supplies capital for lending as a part of Idle’s non-custodial smart contract pools; the protocol will automatically rebalance the pool’s current allocation to achieve optimized interest rates, based on the strategy.`
      }
    ],
    guidelinesQuestions: [
      {
        q: 'How do I manage my assets?',
        a: `You can access Idle’s user dashboard where you can deposit funds, monitor performances and see insights, rebalance funds, convert from FIAT to crypto, and redeem back your assets.`
      },
      {
        q: 'How does the rebalancing process work?',
        a: `A rebalance calculation involves assessing the total assets within a pool, incorporating underlying protocol rate functions and levels of supply and demand, and finally determining an allocation that achieves the optimal interest rate possible after the rebalance takes place, based on the strategy.`
      },
      {
        q: 'What are IdleTokens?',
        a: `IdleTokens represent your balance in the protocol, and accrue interest over time. As a specific Idle’s pool earns interest, its idleToken becomes convertible into an increasing quantity of the underlying asset. IdleTokens conform to the ERC-20 standard.`
      }
    ],
    ratesQuestions: [
      {
        q: 'Has Idle had a security audit?',
        a: `Idle completed multiple and incremental security audits with Quantstamp in December 2019 and April/May 2020 (<a href="https://certificate.quantstamp.com/full/idle-finance" target="_blank" rel="nofollow noopener noreferrer">view the report</a>). Any issues affecting the performance of the protocol or security of funds have been resolved. Users should review our Terms of Service before using the protocol.`
      },
      {
        q: 'How are digital assets custodied?',
        a: `Idle does not custody digital assets. When you interact with the Idle protocol, your digital assets will be sent to a smart contract that Idle does not control. The smart contract has the concept of “accounts,” to which only you have access. These accounts have balances for each asset, which then are lent out to underlying protocols. When you want to withdraw, the smart contract interacts with the underlying platforms to withdraw digital assets and route them to your wallet.`
      },
      {
        q: 'Who is the administrator of the Idle smart contract?',
        a: `We have few administrative privileges (eg pause deposits in case of emergency), but we cannot, in any case, withdraw or move user funds directly. You can read more about here <a href="https://developers.idle.finance/advanced/admin-powers" target="_blank" rel="nofollow noopener noreferrer">https://developers.idle.finance/advanced/admin-powers</a>`
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
        flexDirection={'column'}
      >
        <Title
          mb={3}
          mt={[3,4]}
          fontWeight={5}
          fontSize={[5,6]}
          component={Heading.h4}
        >
          Frequently asked questions
        </Title>

        <Flex
          flexDirection={'column'}
          justifyContent={"center"}
          alignItems={'center'}
        >
          <Flex width={[1,3/5]} px={[2,0]} flexDirection={'row'} justifyContent={'space-between'}>
            <Flex width={1/3} textAlign={'center'} justifyContent={'center'} borderBottom={ isGeneralSelected ? '3px solid #0036ff' : 'none'}>
              <Text
                mb={1}
                fontWeight={3}
                fontSize={[2, 3]}
                textAlign={'center'}
                onClick={() => this.setSection('general')}
                color={isGeneralSelected ? 'blue' : 'copyColor'}
                className={['pointer', isGeneralSelected ? 'selected' : '']}
              >
                General
              </Text>
            </Flex>
            <Flex width={1/3} textAlign={'center'} justifyContent={'center'} borderBottom={ isGuidelinesSelected ? '3px solid #0036ff' : 'none'}>
              <Text
                mb={1}
                fontWeight={3}
                fontSize={[2, 3]}
                textAlign={'center'}
                onClick={() => this.setSection('guidelines')}
                color={isGuidelinesSelected ? 'blue' : 'copyColor'}
                className={['pointer', isGuidelinesSelected ? 'selected' : '']}
              >
                Liquidity Providers
              </Text>
            </Flex>
            <Flex width={1/3} textAlign={'center'} justifyContent={'center'} borderBottom={ isRatesSelected ? '3px solid #0036ff' : 'none'}>
              <Text
                mb={1}
                fontWeight={3}
                fontSize={[2, 3]}
                textAlign={'center'}
                onClick={() => this.setSection('rates')}
                color={isRatesSelected ? 'blue' : 'copyColor'}
                className={['pointer', isRatesSelected ? 'selected' : '']}
              >
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
