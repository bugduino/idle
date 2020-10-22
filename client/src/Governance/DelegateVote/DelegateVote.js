import React, { Component } from 'react';
import RoundButton from '../../RoundButton/RoundButton';
import FunctionsUtil from '../../utilities/FunctionsUtil';
import { Flex, Text, Input, Button, Box } from "rimble-ui";
import DashboardCard from '../../DashboardCard/DashboardCard';
import TxProgressBar from '../../TxProgressBar/TxProgressBar';

class DelegateVote extends Component {

  state = {
    newDelegate:''
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

  async componentWillMount(){
    this.loadUtils();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
  }

  checkNewDelegate = () => {
    return this.functionsUtil.checkAddress(this.state.newDelegate) && this.state.newDelegate.toLowerCase() !== this.props.currentDelegate.toLowerCase();
  }

  changeDelegate = (e) => {
    const newDelegate = e.target.value;
    this.setState({
      newDelegate
    });
  }

  render() {
    return (
      <Flex
        width={1}
        alignItems={'center'}
        flexDirection={'column'}
        justifyContent={'center'}
      >
        {
        // Has balance
        this.props.balance && this.props.balance.gt(0) ? (
          <DashboardCard
            cardProps={{
              mb:2,
              py:[2,3],
              px:[3,4],
              width:'auto',
              position:'relative'
            }}
            isInteractive={false}
          >
            {
              this.props.canClose &&
                <Box
                  top={'0'}
                  zIndex={1}
                  right={'0'}
                  position={'absolute'}
                >
                  <Button.Text
                    icononly
                    icon={'Close'}
                    size={'2.5em'}
                    mainColor={'statValue'}
                    onClick={this.props.closeFunc}
                  />
                </Box>
            }
            <Flex
              width={1}
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={'center'}
            >
              <Text
                mb={2}
                fontWeight={4}
                fontSize={[2,3]}
                color={'dark-gray'}
                textAlign={'center'}
              >
                You have {this.functionsUtil.fixTokenDecimals(this.props.balance,18).toFixed(4)} {this.functionsUtil.getGlobalConfig(['governance','props','tokenName'])} available.
              </Text>
              <Text
                mb={1}
                fontWeight={3}
                color={'statValue'}
                textAlign={'center'}
              >
                Current Delegate:
              </Text>
              <Text
                mb={2}
                fontWeight={3}
                color={'dark-gray'}
                textAlign={'center'}
              >
                {parseInt(this.props.currentDelegate) === 0 ? 'Undelegated' : this.props.currentDelegate}
              </Text>
              {
                this.props.processing && this.props.processing.loading ? (
                  <Flex
                    width={1}
                    flexDirection={'column'}
                  >
                    <TxProgressBar
                      web3={this.props.web3}
                      waitText={`Delegate estimated in`}
                      hash={this.props.processing.txHash}
                      endMessage={`Finalizing delegate request...`}
                      cancelTransaction={this.props.cancelTransaction}
                    />
                  </Flex>
                ) : (
                  <Flex
                    width={1}
                    alignItems={'center'}
                    flexDirection={'column'}
                    justifyContent={'center'}
                  >
                    <Text
                      mb={1}
                      fontWeight={3}
                      color={'statValue'}
                      textAlign={'center'}
                    >
                      Set New Delegate:
                    </Text>
                    <Input
                      min={0}
                      type={'text'}
                      width={'32em'}
                      required={true}
                      height={'3.4em'}
                      borderRadius={2}
                      fontWeight={500}
                      maxWidth={'100%'}
                      textAlign={'center'}
                      boxShadow={'none !important'}
                      value={this.state.newDelegate}
                      placeholder={`Insert delegate address`}
                      onChange={this.changeDelegate.bind(this)}
                      border={`1px solid ${this.props.theme.colors.divider}`}
                    />
                    <RoundButton
                      buttonProps={{
                        mt:2,
                        width:[1,'10em'],
                        disabled:!this.checkNewDelegate()
                      }}
                      handleClick={ e => this.props.setDelegate(this.state.newDelegate) }
                    >
                      Delegate
                    </RoundButton>
                  </Flex>
                )
              }
            </Flex>
          </DashboardCard>
        ) : (
          <Text
            fontWeight={4}
            fontSize={[2,3]}
            color={'dark-gray'}
            textAlign={'center'}
          >
            You don't have any {this.functionsUtil.getGlobalConfig(['governance','props','tokenName'])} token delegated.
          </Text>
        )
       } 
      </Flex>
    );
  }
}

export default DelegateVote;