import React, { Component } from 'react';
import { Box, Flex, Icon, Text, Heading } from 'rimble-ui'
// import styles from './Faquestion.module.scss';

class Faquestion extends Component {
  state = {
    isShowingAnswer: false
  };
  toggleAnswer(e) {
    e.preventDefault();
    this.setState(state => ({...state, isShowingAnswer: !state.isShowingAnswer}));
  };
  render() {
    return (
      <Flex
        my={[3,3]}
        py={[3,3]}
        px={[4,4]}
        flexDirection={'column'}
        alignItems={'baseline'}
        justifyContent={'center'}
        backgroundColor={'white'}
        borderRadius={ this.props.isOpened ? '30px' : '50px' }
        boxShadow={1}
      >
        <Flex flexDirection={'row'} alignItems={'center'} width={1} onClick={this.props.handleClick} style={{cursor: 'pointer'}}>
          <Box width={4/5}>
            <Heading.h4
              fontSize={[1,2]}
              fontFamily={'sansSerif'}
              fontWeight={3}
              color={this.props.isOpened ? 'blue' : 'dark-gray'}
              my={0}>
                {this.props.question}
              </Heading.h4>
          </Box>
          <Flex width={1/5} justifyContent={'flex-end'}>
            <Icon
              name={this.props.isOpened ? 'KeyboardArrowUp' : 'KeyboardArrowDown'}
              color={this.props.isOpened ? 'blue' : 'copyColor'}
              size={"1.5em"}
            />
          </Flex>
        </Flex>
        <Flex width={1}>
          {this.props.isOpened &&
            <Text.p textAlign={'justify'} fontSize={[1,2]} dangerouslySetInnerHTML={{ __html: this.props.answer }}></Text.p>
          }
        </Flex>
      </Flex>
    );
  }
}

export default Faquestion;
