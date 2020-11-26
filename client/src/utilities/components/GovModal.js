import React from "react";
import ModalCard from './ModalCard';
import RoundButton from '../../RoundButton/RoundButton';
import FunctionsUtil from '../../utilities/FunctionsUtil';
import TxProgressBar from '../../TxProgressBar/TxProgressBar';
import { Text, Modal, Flex, Image, Link, Icon } from "rimble-ui";

class GovModal extends React.Component {

  state = {
    total:null,
    balance:null,
    txStatus:null,
    unclaimed:null,
    processing: {
      txHash:null,
      loading:false
    }
  }

  // Utils
  functionsUtil = null;
  idleGovToken = null;

  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }

    this.idleGovToken = this.functionsUtil.getIdleGovToken();
  }

  loadTokenInfo = async () => {
    const [
      balance,
      unclaimed
    ] = await Promise.all([
      this.idleGovToken.getBalance(this.props.account),
      this.idleGovToken.getUnclaimedTokens(this.props.account)
    ]);

    let total = this.functionsUtil.BNify(0);
    if (balance && unclaimed){
      total = this.functionsUtil.BNify(balance).plus(unclaimed);
    }

    this.setState({
      total,
      balance,
      unclaimed
    });
  }

  componentWillMount() {
    this.loadUtils();
    this.loadTokenInfo();
  }

  componentDidMount() {
    this.loadUtils();
  }

  componentDidUpdate(prevProps,prevState){
    this.loadUtils();
    // const txStatusChanged = prevState.txStatus !== this.state.txStatus;
    // if (txStatusChanged && this.state.txStatus === 'success'){
    //   this.loadTokenInfo();
    // }
  }

  async cancelTransaction(){
    this.setState({
      txStatus:null,
      processing: {
        txHash:null,
        loading:false
      }
    });
  }

  claim = async () => {
    const callback = (tx,error) => {
      // Send Google Analytics event
      const eventData = {
        eventAction: 'claim',
        eventCategory: 'Governance',
        eventLabel: tx.status ? tx.status : error
      };

      if (error){
        eventData.eventLabel = this.functionsUtil.getTransactionError(error);
      }

      // Send Google Analytics event
      if (error || eventData.status !== 'error'){
        this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
      }

      const newState = {
        processing: {
          txHash:null,
          loading:false
        },
        txStatus:tx.status ? tx.status : 'error',
      };

      if (tx.status === 'success'){
        newState.balance = this.state.unclaimed;
        newState.unclaimed = this.BNify(0);

        if (typeof this.props.claimCallback === 'function'){
          this.props.claimCallback();
        }
      }

      this.setState(newState);
    };

    const callbackReceipt = (tx) => {
      const txHash = tx.transactionHash;
      this.setState((prevState) => ({
        processing: {
          ...prevState.processing,
          txHash
        }
      }));
    };

    this.idleGovToken.claimRewards(callback,callbackReceipt);

    this.setState((prevState) => ({
      processing: {
        ...prevState.processing,
        loading:true
      }
    }));
  }

  closeModal = async (action) => {
    this.props.closeModal();
  }

  render() {
    return (
      <Modal
        isOpen={this.props.isOpen}
      >
        <ModalCard
          bgLayer={true}
          mainColor={'white'}
          minWidth={['auto','420px']}
          closeFunc={this.props.closeModal}
          background={'radial-gradient(76.02% 75.41% at 1.84% 0%, rgb(162, 196, 246) 0%, rgb(10, 79, 176) 100%)'}
        >
          <ModalCard.Header
            pt={3}
            titleProps={{
              color:'white'
            }}
            title={'Your IDLE balance'}
            borderBottom={'1px solid rgba(255,255,255,0.2)'}
          >
          </ModalCard.Header>
          <ModalCard.Body
            px={3}
          >
            <Flex
              width={1}
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={'center'}
            >
              <Image
                mt={2}
                width={'3em'}
                height={'3em'}
                src={'images/tokens/IDLE.png'}
              />
              <Text
                mt={2}
                fontSize={7}
                color={'white'}
                fontWeight={500}
              >
                {this.state.total ? this.state.total.toFixed(2) : '-'}
              </Text>
              <Text
                mb={2}
                fontSize={3}
                color={'white'}
                fontWeight={400}
              >
                {
                  this.state.unclaimed && this.state.unclaimed.gt(0) ? 'You can now claim your IDLE tokens!' : 'You don\'t have any IDLE to claim'
                }
              </Text>
              <Flex
                pb={2}
                mb={3}
                width={1}
                flexDirection={'column'}
                borderBottom={'1px solid rgba(255,255,255,0.2)'}
              >
                <Flex
                  mb={2}
                  width={1}
                  flexDirection={'row'}
                  justifyContent={'space-between'}
                >
                  <Text
                    color={'white'}
                    fontWeight={500}
                  >
                    Balance:
                  </Text>
                  <Text
                    color={'white'}
                    fontWeight={500}
                  >
                    {this.state.balance ? this.state.balance.toFixed(4) : '-'}
                  </Text>
                </Flex>
                <Flex
                  width={1}
                  flexDirection={'row'}
                  justifyContent={'space-between'}
                >
                  <Text
                    color={'white'}
                    fontWeight={500}
                  >
                    Unclaimed:
                  </Text>
                  <Text
                    color={'white'}
                    fontWeight={500}
                  >
                    {this.state.unclaimed ? this.state.unclaimed.toFixed(4) : '-'}
                  </Text>
                </Flex>
                <Link
                  href={`/#${this.functionsUtil.getGlobalConfig(['governance','baseRoute'])}`}
                >
                  <Flex
                    zIndex={10}
                    position={'relative'}
                    alignItems={'center'}
                    flexDirection={'row'}
                    justifyContent={'center'}
                  >
                    <Text
                      fontSize={2}
                      color={'white'}
                      fontWeight={400}
                    >
                      Go to governance
                    </Text>
                    <Icon
                      ml={1}
                      size={'1em'}
                      color={'white'}
                      name={"OpenInNew"}
                    />
                  </Flex>
                </Link>
              </Flex>
              {
                this.state.unclaimed && this.state.unclaimed.gt(0) && 
                  <Flex
                    mb={3}
                    width={1}
                    zIndex={10}
                    position={'relative'}
                    alignItems={'center'}
                    justifyContent={'center'}
                  >
                    {
                      // Sending transaction
                      this.state.processing && this.state.processing.loading ? (
                        <TxProgressBar
                          textColor={'white'}
                          web3={this.props.web3}
                          cancelTextColor={'moon-gray'}
                          cancelTextHoverColor={'white'}
                          waitText={`Claim estimated in`}
                          hash={this.state.processing.txHash}
                          endMessage={`Finalizing Claim request...`}
                          cancelTransaction={this.cancelTransaction.bind(this)}
                        />
                      ) : (
                        <RoundButton
                          buttonProps={{
                            color:'blue',
                            width:[1,'45%'],
                            mainColor:'white',
                            contrastColor:'blue',
                            disabled:!this.state.unclaimed || this.state.unclaimed.lte(0)
                          }}
                          handleClick={this.claim.bind(this)}
                        >
                          Claim
                        </RoundButton>
                      )
                    }
                  </Flex>
              }
            </Flex>
          </ModalCard.Body>
        </ModalCard>
      </Modal>
    );
  }
}

export default GovModal;