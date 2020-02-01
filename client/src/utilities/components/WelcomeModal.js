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
import ModalCard from './ModalCard';
import colors from '../../colors';
import header_styles from './Header.module.scss';
import axios from 'axios';
import ButtonLoader from '../../ButtonLoader/ButtonLoader.js';
import globalConfigs from '../../configs/globalConfigs';

// export default function WelcomeModal(props) {

class WelcomeModal extends React.Component {

  state = {
    email:null,
    error:false,
    subscribed:false,
    sendingForm:false
  };

  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleValidation = this.handleValidation.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();

    const callback = () => {
      this.setState({
        sendingForm:false,
        subscribed:true
      });
      window.setTimeout(this.props.closeModal,2500);
    };

    // Send Google Analytics event
    if (window.ga){
      window.ga('send', 'event', 'UI', 'send_email', 'WelcomeModal');
    }

    axios.post(globalConfigs.newsletterSubscription.endpoint, {
      'email': this.state.email
    }).then(r => {
      callback();
    })
    .catch(err => {
      callback();
    });

    this.setState({
      sendingForm:true
    })
  };

  closeModal = async () => {
    if (window.ga){
      await (new Promise( async (resolve, reject) => {
        const eventData = {
           'eventCategory': 'UI', //required
           'eventAction': 'continue_without_email', //required
           'eventLabel': 'WelcomeModal',
           'hitCallback': () => {
              resolve(true);
            },
           'hitCallbackFail' : () => {
              reject();
           }
        };
        window.ga('send', 'event', eventData);
      }));

      this.props.closeModal();
    } else {
      this.props.closeModal();
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
            <ModalCard closeFunc={this.props.closeModal}>
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
                    onClick={this.props.closeModal}
                  >
                    CLOSE
                  </Button>
                </Flex>
              </ModalCard.Body>
            </ModalCard>
          ) : (
            <ModalCard closeFunc={this.props.closeModal}>
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
                        buttonProps={{className:header_styles.gradientButton,width:'100%',type:'submit'}}
                        buttonText={'SUBMIT'}
                        isLoading={this.state.sendingForm}
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
