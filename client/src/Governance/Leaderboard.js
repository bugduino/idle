import Title from '../Title/Title';
import { Box, Flex } from "rimble-ui";
import React, { Component } from 'react';
import Breadcrumb from '../Breadcrumb/Breadcrumb';
import GovernanceUtil from '../utilities/GovernanceUtil';
import DelegatesList from './DelegatesList/DelegatesList';
import DelegateDetails from './DelegateDetails/DelegateDetails';

class Leaderboard extends Component {
  state = {
    maxRows:100,
    delegates:null,
    selectedDelegate:null
  };

  // Utils
  governanceUtil = null;

  loadUtils(){
    if (this.governanceUtil){
      this.governanceUtil.setProps(this.props);
    } else {
      this.governanceUtil = new GovernanceUtil(this.props);
    }
  }

  async componentWillMount(){
    this.loadUtils();
    this.loadData();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
  }

  async loadData(){
    const delegates = await this.governanceUtil.getDelegates();

    const { match: { params } } = this.props;

    // Select delegate
    let selectedDelegate = null;
    if (params.item_id){
      const delegateId = params.item_id.toLowerCase();
      const foundProposal = delegates.find( d => d.delegate.toLowerCase() === delegateId );
      if (foundProposal){
        selectedDelegate = foundProposal;
      }
    }

    this.setState({
      delegates,
      selectedDelegate
    });
  }

  render() {

    return (
      <Box
        width={1}
      >
        {
          this.state.selectedDelegate ? (
            <Box
              width={1}
            >
              <Flex
                mb={3}
                width={1}
                alignItems={'center'}
                flexDirection={'row'}
                justifyContent={'flex-start'}
              >
                <Flex
                  width={1}
                >
                  <Breadcrumb
                    {...this.props}
                    text={'Governance'}
                    pathLink={['leaderboard']}
                    isMobile={this.props.isMobile}
                    handleClick={ e => this.props.goToSection('') }
                    path={['Leaderboard',this.state.selectedDelegate.delegate]}
                  />
                </Flex>
              </Flex>
              <DelegateDetails
                {...this.props}
                delegate={this.state.selectedDelegate}
              />
            </Box>
          ) : (
            <Box
              width={1}
            >
              <Flex
                mb={3}
                width={1}
                alignItems={'center'}
                flexDirection={'row'}
                justifyContent={'flex-start'}
              >
                <Breadcrumb
                  {...this.props}
                  text={'Governance'}
                  path={['Leaderboard']}
                  isMobile={this.props.isMobile}
                  handleClick={ e => this.props.goToSection('') }
                />
              </Flex>
              <Title
                mb={[3,4]}
              >
                Governance Leaderboard
              </Title>
              <Flex
                mb={3}
                width={1}
                id={'leaderboard'}
                flexDirection={'column'}
              >
                <DelegatesList
                  {...this.props}
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
          )
        }
      </Box>
    );
  }
}

export default Leaderboard;