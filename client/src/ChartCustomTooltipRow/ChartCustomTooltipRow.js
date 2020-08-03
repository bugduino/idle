import React, { Component } from 'react';
import { Flex, Box, Text } from "rimble-ui";

class ChartCustomTooltipRow extends Component {

  async componentWillMount(){
    
  }

  async componentDidUpdate(prevProps,prevState){

  }

  render() {
    return (
      <Flex
        mb={2}
        width={1}
        alignItems={'center'}
        flexDirection={'row'}
      >
        <Flex
          pr={2}
          style={{
            flexBasis:'0',
            flex:'1 1 0px'
          }}
          alignItems={'center'}
          justifyContent={'flex-start'}
        > 
          {
            this.props.color && 
            <Box
              mr={2}
              width={'10px'}
              height={'10px'}
              borderRadius={'50%'}
              backgroundColor={this.props.color}
            >
            </Box>
          }
          <Text
            fontSize={1}
            fontWeight={2}
            textAlign={'left'}
            color={'dark-gray'}
            style={{
              textTransform:'capitalize'
            }}
          >
            {this.props.label}
          </Text>
        </Flex>
        <Flex
          style={{
            flexBasis:'0',
            flex:'1 1 0px'
          }}
          alignItems={'center'}
          justifyContent={'flex-end'}
        >
          <Text
            fontSize={1}
            fontWeight={3}
            color={'cellText'}
            textAlign={'right'}
            style={{
              whiteSpace:'nowrap'
            }}
            dangerouslySetInnerHTML={{
              __html: this.props.value
            }}
          >
          </Text>
        </Flex>
      </Flex>
    );
  }
}

export default ChartCustomTooltipRow;
