import React, { Component } from 'react';
import ConnectBox from '../../ConnectBox/ConnectBox';
import FlexLoader from '../../FlexLoader/FlexLoader';
import RoundButton from '../../RoundButton/RoundButton';
import GovernanceUtil from '../../utilities/GovernanceUtil';
import DashboardCard from '../../DashboardCard/DashboardCard';
import TxProgressBar from '../../TxProgressBar/TxProgressBar';
import { Flex, Text, Input, Button, Box, EthAddress } from "rimble-ui";

class DelegateVote extends Component {

  state = {
    newDelegate:'',
    processing:{
      txHash:null,
      loading:false
    }
  }

  // Utils
  functionsUtil = null;
  governanceUtil = null;

  loadUtils(){
    if (this.governanceUtil){
      this.governanceUtil.setProps(this.props);
    } else {
      this.governanceUtil = new GovernanceUtil(this.props);
    }

    this.functionsUtil = this.governanceUtil.functionsUtil;
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

  async cancelTransaction(){
    this.setState({
      processing: {
        txHash:null,
        loading:false
      }
    });
  }

  setDelegate(address){
    const addressOk = this.functionsUtil.checkAddress(address);

    if (addressOk){

      const callback = (tx,error) => {
        // Send Google Analytics event
        const eventData = {
          eventCategory: 'Delegate',
          eventAction: address,
          eventLabel: tx.status
        };

        if (error){
          eventData.eventLabel = this.functionsUtil.getTransactionError(error);
        }

        // Send Google Analytics event
        if (error || eventData.status !== 'error'){
          this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
        }

        if (typeof this.props.loadUserData === 'function' && tx.status === 'success'){
          this.props.loadUserData();
        }

        this.setState({
          processing: {
            txHash:null,
            loading:false
          }
        });
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

      this.governanceUtil.setDelegate(address,callback,callbackReceipt);

      this.setState((prevState) => ({
        processing: {
          ...prevState.processing,
          loading:true
        }
      }));
    }
    return null;
  }

  changeDelegate = (e) => {
    const newDelegate = e.target.value;
    this.setState({
      newDelegate
    });
  }

  render() {
    const isUndelegated = parseInt(this.props.currentDelegate) === 0;
    return (
      <Flex
        width={1}
        alignItems={'center'}
        flexDirection={'column'}
        justifyContent={'center'}
      >
        {
        !this.props.account ? (
          <Flex
            width={[1,0.36]}
            alignItems={'stretch'}
            flexDirection={'column'}
            justifyContent={'center'}
          >
            <ConnectBox
              {...this.props}
            />
          </Flex>
        ) : this.props.currentDelegate ? (
          <DashboardCard
            cardProps={{
              mb:2,
              py:[2,3],
              px:[3,4],
              width:[1,0.5],
              position:'relative',
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
              {
                /*
                <Text
                  mb={2}
                  fontWeight={3}
                  fontSize={[2,3]}
                  color={'dark-gray'}
                  textAlign={'center'}
                >
                  You have {this.functionsUtil.fixTokenDecimals(this.props.balance,18).toFixed(4)} {this.functionsUtil.getGlobalConfig(['governance','props','tokenName'])} available.
                </Text>
                */
              }
              <Text
                mb={1}
                fontWeight={3}
                color={'statValue'}
                textAlign={'center'}
              >
                Current Delegate:
              </Text>
              <Flex
                mb={3}
                width={1}
                alignItems={'center'}
                justifyContent={isUndelegated ? 'center' : 'stretch'}
              >
                {
                  isUndelegated ? (
                    <Text
                      fontWeight={3}
                      fontSize={[1,2]}
                      color={'dark-gray'}
                      textAlign={'center'}
                    >
                      Undelegated
                    </Text>
                  ) : (
                    <EthAddress
                      width={1}
                      address={this.props.currentDelegate}
                    />
                  )
                }
              </Flex>
              {
                this.state.processing && this.state.processing.loading ? (
                  <Flex
                    width={1}
                    flexDirection={'column'}
                  >
                    <TxProgressBar
                      web3={this.props.web3}
                      waitText={`Delegate estimated in`}
                      hash={this.state.processing.txHash}
                      endMessage={`Finalizing delegate request...`}
                      cancelTransaction={this.cancelTransaction.bind(this)}
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
                      width={'100%'}
                      required={true}
                      height={'3.4em'}
                      borderRadius={2}
                      fontWeight={500}
                      textAlign={'center'}
                      boxShadow={'none !important'}
                      value={this.state.newDelegate}
                      placeholder={`Insert delegate address`}
                      onChange={this.changeDelegate.bind(this)}
                      border={`1px solid ${this.props.theme.colors.divider}`}
                    />
                    <Flex
                      mt={3}
                      width={1}
                      alignItems={'center'}
                      flexDirection={'row'}
                      justifyContent={'center'}
                    >
                      <RoundButton
                        buttonProps={{
                          mx:1,
                          fontSize:[1,2],
                          width:['auto','10em'],
                          disabled:!this.checkNewDelegate()
                        }}
                        handleClick={ e => this.setDelegate(this.state.newDelegate) }
                      >
                        Delegate
                      </RoundButton>
                      <RoundButton
                        buttonProps={{
                          mx:1,
                          fontSize:[1,2],
                          width:['auto','10em'],
                          mainColor:this.props.theme.colors.redeem,
                          disabled:this.props.currentDelegate.toLowerCase() === this.props.account.toLowerCase()
                        }}
                        handleClick={ e => this.setDelegate(this.props.account) }
                      >
                        Self-delegate
                      </RoundButton>
                    </Flex>
                  </Flex>
                )
              }
            </Flex>
          </DashboardCard>
        ) : (
          <FlexLoader
            flexProps={{
              minHeight:'50vh',
              flexDirection:'row'
            }}
            loaderProps={{
              size:'30px'
            }}
            textProps={{
              ml:2
            }}
            text={'Loading Delegate...'}
          />
        )
       } 
      </Flex>
    );
  }
}

export default DelegateVote;