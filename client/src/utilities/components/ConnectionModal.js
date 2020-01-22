import React from "react";
import {
  Heading,
  Text,
  Icon,
  Modal,
  Flex,
  Box,
  Link,
  Button,
  Loader
} from "rimble-ui";
import styles from './Header.module.scss';
import ModalCard from './ModalCard';
import ImageButton from '../../ImageButton/ImageButton';
import TransactionFeeModal from "./TransactionFeeModal";
import Web3ConnectionButtons from "../../Web3ConnectionButtons/Web3ConnectionButtons";

import {
  Link as RouterLink,
} from "react-router-dom";

class ConnectionModal extends React.Component {
  // TODO save pref in localstorage and do not show 'Before connecting' info every time
  state = {
    currentSection:null,
    showTxFees: false,
    showConnectionButtons: false,
    newToEthereum: false,
    closeRemainingTime:null,
    newToEthereumChoice: null,
    showInstructions: false
  };

  toggleShowTxFees = e => {
    console.log("showTxFees", this.state.showTxFees);
    e.preventDefault();

    this.setState({
      showTxFees: !this.state.showTxFees
    });
  }

  getShowConnectionButtons = () => {
    return (localStorage && localStorage.getItem('showConnectionButtons')) || this.state.showConnectionButtons;
  }

  toggleShowConnectionButtons = (e,showConnectionButtons) => {
    e.preventDefault();

    if (typeof showConnectionButtons === 'undefined'){
      showConnectionButtons = !this.state.showConnectionButtons;
    }

    this.setState({
      newToEthereumChoice:null,
      showTxFees: false,
      showConnectionButtons,
      showInstructions: false
    });

    if (localStorage) {
      if (this.getShowConnectionButtons()){
        localStorage.removeItem('showConnectionButtons');
      } else {
        localStorage.setItem('showConnectionButtons', true);
      }
    }
  }

  showInstructions = e => {
    this.setState({
      showTxFees: false,
      showConnectionButtons: false,
      newToEthereum: false,
      newToEthereumChoice:null,
      showInstructions: true,
    });
  }

  resetModal = e => {
    if (localStorage) {
      localStorage.removeItem('showConnectionButtons');
    }
    this.setState({
      showTxFees: false,
      showConnectionButtons: false,
      newToEthereum: false,
      newToEthereumChoice:null,
      showInstructions: false,
      currentSection:null
    });
  }

  setConnector = async (connectorName,name) => {
    let walletProvider = connectorName === 'Injected' ? name : connectorName;
    if (localStorage) {
      localStorage.setItem('walletProvider', walletProvider);
      localStorage.setItem('connectorName', connectorName);
    }

    if (this.props.setConnector && typeof this.props.setConnector === 'function'){
      this.props.setConnector(connectorName,walletProvider);
    }

    // Set Wallet choice
    this.setState({
      newToEthereumChoice: connectorName
    });

    this.closeCountdown();

    return await window.RimbleWeb3_context.setConnector(connectorName);
  }

  closeCountdown = () => {
    const closeRemainingTime = this.state.closeRemainingTime ? this.state.closeRemainingTime-1 : 5;
    if (!closeRemainingTime){
      this.closeModal();
    } else {
      setTimeout(() => { this.closeCountdown() },1000);
    }
    this.setState({
      closeRemainingTime
    });
  }

  setWalletChoice = (e,choice) => {
    e.preventDefault();
    this.setState({
      newToEthereumChoice: choice
    });
  }

  closeModal = () => {
    this.setState({
      showTxFees: false,
      showConnectionButtons: false,
      newToEthereum: false
    });
    this.props.closeModal();
  }

  toggleNewtoEthereum = (e,newToEthereum) => {
    e.preventDefault();

    if (typeof newToEthereum === 'undefined'){
      newToEthereum = !this.state.newToEthereum;
    }

    this.setState({
      showTxFees: false,
      newToEthereum,
      newToEthereumChoice: null,
      showInstructions: false
    });
  }

  setCurrentSection = (e,currentSection) => {
    e.preventDefault();
    this.setState({
      currentSection
    });
  }

