import Title from '../Title/Title';
import { Box, Flex } from "rimble-ui";
import React, { Component } from 'react';
import StatsCard from '../StatsCard/StatsCard';
import FlexLoader from '../FlexLoader/FlexLoader';
import GovernanceUtil from '../utilities/GovernanceUtil';
import ProposalsList from './ProposalsList/ProposalsList';
import DelegatesList from './DelegatesList/DelegatesList';

class Overview extends Component {

  state = {
    delegates:[],
    proposals:[],
    totalSupply:0,
    dataLoaded:false,
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
      proposals,
      totalSupply
    ] = await Promise.all([
      this.governanceUtil.getDelegates(),
      this.governanceUtil.getProposals(),
      this.governanceUtil.getTotalSupply()
    ]);

    const votesDelegated = delegates.reduce( (votesDelegated,d) => {
      votesDelegated = votesDelegated+parseFloat(d.votes);
      return votesDelegated;
    },0);

    const dataLoaded = true;

    this.setState({
      delegates,
      proposals,
      dataLoaded,
      totalSupply,
      votesDelegated
    });
  }

  render() {
    return (
      <Box
        width={1}
      >
        <Title
          mb={[3,4]}
        >
          Governance Overview
        </Title>
        {
          !this.state.dataLoaded ? (
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
              text={'Loading Data...'}
            />
          ) : (
            <Box
              width={1}
            >
              <Flex
                width={1}
                mb={[3,4]}
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
                    label={null}
                    labelTooltip={null}
                    title={'IDLE Circulating'}
                    minHeight={['130px','143px']}
                    titleMinHeight={['auto','50px']}
                    value={this.functionsUtil.formatMoney(this.state.totalSupply,0)}
                  />
                </Flex>
              </Flex>
              <Box
                width={1}
                mt={[4,5]}
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
                          width:[0.1,0.05]
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
                          width:[0.15,0.12],
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
                          width:[0.75,0.60],
                        },
                        fields:[
                          {
                            name:'title'
                          }
                        ]
                      },
                      {
                        mobile:false,
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
                          width:[0.15,0.12],
                          alignItems:['center','flex-start'],
                          justifyContent:['center','flex-start']
                        },
                        parentProps:{
                          justifyContent:['center','flex-start']
                        },
                        fields:[
                          {
                            name:'statusIcon',
                            props:{
                              mr:[0,2],
                            },
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
                    maxRows={100}
                    {...this.props}
                    rowsPerPage={5}
                    delegates={this.state.delegates}
                    cols={[
                      {
                        title: 'RANK',
                        props:{
                          width:[0.13,0.08]
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
                          width:[0.60,0.50],
                        },
                        fields:[
                          {
                            mobile:false,
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
                          width:[0.27,0.12],
                        },
                        fields:[
                          {
                            name:'votes'
                          }
                        ]
                      },
                      {
                        mobile:false,
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
                        mobile:false,
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
          )
        }
      </Box>
    );
  }
}

export default Overview;
