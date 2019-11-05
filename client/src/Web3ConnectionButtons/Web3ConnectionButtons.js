import React from 'react'
import { useWeb3Context } from 'web3-react'
import { Button, Image, Box, Text, Flex, Icon, Link } from 'rimble-ui';
import connectors from '../App/connectors';
import GeneralUtil from "../utilities/GeneralUtil";
import styles from './Web3ConnectionButtons.module.scss';

export default function Web3ConnectionButtons(props) {
  const context = useWeb3Context()
  const size = props.size || 'large';
  const width = props.width || 1/2;

  if (!context.active && !context.error) {
    console.log('context loading', context);
  } else if (context.error) {
    console.log('context error', context);
  } else {
    console.log('context success', context);
  }
  const setConnector = async connectorName => {
    if (localStorage && connectorName === 'Injected') {
      localStorage.setItem('walletProvider', 'Injected');
    }
    return await context.setConnector(connectorName);
  };
  const unsetConnector = async () => {
    if (localStorage) {
      localStorage.setItem('walletProvider', '');
    }
    return await context.unsetConnector();
  };
  const isMetamask = GeneralUtil.hasMetaMask();
  const isOpera = GeneralUtil.isOpera();
  const onlyPortis = props.onlyPortis;
  const registerPage = props.registerPage;

  if (connectors.Portis) {
    if (registerPage) {
      connectors.Portis.options = connectors.Portis.options || {};
      connectors.Portis.options.registerPageByDefault = true;
    } else {
      connectors.Portis.options = connectors.Portis.options || {};
      connectors.Portis.options.registerPageByDefault = false;
    }
  }

  let basicConnectorsName = Object.keys(connectors).filter(c => c !== 'Infura');
  if (onlyPortis) {
    basicConnectorsName = basicConnectorsName.filter(n => n === 'Portis');
  }

  const buttons = basicConnectorsName.map(connectorName => {
    switch (connectorName) {
      case 'Injected':
        if (isMetamask || isOpera) {
          let name = 'Metamask';
          if (isOpera) {
            name = 'Opera';
          }

          return (
            <Button.Outline
              className={[styles.button]}
              display={'flex'}
              alignItems={'center'}
              mb={[1, 3]}
              width={basicConnectorsName.length>1 ? [1,width] : 1}
              key={connectorName}
              disabled={context.connectorName === connectorName}
              size={size}
              onClick={async () => await setConnector(connectorName)}>
              <Flex alignItems={'center'}>
                <Image
                  display={'inline-flex'}
                  mr={'0.5rem'}
                  src={`images/${name.toLowerCase()}.svg`}
                  alt={name.toLowerCase()}
                  width={'2em'}
                  height={'2em'}
                />
                {name}
              </Flex>
            </Button.Outline>
          )
        } else {
          return (
            <Button.Outline
              className={[styles.button]}
              width={basicConnectorsName.length>1 ? [1,width] : 1}
              mb={[1, 3]}
              key={connectorName}
              disabled={context.connectorName === connectorName}
              size={size}
              onClick={async () => await setConnector(connectorName)}>
              <Flex alignItems={'center'}>
                <Icon
                  display={'inline-flex'}
                  mr={[0,'0.5rem']}
                  color="primary"
                  size={32}
                  name="AccountBalanceWallet" />
                Generic wallet
              </Flex>
            </Button.Outline>
          )
        }
      default:
        return (
          <Button.Outline
            className={[styles.button]}
            mb={[1, 3]}
            width={basicConnectorsName.length>1 ? [1,width] : 1}
            size={size}
            key={connectorName}
            disabled={context.connectorName === connectorName}
            onClick={async () => await setConnector(connectorName)}
          >
            <Flex alignItems={'center'}>
              <Image
                display={'inline-flex'}
                mr={[0,'0.5rem']}
                src={`images/${connectorName.toLowerCase()}.svg`}
                alt={connectorName.toLowerCase()}
                width={'2em'}
                height={'2em'}
              />
              {connectorName}
            </Flex>
          </Button.Outline>
        );
    }
  });

  return (
    <Box width={[1]}>
      <Flex flexDirection={'column'} alignItems={"center"}>
        {context.error && (
          <Text.p textAlign="center">
            An error occurred, are you using an Ethereum browser such as
            <Link href="https://metamask.io/" target="_blank">
              &nbsp; Metamask &nbsp;
            </Link>
             or
            <Link href="https://www.meetdapper.com/" target="_blank">
              &nbsp; Dapper
            </Link>
            ?
            If you do not have an Ethereum wallet follow the
            "I'm new to Ethereum" flow when connecting.
            If you do have a wallet, click Reset and retry one of the wallet listed below,
            Generic wallet option is used for Ethereum browsers only.
          </Text.p>
        )}
        {(context.active || (context.error && context.connectorName)) && context.connectorName !== 'Infura' && (
          <Button.Outline
            width={[1/2]}
            className={[styles.button]}
            mb={[1, 3]}
            size={'large'}
            key={'reset'}
            onClick={async () => await unsetConnector()}
          >
            {context.active ? "Deactivate Connector" : "Reset"}
          </Button.Outline>
        )}
      </Flex>
      {buttons}
    </Box>
  );
}
