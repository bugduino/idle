import React from "react";
import {
  Text,
  Modal,
  Link,
  Flex
} from "rimble-ui";
import ModalCard from './ModalCard';
import TwitterShareButton from '../../TwitterShareButton/TwitterShareButton.js';
import ReferralCode from '../../ReferralCode/ReferralCode.js';

export default function ReferralShareModal(props) {
  const { isOpen, closeModal } = props;
  const referralLink = 'https://idle.finance?referral=ABCDEF';
  return (
    <Modal isOpen={isOpen}>
      <ModalCard closeFunc={closeModal}>
        <ModalCard.Header title={`Earn extra 25 idleDAI`} icon={`images/medal.svg`}></ModalCard.Header>
        <ModalCard.Body>
          <Flex width={1} flexDirection={'column'} mx={'auto'}>
            <Text color={'dark-gray'} fontSize={3} mb={2}>
              Just follow these simple steps to earn some extra idleDAI:
            </Text>
            <Flex mb={3} flexDirection={'column'}>
              <Flex mb={2} flexDirection={'row'} alignItems={'center'} justifyContent={'flex-start'}>
                <Text fontSize={3} fontWeight={3} color={'blue'}>1. Copy</Text>
                <Text ml={1} fontSize={3} color={'#000000'}>your referral link:</Text>
              </Flex>
              <Flex mb={2} flexDirection={'row'} alignItems={'center'} justifyContent={'flex-start'}>
                <ReferralCode code={referralLink} style={{width:'100%',textAlign:'center'}} />
              </Flex>
              <Flex mb={2} flexDirection={'row'} alignItems={'flex-start'} justifyContent={'flex-start'}>
                <Text fontSize={3} fontWeight={3} color={'blue'}>2. Share</Text>
                <Text ml={1} mr={2} fontSize={3} color={'#000000'}>the link with your friends</Text>
              </Flex>
              <Flex mb={2} flexDirection={'row'} alignItems={'flex-start'} justifyContent={'flex-start'}>
                <Text fontSize={3} fontWeight={3} color={'blue'}>3. Earn</Text>
                <Text ml={1} fontSize={3} color={'#000000'}>5 idleDAI for every friend that make a deposits</Text>
              </Flex>
              <Flex mb={2} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
                <TwitterShareButton tweet={`I just made my first deposit on @idlefinance! Go to ${referralLink} and receive 5 DAI on your first deposit!`} text={'Share now'} />
                <Link mt={2} onClick={closeModal} hoverColor={'blue'}>continue without sharing</Link>
              </Flex>
            </Flex>
          </Flex>
        </ModalCard.Body>
      </ModalCard>
    </Modal>
  );
}
