import Title from '../../Title/Title';
import React, { Component } from 'react';
import CastVote from '../CastVote/CastVote';
import StatsCard from '../../StatsCard/StatsCard';
import { Box, Flex, Blockie, Text, Link } from "rimble-ui";
import ProposalField from '../ProposalField/ProposalField';
import GovernanceUtil from '../../utilities/GovernanceUtil';
import ShortHash from "../../utilities/components/ShortHash";
import DashboardCard from '../../DashboardCard/DashboardCard';

class ProposalDetails extends Component {

  state = {};

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

  render() {
    const proposal = this.props.proposal;
    const lastState = Object.values(proposal.states).pop();
    const forVotes = this.functionsUtil.BNify(proposal.forVotes).div(1e18);
    const againstVotes = this.functionsUtil.BNify(proposal.againstVotes).div(1e18);
    const totalVotes = forVotes.plus(againstVotes);
    const forVotesPerc = forVotes.div(totalVotes).times(100).toFixed(2);
    const againstVotesPerc = againstVotes.div(totalVotes).times(100).toFixed(2);
    const forVotesAddrs = proposal.votes.filter( v => (v.support) ).sort( (a,b) => (this.functionsUtil.BNify(a.votes).lt(this.functionsUtil.BNify(b.votes)) ? 1 : -1) );
    const againstVotesAddrs = proposal.votes.filter( v => (!v.support) ).sort( (a,b) => (this.functionsUtil.BNify(a.votes).lt(this.functionsUtil.BNify(b.votes)) ? 1 : -1) );

    return (
      <Box
        width={1}
      >
        <Title
          mb={[3,4]}
        >
          {proposal.title}
        </Title>
        <Flex
          mb={3}
          width={1}
          alignItems={'center'}
          justifyContent={'center'}
          flexDirection={['column','row']}
        >
          <Flex
            mb={[2,0]}
            pr={[0,1]}
            width={[1,1/4]}
            flexDirection={'column'}
          >
            <StatsCard
              value={proposal.id}
              title={'Proposal ID'}
              labelTooltip={ null }
              minHeight={['130px','143px']}
              titleMinHeight={['auto','50px']}
              label={`Created on ${this.functionsUtil.strToMoment(proposal.states[0].start_time*1000).format('DD MMM, YYYY')}`}
            />
          </Flex>
          <Flex
            mb={[2,0]}
            pl={[0,1]}
            pr={[0,1]}
            width={[1,1/4]}
            flexDirection={'column'}
          >
            <StatsCard
              titleMinHeight={['auto','50px']}
              minHeight={['130px','143px']}
              labelTooltip={ null }
              title={'Proposer'}
              label={null}
            >
              <Flex
                alignItems={'center'}
                flexDirection={'row'}
                justifyContent={'center'}
              >
                <Blockie
                  opts={{
                    size: 12,
                    color: "#dfe",
                    bgcolor: "#a71",
                    spotcolor: "#000",
                    seed: proposal.address,
                  }}
                />
                <ShortHash
                  ml={2}
                  lineHeight={1}
                  fontSize={[3,4]}
                  fontWeight={[3,4]}
                  color={'statValue'}
                  hash={proposal.proposer}
                />
              </Flex>
            </StatsCard>
          </Flex>
          <Flex
            mb={[2,0]}
            pl={[0,1]}
            pr={[0,1]}
            width={[1,1/4]}
            flexDirection={'column'}
          >
            <StatsCard
              title={'Status'}
              labelTooltip={ null }
              minHeight={['130px','143px']}
              titleMinHeight={['auto','50px']}
              label={`Updated on ${this.functionsUtil.strToMoment(lastState.start_time*1000).format('DD MMM, YYYY')}`}
            >
              <Flex
                alignItems={'center'}
                flexDirection={'row'}
                justifyContent={'center'}
              >
                <ProposalField
                  {...this.props}
                  proposal={proposal}
                  fieldInfo={{
                    name:'statusIcon',
                    props:{
                      size: this.props.isMobile ? '1.7em' : '2em'
                    }
                  }}
                />
                <Text
                  ml={2}
                  lineHeight={1}
                  fontSize={[4,5]}
                  fontWeight={[3,4]}
                  color={'statValue'}
                >
                  {proposal.state}
                </Text>
              </Flex>
            </StatsCard>
          </Flex>
          <Flex
            pl={[0,1]}
            mb={[2,0]}
            width={[1,1/4]}
            flexDirection={'column'}
          >
            <StatsCard
              label={null}
              title={'Total Votes'}
              labelTooltip={ null }
              minHeight={['130px','143px']}
              titleMinHeight={['auto','50px']}
              value={this.functionsUtil.formatMoney(totalVotes.toFixed(0,1),0)}
            />
          </Flex>
        </Flex>
        <CastVote
          {...this.props}
        />
        <Flex
          width={1}
          mb={[2,3]}
          id={'details-container'}
          justifyContent={'space-between'}
          flexDirection={['column','row']}
        >
          <DashboardCard
            cardProps={{
              p:3,
              mb:[2,0],
              mr:[0,1],
              width:[1,1/2]
            }}
            title={'Actions'}
            titleParentProps={{
              mt:0,
              ml:0
            }}
          >
            <Flex
              width={1}
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={'center'}
            >
              {
                proposal.actions.signatures.map( (action,actionIndex) => {
                  const targetAddr = proposal.actions.targets[actionIndex];
                  return (
                    <Flex
                      py={2}
                      width={1}
                      alignItems={'center'}
                      key={`action_${actionIndex}`}
                      borderBottom={`1px solid ${this.props.theme.colors['near-white']}`}
                    >
                      <Text
                        fontSize={1}
                        fontWeight={3}
                        color={'statValue'}
                      >
                        {parseInt(actionIndex)+1}
                      </Text>
                      <Link
                        ml={2}
                        fontSize={1}
                        fontWeight={2}
                        target={'_blank'}
                        textAlign={'left'}
                        color={'dark-gray'}
                        lineHeight={'initial'}
                        hoverColor={'primary'}
                        rel={'nofollow noopener noreferrer'}
                        href={this.functionsUtil.getEtherscanAddressUrl(targetAddr)}
                      >
                        {action}
                      </Link>
                    </Flex>
                  );
                })
              }
            </Flex>
          </DashboardCard>
          <DashboardCard
            cardProps={{
              p:3,
              ml:[0,1],
              width:[1,1/2]
            }}
          >
            <Flex
              mb={2}
              width={1}
              alignItems={'center'}
              flexDirection={'row'}
              justifyContent={'space-between'}
            >
              <Text
                fontWeight={4}
                fontSize={[2,3]}
                textAlign={'left'}
                color={'dark-gray'}
                lineHeight={'initial'}
              >
                Proposal History
              </Text>
              <Text
                fontWeight={4}
                fontSize={[2,3]}
                textAlign={'left'}
                color={'dark-gray'}
                lineHeight={'initial'}
              >
                Date
              </Text>
            </Flex>
            <Flex
              width={1}
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={'center'}
            >
              {
                proposal.states.map( (stateInfo,stateIndex) => {
                  return (
                    <Flex
                      py={2}
                      width={1}
                      alignItems={'center'}
                      key={`state_${stateIndex}`}
                      justifyContent={'space-between'}
                      borderBottom={`1px solid ${this.props.theme.colors['near-white']}`}
                    >
                      <Flex
                        alignItems={'center'}
                        flexDirection={'row'}
                      >
                        <ProposalField
                          {...this.props}
                          proposal={proposal}
                          fieldInfo={{
                            name:'statusIcon',
                            state:stateInfo.state,
                            props:{
                              size: this.props.isMobile ? '1.3em' : '1.5em'
                            }
                          }}
                        />
                        <Link
                          ml={2}
                          fontSize={1}
                          fontWeight={2}
                          target={'_blank'}
                          textAlign={'left'}
                          color={'dark-gray'}
                          lineHeight={'initial'}
                          hoverColor={'primary'}
                          rel={'nofollow noopener noreferrer'}
                          href={this.functionsUtil.getEtherscanTransactionUrl(stateInfo.trx_hash)}
                        >
                          {stateInfo.state}
                        </Link>
                      </Flex>
                      <Text
                        fontSize={1}
                        fontWeight={2}
                        textAlign={'left'}
                        color={'dark-gray'}
                        lineHeight={'initial'}
                      >
                        {this.functionsUtil.strToMoment(stateInfo.start_time*1000).format('DD MMM, YYYY')}
                      </Text>
                    </Flex>
                  );
                })
              }
            </Flex>
          </DashboardCard>
        </Flex>

        <DashboardCard
          cardProps={{
            p:3,
            mb:[2,3]
          }}
          title={'Details'}
          titleParentProps={{
            mt:0,
            ml:0
          }}
        >
          <Text
            mt={2}
            fontSize={[1,2]}
            style={{
              wordBreak:'break-word'
            }}
            dangerouslySetInnerHTML={{
              __html:proposal.description.replace(/\n/g,"<br />")
            }}
          >
          </Text>
        </DashboardCard>
        <DashboardCard
          cardProps={{
            p:3,
            mb:[2,3]
          }}
        >
          <Flex
            width={1}
            alignItems={'center'}
            flexDirection={'column'}
            justifyContent={'center'}
          >
            <Flex
              mb={2}
              width={1}
              alignItems={'center'}
              flexDirection={'row'}
              justifyContent={'space-between'}
            >
              <Text
                fontWeight={4}
                fontSize={[2,3]}
                textAlign={'left'}
                color={'dark-gray'}
                lineHeight={'initial'}
              >
                For ({forVotesPerc}%)
              </Text>
              <Text
                fontWeight={4}
                fontSize={[2,3]}
                textAlign={'left'}
                color={'dark-gray'}
                lineHeight={'initial'}
              >
                Against ({againstVotesPerc}%)
              </Text>
            </Flex>
            <Flex
              mb={2}
              width={1}
              height={'20px'}
              alignItems={'center'}
              flexDirection={'row'}
              id={'votes-cursor-container'}
            >
              <Flex
                width={1/2}
                height={'100%'}
                justifyContent={'flex-end'}
                borderRadius={'20px 0 0 20px'}
                style={{background:'rgba(0, 211, 149, 0.1)'}}
              >
                <Flex
                  height={'100%'}
                  width={`${forVotesPerc}%`}
                  borderRadius={'20px 0 0 20px'}
                  style={{background:'rgba(0, 211, 149, 1)'}}
                >
                </Flex>
              </Flex>
              <Flex
                width={1/2}
                height={'100%'}
                justifyContent={'flex-start'}
                borderRadius={'0 20px 20px 0'}
                style={{background:'rgba(211, 0, 0, 0.1)'}}
              >
                <Flex
                  height={'100%'}
                  width={`${againstVotesPerc}%`}
                  borderRadius={'0 20px 20px 0'}
                  style={{background:'rgba(211, 0, 0, 1)'}}
                >
                </Flex>
              </Flex>
            </Flex>
            <Flex
              width={1}
              height={'20px'}
              alignItems={'center'}
              flexDirection={'row'}
              id={'votes-number-container'}
            >
              <Flex
                width={1/2}
                height={'100%'}
                justifyContent={'flex-end'}
              >
                <Flex
                  height={'100%'}
                  width={`${forVotesPerc}%`}
                  justifyContent={'flex-start'}
                >
                  <Text
                    fontWeight={3}
                    fontSize={[1,2]}
                    textAlign={'left'}
                    color={'statValue'}
                    lineHeight={'initial'}
                  >
                    {this.functionsUtil.formatMoney(forVotes.toFixed(0,1),0)}
                  </Text>
                </Flex>
              </Flex>
              <Flex
                width={1/2}
                height={'100%'}
                justifyContent={'flex-start'}
              >
                <Flex
                  height={'100%'}
                  minWidth={'10%'}
                  width={`${againstVotesPerc}%`}
                  justifyContent={parseFloat(againstVotesPerc)<=10 ? 'flex-start' : 'flex-end'}
                >
                  <Text
                    fontWeight={3}
                    fontSize={[1,2]}
                    textAlign={'right'}
                    color={'statValue'}
                    lineHeight={'initial'}
                  >
                    {this.functionsUtil.formatMoney(againstVotes.toFixed(0,1),0)}
                  </Text>
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </DashboardCard>
        <Flex
          mb={4}
          width={1}
          id={'votes-addresses-container'}
          justifyContent={'space-between'}
          flexDirection={['column','row']}
        >
          <DashboardCard
            cardProps={{
              p:3,
              mb:[2,0],
              mr:[0,1],
              width:[1,1/2]
            }}
            id={'for-votes-addresses-container'}
          >
            <Flex
              width={1}
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={'center'}
            >
              <Flex
                mb={2}
                width={1}
                alignItems={'center'}
                flexDirection={'row'}
                justifyContent={'space-between'}
              >
                <Text
                  fontWeight={4}
                  fontSize={[2,3]}
                  textAlign={'left'}
                  color={'dark-gray'}
                  lineHeight={'initial'}
                >
                  For Addresses ({forVotesAddrs.length})
                </Text>
                <Text
                  fontWeight={4}
                  fontSize={[2,3]}
                  textAlign={'left'}
                  color={'dark-gray'}
                  lineHeight={'initial'}
                >
                  Votes
                </Text>
              </Flex>
              <Flex
                width={1}
                style={{
                  overflow:'scroll'
                }}
                maxHeight={'400px'}
                flexDirection={'column'}
              >
                {
                  forVotesAddrs.map( (voteInfo,voteIndex) => {
                    const votes = this.functionsUtil.formatMoney(this.functionsUtil.BNify(voteInfo.votes).div(1e18).toFixed(4,1),4);
                    return (
                      <Flex
                        py={2}
                        width={1}
                        alignItems={'center'}
                        flexDirection={'row'}
                        key={`vote_for_${voteIndex}`}
                        justifyContent={'space-between'}
                        borderBottom={`1px solid ${this.props.theme.colors['near-white']}`}
                      >
                        <Flex
                          alignItems={'center'}
                          flexDirection={'row'}
                          justifyContent={'flex-start'}
                        >
                          <Blockie
                            opts={{
                              size: 7,
                              color: "#dfe",
                              bgcolor: "#a71",
                              spotcolor: "#000",
                              seed: voteInfo.voter,
                            }}
                          />
                          <Link
                            ml={2}
                            fontSize={1}
                            fontWeight={2}
                            target={'_blank'}
                            textAlign={'left'}
                            color={'statValue'}
                            lineHeight={'initial'}
                            hoverColor={'primary'}
                            rel={'nofollow noopener noreferrer'}
                            href={this.functionsUtil.getEtherscanAddressUrl(voteInfo.voter)}
                          >
                            {
                              this.props.isMobile ? (
                                <ShortHash
                                  fontSize={1}
                                  fontWeight={2}
                                  textAlign={'left'}
                                  color={'statValue'}
                                  hash={voteInfo.voter}
                                  lineHeight={'initial'}
                                />
                              ) : voteInfo.voter
                            }
                          </Link>
                        </Flex>
                        <Text
                          fontSize={1}
                          fontWeight={2}
                          textAlign={'left'}
                          color={'statValue'}
                          lineHeight={'initial'}
                        >
                          {votes}
                        </Text>
                      </Flex>
                    )
                  })
                }
              </Flex>
            </Flex>
          </DashboardCard>
          <DashboardCard
            cardProps={{
              p:3,
              ml:[0,1],
              width:[1,1/2]
            }}
            id={'against-votes-addresses-container'}
          >
            <Flex
              mb={2}
              width={1}
              alignItems={'center'}
              flexDirection={'row'}
              justifyContent={'space-between'}
            >
              <Text
                fontWeight={4}
                fontSize={[2,3]}
                textAlign={'left'}
                color={'dark-gray'}
                lineHeight={'initial'}
              >
                Against Addresses ({againstVotesAddrs.length})
              </Text>
              <Text
                fontWeight={4}
                fontSize={[2,3]}
                textAlign={'left'}
                color={'dark-gray'}
                lineHeight={'initial'}
              >
                Votes
              </Text>
            </Flex>
            <Flex
              width={1}
              style={{
                overflow:'scroll'
              }}
              maxHeight={'400px'}
              flexDirection={'column'}
            >
              {
                againstVotesAddrs.map( (voteInfo,voteIndex) => {
                  const votes = this.functionsUtil.formatMoney(this.functionsUtil.BNify(voteInfo.votes).div(1e18).toFixed(4,1),4);
                  return (
                    <Flex
                      py={2}
                      width={1}
                      alignItems={'center'}
                      flexDirection={'row'}
                      justifyContent={'space-between'}
                      key={`vote_against_${voteIndex}`}
                      borderBottom={`1px solid ${this.props.theme.colors['near-white']}`}
                    >
                      <Flex
                        alignItems={'center'}
                        flexDirection={'row'}
                        justifyContent={'flex-start'}
                      >
                        <Blockie
                          opts={{
                            size: 7,
                            color: "#dfe",
                            bgcolor: "#a71",
                            spotcolor: "#000",
                            seed: voteInfo.voter,
                          }}
                        />
                        <Link
                          ml={2}
                          fontSize={1}
                          fontWeight={2}
                          target={'_blank'}
                          textAlign={'left'}
                          color={'statValue'}
                          lineHeight={'initial'}
                          hoverColor={'primary'}
                          rel={'nofollow noopener noreferrer'}
                          href={this.functionsUtil.getEtherscanAddressUrl(voteInfo.voter)}
                        >
                          {voteInfo.voter}
                        </Link>
                      </Flex>
                      <Text
                        fontSize={1}
                        fontWeight={2}
                        textAlign={'left'}
                        color={'statValue'}
                        lineHeight={'initial'}
                      >
                        {votes}
                      </Text>
                    </Flex>
                  )
                })
              }
            </Flex>
          </DashboardCard>
        </Flex>
      </Box>
    );
  }
}

export default ProposalDetails;