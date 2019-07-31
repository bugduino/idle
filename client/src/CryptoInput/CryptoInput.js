import React, { Component } from "react";
import { Heading, Box, Flex, Form, Button, Image } from 'rimble-ui'
import styles from './CryptoInput.module.scss';

class CryptoInput extends Component {
  render() {
    const convertedValue = !isNaN(this.props.trimEth(this.props.IdleDAIPrice)) && !!this.props.IdleDAIPrice ? '~'+this.props.BNify(this.props.defaultValue/this.props.IdleDAIPrice).toFixed(2)+' idleDAI' : '';
    return (
        <>
          <Flex
            maxWidth={['90%','40em']}
            borderRadius={'2rem'}
            border={'1px solid'}
            alignItems={'center'}
            borderColor={'#ccc'}
            p={0}
            mt={['0','1em']}
            mx={'auto'}
            >
              <Box width={[1/10]}>
                <Image src="images/btn-dai.svg" height={this.props.height} ml={['0.5em','1em']} />
              </Box>
              <Box width={[6/10, 5/10]}>
                <Form.Input
                  style={{
                    paddingLeft: '1em',
                    paddingRight: '1em'
                  }}
                  placeholder={`Enter DAI Amount`}
                  value={this.props.defaultValue}
                  type="number"
                  borderRadius='2rem'
                  border='0'
                  borderColor='transparent'
                  boxShadow='none !important'
                  min={0}
                  height={this.props.height}
                  step={0.01}
                  fontSize={[2, 4]}
                  width={'100%'}
                  bg={'transparent'}
                  color={this.props.color}
                  className={[styles.mainInput]}
                  onChange={this.props.handleChangeAmount}
                />
              </Box>
              <Box display={['none','block']} width={2/10}>
                <Form.Input
                  style={{
                    paddingLeft: '0',
                    paddingRight: '10px',
                    textAlign: 'right'
                  }}
                  readOnly={'readOnly'}
                  placeholder={''}
                  value={convertedValue}
                  type="text"
                  border='0'
                  borderColor='transparent'
                  boxShadow='none !important'
                  min={0}
                  height={this.props.height}
                  step={0.01}
                  fontSize={[1, 1]}
                  width={'100%'}
                  bg={'transparent'}
                  color={'grey'}
                  className={[styles.mainInput]}
                />
              </Box>
              <Box width={[3/10, 2/10]}>
                <Button onClick={this.props.handleClick} className={[styles.button]} size={this.props.isMobile ? 'medium' : 'large'} mainColor={'blue'} fontWeight={2} fontSize={[2,3]} px={this.props.isMobile ? [2,3] : [4,5]} my={0} width={1}>LEND</Button>
              </Box>
          </Flex>
          <Flex maxWidth={['90%','40em']} justifyContent={'left'} alignItems={'left'} mt={[1, 2]} mb={[2,3]} mx={'auto'}>
            <Box pl={'5%'}>
              <Heading.h5 color={'darkGray'} fontWeight={1} fontSize={1} textAlign={'center'}>
              {!this.props.isMobile ? 
                  !isNaN(this.props.trimEth(this.props.IdleDAIPrice)) && !!this.props.IdleDAIPrice && `1 idleDAI = ${this.props.trimEth(this.props.IdleDAIPrice)} DAI`
                 : 
                  convertedValue
              }
              </Heading.h5>
            </Box>
          </Flex>
          <Flex justifyContent={'center'}>
            <Heading.h5 mt={[1, 2]} color={'darkGray'} fontWeight={1} fontSize={1} textAlign={'center'}>
              *This is beta software. Use at your own risk.
            </Heading.h5>
          </Flex>
        </>
    );
  }
}
export default CryptoInput;
