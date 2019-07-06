import React, { Component } from 'react';
import { Flex, Icon, Text, Heading } from 'rimble-ui'
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
        pt={(this.props.pt || this.props.pt === 0) ? this.props.pt : [2, 4]}
        flexDirection={['column']}
        alignItems={'center'}
        justifyContent={'center'}>
        <Heading.h4
          fontFamily={'serif'}
          style={{cursor: 'pointer'}}
          fontSize={[3, 4]}
          pt={(this.props.pt || this.props.pt === 0) ? this.props.pt : 2}
          pb={2}
          my={0}
          onClick={this.toggleAnswer.bind(this)}>
          <Flex alignItems={'center'}>
            <Icon
              name={this.state.isShowingAnswer ? 'Close' : 'Add'}
              color="copyColor"
              size={"1.5em"}
              mr={[2]}
            />
            {this.props.question}
          </Flex>
        </Heading.h4>

        {this.state.isShowingAnswer &&
          <Text.p fontSize={[3]}>
            {this.props.answer}
          </Text.p>
        }
      </Flex>
    );
  }
}

export default Faquestion;
