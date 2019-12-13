import React from "react";
import {
  Heading,
  Text,
  Modal,
  Box,
  Flex,
  Flash
} from "rimble-ui";
import ModalCard from './ModalCard';
import NewsletterForm from '../../NewsletterForm/NewsletterForm';

export default function (props) {
  const { isOpen, closeModal } = props;
  return (
    <Modal isOpen={isOpen}>
      <ModalCard closeFunc={closeModal}>
        <Flex flex={'1 1 auto'} style={{ overflow: 'auto' }} >
          <Flex
            width={["auto", "50em"]}
            flexDirection={'column'}
            alignItems={'center'}
            m={'auto'}
            py={[3,4]}
            px={[4,5]}
            justifyContent={'center'}>
            <Heading.h2 textAlign={'center'} color={'dark-gray'}>
              New release is coming soon!
            </Heading.h2>
            <Flex
              flexDirection={'column'}
              alignItems={'center'}
              justifyContent={'flex-start'}>
              <Box>
                <Text my={1}>
                  We are about to release the new version of the contract which will support both SAI and DAI: a simple migration process will allow you to migrate from idleSAI v1 to idleSAI v2 and also from idleSAI v1 to idleDAI v2.
                </Text>
                <Flash p={0} px={2} my={3} style={{backgroundColor:'white',borderColor:'blue'}}>
                  <Heading.h4 textAlign={'center'} my={3} p={[0,2]} color={'blue'} textTransform={'underline'}>
                    In the meantime you can keep your SAI in Idle and earn some more interests.
                  </Heading.h4>
                </Flash>
              </Box>
              <Box width={1}>
                <Text textAlign={'left'} mb={3}>
                  Sign up to Idle Newsletter to get updated as soon as our new version is ready:
                </Text>
                <NewsletterForm label={'Insert your e-mail:'} buttonLabel={'KEEP ME UPDATED'} />
              </Box>
            </Flex>
          </Flex>
        </Flex>
      </ModalCard>
    </Modal>
  );
}
