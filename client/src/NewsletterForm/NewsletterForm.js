import React, { Component } from "react";
import { Flex, Box, Button, Form, Text, Checkbox, Link } from 'rimble-ui';
import axios from 'axios';
import styles from './NewsletterForm.module.scss';
import globalConfigs from '../configs/globalConfigs';

class NewsletterForm extends Component {
  state = {
    validated: false,
    privacy: false,
    email: null,
    message: ''
  };

  constructor(props) {
    super(props);
    this.state = { validated: false };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleValidation = this.handleValidation.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();

    if (!this.state.privacy){
      this.setState({message:'Please check the privacy policy box to proceed.', messageColor:'red' });
      return false;
    }

    this.setState({validated:true });

    axios.post(globalConfigs.newsletterSubscription.endpoint, {
      'email': this.state.email
    }).then(r => {
      if (r.data.status === 'success'){
        this.setState({message:'Thanks! Check your e-mail and confirm your subscription', messageColor:'green' });
      } else {
        this.setState({message:'Error while sending your subscription... Please try again', messageColor:'red' });
      }
    })
    .catch(err => {
      this.setState({message:'Error while sending your subscription... Please try again', messageColor:'red' });
    });
  }

  toggleCheckbox(e) {
    this.setState({ privacy: e.target.checked });
  }

  handleValidation(e) {
    if (e && e.target) {
      this.setState({ email: e.target.value });
      e.target.parentNode.classList.add("was-validated");
    }
  }

  render() {

    return (
        <Box mt={[2,3]} maxWidth={'45em'} width={1}>
          <Form onSubmit={this.handleSubmit}>
            <Flex flexDirection={['column','row']} alignItems={['center','flex-start']} justifyContent={'center'}>
              <Box width={[1,7/10]}>
                <Form.Field width={1} label={''}>
                  <Form.Input
                    type="email"
                    name="EMAIL"
                    required
                    width={1}
                    outline={'none'}
                    border={0}
                    fontSize={[2,5]}
                    borderRadius={0}
                    pl={0}
                    pb={3}
                    textAlign={['center','left']}
                    placeholder={'Enter your e-mail'}
                    boxShadow={'none !important'}
                    borderBottom={'1px solid #a6a6a6'}
                    onChange={this.handleValidation}
                  />
                </Form.Field>
                <Flex mb={[3,0]} flexDirection={'row'} alignItems={'center'}>
                  <Checkbox onClick={ e => this.toggleCheckbox(e) } label={'I\'ve read and accepted the'} required />
                  <Link color={'blue'} hoverColor={'blue'} target={'_blank'} rel="nofollow noopener noreferrer" href={"https://www.iubenda.com/privacy-policy/61211749"}>Privacy Policy</Link>
                </Flex>
                {this.state.message && this.state.message.length &&
                  <Text.p py={0} mt={[2,3]} mb={3} textAlign={['center','left']} color={this.state.messageColor}>{this.state.message}</Text.p>
                }
              </Box>
              <Box width={[1,3/10]} my={[0,'26px']}>
                <Button className={styles.gradientButton} type="submit" width={1}>
                  GET UPDATES
                </Button>
              </Box>
            </Flex>
          </Form>
        </Box>
    );
  }
}
export default NewsletterForm;
