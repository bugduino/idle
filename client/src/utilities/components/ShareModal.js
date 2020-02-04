import React from "react";
import {
  Text,
  Modal,
  Link,
  Flex
} from "rimble-ui";
import ModalCard from './ModalCard';
import TwitterShareButton from '../../TwitterShareButton/TwitterShareButton.js';
import Confetti from 'react-confetti/dist/react-confetti';
import FunctionsUtil from '../../utilities/FunctionsUtil';

class ShareModal extends React.Component {

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

  closeModal = async (action) => {
    const globalConfigs = this.functionsUtil.getGlobalConfigs();
    // Send Google Analytics event
    if (globalConfigs.analytics.google.events.enabled){
      await this.functionsUtil.sendGoogleAnalyticsEvent({
        eventCategory: 'Share',
        eventAction: action,
        eventLabel: 'ShareModal'
      });
      this.props.closeModal();
    } else {
      this.props.closeModal();
    }
  }

  render() {
    const tweet = window.escape(this.props.tweet);
    const customText = {__html: this.props.text};
    return (
      <Modal isOpen={this.props.isOpen}>
        <ModalCard closeFunc={this.props.closeModal}>
          {
            this.props.confettiEnabled &&
            <Confetti
              style={{ position: 'fixed','zIndex':9999 }}
              run={true}
              recycle={true}
              width={window.innerWidth}
              height={window.innerHeight}
            />
          }
          <ModalCard.Header title={this.props.title} icon={this.props.icon}></ModalCard.Header>
          <ModalCard.Body>
            <Flex my={3} width={1} flexDirection={'column'} mx={'auto'}>
              <Text color={'dark-gray'} textAlign={'center'} fontSize={3} mb={2} dangerouslySetInnerHTML={customText}></Text>
            </Flex>
            <Flex mb={3} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
              <TwitterShareButton tweet={tweet} text={'Share now'} parent={'ShareModal'} />
              <Link mt={2} onClick={ e => this.closeModal('continue_without_sharing') } hoverColor={'blue'}>continue without sharing</Link>
            </Flex>
          </ModalCard.Body>
        </ModalCard>
      </Modal>
    );
  }
}

export default ShareModal;