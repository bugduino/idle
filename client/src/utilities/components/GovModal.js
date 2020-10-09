import React from "react";
import ModalCard from './ModalCard';
import { Text, Modal, Flex, Image } from "rimble-ui";
import RoundButton from '../../RoundButton/RoundButton';
// import Confetti from 'react-confetti/dist/react-confetti';
import FunctionsUtil from '../../utilities/FunctionsUtil';

class GovModal extends React.Component {

  state = {
    total:null,
    balance:null,
    unclaimed:null
  }

  // Utils
  functionsUtil = null;
  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  loadTokenInfo = async () => {
    const [
      unclaimed,
      balance
    ] = await Promise.all([
        this.functionsUtil.getIdleTokensUnclaimed(this.props.account),
        this.functionsUtil.getTokenBalance('IDLE',this.props.account),
    ]);

    const total = this.functionsUtil.BNify(balance).plus(unclaimed);

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

  componentDidUpdate() {
    this.loadUtils();
  }

  claim = async () => {

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
                {this.state.total ? this.state.total.toFixed(4) : '-'}
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
                mb={3}
                pb={3}
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
              </Flex>
              <Flex
                mb={3}
                width={1}
                alignItems={'center'}
                justifyContent={'center'}
              >
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
              </Flex>
            </Flex>
          </ModalCard.Body>
        </ModalCard>
      </Modal>
    );
  }
}

export default GovModal;