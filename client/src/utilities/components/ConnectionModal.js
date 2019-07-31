import React from "react";
import {
  Heading,
  Text,
  Icon,
  Modal,
  Flex,
  Box,
  Link,
  Button
} from "rimble-ui";
import ModalCard from './ModalCard';
import TransactionFeeModal from "./TransactionFeeModal";
import Web3ConnectionButtons from "../../Web3ConnectionButtons/Web3ConnectionButtons";

class ConnectionModal extends React.Component {
  state = {
    showTxFees: false,
    showConnectionButtons: false
  };

  toggleShowTxFees = e => {
    console.log("showTxFees", this.state.showTxFees);
    e.preventDefault();

    this.setState({
      showTxFees: !this.state.showTxFees
    });
  };

  toggleShowConnectionButtons = e => {
    e.preventDefault();

    this.setState({
      showConnectionButtons: !this.state.showConnectionButtons
    });

    const showConnectionButtons = this.getShowConnectionButtons();
    if (showConnectionButtons){
      localStorage.removeItem('showConnectionButtons');
    } else {
      localStorage.setItem('showConnectionButtons', true);
    }
  };

  getShowConnectionButtons = () => {
    return localStorage ? localStorage.getItem('showConnectionButtons') !== null : this.state.showConnectionButtons;
  }

  renderModalContent = () => {
    const showConnectionButtons = this.getShowConnectionButtons();

    if (showConnectionButtons) {
      return (
        <Box width={1}>
          <Heading fontSize={[4, 5]} mb={[3, 4]} textAlign='center'>
            Connect with:
          </Heading>
          <Web3ConnectionButtons size={'large'} />
        </Box>
      );
    }

    return (
      <React.Fragment>
        {/* Start primary content */}
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
                size="4em"
              />
            </Flex>
            <Heading fontSize={2}>The blockchain is public</Heading>
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
                size="4em"
              />
            </Flex>
            <Heading fontSize={2}>Have some Ether for fees</Heading>
            <Text fontSize={1} mb={3}>
              You’ll need Ether to pay transaction fees. Buy Ether
              from exchanges like Coinbase.
            </Text>
            <Link
              title="Learn about Ethereum transaction fees"
              as={"a"}
              color={'primary'}
              hoverColor={'primary'}
              href="#"
              onClick={this.toggleShowTxFees}
            >
              What are transaction fees?
            </Link>
          </Box>
          <Box flex={'1 1'} width={1} mt={[3, 0]} mb={[4, 0]}>
            <Flex justifyContent={"center"} mb={3}>
              <Icon
                name="People"
                color="primary"
                size="4em"
              />
            </Flex>
            <Heading fontSize={2}>Have the right account ready</Heading>
            <Text fontSize={1}>
              If you have multiple Ethereum accounts, check that the
              one you want to use is active in your browser.
            </Text>
          </Box>
        </Flex>
        {/* End Modal Content */}
      </React.Fragment>
    );
  }

  renderFooter = () => {
    const showConnectionButtons = this.getShowConnectionButtons();

    return (
      <ModalCard.Footer>
        { showConnectionButtons ? (
            <Link
              title="Read instructions"
              color={'primary'}
              hoverColor={'primary'}
              href="#"
              onClick={this.toggleShowConnectionButtons}
            >
              Read instructions
            </Link>
          ) : (
            <Button
              onClick={this.toggleShowConnectionButtons}
              borderRadius={4}>
              CONNECT
            </Button>
          )
        }
      </ModalCard.Footer>
    );
  }

  closeModal = () => {
    this.setState({
      showTxFees: false,
      showConnectionButtons: false
    });
    this.props.closeModal();
  }

  render() {
    return (
      <Modal isOpen={this.props.isOpen}>
        <ModalCard closeFunc={this.closeModal}>

          {this.state.showTxFees === false ? (
            <React.Fragment>
              <ModalCard.Body>
                {this.renderModalContent()}
              </ModalCard.Body>
              {this.renderFooter()}
            </React.Fragment>
          ) : (
            <ModalCard.Body>
              <TransactionFeeModal />
              <ModalCard.BackButton onClick={this.toggleShowTxFees} />
            </ModalCard.Body>
          )}

        </ModalCard>
      </Modal>
    );
  }
}

export default ConnectionModal;
