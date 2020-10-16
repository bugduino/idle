import Title from '../Title/Title';
import { Box, Flex } from "rimble-ui";
import React, { Component } from 'react';
import Breadcrumb from '../Breadcrumb/Breadcrumb';
import GovernanceUtil from '../utilities/GovernanceUtil';
import ProposalsList from './ProposalsList/ProposalsList';
import ProposalDetails from './ProposalDetails/ProposalDetails';

class Proposals extends Component {
  state = {
    proposals:null,
    selectedProposal:null
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
    const proposals = await this.governanceUtil.getProposals();

    const { match: { params } } = this.props;
      
    // Look if proposalId exists
    let selectedProposal = null;
    if (params.item_id && parseInt(params.item_id)){
      const proposalId = parseInt(params.item_id);
      const foundProposal = proposals.find( p => parseInt(p.id) === proposalId );
      // Set selected proposal
      if (foundProposal){
        selectedProposal = foundProposal;
      }
    }

    this.setState({
      proposals,
      selectedProposal
    });
  }

  render() {
    return (
      <Box
        width={1}
      >
        {
          this.state.selectedProposal ? (
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
                    text={'Proposals'}
                    isMobile={this.props.isMobile}
                    path={[this.state.selectedProposal.title]}
                    handleClick={ e => this.props.goToSection('proposals') }
                  />
                </Flex>
              </Flex>
              <ProposalDetails
                {...this.props}
                proposal={this.state.selectedProposal}
              />
            </Box>
          ) : (
            <Box
              width={1}
            >
              <Title
                mb={[3,4]}
              >
                Governance Proposals
              </Title>
              <Flex
                mb={[3,4]}
                width={1}
                id={'transactions'}
                flexDirection={'column'}
              >
                <ProposalsList
                  {...this.props}
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
          )
        }
      </Box>
    );
  }
}

export default Proposals;
