import React from "react";
import {
  Heading,
  Text,
  Modal,
  Box,
  Flex,
  Button,
  Image,
  EthAddress
} from "rimble-ui";
import ModalCard from './ModalCard';
import { useWeb3Context } from 'web3-react'
import BigNumber from 'bignumber.js';
import styles from '../../CryptoInput/CryptoInput.module.scss';

export default function (props) {
  const context = useWeb3Context();
  const { account, selectedToken, accountBalance, accountBalanceToken, idleTokenBalance, isOpen, closeModal } = props;

  const balances = [
    {
      'icon':'images/ether.png',
      'amount':accountBalance
    },
    {
      'icon':'images/tokens/'+selectedToken+'.svg',
      'amount':accountBalanceToken
    },
    {
      'icon':'images/tokens/idleDAI.png',
      'amount':idleTokenBalance
    }
  ];

  const BNify = s => new BigNumber(String(s));
  const trimEth = eth => {
    return BNify(eth).toFixed(6);
  };
  const setConnector = async connectorName => {
    if (localStorage) {
      localStorage.setItem('walletProvider', '');
    }
    return await context.setConnector(connectorName);
  };
  if (account){

    const renderBalances = balances.map( (balance,i) => {
      return (
        <Flex
          key={'balance_'+i}
          width={['100%','auto']}
          maxWidth={['90%','14em']}
          borderRadius={'2rem'}
          alignItems={'center'}
          boxShadow={0}
          p={1}
          my={[1,2]}
          mx={'auto'}
          >
            <Flex justifyContent={['flex-end','flex-start']} width={[2/5,2/10]}>
              <Image src={balance.icon} height={'32px'} ml={['0.5em','10px']} />
            </Flex>
            <Box width={[3/5,8/10]} pl={['0.6em','20px']}>
              <Text
                border='0'
                borderColor='transparent'
                boxShadow='none !important'
                fontSize={[2, 3]}
                width={'100%'}
                bg={'transparent'}
                color={'dark-gray'}
                className={[styles.mainInput]}
              >
                {!isNaN(trimEth(balance.amount)) ? trimEth(balance.amount) : trimEth(0)}
              </Text>
            </Box>
        </Flex>
      );
    });

    return (
      <Modal isOpen={isOpen}>
        <ModalCard closeFunc={closeModal}>
          <ModalCard.Header title={'Account overview'}></ModalCard.Header>
          <ModalCard.Body>
            <Flex
              width={["auto", "40em"]}
              flexDirection={'column'}
              alignItems={'center'}
              justifyContent={'center'}>
              <Flex
                flexDirection={'column'}
                alignItems={'center'}
                justifyContent={'center'}
                my={[2,3]}>
                <Box style={{'wordBreak': 'break-word'}}>
                  <EthAddress address={account} />
                </Box>
              </Flex>
              <Flex alignItems={'center'} flexDirection={'column'} width={'100%'}>
                <Heading.h4 textAlign={'center'}>Balance</Heading.h4>
                {renderBalances}
              </Flex>
            </Flex>
          </ModalCard.Body>

          <ModalCard.Footer>
            {(context.active || (context.error && context.connectorName)) && (
              <Button
                mt={[1, 2]}
                size={'medium'}
                px={'80px'}
                borderRadius={4}
                onClick={async () => await setConnector('Infura')}>
                {context.active ? "Log out wallet" : "Reset"}
              </Button>
            )}
          </ModalCard.Footer>
        </ModalCard>
      </Modal>
    );
  }

  return null;
}
