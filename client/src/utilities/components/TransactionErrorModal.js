import React from "react";
import {
  Text,
  Link,
  Flex,
  Modal,
  Button
} from "rimble-ui";
import ModalCard from './ModalCard';
import FunctionsUtil from '../FunctionsUtil';

class TransactionErrorModal extends React.Component {

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
    this.props.modals.methods.closeTransactionErrorModal();
  }

  render() {

    const isLedgerError = typeof this.props.modals.data.transactionError === 'string' && this.props.modals.data.transactionError.toLowerCase().includes('ledger');
    const isSlowTxError = typeof this.props.modals.data.transactionError === 'string' && this.props.modals.data.transactionError.toLowerCase().includes('not mined within 50 blocks');

    return (
      <Modal isOpen={this.props.isOpen}>
        <ModalCard closeFunc={ e => this.closeModal(e) }>
          <ModalCard.Header title={ 'Transaction Error' } icon={'images/warning.svg'}></ModalCard.Header>
          <ModalCard.Body>
            <Flex my={1} width={1} flexDirection={'column'} mx={'auto'}>
              <Text.p color={'dark-gray'} textAlign={'center'}>
                The following error occured while trying to send a transaction:<br />
                <Text.span color={'red'} fontWeight={3}>"{this.props.modals.data.transactionError}"</Text.span><br />
                {
                  isLedgerError ? (
                    <Text.span
                      fontSize={1}
                    >
                      <br />Make sure that your Ledger is <strong>connected</strong> and <strong>unlocked</strong>. Also check that both <strong>Contract data</strong> and <strong>Browser support</strong> are enabled in the Ledger settings.<br />
                      We also suggest you to connect your Ledger with Metamask, read the <Link fontSize={1} color={'blue'} hoverColor={'blue'} target={'_blank'} rel={"nofollow noopener noreferrer"} href={'https://metamask.zendesk.com/hc/en-us/articles/360020394612-How-to-connect-a-Trezor-or-Ledger-Hardware-Wallet'}>instructions here</Link>.
                    </Text.span>
                  ) : isSlowTxError ? 'This could happen when the gas price is low, check the transaction status with your Wallet.' : 'Make sure that your have enough funds in your wallet.'
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

export default TransactionErrorModal;