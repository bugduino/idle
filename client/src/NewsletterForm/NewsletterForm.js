import React, { Component } from "react";
import { Flex, Box, Button, Form, Text, Checkbox, Link } from 'rimble-ui';
import axios from 'axios';
import styles from './NewsletterForm.module.scss';

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

    axios.post(`https://dev.lapisgroup.it/idle/newsletter.php`, {
      'email': this.state.email
    }).then(r => {
      this.setState({message:'You have successfully subscribed to the newsletter', messageColor:'green' });
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

    const label = (
      <>I've read and accepted the <Link color={'blue'} hoverColor={'blue'} target={'_blank'} href={"https://www.iubenda.com/privacy-policy/61211749"}>Privacy Policy</Link></>
    );

    return (
        <Box mt={[2,3]} maxWidth={'100%'}>
          <Form onSubmit={this.handleSubmit}>
            <Flex flexDirection={['column','row']} alignItems={['center','flex-start']} justifyContent={'center'}>
              <Box width={[1,8/10]}>
                <Form.Field width={1}>
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
                    placeholder={'yourbestmail@whatever.com'}
                    boxShadow={'none !important'}
                    borderBottom={'1px solid #a6a6a6'}
                    onChange={this.handleValidation}
                  />
                </Form.Field>
                <Flex mb={[3,0]} flexDirection={'row'} alignItems={'center'}>
                  <Checkbox onClick={ e => this.toggleCheckbox(e) } label={label} required />
                </Flex>
                {this.state.message && this.state.message.length &&
                  <Text.p py={0} mt={[2,3]} mb={3} textAlign={['center','left']} color={this.state.messageColor}>{this.state.message}</Text.p>
                }
              </Box>
              <Box width={[1,2/10]} my={[0,'26px']}>
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
