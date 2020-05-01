import React from "react";
import { Flex, Icon, Box, Text, QR, Image } from "rimble-ui";
import ShortHash from "./ShortHash";
import BigNumber from 'bignumber.js';
// import styles from './AccountOverview.module.scss';
import globalConfigs from '../../configs/globalConfigs';

class AccountOverview extends React.Component {
  BNify = s => new BigNumber(String(s));
  trimEth = (eth, to) => {
    return this.BNify(eth).toFixed(to);
  };
  getWalletProvider(){
    if (localStorage){
      return localStorage.getItem('walletProvider') ? localStorage.getItem('walletProvider') : null;
    }
    return null;
  }
  render() {
    // const roundedBalance = this.trimEth(this.props.accountBalance, 4);
    // const roundedTokenBalance = this.trimEth(this.props.accountBalanceToken, 2);
    const walletProvider = this.getWalletProvider();
    const connectorInfo = globalConfigs.connectors[walletProvider.toLowerCase()];
    const walletIcon = connectorInfo && connectorInfo.icon ? connectorInfo.icon : `${walletProvider.toLowerCase()}.svg`;
    return (
      <Flex
      my={2}
      alignItems={'center'}
      style={{cursor:'pointer'}}
      onClick={this.props.toggleModal}
    >
        {
          connectorInfo ? (
            <Image
              width={'55px'}
              height={'55px'}
              mr={[0,'0.5rem']}
              display={'inline-flex'}
              src={`images/${walletIcon}`}
              alt={walletProvider.toLowerCase()}
            />
          ) : (
            <Icon
              name='AccountCircle'
              size={'50'}
              ml={2}
              mt={[0, 0]}
              color='copyColor' />
          )
        }
        {!this.props.isMobile &&
          <Box>
            {this.props.hasQRCode &&
              <Flex mr={3} p={1}>
                <QR
                  value={this.props.account}
                  size={50}
                  renderAs={'svg'}
                />
              </Flex>
            }
            <Flex flexDirection={'column'}>
              <Flex
                width={1}
                alignItems={'center'}
                flexDirection={'row'}
                justifyContent={'space-between'}
              >
                <Text
                  fontSize={2}
                  fontWeight={3}
                  color={'copyColor'}
                >
                  Hello
                </Text>
                <ShortHash
                  fontSize={2}
                  fontWeight={3}
                  color={'copyColor'}
                  hash={this.props.account}
                />
              </Flex>
              <Text
                fontSize={1}
                fontWeight={3}
                color={'subColor'}
                >
                Connected with {walletProvider}
              </Text>
            </Flex>
          </Box>
        }
      </Flex>
    );
  }
}

export default AccountOverview;
