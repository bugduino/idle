import React, { Component } from "react";
import { Box, Button, Form, Text } from 'rimble-ui';
import axios from 'axios';
// import styles from './NewsletterForm.module.scss';

const MAILCHIMP_KEY = process.env.REACT_APP_MAILCHIMP_KEY;
const MAILCHIMP_INSTANCE = process.env.REACT_APP_MAILCHIMP_INSTANCE;
const MAILCHIMP_LIST_ID = process.env.REACT_APP_MAILCHIMP_LIST_ID;

class NewsletterForm extends Component {
  state = {
    validated: false,
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
    this.setState({validated:true });

    axios.post(`https://${MAILCHIMP_INSTANCE}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/`, {
      'email_address': this.state.email,
      'status': 'subscribed'
    }, {
      headers:{
        'Content-Type':'application/json;charset=utf-8',
        'Authorization': `apikey ${MAILCHIMP_KEY}`
      }
    }).then(r => {
      this.setState({message:'You have successfully subscribed to the newsletter', messageColor:'green' });
    })
    .catch(err => {
      this.setState({message:'Error while sending your subscription... Please try again', messageColor:'red' });
    });
  }

  handleValidation(e) {
    if (e && e.target) {
      this.setState({ email: e.target.value });
      e.target.parentNode.classList.add("was-validated");
    }
  }

  render() {
    return (
        <Box>
          <Form onSubmit={this.handleSubmit}>
            <Form.Field label="Email" width={1}>
              <Form.Input
                type="email"
                name="EMAIL"
                required
                width={1}
                onChange={this.handleValidation}
              />
            </Form.Field>
            {this.state.message && this.state.message.length &&
              <Text.p py={0} mt={0} mb={3} textAlign={'center'} color={this.state.messageColor}>{this.state.message}</Text.p>
            }
            <Button type="submit" width={1}>
              GET UPDATES
            </Button>
          </Form>
        </Box>
    );
  }
}
export default NewsletterForm;
