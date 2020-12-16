import React, { Component } from 'react';
import { Flex, Text, Box, Link } from "rimble-ui";
import FlexLoader from '../../FlexLoader/FlexLoader';
import RoundButton from '../../RoundButton/RoundButton';
import DelegateVote from '../DelegateVote/DelegateVote';
import ProposalField from '../ProposalField/ProposalField';
import GovernanceUtil from '../../utilities/GovernanceUtil';
import DashboardCard from '../../DashboardCard/DashboardCard';
import TxProgressBar from '../../TxProgressBar/TxProgressBar';

class CastVote extends Component {

  state = {
    vote:null,
    loaded:false,
    userVote:null,
    processing:{
      txHash:null,
      loading:false
    },
    voteSucceed:false,
    showDelegateBox:false
  };

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
    this.loadData();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
    const accountChanged = prevProps.account !== this.props.account;
    if (accountChanged){
      this.loadData();
    }
  }

  async loadData(){
    if (this.props.account){
      const userVote = this.props.proposal.votes.find( v => (v.voter.toLowerCase() === this.props.account.toLowerCase()) );
      this.setState({
        userVote,
        loaded:true
      });
    }
  }

  async cancelTransaction(){
    this.setState({
      processing: {
        txHash:null,
        loading:false
      }
    });
  }

  toggleDelegateBox(showDelegateBox){
    this.setState({
      showDelegateBox
    });
  }

  castVote(){

    if (this.state.vote === null){
      return false;
    }

    const callback = (tx,error) => {
      // Send Google Analytics event
      const eventData = {
        eventCategory: 'Proposal',
        eventAction: 'CastVote',
        eventLabel: this.state.vote
      };

      if (error){
        eventData.eventLabel = this.functionsUtil.getTransactionError(error);
      }

      // Send Google Analytics event
      if (error || eventData.status !== 'error'){
        this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
      }

      let userVote = null;
      const txSucceeded = tx.status === 'success';
      if (txSucceeded){
        userVote = {
          voter:this.props.account,
          votes:this.props.votes.toString(),
          support:this.state.vote === 'for',
          proposalId:this.props.proposal.id,
        };

        if (typeof this.props.callback === 'function'){
          this.props.callback();
        }
      }


      this.setState({
        userVote,
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

    const vote = this.state.vote === 'for';
    const proposalId = parseInt(this.props.proposal.id);

    this.governanceUtil.castVote(proposalId,vote,callback,callbackReceipt);

    this.setState((prevState) => ({
      processing: {
        ...prevState.processing,
        loading:true
      }
    }));
  }

  setVote = (vote) => {
    this.setState({
      vote
    });
  }

  render() {
    return this.state.userVote ? (
        <Flex
          p={3}
          width={1}
          mb={[2,3]}
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
            You have voted for the proposal #{this.props.proposal.id}:
          </Text>
          <DashboardCard
            cardProps={{
              mb:2,
              py:[2,3],
              px:[3,4],
              width:'auto'
            }}
            isInteractive={false}
          >
            <Flex
              my={1}
              alignItems={'center'}
              flexDirection={'row'}
              justifyContent={'center'}
            >
              <ProposalField
                fieldInfo={{
                  name:'statusIcon',
                  state: this.state.userVote.support ? 'Executed' : 'Canceled',
                  props:{
                    mr:2
                  }
                }}
              />
              <Text
                fontWeight={3}
                fontSize={[2,3]}
              >
                {this.state.userVote.support ? 'For' : 'Against'}
              </Text>
            </Flex>
          </DashboardCard>
          <Text
            fontSize={1}
            fontWeight={500}
            color={'statValue'}
            textAlign={'center'}
          >
            voted with {this.functionsUtil.formatMoney(this.functionsUtil.fixTokenDecimals(this.state.userVote.votes,18).toFixed(0,1),0)} votes
          </Text>
        </Flex>
      ) : this.props.proposal.state === 'Active' && (
        <Box
          p={3}
          width={1}
          mb={[2,3]}
        >
          {
            // Data not loaded yet
            !this.state.loaded ? (
              <FlexLoader
                flexProps={{
                  flexDirection:'row',
                }}
                loaderProps={{
                  size:'30px'
                }}
                textProps={{
                  ml:2
                }}
                text={'Loading data...'}
              />
            ) :
            // No votes delegated
            (!this.props.votes || this.functionsUtil.BNify(this.props.votes).lte(0) || this.state.showDelegateBox) ? (
              <DelegateVote
                {...this.props}
                canClose={this.state.showDelegateBox}
                closeFunc={ e => this.toggleDelegateBox(false) }
              />
            ) : (
              <Flex
                width={1}
                alignItems={'center'}
                flexDirection={'column'}
                justifyContent={'center'}
              >
                <Text
                  mb={1}
                  fontWeight={4}
                  fontSize={[2,3]}
                  color={'dark-gray'}
                  textAlign={'center'}
                >
                  Cast your vote for the proposal #{this.props.proposal.id}:
                </Text>
                <Text
                  mb={2}
                  fontSize={1}
                  color={'red'}
                  fontWeight={500}
                  textAlign={'center'}
                >
                  Make sure you have been delegated before this proposal has been submitted
                </Text>
                {
                  this.state.processing && this.state.processing.loading ? (
                    <Flex
                      width={1}
                      flexDirection={'column'}
                    >
                      <TxProgressBar
                        web3={this.props.web3}
                        waitText={`Vote estimated in`}
                        hash={this.state.processing.txHash}
                        endMessage={`Finalizing vote request...`}
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
                      <Flex
                        mb={2}
                        width={[1,0.4]}
                        alignItems={'center'}
                        flexDirection={'row'}
                        justifyContent={'space-between'}
                      >
                        <DashboardCard
                          cardProps={{
                            p:[2,3],
                            width:0.48,
                            onMouseDown:() => {
                              this.setVote('for');
                            }
                          }}
                          isInteractive={true}
                          isActive={ this.state.vote === 'for' }
                        >
                          <Flex
                            my={1}
                            alignItems={'center'}
                            flexDirection={'row'}
                            justifyContent={'center'}
                          >
                            <ProposalField
                              fieldInfo={{
                                name:'statusIcon',
                                state:'Executed',
                                props:{
                                  mr:2
                                }
                              }}
                            />
                            <Text
                              fontWeight={3}
                              fontSize={[2,3]}
                            >
                              For
                            </Text>
                          </Flex>
                        </DashboardCard>
                        <DashboardCard
                          cardProps={{
                            p:[2,3],
                            width:0.48,
                            onMouseDown:() => {
                              this.setVote('against');
                            }
                          }}
                          isInteractive={true}
                          isActive={ this.state.vote === 'against' }
                        >
                          <Flex
                            my={1}
                            alignItems={'center'}
                            flexDirection={'row'}
                            justifyContent={'center'}
                          >
                            <ProposalField
                              fieldInfo={{
                                name:'statusIcon',
                                state:'Canceled',
                                props:{
                                  mr:2
                                }
                              }}
                            />
                            <Text
                              fontWeight={3}
                              fontSize={[2,3]}
                            >
                              Against
                            </Text>
                          </Flex>
                        </DashboardCard>
                      </Flex>
                      <Text
                        mb={0}
                        fontSize={1}
                        fontWeight={500}
                        color={'statValue'}
                        textAlign={'center'}
                      >
                        You have {this.functionsUtil.formatMoney(this.functionsUtil.fixTokenDecimals(this.props.votes,18).toFixed(0,1),0)} votes delegated
                      </Text>
                      {
                        this.props.balance && this.functionsUtil.BNify(this.props.balance).gt(0) &&
                          <Link
                            mt={0}
                            mainColor={'primary'}
                            hoverColor={'primary'}
                            onClick={ e => this.toggleDelegateBox(true) }
                          >
                            change delegate
                          </Link>
                      }
                      <RoundButton
                        buttonProps={{
                          mt:2,
                          width:[1,0.2],
                          disabled:this.state.vote === null
                        }}
                        handleClick={this.castVote.bind(this)}
                      >
                        Vote
                      </RoundButton>
                    </Flex>
                  )
                }
              </Flex>
            )
          }
        </Box>
      );
  }
}

export default CastVote;