  renderModalContent = () => {

    const TOSacceptance = (
      <Box>
        <Text textAlign={'center'} fontSize={1} py={[2,3]}>By connecting, I accept Idle's <RouterLink to="/terms-of-service" color={'blue'} style={{textDecoration:'underline'}} target={'_blank'}>Terms of Service</RouterLink></Text>
      </Box>
    );

    const showConnectionButtons = this.state.currentSection === 'wallet';
    const newToEthereum = this.state.currentSection === 'new';
    const showInstructions = this.state.currentSection === 'instructions';

    if (showInstructions){
      return (
        <React.Fragment>
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

    if (showConnectionButtons) {
      return (
        <Box>
          <ModalCard.Header title={'Select your Wallet'} subtitle={'And get started with Idle.'} icon={'images/idle-mark.png'}></ModalCard.Header>
          <ModalCard.Body>
            <Flex width={1} px={[0,5]} flexDirection={'column'} justifyContent={'center'}>
              <Web3ConnectionButtons isMobile={this.props.isMobile} closeModal={ this.closeModal } setConnector={ this.props.setConnector } width={1/2} size={ this.props.isMobile ? 'medium' : 'large' } />
            </Flex>
            { TOSacceptance }
          </ModalCard.Body>
        </Box>
      );
    }

    if (newToEthereum) {
      return (
        <React.Fragment>
          <ModalCard.Header title={'Let\'s create your first Ethereum wallet'} icon={'images/idle-mark.png'}></ModalCard.Header>
          <ModalCard.Body>
            {
              !this.state.newToEthereumChoice ? (
                <Box>
                  <Box mb={[3,4]}>
                    <Text fontSize={[2,3]} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                      Connect with e-mail or phone number?
                    </Text>
                  </Box>
                  <Flex mb={3} flexDirection={['column','row']} alignItems={'center'} justifyContent={'center'}>
                    <ImageButton isMobile={this.props.isMobile} imageSrc={'images/email.svg'} imageProps={ this.props.isMobile ? {width:'auto',height:'42px'} : {mb:'3px',width:'auto',height:'55px'}} caption={'Use e-mail'} subcaption={'Connect w/ Portis'} handleClick={ e => this.setConnector('Portis','Portis') } />
                    <ImageButton isMobile={this.props.isMobile} imageSrc={'images/mobile.svg'} imageProps={ this.props.isMobile ? {width:'auto',height:'42px'} : {mb:'3px',width:'auto',height:'55px'}} caption={'Use phone number'} subcaption={'Connect w/ Fortmatic'} handleClick={ e => this.setConnector('Fortmatic','Fortmatic') }/>
                  </Flex>
                </Box>
              ) : (
                <Box>
                  <Text fontSize={3} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                    We are connecting you to {this.state.newToEthereumChoice} wallet provider...
                  </Text>
                  <Flex
                    mt={2}
                    justifyContent={'center'}
                    alignItems={'center'}
                    textAlign={'center'}>
                    <Loader size="40px" /> <Text ml={2} color={'dark-gray'}>Closing in {this.state.closeRemainingTime} seconds...</Text>
                  </Flex>
                </Box>
              )
            }
            { TOSacceptance }
          </ModalCard.Body>
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        <ModalCard.Header title={'Connect to Idle'} icon={'images/idle-mark.png'}></ModalCard.Header>
        <ModalCard.Body>
          {
            <Box>
              <Box mb={[3,4]}>
                <Text fontSize={[2,3]} textAlign={'center'} fontWeight={2} lineHeight={1.5}>
                  How do you want to connect to Idle?
                </Text>
              </Box>
              <Flex mb={[2,3]} flexDirection={['column','row']} alignItems={'center'} justifyContent={'center'}>
                <ImageButton isMobile={ this.props.isMobile } imageSrc={'images/ethereum-wallet.svg'} imageProps={ this.props.isMobile ? {width:'auto',height:'42px'} : {width:'auto',height:'55px',marginBottom:'5px'} } caption={`Ethereum wallet`} subcaption={'Choose your favourite'} handleClick={ e => this.setCurrentSection(e,'wallet') } />
                <ImageButton isMobile={ this.props.isMobile } imageSrc={'images/mobile.svg'} imageProps={ this.props.isMobile ? {width:'auto',height:'42px'} : {width:'auto',height:'55px',marginBottom:'5px'} } caption={`New wallet`} subcaption={'Use email / phone'} handleClick={ e => this.setCurrentSection(e,'new') } />
              </Flex>
            </Box>
          }
          { TOSacceptance }
        </ModalCard.Body>
      </React.Fragment>
    );
  }

  renderFooter = () => {
    // const showConnectionButtons = this.state.currentSection === 'wallet';
    // const newToEthereum = this.state.currentSection === 'new';
    // const showInstructions = this.state.currentSection === 'instructions';
    return (
      <ModalCard.Footer>
        { (!this.state.currentSection) ? (
            <Button
              className={[styles.gradientButton,styles.empty]}
              onClick={ e => this.setCurrentSection(e,'instructions') }
              size={'medium'}
              borderRadius={4}
              contrastColor={'blue'}
              fontWeight={3}
              fontSize={[2,2]}
              mx={'auto'}
              px={[4,5]}
            >
              READ INSTRUCTIONS
            </Button>
          ) : (
            <Button
              className={[styles.gradientButton,styles.empty]}
              onClick={this.resetModal}
              size={'medium'}
              borderRadius={4}
              contrastColor={'blue'}
              fontWeight={3}
              fontSize={[2,2]}
              mx={'auto'}
              px={[4,5]}
            >
              BACK
            </Button>
          )
        }
      </ModalCard.Footer>
    );
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
            <Box>
              <TransactionFeeModal />
              {this.renderFooter()}
            </Box>
          )}

        </ModalCard>
      </Modal>
    );
  }
}

export default ConnectionModal;
