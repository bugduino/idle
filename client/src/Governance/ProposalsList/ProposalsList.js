import React, { Component } from 'react';
import TableRow from '../../TableRow/TableRow';
import FlexLoader from '../../FlexLoader/FlexLoader';
import TableHeader from '../../TableHeader/TableHeader';
import FunctionsUtil from '../../utilities/FunctionsUtil';
import ProposalField from '../ProposalField/ProposalField';
import { Flex, Heading, Text, Link, Icon } from "rimble-ui";
import ProposalListFilters from '../ProposalListFilters/ProposalListFilters';

class ProposalsList extends Component {

  state = {
    page:1,
    loading:true,
    rowsPerPage:10,
    totalRows:null,
    totalPages:null,
    activeFilters:{
      status:null,
    },
    filters:{
      status:{
        pending:'Pending',
        active:'Active',
        canceled:'Canceled',
        defeated:'Defeated',
        succeeded:'Succeeded',
        queued:'Queued',
        expired:'Expired',
        executed:'Executed'
      },
    },
    processedRows:null,
    lastBlockNumber:null
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

  prevPage(e){
    if (e){
      e.preventDefault();
    }
    const page = Math.max(1,this.state.page-1);
    this.setState({
      page
    });
  }

  nextPage(e){
    if (e){
      e.preventDefault();
    }
    const page = Math.min(this.state.totalPages,this.state.page+1);
    this.processList(page);
    this.setState({
      page
    });
  }

  async componentDidMount(){
    this.loadUtils();
    this.processList();
  }

  applyFilters = activeFilters => {
    this.setState({
      activeFilters
    },() => {
      this.processList();
    });
  }

  resetFilters = () => {
    this.setState({
      activeFilters:{
        status:null,
      }
    },() => {
      this.processList();
    });
  }

  async componentDidUpdate(prevProps, prevState) {
    this.loadUtils();
    const pageChanged = prevState.page !== this.state.page;
    const proposalsChanged = JSON.stringify(prevProps.proposals) !== JSON.stringify(this.props.proposals);
    if (pageChanged || proposalsChanged){
      this.processList();
    }
  }

  processList = (page=null) => {

    if (!this.props.proposals){
      return false;
    }

    page = page ? page : this.state.page;

    const rowsPerPage = this.props.rowsPerPage ? this.props.rowsPerPage : this.state.rowsPerPage;

    // Sort Proposals by timeStamp
    const proposals = Object.values(this.props.proposals)
                        .filter(p => (
                          (this.state.activeFilters.status === null || p.state.toLowerCase() === this.state.activeFilters.status.toLowerCase())
                        )) // Filter by activeFilters
                        .sort((a,b) => (a.timestamp > b.timestamp) ? -1 : 1 );

    // Calculate max number of pages
    const totalRows = proposals.length;
    const totalPages = Math.ceil(totalRows/rowsPerPage);

    const processedRows = [];

    proposals.forEach((p, i) => {
      if (i>=((page-1)*rowsPerPage) && i<((page-1)*rowsPerPage)+rowsPerPage) {
        processedRows.push(p);
      }
    });

    const loading = false;
  
    this.setState({
      loading,
      totalRows,
      totalPages,
      processedRows
    });
  }

  render() {

    const filtersEnabled = typeof this.props.filtersEnabled === 'undefined' || this.props.filtersEnabled;
    const hasActiveFilters = filtersEnabled && Object.values(this.state.activeFilters).filter( v => (v !== null) ).length>0;
    const processedRows = this.state.processedRows ? Object.values(this.state.processedRows) : null;
    const hasRows = processedRows && processedRows.length>0;

    return (
      <Flex flexDirection={'column'} width={1} m={'0 auto'}>
        {
          (this.state.loading || !this.state.processedRows === null) ? (
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
              text={'Loading Proposals...'}
            />
          ) : (
            <Flex
              width={1}
              position={'relative'}
              flexDirection={'column'}
              id={'proposals-list-container'}
              pt={[0, (!filtersEnabled || !hasRows ? 0 : hasActiveFilters ? '116px' : 5) ] }
            >
              {
                hasRows ? (
                  <Flex
                    width={1}
                    flexDirection={'column'}
                  >
                    {
                      filtersEnabled &&
                        <ProposalListFilters
                          {...this.props}
                          filters={this.state.filters}
                          activeFilters={this.state.activeFilters}
                          resetFilters={this.resetFilters.bind(this)}
                          applyFilters={this.applyFilters.bind(this)}
                        />
                    }
                    <TableHeader
                      cols={this.props.cols}
                      isMobile={this.props.isMobile}
                    />
                    <Flex
                      id={'proposals-list'}
                      flexDirection={'column'}
                    >
                      {
                        processedRows.map( (proposal,index) => {
                          const proposalId = proposal.id;
                          const handleClick = (e) => {
                            return (proposalId ? this.props.goToSection(`proposals/${proposalId}`) : null);
                          };
                          return (
                            <TableRow
                              {...this.props}
                              rowProps={{
                                isInteractive:true
                              }}
                              id={proposalId}
                              proposal={proposal}
                              handleClick={handleClick}
                              key={`proposal-${proposalId}`}
                              fieldComponent={ProposalField}
                              rowId={`proposal-col-${proposalId}`}
                              cardId={`proposal-card-${proposalId}`}
                            />
                          );
                        })
                      }
                    </Flex>
                    <Flex
                      height={'50px'}
                      alignItems={'center'}
                      flexDirection={'row'}
                      justifyContent={'flex-end'}
                      id={'proposals-list-pagination'}
                    >
                      <Flex mr={3}>
                        <Link mr={1} onClick={ e => this.prevPage(e) }>
                          <Icon
                            name={'KeyboardArrowLeft'}
                            size={'2em'}
                            color={ this.state.page>1 ? '#4f4f4f' : '#d8d8d8' }
                          />
                        </Link>
                        <Link onClick={ e => this.nextPage(e) }>
                          <Icon
                            name={'KeyboardArrowRight'}
                            size={'2em'}
                            color={ this.state.page<this.state.totalPages ? '#4f4f4f' : '#d8d8d8' }
                          />
                        </Link>
                      </Flex>
                      <Flex alignItems={'center'}>
                        <Text 
                          fontSize={1}
                          fontWeight={3}
                          color={'cellText'}
                        >
                          Page {this.state.page} of {this.state.totalPages}
                        </Text>
                      </Flex>
                    </Flex>
                  </Flex>
                ) : (
                  <Heading.h3
                    fontWeight={2}
                    fontSize={[2,3]}
                    color={'dark-gray'}
                    textAlign={'center'}
                    fontFamily={'sansSerif'}
                  >
                    There are no proposals
                  </Heading.h3>
                )
              }
            </Flex>
          )
        }
      </Flex>
    );
  }
}

export default ProposalsList;
