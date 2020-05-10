import theme from '../theme';
import React, { Component } from 'react';
import styles from './TransactionListFilters.module.scss';
import DashboardCard from '../DashboardCard/DashboardCard';
import TableCellHeader from '../TableCellHeader/TableCellHeader';
import { Flex, Heading, Text, Icon, Radio, Button, Link } from "rimble-ui";

class TransactionListFilters extends Component {

  state = {
    maxWidth:0.4,
    minWidth:0.18,
    maxHeight:425,
    isOpened:false,
    activeFilters:{
      status:null,
      assets:null,
      actions:null
    }
  }

  setFilter = (filter,value) => {
    this.setState((prevState) => ({
      activeFilters:{
        ...prevState.activeFilters,
        [filter]:value
      }
    }));
  }

  applyFilters = (toggle=true) => {
    if (typeof this.props.applyFilters === 'function'){
      this.props.applyFilters(this.state.activeFilters);
    }
    if (toggle){
      this.toggleOpened();
    }
  }

  resetFilter = (filter) => {
    this.setState((prevState) => ({
      activeFilters:{
        ...prevState.activeFilters,
        [filter]:null
      }
    }),() => {
      this.applyFilters(false);
    });
  }

  resetFilters = (toggle=true) => {
    this.setState({
      activeFilters:{
        status:null,
        assets:null,
        actions:null
      }
    },() => {
      if (typeof this.props.resetFilters === 'function'){
        this.props.resetFilters();
      }
      if (toggle){
        this.toggleOpened();
      }
    })
  }

  toggleOpened = () => {
    this.setState((prevState) => ({
      isOpened: !prevState.isOpened
    }));
  }

  render() {
    return (
      <Flex
        mb={3}
        top={0}
        width={1}
        zIndex={1}
        flexDirection={'column'}
        alignItems={'flex-start'}
        justifyContent={'center'}
        position={['relative','absolute']}
      >
        <DashboardCard
          cardProps={{
            py:2,
            px:3,
            width:[1, this.state.isOpened ? this.state.maxWidth : this.state.minWidth ],
            style:{
              transition:'width 0.3s ease-in-out'
            }
          }}
          isInteractive={ !this.state.isOpened }
        >
          <Flex
            width={1}
            style={{
              cursor:'pointer'
            }}
            alignItems={'center'}
            flexDirection={'row'}
            onClick={this.toggleOpened}
            justifyContent={'space-between'}
          >
            <Text
              fontSize={2}
              fontWeight={500}
              color={'copyColor'}
            >
              Filters
            </Text>
            <Icon
              size={'1.5em'}
              color={'copyColor'}
              name={ this.state.isOpened ? 'Close' : 'Tune' }
            />
          </Flex>
          <Flex
            flexDirection={'column'}
            style={{
              overflow:'hidden',
              transition:'max-height 0.3s ease-in-out',
              maxHeight:this.state.isOpened ? this.state.maxHeight : 0
            }}
          >
            <Flex
              mt={2}
              py={2}
              width={1}
              flexDirection={'row'}
              borderTop={`1px solid ${theme.colors.divider}`}
            >
              {
                Object.keys(this.props.filters).map((filterCategory) => {
                  const filterValues = this.props.filters[filterCategory];
                  return (
                    <Flex
                      flexDirection={'column'}
                      key={`filter_${filterCategory}`}
                      style={{
                        flexBasis:'0',
                        flex:'1 1 0px'
                      }}
                    >
                      <TableCellHeader
                        pb={2}
                        fontWeight={3}
                        fontSize={[1,2]}
                        color={'cellText'}
                      >
                        {filterCategory.toUpperCase()}
                      </TableCellHeader>
                      {
                        Object.keys(filterValues).map((filterValue) => {
                          const filterLabel = filterValues[filterValue];
                          const isChecked = this.state.activeFilters[filterCategory]===filterValue;
                          return (
                            <Radio
                              my={2}
                              label={filterLabel}
                              checked={isChecked}
                              className={styles.radioBtn}
                              key={`filter_${filterCategory}_${filterValue}`}
                              onChange={ e => this.setFilter(filterCategory,filterValue) }
                            />
                          );
                        })
                      }
                    </Flex>
                  );
                })
              }
            </Flex>
            <Flex
              flexDirection={'row'}
            >
              <Button.Text
                fontWeight={4}
                fontSize={[2,3]}
                mainColor={'copyColor'}
                onClick={this.applyFilters}
              >
                Apply filters
              </Button.Text>
              <Button.Text
                ml={3}
                fontWeight={4}
                fontSize={[2,3]}
                mainColor={'copyColor'}
                onClick={this.resetFilters}
              >
                Reset
              </Button.Text>
            </Flex>
          </Flex>
        </DashboardCard>
        {
          !this.state.isOpened && this.props.activeFilters && Object.values(this.props.activeFilters).filter( v => (v !== null) ).length>0 &&
            <Flex
              mt={3}
              width={1}
              flexDirection={['column','row']}
              alignItems={['flex-start','flex-end']}
              justifyContent={['flex-end','flex-start']}
            >
              {
                Object.keys(this.props.activeFilters).map((filterName) => {
                  const filterValue = this.props.activeFilters[filterName];
                  if (filterValue !== null){
                    const filterLabel = this.props.filters[filterName][filterValue];
                    return (
                      <DashboardCard
                        cardProps={{
                          mr:3,
                          py:2,
                          px:3,
                          width:[1,this.state.minWidth]
                        }}
                        isInteractive={true}
                        key={`filter_${filterName}`}
                      >
                        <Flex
                          width={1}
                          style={{
                            cursor:'pointer'
                          }}
                          alignItems={'center'}
                          flexDirection={'row'}
                          justifyContent={'space-between'}
                          onClick={e => this.resetFilter(filterName)}
                        >
                          <Text
                            fontSize={2}
                            fontWeight={500}
                            color={'cellText'}
                            style={{
                              textTransform:'capitalize'
                            }}
                          >
                            {filterLabel}
                          </Text>
                          <Icon
                            size={'1.5em'}
                            name={'Close'}
                            color={'cellText'}
                          />
                        </Flex>
                      </DashboardCard>
                    );
                  }
                  return null;
                })
              }
              <Link
                fontSize={2}
                fontWeight={2}
                color={'dark-gray'}
                hoverColor={'copyColor'}
                onClick={ e => this.resetFilters(false) }
              >
                Clear all filters
              </Link>
            </Flex>
        }
      </Flex>
    );
  }
}

export default TransactionListFilters;