import React, { Component } from 'react';
import TableRow from '../../TableRow/TableRow';
import FlexLoader from '../../FlexLoader/FlexLoader';
import TableHeader from '../../TableHeader/TableHeader';
import FunctionsUtil from '../../utilities/FunctionsUtil';
import DelegateField from '../DelegateField/DelegateField';
import { Flex, Heading, Text, Link, Icon } from "rimble-ui";

class DelegatesList extends Component {

  state = {
    page:1,
    filters:{},
    loading:true,
    rowsPerPage:10,
    totalRows:null,
    totalPages:null,
    activeFilters:{},
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
    const delegatesChanged = JSON.stringify(prevProps.delegates) !== JSON.stringify(this.props.delegates);
    if (pageChanged || delegatesChanged){
      this.processList();
    }
  }

  processList = (page=null) => {

    if (!this.props.delegates){
      return false;
    }

    page = page ? page : this.state.page;

    const rowsPerPage = this.props.rowsPerPage ? this.props.rowsPerPage : this.state.rowsPerPage;

    // Sort Proposals by timeStamp
    let delegates = Object.values(this.props.delegates)
                        .sort((a,b) => (a.timestamp > b.timestamp) ? -1 : 1 );

    if (this.props.maxRows !== null && this.props.maxRows>0){
      delegates = delegates.splice(0,this.props.maxRows);
    }

    // Calculate max number of pages
    const totalRows = delegates.length;
    const totalPages = Math.ceil(totalRows/rowsPerPage);

    const processedRows = [];

    delegates.forEach((p, i) => {
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

    const processedRows = this.state.processedRows ? Object.values(this.state.processedRows) : null;

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
              text={'Loading Leaderboard...'}
            />
          ) : (
            <Flex
              width={1}
              position={'relative'}
              flexDirection={'column'}
              id={'delegates-list-container'}
            >
              {
                processedRows && processedRows.length>0 ? (
                  <Flex
                    width={1}
                    flexDirection={'column'}
                  >
                    <TableHeader
                      cols={this.props.cols}
                      isMobile={this.props.isMobile}
                    />
                    <Flex
                      id={'delegates-list'}
                      flexDirection={'column'}
                    >
                      {
                        processedRows.map( (delegate,index) => {
                          const delegateId = delegate.delegate;
                          const handleClick = (e) => {
                            return (delegateId ? this.props.goToSection(`leaderboard/${delegateId}`) : null);
                          };
                          return (
                            <TableRow
                              {...this.props}
                              rowProps={{
                                isInteractive:true
                              }}
                              id={delegateId}
                              delegate={delegate}
                              key={`delegate-${index}`}
                              handleClick={handleClick}
                              fieldComponent={DelegateField}
                              rowId={`delegate-col-${index}`}
                              cardId={`delegate-card-${index}`}
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
                      id={'delegates-list-pagination'}
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
                    There are no delegates
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

export default DelegatesList;
