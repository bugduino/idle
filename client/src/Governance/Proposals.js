import Title from '../Title/Title';
import { Box, Flex } from "rimble-ui";
import React, { Component } from 'react';
import Breadcrumb from '../Breadcrumb/Breadcrumb';
import NewProposal from './NewProposal/NewProposal';
import GovernanceUtil from '../utilities/GovernanceUtil';
import ProposalsList from './ProposalsList/ProposalsList';
import CardIconButton from '../CardIconButton/CardIconButton';
import ProposalDetails from './ProposalDetails/ProposalDetails';

class Proposals extends Component {
  state = {
    proposals:null,
    addProposal:false,
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

    const contractsInitialized = this.props.contractsInitialized && prevProps.contractsInitialized !== this.props.contractsInitialized;
    if (contractsInitialized){
      this.loadData();
    }
  }

  async loadData(){

    if (!this.props.contractsInitialized){
      return false;
    }

    const proposals = await this.governanceUtil.getProposals();

    const { match: { params } } = this.props;
      
    // Look if proposalId exists
    let addProposal = false;
    let selectedProposal = null;
    if (params.item_id && parseInt(params.item_id)){
      const proposalId = parseInt(params.item_id);
      const foundProposal = proposals.find( p => parseInt(p.id) === proposalId );
      // Set selected proposal
      if (foundProposal){
        selectedProposal = foundProposal;
      }
    } else if (params.item_id && params.item_id.toLowerCase() === 'new'){
      addProposal = true;
    }

    this.setState({
      proposals,
      addProposal,
      selectedProposal
    });
  }

  render() {
    return (
      <Box
        width={1}
      >
        <Flex
          mb={3}
          width={1}
          alignItems={'center'}
          flexDirection={'row'}
          justifyContent={(this.state.selectedProposal || this.state.addProposal) ? 'space-between' : 'flex-end'}
        >
          {
            this.state.selectedProposal ? (
              <Flex
                alignItems={'center'}
                width={0.5}
              >
                <Breadcrumb
                  {...this.props}
                  text={'Governance'}
                  pathLink={['proposals']}
                  isMobile={this.props.isMobile}
                  handleClick={ e => this.props.goToSection('/') }
                  path={['Proposals',this.state.selectedProposal.title]}
                />
              </Flex>
            ) : this.state.addProposal ? (
              <Flex
                alignItems={'center'}
                width={0.5}
              >
                <Breadcrumb
                  {...this.props}
                  text={'Governance'}
                  pathLink={['proposals']}
                  isMobile={this.props.isMobile}
                  path={['Proposals','Add proposal']}
                  handleClick={ e => this.props.goToSection('/') }
                />
              </Flex>
            ) : (
              <Flex
                alignItems={'center'}
                width={0.5}
              >
                <Breadcrumb
                  {...this.props}
                  text={'Governance'}
                  path={['Proposals']}
                  isMobile={this.props.isMobile}
                  handleClick={ e => this.props.goToSection('/') }
                />
              </Flex>
            )
          }
          {
            !this.state.addProposal && 
              <Flex
                width={0.5}
                alignItems={'center'}
                justifyContent={'flex-end'}
              >
                <CardIconButton
                  icon={'Add'}
                  {...this.props}
                  text={'New Proposal'}
                  handleClick={ e => this.props.goToSection(`proposals/new`) }
                />
              </Flex>
          }
        </Flex>
        {
          this.state.selectedProposal ? (
            <Box
              width={1}
            >
              <ProposalDetails
                {...this.props}
                loadData={this.loadData.bind(this)}
                proposal={this.state.selectedProposal}
              />
            </Box>
          ) : this.state.addProposal ? (
            <Box
              width={1}
            >
              <NewProposal
                {...this.props}
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
                mb={3}
                width={1}
                id={'proposals'}
                flexDirection={'column'}
              >
                <ProposalsList
                  {...this.props}
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
          )
        }
      </Box>
    );
  }
}

export default Proposals;
