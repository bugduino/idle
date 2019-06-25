import React from "react";
import { Flex, Icon, Box, Text, QR } from "rimble-ui";
import ShortHash from "./ShortHash";
import BigNumber from 'bignumber.js';

class AccountOverview extends React.Component {
  BNify = s => new BigNumber(String(s));
  trimEth = (eth, to) => {
    return this.BNify(eth).toFixed(to);
  };
  render() {
    const roundedBalance = this.trimEth(this.props.accountBalance, 4);
    const roundedDAIBalance = this.trimEth(this.props.accountBalanceDAI, 2);
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
              <Text.span fontSize={1} color={'mid-gray'}>
                User: &nbsp;
                <ShortHash
                  fontSize={1} color={'mid-gray'}
                  hash={this.props.account} />
              </Text.span>
              <Text
                fontSize={1}
                color={this.props.accountBalanceLow ? 'red' : 'mid-gray'}
                >
                {isNaN(roundedBalance) ? '0' : roundedBalance} ETH
                {roundedDAIBalance && !isNaN(roundedDAIBalance) && `, ${roundedDAIBalance} DAI`}
              </Text>
            </Box>
          </Box>
        }
        <Icon
          name='AccountCircle'
          size={35}
          ml={2}
          mt={[0, 2]}
          color='primary' />
      </Flex>
    );
  }
}

export default AccountOverview;
