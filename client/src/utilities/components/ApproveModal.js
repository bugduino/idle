import React from "react";
import {
  Text,
  Modal,
  Box,
  Button,
} from "rimble-ui";
import ModalCard from './ModalCard';

export default function ApproveModal(props) {
  const { isOpen, closeModal, onClick, tokenName, baseTokenName } = props;

  const isRedeeming = tokenName.charAt(0) === 'c';

  return (
    <Modal isOpen={isOpen}>
      <ModalCard closeFunc={closeModal}>
        <ModalCard.Header title={`Enabling ${tokenName} tokens`}>
        </ModalCard.Header>
        <ModalCard.Body>
          <Box mt={2} mb={4}>
            <Text fontWeight={3} fontSize={[2, 3]} my={0}>
              What it means?
            </Text>
            <Text fontSize={2}>
              Currently {tokenName} tokens are in your wallet and you are the one and only owner of them.
            </Text>
            <Text fontSize={2}>
              By clicking on ENABLE you are allowing the Idle contract to actually
              move {tokenName} on your behalf so we can forward them on various lending protocols.
            </Text>
            <Text fontWeight={3} fontSize={[2, 3]} my={3}>You need to enable {tokenName} tokens to:</Text>
            <Text fontSize={2}>
              <ul>
                {isRedeeming ?
                  <li>Redeem {baseTokenName} plus interest</li>:
                  <li>Lend {tokenName} tokens</li>
                }
              </ul>
            </Text>
          </Box>
        </ModalCard.Body>

        <ModalCard.Footer>
          <Button
            onClick={onClick}
            borderRadius={4}>
            ENABLE {tokenName}
          </Button>
        </ModalCard.Footer>
      </ModalCard>
    </Modal>
  );
}
