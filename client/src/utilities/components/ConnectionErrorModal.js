import React from "react";
import {
  Text,
  Modal,
  Flex,
  Button
} from "rimble-ui";
import ModalCard from './ModalCard';
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
    // Disconnect to Infura only if the wallet is not logged
    if (!this.props.account){
      await this.props.context.setFirstValidConnector(['Infura']);
      this.props.setConnector('Infura',null);
    }
    this.props.modals.methods.closeConnectionErrorModal();
  }

  render() {

    const walletProvider = this.functionsUtil.getWalletProvider();
    const isLedger = (walletProvider && walletProvider.toLowerCase() === 'ledger') || (typeof this.props.modals.data.connectionError === 'string' && this.props.modals.data.connectionError.toLowerCase().includes('ledger'));

    return (
      <Modal isOpen={this.props.isOpen}>
        <ModalCard closeFunc={ e => this.closeModal(e) }>
          <ModalCard.Header title={ isLedger ? 'Ledger Error' : `Connection Error` } icon={'images/warning.svg'}></ModalCard.Header>
          <ModalCard.Body>
            <Flex my={1} width={1} flexDirection={'column'} mx={'auto'}>
              <Text.p color={'dark-gray'} textAlign={'center'}>
                The following error occured while trying to connect with your { isLedger ? 'Ledger' : 'account' }:<br />
                <Text.span color={'red'} fontWeight={3}>"{this.props.modals.data.connectionError}"</Text.span><br />
                {
                  isLedger ? (
                    <Text.span>
                      Make sure that your Ledger is <strong>connected</strong> and <strong>unlocked</strong>. Also check that both <strong>Contract data</strong> and <strong>Browser support</strong> are enabled in the Ledger settings.<br />

                    </Text.span>
                  ) : 'Make sure that your wallet is unlocked and try again.'
                }
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