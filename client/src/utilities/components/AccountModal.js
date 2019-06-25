import React from "react";
import {
  Heading,
  Text,
  Modal,
  Flex,
  QR,
  Button,
} from "rimble-ui";
import ModalCard from './ModalCard';
import { useWeb3Context } from 'web3-react'
import BigNumber from 'bignumber.js';

export default function (props) {
  const context = useWeb3Context();
  const { account, accountBalance, accountBalanceDAI, isOpen, closeModal } = props;
  const BNify = s => new BigNumber(String(s));
  const trimEth = eth => {
    return BNify(eth).toFixed(6);
  };

  return (
    <Modal isOpen={isOpen}>
      <ModalCard closeFunc={closeModal}>
        <ModalCard.Body>
          <Heading.h2>Account overview</Heading.h2>
          <Text.span fontSize={3} color={'mid-gray'}>
            Public Address:
            <div style={{'wordBreak': 'break-word'}}>
              {props.account}
            </div>
          </Text.span>
          {/*
            <PublicAddress address={account} />
          */}
          {account &&
            <Flex p={1}>
              <QR
                value={props.account}
                renderAs={'svg'}
              />
            </Flex>
          }

          <Text my={3} fontSize={3}>
            {trimEth(accountBalance)} ETH
          </Text>
          <Text my={3} fontSize={3}>
            {trimEth(accountBalanceDAI)} DAI
          </Text>
        </ModalCard.Body>

        <ModalCard.Footer>
          {(context.active || (context.error && context.connectorName)) && (
            <Button.Outline
              mb={[2, 3]}
              width={[1, 1/2]}
              size={'medium'}
              onClick={async () => await context.unsetConnector()}>
              {context.active ? "Log out wallet" : "Reset"}
            </Button.Outline>
          )}
        </ModalCard.Footer>
      </ModalCard>
    </Modal>
  );
}
