import React from "react";
import {
  Text,
  Modal,
  Flex,
  Button
} from "rimble-ui";
import ModalCard from './ModalCard';
import globalConfigs from '../../configs/globalConfigs';
import FunctionsUtil from '../FunctionsUtil';

class ConnectionErrorModal extends React.Component {

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

  async closeModal(e){
    e.preventDefault();
    await this.props.context.setFirstValidConnector(['Infura']);
    this.props.modals.methods.closeConnectionErrorModal();
    this.props.setConnector('Infura',null);
  }

  render() {
    const walletProvider = localStorage && localStorage.getItem('walletProvider') ? localStorage.getItem('walletProvider') : null;
    const connectorInfo = walletProvider ? globalConfigs.connectors[walletProvider.toLowerCase()] : null;
    const walletIcon = connectorInfo ? (connectorInfo.icon ? connectorInfo.icon : `${walletProvider.toLowerCase()}.svg`) : null;
    return (
      <Modal isOpen={this.props.isOpen}>
        <ModalCard closeFunc={ e => this.closeModal(e) }>
          <ModalCard.Header title={`${walletProvider} connection error`} icon={`images/${walletIcon}`}></ModalCard.Header>
          <ModalCard.Body>
            <Flex my={1} width={1} flexDirection={'column'} mx={'auto'}>
              <Text.p color={'dark-gray'} textAlign={'center'}>
                The following error occured while trying to connect with your {walletProvider} account:<br />
                <Text.span color={'red'} fontWeight={3}>"{this.props.modals.data.connectionError}"</Text.span>
              </Text.p>
            </Flex>
            <Flex mb={3} flexDirection={'column'} alignItems={'center'} justifyContent={'center'}>
              <Button
                borderRadius={4}
                my={2}
                mx={[0, 2]}
                size={this.props.isMobile ? 'small' : 'medium'}
                onClick={ async (e) => { await this.closeModal(e); } }
              >
              GOT IT
              </Button>
            </Flex>
          </ModalCard.Body>
        </ModalCard>
      </Modal>
    );
  }
}

export default ConnectionErrorModal;