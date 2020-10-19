import Title from '../Title/Title';
import { Box, Flex } from "rimble-ui";
import React, { Component } from 'react';
import StatsCard from '../StatsCard/StatsCard';
import GovernanceUtil from '../utilities/GovernanceUtil';
import ProposalsList from './ProposalsList/ProposalsList';
import DelegatesList from './DelegatesList/DelegatesList';

class Overview extends Component {

  state = {
    delegates:[],
    proposals:[],
    votesDelegated:0,
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
  }

  async loadData(){
    const [
      delegates,
      proposals
    ] = await Promise.all([
      this.governanceUtil.getDelegates(),
      this.governanceUtil.getProposals()
    ]);

    const votesDelegated = delegates.reduce( (votesDelegated,d) => {
      votesDelegated = votesDelegated+parseFloat(d.votes);
      return votesDelegated;
    },0);

    this.setState({
      delegates,
      proposals,
      votesDelegated
    });
  }

  render() {
    return (
      <Box
        width={1}
      >
        <Box
          width={1}
        >
          <Title
            mb={[3,4]}
          >
            Governance Overview
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
                labelTooltip={null}
                title={'Votes Delegated'}
                minHeight={['130px','143px']}
                titleMinHeight={['auto','50px']}
                value={this.functionsUtil.formatMoney(this.state.votesDelegated.toFixed(2,1),2)}
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
                label={null}
                labelTooltip={null}
                title={'Voting Addresses'}
                minHeight={['130px','143px']}
                titleMinHeight={['auto','50px']}
                value={this.state.delegates.length}
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
                label={null}
                labelTooltip={null}
                title={'Proposals'}
                minHeight={['130px','143px']}
                titleMinHeight={['auto','50px']}
                value={this.state.proposals.length}
              />
            </Flex>
            <Flex
              pl={[0,1]}
              mb={[2,0]}
              width={[1,1/4]}
              flexDirection={'column'}
            >
              <StatsCard
                value={null}
                label={null}
                labelTooltip={null}
                title={'Votes Delegated'}
                minHeight={['130px','143px']}
                titleMinHeight={['auto','50px']}
              />
            </Flex>
          </Flex>
        </Box>
        <Box
          width={1}
        >
          <Title
            mb={[3,4]}
          >
            Recent Proposals
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
              filtersEnabled={false}
              proposals={this.state.proposals}
              cols={[
                {
                  title: '#',
                  props:{
                    width:[0.05,0.05]
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
                    width:[0.60,0.60],
                  },
                  fields:[
                    {
                      name:'title'
                    }
                  ]
                },
                {
                  title:'VOTES',
                  props:{
                    width:[0.11,0.11],
                  },
                  fields:[
                    {
                      name:'votes'
                    }
                  ]
                },
                {
                  title:'STATUS',
                  props:{
                    width:[0.12,0.12],
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
        <Box
          width={1}
        >
          <Title
            mb={[3,4]}
          >
            Leaderboard
          </Title>
          <Flex
            mb={[3,4]}
            width={1}
            id={'transactions'}
            flexDirection={'column'}
          >
            <DelegatesList
              {...this.props}
              rowsPerPage={5}
              delegates={this.state.delegates}
              cols={[
                {
                  title: 'RANK',
                  props:{
                    width:[0.08,0.08]
                  },
                  fields:[
                    {
                      name:'rank'
                    },
                  ]
                },
                {
                  title:'ADDRESS',
                  props:{
                    width:[0.50,0.50],
                  },
                  fields:[
                    {
                      name:'avatar',
                      props:{
                        mr:2
                      }
                    },
                    {
                      name:'delegate'
                    }
                  ]
                },
                {
                  title:'VOTES',
                  props:{
                    width:[0.12,0.12],
                  },
                  fields:[
                    {
                      name:'votes'
                    }
                  ]
                },
                {
                  title:'VOTE WEIGHT',
                  props:{
                    width:[0.15,0.15],
                  },
                  fields:[
                    {
                      name:'vote_weight',
                      parentProps:{
                        alignItems:'center'
                      }
                    }
                  ]
                },
                {
                  title:'PROPOSALS VOTED',
                  props:{
                    width:[0.15,0.15],
                  },
                  fields:[
                    {
                      name:'proposals',
                      parentProps:{
                        alignItems:'center'
                      }
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

export default Overview;
