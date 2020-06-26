import React from "react";
import ModalCard from './ModalCard';
import { Text, Modal, Flex } from "rimble-ui";
import FunctionsUtil from '../../utilities/FunctionsUtil';

class TooltipModal extends React.Component {

  state = {};

  // Utils
  functionsUtil = null;
  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  constructor(props) {
    super(props);
    this.loadUtils();
  }

  componentDidUpdate = async () => {
    this.loadUtils();
  }

  closeModal = async () => {
    this.props.closeModal();
  }

  render() {

    return (
      <Modal
        isOpen={this.props.isOpen}
      >
        <ModalCard
          maxWidth={['960px','650px']}
          closeFunc={this.props.closeModal}
        >
          <ModalCard.Header
            title={this.props.title}
          >
          </ModalCard.Header>
          <ModalCard.Body>
            <Flex
              width={1}
              mb={'24px'}
              flexDirection={'column'}
            >
              <Text
                fontSize={2}
                textAlign={'left'}
                color={'dark-gray'}
                dangerouslySetInnerHTML={{ __html: this.props.content }}
              >
              </Text>
            </Flex>
          </ModalCard.Body>
        </ModalCard>
      </Modal>
    );
  }
}

export default TooltipModal;