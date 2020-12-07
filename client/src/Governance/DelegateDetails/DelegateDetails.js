import Title from '../../Title/Title';
import React, { Component } from 'react';
import ExtLink from '../../ExtLink/ExtLink';
import StatsCard from '../../StatsCard/StatsCard';
import { Box, Flex, Blockie, Icon } from "rimble-ui";
import ProposalsList from '../ProposalsList/ProposalsList';
import GovernanceUtil from '../../utilities/GovernanceUtil';
import ShortHash from "../../utilities/components/ShortHash";

class DelegateDetails extends Component {

  state = {
    proposals:null
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
    this.loadProposals();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
    const delegateChanged = JSON.stringify(prevProps.delegate) !== JSON.stringify(this.props.delegate);
    if (delegateChanged){
      this.loadProposals();
    }
  }

  async loadProposals(){
    const delegate = this.props.delegate;
    const proposals = await this.governanceUtil.getProposals(delegate.delegate);

    this.setState({
      proposals
    });
  }

  render() {

    const delegate = this.props.delegate;

    // rank
    // votes
    // delegate
    // proposals
    // vote_weight

    return (
      <Box
        width={1}
      >
        <Title
          mb={[3,4]}
        >
          Delegate Details
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
              label={null}
              title={'Rank'}
              value={delegate.rank}
              labelTooltip={ null }
              minHeight={['100px','143px']}
              titleMinHeight={['auto','50px']}
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
              minHeight={['100px','143px']}
              labelTooltip={ null }
              title={'Address'}
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
                    seed: delegate.delegate,
                  }}
                />
                <ExtLink
                  href={this.functionsUtil.getEtherscanAddressUrl(delegate.delegate)}
                >
                  <Flex
                    flexDirection={'row'}
                    alignItems={'flex-end'}
                    justifyContent={'flex-start'}
                  >
                    <ShortHash
                      ml={2}
                      lineHeight={1}
                      fontSize={[3,4]}
                      fontWeight={[3,4]}
                      color={'statValue'}
                      hash={delegate.delegate}
                    />
                    <Icon
                      ml={1}
                      size={'1.2em'}
                      name={'OpenInNew'}
                      color={'statValue'}
                    />
                  </Flex>
                </ExtLink>
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
              label={null}
              title={'Votes'}
              labelTooltip={null}
              minHeight={['100px','143px']}
              titleMinHeight={['auto','50px']}
              value={this.functionsUtil.formatMoney(this.functionsUtil.BNify(delegate.votes).toFixed(2,1),2)}
            />
          </Flex>
          <Flex
            pl={[0,1]}
            mb={[2,0]}
            width={[1,1/4]}
            flexDirection={'column'}
          >
            <StatsCard
              label={null}
              labelTooltip={ null }
              title={'Proposals Voted'}
              value={delegate.proposals}
              minHeight={['100px','143px']}
              titleMinHeight={['auto','50px']}
            />
          </Flex>
        </Flex>
        <Box
          width={1}
          mt={[4,5]}
        >
          <Title
            mb={[2,3]}
          >
            Voting History
          </Title>
          <Flex
            mb={[3,4]}
            width={1}
            id={'transactions'}
            flexDirection={'column'}
          >
            <ProposalsList
              {...this.props}
              rowsPerPage={5}
              delegate={delegate}
              filtersEnabled={false}
              proposals={this.state.proposals}
              cols={[
                {
                  title: '#',
                  props:{
                    width:[0.08,0.05]
                  },
                  fields:[
                    {
                      name:'id',
                      props:{
                      }
                    },
                  ]
                },
                {
                  title:'DATE',
                  mobile:false,
                  props:{
                    width:0.12,
                  },
                  fields:[
                    {
                      name:'date'
                    }
                  ]
                },
                {
                  title:'TITLE',
                  props:{
                    width:[0.66,0.57],
                  },
                  fields:[
                    {
                      name:'title'
                    }
                  ]
                },
                {
                  title:'VOTE',
                  props:{
                    width:[0.14,0.14],
                    textAlign:'center'
                  },
                  fields:[
                    {
                      name:'support',
                      parentProps:{
                        alignItems:'center'
                      }
                    }
                  ]
                },
                {
                  title:'STATUS',
                  props:{
                    width:[0.12,0.12],
                    justifyContent:['center','flex-start']
                  },
                  parentProps:{
                    justifyContent:['center','flex-start']
                  },
                  fields:[
                    {
                      name:'statusIcon',
                      props:{
                        mr:[0,2]
                      }
                    },
                    {
                      mobile:false,
                      name:'status'
                    }
                  ]
                },
              ]}
            />
          </Flex>
        </Box>
      </Box>
    );
  }
}

export default DelegateDetails;