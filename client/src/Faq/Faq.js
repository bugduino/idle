import React, { Component } from 'react';
import { Box, Flex, Text, Heading } from 'rimble-ui'
// import styles from './Faq.module.scss';
import Faquestion from '../Faquestion/Faquestion';

class Faq extends Component {
  state = {
    selectedSection: 'general',
    generalQuestions: [
      {
        q: 'How could you provide such APR?',
        a: `We source interest rates through different lending protocols and we forward your funds to the appropriate provider`
      },
      {
        q: 'How could you provide such APR?',
        a: `We source interest rates through different lending protocols and we forward your funds to the appropriate provider`
      },
      {
        q: 'How could you provide such APR?',
        a: `We source interest rates through different lending protocols and we forward your funds to the appropriate provider`
      }
    ],
    guidelinesQuestions: [
      {
        q: 'Guidelines you provide such APR?',
        a: `We source interest rates through different lending protocols and we forward your funds to the appropriate provider`
      },
      {
        q: 'Guidelines you provide such APR?',
        a: `We source interest rates through different lending protocols and we forward your funds to the appropriate provider`
      },
      {
        q: 'Guidelines you provide such APR?',
        a: `We source interest rates through different lending protocols and we forward your funds to the appropriate provider`
      }
    ],
    ratesQuestions: [
      {
        q: 'Rates you provide such APR?',
        a: `We source interest rates through different lending protocols and we forward your funds to the appropriate provider`
      },
      {
        q: 'Rates you provide such APR?',
        a: `We source interest rates through different lending protocols and we forward your funds to the appropriate provider`
      },
      {
        q: 'Rates you provide such APR?',
        a: `We source interest rates through different lending protocols and we forward your funds to the appropriate provider`
      }
    ]
  };
  setSection(section) {
    this.setState(state => ({...state, selectedSection: section}));
  }
  render() {
    const {generalQuestions, selectedSection, guidelinesQuestions, ratesQuestions} = this.state;
    const generalDivs = generalQuestions.map((question, i) => (
      <Faquestion question={question.q} answer={question.a} pt={i === 0 ? 0 : ''} />
    ));
    const guidelinesDivs = guidelinesQuestions.map((question, i) => (
      <Faquestion question={question.q} answer={question.a} pt={i === 0 ? 0 : ''} />
    ));
    const ratesDivs = ratesQuestions.map((question, i) => (
      <Faquestion question={question.q} answer={question.a} pt={i === 0 ? 0 : ''} />
    ));
    const isGeneralSelected = selectedSection === 'general';
    const isGuidelinesSelected = selectedSection === 'guidelines';
    const isRatesSelected = selectedSection === 'rates';
    return (
      <Flex
        py={[2, 4]}
        flexDirection={['column']}>
        <Heading.h2 fontFamily={'serif'} fontSize={[5, 6]} textAlign={'center'} py={2} alignItems={'center'} my={0}>
          Faq
        </Heading.h2>

        <Flex
          flexDirection={['column', 'row']}
          justifyContent={["flex-start", "space-between"]}
          my={[2, 4]}
        >
          <Flex flexDirection={['row', 'column']} justifyContent={['space-between', 'flex-start']}>
            <Text
              fontSize={[3, 4]}
              mb={[1, 3]}
              color={isGeneralSelected ? 'blue' : 'copyColor'}
              onClick={() => this.setSection('general')}
              className={['pointer', isGeneralSelected ? 'selected' : '']}>
              General
            </Text>
            <Text
              fontSize={[3, 4]}
              mb={[1, 3]}
              color={isGuidelinesSelected ? 'blue' : 'copyColor'}
              onClick={() => this.setSection('guidelines')}
              className={['pointer', isGuidelinesSelected ? 'selected' : '']}>
              Guidelines
            </Text>
            <Text
              fontSize={[3, 4]}
              mb={[1, 3]}
              color={isRatesSelected ? 'blue' : 'copyColor'}
              onClick={() => this.setSection('rates')}
              className={['pointer', isRatesSelected ? 'selected' : '']}>
              Rates
            </Text>
          </Flex>
          <Box flex={'1 1'} width={1} mt={[3, 0]} mb={[4, 0]} mr={4} ml={[0, 5]}>
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
