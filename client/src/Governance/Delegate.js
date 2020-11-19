import Title from '../Title/Title';
import { Box, Flex } from "rimble-ui";
import React, { Component } from 'react';
import Breadcrumb from '../Breadcrumb/Breadcrumb';
import DelegateVote from './DelegateVote/DelegateVote';

class Delegate extends Component {

  render() {
    return (
      <Box
        width={1}
      >
        <Flex
          mb={3}
          width={1}
          alignItems={'center'}
          flexDirection={'row'}
          justifyContent={'flex-start'}
        >
          <Breadcrumb
            {...this.props}
            text={'Governance'}
            path={['Delegate votes']}
            isMobile={this.props.isMobile}
            handleClick={ e => this.props.goToSection('') }
          />
        </Flex>
        <Box
          width={1}
        >
          <Title
            mb={[3,4]}
          >
            Delegate Votes
          </Title>
          <Flex
            px={[0,3]}
            mb={[3,4]}
            width={1}
            flexDirection={'column'}
            id={'delegate-container'}
          >
            <DelegateVote
              {...this.props}
            />
          </Flex>
        </Box>
      </Box>
    );
  }
}

export default Delegate;
