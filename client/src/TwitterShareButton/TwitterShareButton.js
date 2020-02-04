import React, { Component } from 'react';
import {
  Button,
  Flex,
  Box,
  Text
} from "rimble-ui";
import styles from './TwitterShareButton.module.scss';
import FunctionsUtil from '../utilities/FunctionsUtil';

class TwitterShareButton extends Component {

  // Utils
  functionsUtil = null;
  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  componentWillMount() {
    this.loadUtils();
  }

  componentDidMount() {
    this.loadUtils();
  }

  componentDidUpdate() {
    this.loadUtils();
  }

  share = () => {
    // Send Google Analytics event
    this.functionsUtil.sendGoogleAnalyticsEvent({
      eventCategory: 'Share',
      eventAction: 'twitter',
      eventLabel: this.props.parent
    });

    const w = Math.min(window.innerWidth,600);
    const h = 350;
    const x = (window.innerWidth-w)/2;
    const y = 150;
    window.open(`https://twitter.com/intent/tweet?text=${this.props.tweet}`,"_blank",`toolbar=yes,scrollbars=no,resizable=no,top=${y},left=${x},width=${w},height=${h}`);
  }

  render() {
    return (
        <Button
          borderRadius={1}
          mainColor={'#2aa6f2'}
          contrastColor={'white'}
          onClick={ e => { this.share() } }
        >
          <Flex flexDirection={'row'} alignItems={'center'} justifyContent={'center'}>
            <Box className={styles.twitterIcon} />
            <Text color={'white'} fontWeight={3} ml={2}>{ this.props.text ? this.props.text : 'Tweet' }</Text>
          </Flex>
        </Button>
    );
  }
}

export default TwitterShareButton;
