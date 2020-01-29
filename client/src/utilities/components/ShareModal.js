import React from "react";
import {
  Text,
  Modal,
  Link,
  Flex
} from "rimble-ui";
import ModalCard from './ModalCard';
import TwitterShareButton from '../../TwitterShareButton/TwitterShareButton.js';
import Confetti from 'react-confetti/dist/react-confetti';

export default function ShareModal(props) {
  const tweet = window.escape(props.tweet);
  const customText = {__html: props.text};
  return (
    <Modal isOpen={props.isOpen}>
      <ModalCard closeFunc={props.closeModal}>
        {
          props.confettiEnabled &&
          <Confetti
            style={{ position: 'fixed','zIndex':9999 }}
            run={true}
            recycle={true}
            width={window.innerWidth}
            height={window.innerHeight}
          />
        }
        <ModalCard.Header title={props.title} icon={props.icon}></ModalCard.Header>
        <ModalCard.Body>
          <Flex my={3} width={1} flexDirection={'column'} mx={'auto'}>
            <Text color={'dark-gray'} textAlign={'center'} fontSize={3} mb={2} dangerouslySetInnerHTML={customText}></Text>
          </Flex>
          <Flex mb={3} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
            <TwitterShareButton tweet={tweet} text={'Share now'} />
            <Link mt={2} onClick={props.closeModal} hoverColor={'blue'}>continue without sharing</Link>
          </Flex>
        </ModalCard.Body>
      </ModalCard>
    </Modal>
  );
}
