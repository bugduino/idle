import React from "react";
import {
  Heading,
  Text,
  Icon,
  Modal,
  Flex,
  Box,
  ToastMessage
} from "rimble-ui";
import NetworkOverview from "./NetworkOverview";
import theme from "./../../theme";
import ModalCard from './ModalCard';

class ConnectionPendingModal extends React.Component {
  render() {
    return (
      <Modal isOpen={this.props.isOpen}>
        <ModalCard closeFunc={this.props.closeModal}>
          <ModalCard.Body>
            <Box>
              <Text color={theme.colors.primary} caps>
                Current Network
              </Text>
              <NetworkOverview network={this.props.currentNetwork} />
            </Box>
            <Box mt={4} mb={5}>
              <Heading fontSize={[4, 5]}>Before you connect</Heading>
              <Text fontSize={[2, 3]} my={3}>
                Connecting lets you use the Idle dApp via your
                Ethereum account.
              </Text>
            </Box>
            <Flex
              flexDirection={['column', 'row']}
              justifyContent={"space-between"}
              my={[0, 4]}
            >
              <Box flex={'1 1'} width={1} mt={[3, 0]} mb={[4, 0]} mr={4}>
                <Flex justifyContent={"center"} mb={3}>
                  <Icon
                    name="Public"
                    color="primary"
                    size="4rem"
                  />
                </Flex>
                <Heading fontSize={2}>New to Idle?</Heading>
                <Text fontSize={1}>
                  Your Ethereum account activity is public on the
                  blockchain. Choose an account you don’t mind being
                  linked with your activity here.
                </Text>
              </Box>
              <Box flex={'1 1'} width={1} mt={[3, 0]} mb={[4, 0]} mr={4}>
                <Flex justifyContent={"center"} mb={3}>
                  <Icon
                    name="AccountBalanceWallet"
                    color="primary"
                    size="4rem"
                  />
                </Flex>
                <Heading fontSize={2}>What does connection mean?</Heading>
                <Text fontSize={1} mb={3}>
                  Shares your Ethereum account address with us.
                  Allows us to start transactions on the blockchain (at your
                  request)
                </Text>
              </Box>
              <Box flex={'1 1'} width={1} mt={[3, 0]} mb={[4, 0]}>
                <Flex justifyContent={"center"} mb={3}>
                  <Icon
                    name="People"
                    color="primary"
                    size="4rem"
                  />
                </Flex>
                <Heading fontSize={2}>Connect your account</Heading>
                <Text fontSize={1}>
                  A connection request should automatically appear. If not, open
                  it using the MetaMask extension icon in your browser.
                </Text>
              </Box>
            </Flex>
          </ModalCard.Body>
          <ModalCard.Footer>
            <ToastMessage
              message={"Waiting for connection confirmation..."}
              secondaryMessage={"This won't cost your any Ether"}
              icon={"InfoOutline"}
            />
          </ModalCard.Footer>
        </ModalCard>
      </Modal>
    );
  }
}

export default ConnectionPendingModal;
