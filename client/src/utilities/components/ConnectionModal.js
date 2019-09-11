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
  // TODO save pref in localstorage and do not show 'Before connecting' info every time
  state = {
    showTxFees: false,
    showConnectionButtons: false,
    newToEthereum: false
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
    if (localStorage) {
      if (showConnectionButtons){
        localStorage.removeItem('showConnectionButtons');
      } else {
        localStorage.setItem('showConnectionButtons', true);
      }
    }
  };
  resetModal = e => {
    if (localStorage) {
      localStorage.removeItem('showConnectionButtons');
    }
    this.setState({
      showConnectionButtons: false,
      newToEthereum: false
    });
  };

  getShowConnectionButtons = () => {
    return localStorage ? localStorage.getItem('showConnectionButtons') : this.state.showConnectionButtons;
  }

  toggleNewtoEthereum = e => {
    e.preventDefault();

    this.setState({
      newToEthereum: !this.state.newToEthereum
    });
  };

  renderModalContent = () => {
    const showConnectionButtons = this.getShowConnectionButtons();
    const newToEthereum = this.state.newToEthereum;
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

    if (newToEthereum) {
      return (
        <React.Fragment>
          <Box mt={4} mb={5}>
            <Heading fontSize={[4, 5]}>Let's create your first Ethereum wallet</Heading>
            <Text fontSize={[2, 3]} my={3}>
              Managing ethereum wallet could be intimidating, but we are making it
              seamless by integrating the Portis wallet provider.
              After clicking the button below you will create you first Ethereum wallet
              and you'll be ready to start your journey into Idle.
            </Text>
          </Box>
          <Flex alignItems={"center"}>
            <Web3ConnectionButtons size={'large'} onlyPortis={true} registerPage={true} />
          </Flex>
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        {/* Start primary content */}
        <Box mt={4} mb={5}>
          <Heading fontSize={[4, 5]}>Before you connect</Heading>
          <Text fontSize={[2, 3]} my={3}>
            Connecting lets you use Idle via your
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
              from exchanges like Coinbase or directly via enabled wallet
              such as Portis or Dapper.
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
    const newToEthereum = this.state.newToEthereum;
    return (
      <ModalCard.Footer>
        { showConnectionButtons || newToEthereum ? (
            <Link
              title="Read instructions"
              color={'primary'}
              hoverColor={'primary'}
              href="#"
              onClick={this.resetModal}
            >
              Read instructions
            </Link>
          ) : (
            <Flex flexDirection={['column', 'row']} width={1} justifyContent={['space-around']}>
              <Button
                onClick={this.toggleShowConnectionButtons}
                borderRadius={4}>
                CONNECT
              </Button>
              <Button
                onClick={this.toggleNewtoEthereum}
                borderRadius={4}>
                I AM NEW TO ETHEREUM
              </Button>
            </Flex>
          )
        }
      </ModalCard.Footer>
    );
  }

  closeModal = () => {
    this.setState({
      showTxFees: false,
      showConnectionButtons: false,
      newToEthereum: false
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
