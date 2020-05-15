import Select from 'react-select';
import { Flex, Text } from "rimble-ui";
import React, { Component } from 'react';
import AssetField from '../AssetField/AssetField';
import FunctionsUtil from '../utilities/FunctionsUtil';
import DashboardCard from '../DashboardCard/DashboardCard';

class GenericSelector extends Component {

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
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
  }

  render() {
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

    const CustomOption = (props) => {

      // Don't show selected value
      if (props.selectProps.value.value === props.value){
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
          backgroundColor={ props.isFocused ? '#fbfbfb' : '#ffffff' }
        >
          <CustomOptionValue
            {...props}
          />
        </Flex>
      );
    }

    return (
      <Select
        isSearchable={false}
        name={this.props.name}
        options={this.props.options}
        defaultValue={this.props.defaultValue}
        onChange={ v => this.props.onChange(v.value) }
        components={{
            Menu: CustomMenu,
            Option: CustomOption,
            Control: ControlComponent,
            SingleValue: CustomValueContainer,
            IndicatorSeparator: CustomIndicatorSeparator
        }}
      />
    );
  }
}

export default GenericSelector;
