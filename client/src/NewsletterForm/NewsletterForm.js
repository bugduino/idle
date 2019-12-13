import React, { Component } from "react";
import { Box, Button, Form, Text } from 'rimble-ui';
import axios from 'axios';
// import styles from './NewsletterForm.module.scss';

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

    axios.post(`https://dev.lapisgroup.it/idle/newsletter.php`, {
      'email': this.state.email
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
        <Box width={1}>
          <Form onSubmit={this.handleSubmit}>
            <Form.Field label={ this.props.label ? this.props.label : 'Email' } width={1}>
              <Form.Input
                placeholder={this.props.placeholder}
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
              { this.props.buttonLabel ? this.props.buttonLabel : 'GET UPDATES' }
            </Button>
          </Form>
        </Box>
    );
  }
}
export default NewsletterForm;
