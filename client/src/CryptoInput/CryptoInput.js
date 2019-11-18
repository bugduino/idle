import React, { Component } from "react";
import { Heading, Box, Flex, Form, Button, Image, Link, Text, Pill } from 'rimble-ui'
import styles from './CryptoInput.module.scss';

class CryptoInput extends Component {
  render() {
    const convertedValueDecimals = this.props.isMobile ? 2 : 4;
    const convertedLabel = this.props.convertedLabel ? this.props.convertedLabel : 'idle'+this.props.selectedAsset;
    const convertedValue = !isNaN(this.props.trimEth(this.props.idleTokenPrice)) && !!this.props.idleTokenPrice ? '~'+this.props.BNify(this.props.defaultValue/this.props.idleTokenPrice).toFixed(convertedValueDecimals)+' '+convertedLabel : '';
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
              <Flex width={[2/10]}>
                <Image src={this.props.icon ? this.props.icon : `images/btn-${this.props.selectedAsset.toLowerCase()}.svg`} height={'32px'} ml={['0.5em','10px']} />
              </Flex>
              <Box width={8/10}>
                <Form.Input
                  placeholder={this.props.placeholder ? this.props.placeholder : `Enter ${this.props.selectedAsset} Amount`}
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
              this.props.account && !isNaN(this.props.trimEth(this.props.balance)) && 
              <Box pl={'5%'}>
                <Heading.h5 color={'darkGray'} fontWeight={1} fontSize={1}>
                    {
                      parseFloat(this.props.balance)>0 ? (
                        <Link color={'primary'} hoverColor={'primary'} fontWeight={2} fontSize={1} lineHeight={'1.25'} onClick={ e => this.props.useEntireBalance(this.props.balance) }>
                          {this.props.action} Max: {!this.props.isMobile ? parseFloat(this.props.balance).toFixed(6) : parseFloat(this.props.balance).toFixed(2) } { this.props.balanceLabel ? this.props.balanceLabel : this.props.selectedAsset }
                        </Link>
                      ) : null
                    }
                </Heading.h5>
              </Box>
            }
          </Flex>

          {this.props.genericError && (
            <Text textAlign='center' color={'red'} fontSize={2} mb={[2,3]}>{this.props.genericError}</Text>
          )}

          {this.props.buyTokenMessage && (
            <Flex alignItems={'center'} justifyContent={'center'}>
              <Link textAlign={'center'} color={'blue'} hoverColor={'blue'} fontWeight={1} fontSize={1} mb={[2,3]} onClick={ e => { this.props.renderZeroExInstant(e,this.props.defaultValue) } }>
                {this.props.buyTokenMessage}
              </Link>
            </Flex>
          )}

          {
            this.props.account && this.props.showTokenApproved && !this.props.isAssetApproved && (
              <Flex textAlign={'center'} alignItems={'center'}>
                <Link textAlign='center' color={'darkGray'} hoverColor={'blue'} fontWeight={1} fontSize={1} mt={[1,2]} onClick={this.props.showApproveModal}>
                  You have to enable {this.props.selectedAsset} before lending
                </Link>
              </Flex>
            )
          }

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
          {
            /*
            <TxProgressBar hash={'0xd8718542754b99dc2b8ef49a753e4360804cfa555ac21d919c7a747ba2d5ce8a'} />
            */
          }

          {this.props.renderZeroExInstant && (
            <>
              <Flex justifyContent={'center'} my={[2,3]} >
                <Link className={styles.newLink} display={'flex'} color={'dark-gray'} hoverColor={'blue'} justifyContent={'center'} onClick={ e => { this.props.renderZeroExInstant(e) } }>
                  <Flex flexDirection={'row'} width={[1,'14em']} borderRadius={3} className={styles.newPillContainer} p={'4px'}>
                    <Flex width={3/11} alignItems={'center'} justifyContent={'center'} className={styles.newPill} color={'white'} fontSize={2} fontWeight={3} borderRadius={3}>
                      NEW
                    </Flex>
                    <Flex width={8/11} justifyContent={'center'}>
                      <Text textAlign={'center'} fontWeight={2} fontSize={1}>Get more {this.props.selectedAsset} now</Text>
                    </Flex>
                  </Flex>
                </Link>
              </Flex>
            </>
          )}
        </>
    );
  }
}
export default CryptoInput;
