import React, { Component } from "react";
import { Box, Flex, Form, Button } from 'rimble-ui'
import styles from './CryptoInput.module.scss';

class CryptoInput extends Component {
  render() {
    return (
        <Flex
          className={[styles.mainInputContainer]}
          maxWidth={['20em','40em']}
          borderRadius={'2rem'}
          border={'1px solid'}
          borderColor={'#ccc'}
          p={0}
          my={['0','1em']}
          mx={'auto'}
          >
            <Box width={[3/5]}>
              <Form.Input
                placeholder={`Enter Amount`}
                value={this.props.defaultValue}
                type="number"
                borderRadius='2rem'
                border='0'
                pl={'1em'}
                pt={[0,'0.5em']}
                borderColor='transparent'
                boxShadow='none !important'
                min={0}
                height={this.props.height}
                step={0.01}
                fontSize={[3,4]}
                width={'100%'}
                bg={'transparent'}
                color={this.props.color}
                className={[styles.mainInput]}
                onChange={this.props.handleChangeAmount}
              />
            </Box>
            <Box display={['none','block']} width={2/5}>
              <Button onClick={this.props.handleClick} className={[styles.button]} size={'large'} mainColor={'blue'} fontSize={[2,3]} px={[4,5]} my={0} width={1}>Start Lending</Button>
            </Box>
            <Box display={['block','none']} width={2/5}>
              <Button onClick={this.props.handleClick} className={[styles.button]} size={'medium'} mainColor={'blue'} fontSize={[2,3]} px={[2,3]} my={0} width={1}>Start Lending</Button>
            </Box>
        </Flex>
    );
  }
}
export default CryptoInput;
