import React from "react";
import {
  Heading,
  Text,
  Modal,
  Box
} from "rimble-ui";
import ModalCard from './ModalCard';
import NewsletterForm from '../../NewsletterForm/NewsletterForm';

export default function MaxCapModal(props) {
  const { isOpen, closeModal, maxCap, currSupply } = props;
  const humanCurrSupply = +(currSupply.div(1e18)).toFixed(2);
  const maxMintable = +(maxCap.minus(currSupply.div(1e18))).toFixed(2);
  return (
    <Modal isOpen={isOpen}>
      <ModalCard closeFunc={closeModal}>
        <ModalCard.Body>
          <Box mt={3} mb={3}>
            <Heading color={'black'} fontSize={[4, 5]}>Max deposit reached</Heading>
            <Text fontSize={[2, 3]} my={3}>
              {currSupply.div(1e18).gte(maxCap) ?
                `The max amount of ${maxCap.toString()} IdleDAI have currently been reached, so new deposits
                are now paused.` :

                `The current supply of IdleDAI is ${humanCurrSupply} (MAX CAP: ${maxCap.toString()} IdleDAI) so the
                max amount mintable is ${maxMintable}, try with a lower amount.`
              }
            </Text>
            <Text fontSize={[2, 3]} my={3}>
              This is still a Beta version, we are currently working on a new and improved rebalance process
              which would scale better for large amount of funds.
              You can come back later to check if others have redeemed their
              position or subscribe to our newsletter to be notified when the new version is ready.
            </Text>

            <NewsletterForm />
          </Box>
        </ModalCard.Body>
      </ModalCard>
    </Modal>
  );
}
