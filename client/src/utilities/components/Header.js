import React from "react";
import { Box, Flex, Button, Image } from "rimble-ui";
import AccountOverview from "./AccountOverview";
import AccountModal from "./AccountModal";
import styles from '../../SmartContractControls/SmartContractControls.module.scss';

class Header extends React.Component {
  state = {
    isOpen: false
  }

  toggleModal = () => {
    this.setState(state => ({...state, isOpen: !state.isOpen}));
  }

  render() {
    return (
      <Box style={{
        'position': 'absolute',
        'left': '0',
        'right': '0',
        'zIndex': 99
        }}
      >
        <Flex bg={"transparent"} pt={[3,3]} alignItems={'flex-end'}>
          <Box ml={[3, 5]} width={[1, 3/12]}>
            <Image src="images/logo.png"
              height={['35px','50px']}
              position={'relative'} />
          </Box>
          <Box display={['inline-block', 'none']}>
            {this.props.account ? (
              <AccountOverview
                account={this.props.account}
                hasQRCode={false}
                isMobile={this.props.isMobile}
                accountBalanceLow={this.props.accountBalanceLow}
                accountBalance={this.props.accountBalance}
                accountBalanceDAI={this.props.accountBalanceDAI}
                toggleModal={this.toggleModal}
              />
            ) : (
              <Button
                className={styles.gradientButton}
                borderRadius={4}
                my={2}
                mr={[3, 4]}
                onClick={this.props.connectAndValidateAccount}
                size={this.props.isMobile ? 'small' : 'medium'}
              >
                CONNECT
              </Button>
            )}
          </Box>
          <Box display={['none','block']} width={[8/12]} justifyContent="flex-end">
            <Flex alignItems={"center"} justifyContent="flex-end">
              {this.props.account ? (
                <AccountOverview
                  account={this.props.account}
                  hasQRCode={false}
                  isMobile={this.props.isMobile}
                  accountBalanceLow={this.props.accountBalanceLow}
                  accountBalance={this.props.accountBalance}
                  accountBalanceDAI={this.props.accountBalanceDAI}
                  toggleModal={this.toggleModal}
                />
              ) : (
                <Button
                  contrastColor={'blue'}
                  mainColor={'white'}
                  borderRadius={4}
                  my={2}
                  mr={[3, 4]}
                  onClick={this.props.connectAndValidateAccount}
                  size={this.props.isMobile ? 'small' : 'medium'}
                >
                  CONNECT
                </Button>
              )}
            </Flex>
          </Box>
        </Flex>
        <AccountModal
          account={this.props.account}
          accountBalance={this.props.accountBalance}
          accountBalanceDAI={this.props.accountBalanceDAI}
          isOpen={this.state.isOpen}
          isMobile={this.props.isMobile}
          closeModal={this.toggleModal}
          network={this.props.network.current} />
      </Box>
    );
  }
}

export default Header;
