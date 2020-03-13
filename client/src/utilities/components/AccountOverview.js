import React from "react";
import { Flex, Icon, Box, Text, QR, Image } from "rimble-ui";
import ShortHash from "./ShortHash";
import BigNumber from 'bignumber.js';
import styles from './AccountOverview.module.scss';
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
    const roundedBalance = this.trimEth(this.props.accountBalance, 4);
    const roundedTokenBalance = this.trimEth(this.props.accountBalanceToken, 2);
    const walletProvider = this.getWalletProvider();

    const connectorInfo = globalConfigs.connectors[walletProvider.toLowerCase()];
    const walletIcon = connectorInfo && connectorInfo.icon ? connectorInfo.icon : `${walletProvider.toLowerCase()}.svg`;
    return (
      <Flex alignItems={"flex-start"} style={{cursor: 'pointer'}} mx={3} my={2} onClick={this.props.toggleModal}>
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
            <Box>
              <Text fontSize={1} color={'white'}>
                User: &nbsp;
                <ShortHash
                  fontSize={1} color={'white'}
                  hash={this.props.account} />
              </Text>
              <Text
                fontSize={1}
                color={this.props.accountBalanceLow ? 'white' : 'white'}
                >
                {isNaN(roundedBalance) ? '0' : roundedBalance} ETH
                {roundedTokenBalance && !isNaN(roundedTokenBalance) ? `, ${roundedTokenBalance}` : ', 0'} {this.props.selectedToken}
              </Text>
            </Box>
          </Box>
        }
        {
          connectorInfo ? (
            <Image
              width={'42px'}
              height={'42px'}
              display={'inline-flex'}
              mr={[0,'0.5rem']}
              src={`images/${walletIcon}`}
              alt={walletProvider.toLowerCase()}
              className={styles.walletProvider}
            />
          ) : (
            <Icon
              name='AccountCircle'
              size={'45'}
              ml={2}
              mt={[0, 0]}
              color='white' />
          )
        }
      </Flex>
    );
  }
}

export default AccountOverview;
