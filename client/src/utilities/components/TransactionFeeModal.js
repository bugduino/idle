import React from "react";
import { Heading, Text, Box, Flex, Icon } from "rimble-ui";
import ModalCard from './ModalCard';

function TransactionFeeModal(props) {
  return (
    <Box>
      <ModalCard.Header title={'Transaction fees, what are you paying for?'} subtitle={'You need to pay a fee to use the Ethereum blockchain.'} subtitle2={'This pays for someone to process your transaction and store the data.'}></ModalCard.Header>
      <ModalCard.Body>
        <Flex flexDirection={['column', 'row']}
          justifyContent={"space-between"}
          my={[0, 4]}>
          <Box flex={'1 1'} width={1} mt={[0, 0]} mb={[4, 0]} mr={4}>
            <Flex justifyContent={"center"} mb={3}>
              <Icon
                name="Fingerprint"
                color="skyBlue"
                size="4em"
              />
            </Flex>
            <Heading fontSize={2} textAlign={'center'}>Undeniable proof</Heading>
            <Text fontSize={1} textAlign={'center'}>
              You get a public record of any funds you send or receive, a bit like
              a deed for a house.
            </Text>
          </Box>
          <Box flex={'1 1'} width={1} mt={[0, 0]} mb={[4, 0]} mr={4}>
            <Flex justifyContent={"center"} mb={3}>
              <Icon
                name="EnhancedEncryption"
                color="skyBlue"
                size="4em"
              />
            </Flex>
            <Heading fontSize={2} textAlign={'center'}>Unbreakable encryption</Heading>
            <Text fontSize={1} textAlign={'center'}>
              Your funds can only ever go to your intended recipients.
            </Text>
          </Box>
          <Box flex={'1 1'} width={1} mt={[0, 0]} mb={[4, 0]} mr={4}>
            <Flex justifyContent={"center"} mb={3}>
              <Icon
                name="AccountBalance"
                color="skyBlue"
                size="4em"
              />
              <Icon
                name="NotInterested"
                color="skyBlue"
                size="4em"
              />
            </Flex>
            <Heading fontSize={2} textAlign={'center'}>Unparalleled control</Heading>
            <Text fontSize={1} textAlign={'center'}>
              You can pay or get paid without using any banks or companies.
            </Text>
          </Box>
        </Flex>
      </ModalCard.Body>
    </Box>
  );
}

export default TransactionFeeModal;
