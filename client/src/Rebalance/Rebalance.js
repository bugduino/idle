import { Flex, Text } from "rimble-ui";
import React, { Component } from 'react';
import FlexLoader from '../FlexLoader/FlexLoader';
import RoundButton from '../RoundButton/RoundButton';
import FunctionsUtil from '../utilities/FunctionsUtil';
import TxProgressBar from '../TxProgressBar/TxProgressBar';

class Rebalance extends Component {

  state = {
    loading:true,
    processing:{
      rebalance:{
        txHash:null,
        loading:false
      },
    },
    shouldRebalance:null
  };

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
    this.checkRebalance();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    const accountChanged = prevProps.account !== this.props.account;
    const tokenChanged = prevProps.selectedToken !== this.props.selectedToken;
    if (tokenChanged || accountChanged){
      this.checkRebalance();
    }
  }

  checkRebalance = async () => {
    this.setState({
      loading:true,
    });

    const shouldRebalance = await this.functionsUtil.checkRebalance(this.props.tokenConfig);

    this.setState({
      loading:false,
      shouldRebalance
    });
  }

  rebalance = async (e) => {
    e.preventDefault();

    const callback = (tx,error) => {

      // Send Google Analytics event
      const eventData = {
        eventCategory: 'Rebalance',
        eventAction: this.props.selectedToken,
        eventLabel: tx.status,
      };

      let txDenied = false;

      if (error){
        eventData.eventLabel = this.functionsUtil.getTransactionError(error);
      }

      // Send Google Analytics event
      if (error || eventData.status !== 'error'){
        this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
      }

      if (tx.status === 'success'){
        // Toast message
        window.toastProvider.addMessage(`Rebalance completed`, {
          secondaryMessage: `Now the pool is balanced!`,
          colorTheme: 'light',
          actionHref: "",
          actionText: "",
          variant: "success",
        });

      } else if (!txDenied){
        window.toastProvider.addMessage(`Rebalance error`, {
          secondaryMessage: `The rebalance has failed, try again...`,
          colorTheme: 'light',
          actionHref: "",
          actionText: "",
          variant: "failure",
        });
      }

      this.setState((prevState) => ({
        processing: {
          ...prevState.processing,
          rebalance:{
            txHash:null,
            loading:false
          }
        }
      }));

      this.checkRebalance();
    }

    const callback_receipt = (tx) => {
      const txHash = tx.transactionHash;
      this.setState((prevState) => ({
          processing: {
            ...prevState.processing,
            rebalance:{
              ...prevState.processing.rebalance,
              txHash
            }
          }
        })
      );
    };

    this.props.contractMethodSendWrapper(this.props.tokenConfig.idle.token, 'rebalance', [], null , callback, callback_receipt);

    this.setState({
      processing:{
        rebalance:{
          txHash:null,
          loading:true
        }
      }
    });
  }

  render() {
    return (
      <Flex
        px={3}
        width={1}
        minHeight={'100px'}
        alignItems={'center'}
        flexDirection={'column'}
        justifyContent={'center'}
      >
      {
        this.state.loading ? (
          <FlexLoader
            flexProps={{
              flexDirection:'row'
            }}
            loaderProps={{
              size:'30px'
            }}
            textProps={{
              ml:2
            }}
            text={'Checking rebalance...'}
          />
        ) : (
          this.state.processing.rebalance.loading ? (
            <TxProgressBar web3={this.props.web3} waitText={`Rebalance estimated in`} endMessage={`Finalizing rebalance request...`} hash={this.state.processing.rebalance.txHash} />
          ) : (
            <Flex
              width={1}
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={'center'}
            >
              <Text
                mt={0}
                mb={3}
                textAlign={'center'}
              >
                {this.state.shouldRebalance ? 'Rebalance the entire pool. All users will bless you.' : 'The pool is already balanced.'}
              </Text>
              <RoundButton
                buttonProps={{
                  width:'auto',
                  disabled:!this.state.shouldRebalance
                }}
                handleClick={e => this.rebalance(e)}
              >
                Rebalance
              </RoundButton>
            </Flex>
          )
        )
      }
      </Flex>
    )
  }
}

export default Rebalance;