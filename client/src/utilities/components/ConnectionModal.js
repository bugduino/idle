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
import styles from './Header.module.scss';
import ModalCard from './ModalCard';
import TransactionFeeModal from "./TransactionFeeModal";
import Web3ConnectionButtons from "../../Web3ConnectionButtons/Web3ConnectionButtons";
import Web3ConnectionButtons_styles from '../../Web3ConnectionButtons/Web3ConnectionButtons.module.scss';
import {
  Link as RouterLink,
} from "react-router-dom";

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
      showTxFees: false,
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
      showTxFees: false,
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
      showTxFees: false,
      newToEthereum: !this.state.newToEthereum
    });
  };

  renderModalContent = () => {

    const TOSacceptance = (
      <Box>
        <Text textAlign={'center'} fontSize={1} py={[2,3]}>By connecting, I accept Idle's <RouterLink to="/terms-of-service" color={'blue'} style={{textDecoration:'underline'}} target={'_blank'}>Terms of Service</RouterLink></Text>
      </Box>
    );

    const showConnectionButtons = this.getShowConnectionButtons();
    const newToEthereum = this.state.newToEthereum;
    if (showConnectionButtons) {
      return (
        <>
          <ModalCard.Header title={'Select your Wallet'} subtitle={'And get started with Idle.'} icon={'images/idle-dai.png'}></ModalCard.Header>
          <ModalCard.Body>
            <Box width={1} px={[3,5]} justifyContent={'center'}>
              <Web3ConnectionButtons setConnector={ this.props.setConnector } width={1/2} size={ this.props.isMobile ? 'medium' : 'large' } />
            </Box>
            { TOSacceptance }
          </ModalCard.Body>
        </>
      );
    }

    if (newToEthereum) {
      return (
        <React.Fragment>
          <ModalCard.Header title={'Let\'s create your first Ethereum wallet'}></ModalCard.Header>
          <ModalCard.Body>
            <Box mb={[3,4]}>
              <Text fontSize={[2,2]} textAlign={['center','left']} fontWeight={2} lineHeight={1.5}>
                Managing ethereum wallet could be intimidating, but we are making it
                seamless by integrating the Portis wallet provider.
                After clicking the button below you will create you first Ethereum wallet
                and you'll be ready to start your journey into Idle.
              </Text>
            </Box>
            <Flex alignItems={"center"} flexDirection={['column','row']}>
              <Box width={[1,1/2]}>
                <Web3ConnectionButtons setConnector={ this.props.setConnector } size={this.props.isMobile ? 'medium' : 'large'} onlyPortis={true} registerPage={true} />
              </Box>
              <Box width={[1,1/2]}>
                <Button.Outline
                  className={[Web3ConnectionButtons_styles.button]}
                  display={'flex'}
                  alignItems={'center'}
                  mb={[1, 3]}
                  width={1}
                  key={'Reset'}
                  size={ this.props.isMobile ? 'medium' : 'large' }
                  onClick={this.toggleShowConnectionButtons}>
                  <Flex alignItems={'center'}>
                    <Icon
                      name="Replay"
                      color="copyColor"
                      size={'1.5em'}
                    />
                    Choose another wallet
                  </Flex>
                </Button.Outline>
              </Box>
            </Flex>
            { TOSacceptance }
          </ModalCard.Body>
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        {/* Start primary content */}
        <ModalCard.Header title={'Before you connect'} subtitle={'Connecting lets you use Idle via your Ethereum account.'}></ModalCard.Header>
        <ModalCard.Body>
          <Flex
            flexDirection={['column', 'row']}
            justifyContent={"space-between"}
            my={[0, 3]}
          >
            <Box flex={'1 1'} width={1} mt={[0, 0]} mb={[4, 0]} mr={4}>
              <Flex justifyContent={"center"} mb={3}>
                <Icon
                  name="Public"
                  color="skyBlue"
                  size="4em"
                />
              </Flex>
              <Heading fontSize={2} textAlign={'center'}>The blockchain is public</Heading>
              <Text fontSize={1} textAlign={'center'}>
                Your Ethereum account activity is public on the
                blockchain. Choose an account you don’t mind being
                linked with your activity here.
              </Text>
            </Box>
            <Box flex={'1 1'} width={1} mt={[0, 0]} mb={[4, 0]} mr={4}>
              <Flex justifyContent={"center"} mb={3}>
                <Icon
                  name="AccountBalanceWallet"
                  color="skyBlue"
                  size="4em"
                />
              </Flex>
              <Heading fontSize={2} textAlign={'center'}>Have some Ether for fees</Heading>
              <Text fontSize={1} mb={3} textAlign={'center'}>
                You’ll need Ether to pay transaction fees. Buy Ether
                from exchanges like Coinbase or directly via enabled wallet
                such as Portis or Dapper.<br />
                <Link
                  title="Learn about Ethereum transaction fees"
                  fontWeight={'0'}
                  color={'blue'}
                  textAlign={'center'}
                  hoverColor={'blue'}
                  href="#"
                  onClick={this.toggleShowTxFees}
                >
                  What are transaction fees?
                </Link>
              </Text>
            </Box>
            <Box flex={'1 1'} width={1} mt={[0, 0]} mb={[4, 0]}>
              <Flex justifyContent={"center"} mb={3}>
                <Icon
                  name="People"
                  color="skyBlue"
                  size="4em"
                />
              </Flex>
              <Heading fontSize={2} textAlign={'center'}>Have the right account ready</Heading>
              <Text fontSize={1} textAlign={'center'}>
                If you have multiple Ethereum accounts, check that the
                one you want to use is active in your browser.
              </Text>
            </Box>
          </Flex>
        </ModalCard.Body>
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
            <Flex flexDirection={['column', 'row']} width={1} justifyContent={'center'}>
              <Button
                className={styles.gradientButton}
                borderRadius={4}
                my={2}
                mr={[0, 4]}
                size={this.props.isMobile ? 'small' : 'medium'}
                onClick={this.toggleShowConnectionButtons}
              >
                I ALREADY HAVE A WALLET
              </Button>
              {
                this.state.showTxFees ? (
                  <Button
                    borderRadius={4}
                    my={2}
                    mr={[0, 4]}
                    size={this.props.isMobile ? 'small' : 'medium'}
                    mainColor={'darkGray'}
                    onClick={this.resetModal}
                  >
                    BACK TO INSTRUCTIONS
                  </Button>
                ) : (
                <Button
                  borderRadius={4}  
                  my={2}
                  mr={[0, 4]}
                  size={this.props.isMobile ? 'small' : 'medium'}
                  mainColor={'blue'}
                  onClick={this.toggleNewtoEthereum}
                >
                  CREATE A NEW WALLET
                </Button>
                )
              }
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
              {this.renderModalContent()}
              {this.renderFooter()}
            </React.Fragment>
          ) : (
            <>
              <TransactionFeeModal />
              {this.renderFooter()}
            </>
          )}

        </ModalCard>
      </Modal>
    );
  }
}

export default ConnectionModal;
