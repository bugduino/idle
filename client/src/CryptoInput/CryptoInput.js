import React, { Component } from "react";
import { Heading, Box, Flex, Form, Button, Image, Link, Text } from 'rimble-ui'
import styles from './CryptoInput.module.scss';

class CryptoInput extends Component {
  render() {
    const convertedLabel = this.props.convertedLabel ? this.props.convertedLabel : 'idleDAI';
    const convertedValue = !isNaN(this.props.trimEth(this.props.IdleDAIPrice)) && !!this.props.IdleDAIPrice ? '~'+this.props.BNify(this.props.defaultValue/this.props.IdleDAIPrice).toFixed(2)+' '+convertedLabel : '';
    const showLendButton = typeof this.props.showLendButton === 'undefined' || !!this.props.showLendButton;
    const buttonLabel = typeof this.props.buttonLabel === 'undefined' ? 'LEND' : this.props.buttonLabel;
    return (
        <>
          <Flex
            width={'100%'}
            maxWidth={['90%','30em']}
            borderRadius={'2rem'}
            alignItems={'center'}
            borderColor={'#ccc'}
            boxShadow={1}
            p={1}
            mx={'auto'}
            >
              <Flex width={[1/10]}>
                <Image src={this.props.icon ? this.props.icon : 'images/btn-dai.svg'} height={'32px'} ml={['0.5em','10px']} />
              </Flex>
              <Box width={8/10}>
                <Form.Input
                  placeholder={this.props.placeholder ? this.props.placeholder : `Enter DAI Amount`}
                  value={this.props.defaultValue}
                  type="number"
                  borderRadius='2rem'
                  border='0'
                  borderColor='transparent'
                  boxShadow='none !important'
                  min={0}
                  height={this.props.height}
                  step={0.01}
                  fontSize={[2, 3]}
                  width={'100%'}
                  bg={'transparent'}
                  color={this.props.color}
                  className={[styles.mainInput]}
                  onChange={this.props.handleChangeAmount}
                />
              </Box>
              {
                !this.props.isMobile && (
                  <Box width={3/10}>
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
                )
              }
          </Flex>
          <Flex
            width={'100%'}
            maxWidth={['90%','30em']}
            justifyContent={'space-between'}
            mt={[2, 2]} mb={[2,3]} mx={'auto'}
          >
            {
              this.props.account && !isNaN(this.props.trimEth(this.props.accountBalanceDAI)) && 
              <Box pl={'5%'}>
                <Heading.h5 color={'darkGray'} fontWeight={1} fontSize={1}>
                    {
                      parseFloat(this.props.accountBalanceDAI)>0 ? (
                        <Link color={'darkGray'} hoverColor={'darkGray'} fontWeight={1} fontSize={1} lineHeight={'1.25'} onClick={ e => this.props.useEntireBalance(this.props.accountBalanceDAI) }>
                          Balance: {!this.props.isMobile ? parseFloat(this.props.accountBalanceDAI).toFixed(6) : parseFloat(this.props.accountBalanceDAI).toFixed(2) } { this.props.balanceLabel ? this.props.balanceLabel : 'DAI' }
                        </Link>
                      ) : (
                        <Link color={'darkGray'} hoverColor={'darkGray'} fontWeight={1} fontSize={1} lineHeight={'1.25'}>
                          You have no { this.props.balanceLabel ? this.props.balanceLabel : 'DAI' } in your wallet
                        </Link>
                      )
                    }
                </Heading.h5>
              </Box>
            }
          </Flex>

          {this.props.genericError && (
            <Text textAlign='center' color={'red'} fontSize={2} mb={[2,3]}>{this.props.genericError}</Text>
          )}

          {
            showLendButton && 
            <Flex width={1} alignItems={'center'} justifyContent={'center'} mb={0} mx={'auto'}>
              <Button
                onClick={this.props.handleClick}
                className={styles.gradientButton}
                size={this.props.isMobile ? 'medium' : 'medium'}
                mainColor={'blue'}
                fontWeight={3}
                fontSize={2}
                px={0}
                my={0}
                width={[1/2,1/5]}
                disabled={this.props.disableLendButton ? 'disabled' : false}
              >
                {buttonLabel}
              </Button>
            </Flex>
          }
        </>
    );
  }
}
export default CryptoInput;
