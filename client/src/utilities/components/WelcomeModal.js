import React from "react";
import {
  Text,
  Modal,
  Button,
  Form,
  Icon,
  Flex,
  Link
} from "rimble-ui";
import axios from 'axios';
import colors from '../../colors';
import ModalCard from './ModalCard';
import header_styles from './Header.module.scss';
import ButtonLoader from '../../ButtonLoader/ButtonLoader.js';
import globalConfigs from '../../configs/globalConfigs';
import FunctionsUtil from '../../utilities/FunctionsUtil';

class WelcomeModal extends React.Component {

  state = {
    email:null,
    error:false,
    subscribed:false,
    sendingForm:false
  };

  functionsUtil = null;

  constructor(props) {
    super(props);
    this.functionsUtil = new FunctionsUtil(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleValidation = this.handleValidation.bind(this);
  }

  componentDidUpdate = async () => {
    this.functionsUtil.setProps(this.props);
  }

  sendUserInfo = (sendEmail=true) => {
    const walletProvider = this.functionsUtil.getWalletProvider();
    const userInfo = {
      address: this.props.account,
      provider: walletProvider
    };

    if (sendEmail && this.state.email !== null){
      userInfo.email = this.state.email;
    }

    this.functionsUtil.simpleIDPassUserInfo(userInfo);
  }

  handleSubmit(e) {
    e.preventDefault();

    if (!this.state.email){
      return false;
    }

    const callback = () => {
      this.setState({
        sendingForm:false,
        subscribed:true
      });
      window.setTimeout(this.props.closeModal,2500);
    };

    this.sendUserInfo();

    // Send Google Analytics event
    this.functionsUtil.sendGoogleAnalyticsEvent({
      eventCategory: 'UI',
      eventAction: 'send_email',
      eventLabel: 'WelcomeModal'
    });

    axios.post(globalConfigs.newsletterSubscription.endpoint, {
      'email': this.state.email
    }).then(r => {
      callback();
    })
    .catch(err => {
      callback();
    });

    // Set signedUp in the localStorage
    if (localStorage){
      const walletAddress = this.props.account.toLowerCase();
      let lastLogin = localStorage.getItem('lastLogin') ? JSON.parse(localStorage.getItem('lastLogin')) : null;
      if (lastLogin && lastLogin[walletAddress] && !lastLogin[walletAddress].signedUp){
        lastLogin[walletAddress].signedUp = true;
        this.functionsUtil.setLocalStorage('lastLogin',JSON.stringify(lastLogin));
      }
    }

    this.setState({
      sendingForm:true
    })
  };

  closeModal = async () => {

    const closeModal = () => {
      this.props.closeModal();
    };

    try{
      // Prevent sending email
      this.sendUserInfo(false);

      // Send Google Analytics event
      if (globalConfigs.analytics.google.events.enabled){
        this.functionsUtil.sendGoogleAnalyticsEvent({
          eventCategory: 'UI',
          eventAction: 'continue_without_email',
          eventLabel: 'WelcomeModal'
        },closeModal);

        // Call callback after 1 second if stuck
        setTimeout(closeModal,1000);
      } else {
        closeModal();
      }
    } catch (err) {
      closeModal();
    }
  }

  handleValidation(e) {
    if (e && e.target) {
      this.setState({ email: e.target.value });
      e.target.parentNode.classList.add("was-validated");
    }
  }

  render() {
    return (
      <Modal isOpen={this.props.isOpen}>
        {
          this.state.subscribed ? (
            <ModalCard
              closeFunc={this.closeModal}
            >
              <ModalCard.Header title={'All done'} icon={`images/done.svg`}></ModalCard.Header>
              <ModalCard.Body>
                <Flex width={1} flexDirection={'column'} mb={3}>
                  <Text color={'dark-gray'} textAlign={'center'} fontSize={3} my={0}>
                    Thanks for subscribing!
                  </Text>
                  <Button
                    my={3}
                    width={'100%'}
                    borderRadius={4}
                    onClick={this.closeModal}
                  >
                    CLOSE
                  </Button>
                </Flex>
              </ModalCard.Body>
            </ModalCard>
          ) : (
            <ModalCard closeFunc={this.closeModal}>
              <ModalCard.Header title={'Stay up-to-date!'} icon={`images/notification.svg`}>
              </ModalCard.Header>
              <ModalCard.Body>
                <Form onSubmit={this.handleSubmit}>
                  <Flex width={1} flexDirection={'column'} mb={3}>
                    <Text color={'mid-gray'} textAlign={'left'} fontSize={3} my={0}>
                      Add your e-mail to receive updates about:
                    </Text>
                  </Flex>
                  <Flex width={1} flexDirection={'column'} mt={2}>
                    <Flex my={2} flexDirection={'row'} alignItems={'center'}>
                      <Icon
                        name={'CheckCircle'}
                        color={colors.green}
                        size={'32'}
                      />
                      <Text color={'dark-gray'} textAlign={'left'} fontSize={3} fontWeight={2} my={0} ml={2}>
                        Performance reports
                      </Text>
                    </Flex>
                    <Flex my={2} flexDirection={'row'}>
                      <Icon
                        name={'CheckCircle'}
                        color={colors.green}
                        size={'32'}
                      />
                      <Text color={'dark-gray'} textAlign={'left'} fontSize={3} fontWeight={2} my={0} ml={2}>
                        New Protocols & Tokens
                      </Text>
                    </Flex>
                    <Flex my={2} flexDirection={'row'}>
                      <Icon
                        name={'CheckCircle'}
                        color={colors.green}
                        size={'32'}
                      />
                      <Text color={'dark-gray'} textAlign={'left'} fontSize={3} fontWeight={2} my={0} ml={2}>
                        Latest updates
                      </Text>
                    </Flex>
                    <Form.Field width={1} label={''}>
                      <Form.Input
                        type="email"
                        name="EMAIL"
                        width={1}
                        outline={'none'}
                        border={0}
                        px={3}
                        py={4}
                        fontSize={3}
                        textAlign={['center','left']}
                        placeholder={'Enter your e-mail'}
                        onChange={this.handleValidation}
                        required
                      />
                    </Form.Field>
                    <Flex mb={3} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
                      <ButtonLoader
                        buttonText={'SUBMIT'}
                        isLoading={this.state.sendingForm}
                        buttonProps={{className:header_styles.gradientButton,width:'100%',type:'submit'}}
                      >
                      </ButtonLoader>
                      <Link mt={2} onClick={this.closeModal} hoverColor={'blue'}>continue without e-mail</Link>
                    </Flex>
                  </Flex>
                </Form>
              </ModalCard.Body>
            </ModalCard>
          )
        }
      </Modal>
    );
  }
}

export default WelcomeModal;
