import React, { Component } from "react";
import { Box, Button, Form, Text } from 'rimble-ui';
import axios from 'axios';
// import styles from './NewsletterForm.module.scss';

// export default function ImageTextBox(props) {
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
      this.setState(state => ({...state, validated:true }));

      const mailchimpInstance   = 'us3';
      const listUniqueId        = '372b87dacf';
      const mailchimpApiKey     = 'a7d46c3c8ef3c315272fb58a8bdff1e9-us3';

      axios
          .post('https://' + mailchimpInstance + '.api.mailchimp.com/3.0/lists/' + listUniqueId + '/members/',{
            'email_address': this.state.email,
            'status': 'subscribed'
          },{
            headers:{
              'Content-Type':'application/json;charset=utf-8',
              'Authorization': 'apikey ' + mailchimpApiKey
            }
          }).then(r => {
            this.setState({...this.state, message:'You have successfully subscribed to the newsletter', messageColor:'green' });
          })
          .catch(err => {
            this.setState({...this.state, message:'Error while sending your subscription... Please try again', messageColor:'red' });
          });
    }

    handleValidation(e) {
      this.setState({...this.state, email:e.target.value });
      e.target.parentNode.classList.add("was-validated");
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
              Get Updates
            </Button>
          </Form>
        </Box>
    );
  }
}
export default NewsletterForm;
