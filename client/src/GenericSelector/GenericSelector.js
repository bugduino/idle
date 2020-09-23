import theme from "../theme";
import Select from 'react-select';
import React, { Component } from 'react';
import { Flex, Text, Input } from "rimble-ui";
import styles from './GenericSelector.module.scss';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';

class GenericSelector extends Component {

  state = {};

  // Utils
  functionsUtil = null;

  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  async componentWillMount(){
    this.loadUtils();
    await this.loadComponents();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    const selectedTokenChanged = prevProps.selectedToken !== this.props.selectedToken;
    const optionsChanged = JSON.stringify(prevProps.options) !== JSON.stringify(this.props.options);
    const defaultValueChanged = JSON.stringify(prevProps.defaultValue) !== JSON.stringify(this.props.defaultValue);
    const componentsChanged = prevProps.CustomOptionValue !== this.props.CustomOptionValue || prevProps.CustomValueContainer !== this.props.CustomValueContainer;

    if (optionsChanged || selectedTokenChanged || defaultValueChanged || componentsChanged){
      this.loadComponents();
    }
  }

  async loadComponents(){
    
    const ControlComponent = props => {
      const cardProps = Object.assign(
        props.innerProps,
        {
          p:2,
          width:1,
          style:{cursor:'pointer'}
        },
        (this.props.innerProps ? this.props.innerProps : {})
      );

      if (props.menuIsOpen){
        cardProps.boxShadow = 4;
      }
      return (
        <DashboardCard
          isInteractive={true}
          cardProps={cardProps}
        >
          <Flex
            width={1}
            flexDirection={'row'}
          >
            {props.children}
          </Flex>
        </DashboardCard>
      );
    };

    const CustomIndicatorSeparator = props => null;

    const CustomMenu = props => {
      const cardProps = Object.assign(props.innerProps,{
        mt:2,
        zIndex:1,
        boxShadow:null,
        position:'absolute'
      });
      return (
        <DashboardCard
          cardProps={cardProps}
        >
          {props.children}
        </DashboardCard>
      );
    }

    const CustomValueContainer = this.props.CustomValueContainer ? this.props.CustomValueContainer : props => {
      return (
        <Flex
          {...props.innerProps}
        >
          <Flex
            width={1}
            alignItems={'center'}
            flexDirection={'row'}
          >
            <Text
              fontWeight={3}
            >
              {props.selectProps.value.label}
            </Text>
          </Flex>
        </Flex>
      );
    }

    const CustomOptionValue = this.props.CustomOptionValue ? this.props.CustomOptionValue : (props) => {
      return (
        <Flex
          width={1}
          alignItems={'center'}
          flexDirection={'row'}
        >
          <Text>
            {props.label}
          </Text>
        </Flex>
      );
    };

    const CustomInputContainer = this.props.CustomInputContainer ? this.props.CustomInputContainer : (props) => {

      if (!props.selectProps.isSearchable){
        return null;
      }

      return (
        <Input
          {...props}
          fontSize={theme.fontSizes[2]}
          color={theme.colors.copyColor}
          fontWeight={theme.fontWeights[3]}
          fontFamily={theme.fonts.sansSerif}
          className={[styles.searchInput,!props.selectProps.menuIsOpen ? styles.searchInputHidden : null]}
        />
      );
    };

    const CustomOption = (props) => {

      const options = props.selectProps.options;
      let selectedValue = props.selectProps && props.selectProps.value && props.selectProps.value.value;

      // Check if the selectedValue is included in options
      if (selectedValue && options.map( o => o.value ).indexOf(selectedValue) === -1 && this.props.defaultValue){
        selectedValue = this.props.defaultValue.value;
      }

      // Don't show selected value
      if (selectedValue && selectedValue === props.value){
        return null;
      }

      return (
        <Flex
          px={3}
          py={2}
          width={1}
          {...props.innerProps}
          alignItems={'center'}
          flexDirection={'row'}
          style={{cursor:'pointer'}}
          justifyContent={'flex-start'}
          className={styles.genericSelector}
          backgroundColor={ props.isFocused ? '#fbfbfb' : '#ffffff' }
        >
          <CustomOptionValue
            {...props}
          />
        </Flex>
      );
    }

    await this.setState({
      CustomMenu,
      CustomOption,
      ControlComponent,
      CustomValueContainer,
      CustomInputContainer,
      CustomIndicatorSeparator
    });
  }

  render() {
    const isSearchable = typeof this.props.isSearchable !== 'undefined' ? this.props.isSearchable : false;
    return (
      <Select
        name={this.props.name}
        isSearchable={isSearchable}
        options={this.props.options}
        defaultValue={this.props.defaultValue}
        onChange={ v => this.props.onChange(v.value) }
        components={{
            Menu: this.state.CustomMenu,
            Option: this.state.CustomOption,
            Control: this.state.ControlComponent,
            Input: this.state.CustomInputContainer,
            SingleValue: this.state.CustomValueContainer,
            IndicatorSeparator: this.state.CustomIndicatorSeparator
        }}
      />
    );
  }
}

export default GenericSelector;
