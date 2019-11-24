import React from "react";
import {
  Text,
  Modal,
  Box,
  Button,
} from "rimble-ui";
import ModalCard from './ModalCard';

export default function WelcomeModal(props) {
  const { isOpen, closeModal } = props;
  const walletProvider = localStorage ? ' '+localStorage.getItem('walletProvider')+' ' : null;
  // const icon = walletProvider ? walletProvider.trim().toLowerCase()+'.svg' : 'idle-dai.png';
  const icon = 'idle-dai.png';

  return (
    <Modal isOpen={isOpen}>
      <ModalCard closeFunc={closeModal}>
        <ModalCard.Header title={`Welcome to Idle`} icon={`images/${icon}`}>
        </ModalCard.Header>
        <ModalCard.Body>
          <Box mt={2} mb={4}>
            <Text textAlign={'center'} fontSize={[2, 3]} my={0}>
              Your{walletProvider}wallet is now connected.<br />
              Close this modal and start lending your idle tokens.
            </Text>
          </Box>
        </ModalCard.Body>

        <ModalCard.Footer>
          <Button
            onClick={closeModal}
            borderRadius={4}>
            START LENDING
          </Button>
        </ModalCard.Footer>
      </ModalCard>
    </Modal>
  );
}
