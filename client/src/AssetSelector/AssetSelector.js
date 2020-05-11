import { Flex } from "rimble-ui";
import React, { Component } from 'react';
import AssetField from '../AssetField/AssetField';
import FunctionsUtil from '../utilities/FunctionsUtil';
import GenericSelector from '../GenericSelector/GenericSelector';

class AssetSelector extends Component {

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

    const options = Object.keys(this.props.availableTokens).map(token => ({value:token,label:token}));
    const defaultValue = options.find(v => (v.value === this.props.selectedToken.toUpperCase()));

    const CustomOptionValue = props => {
      return (
        <Flex
          width={1}
          alignItems={'center'}
          flexDirection={'row'}
        >
          <AssetField token={props.value} fieldInfo={{
              name:'icon',
              props:{
                mr:2,
                height:'2em'
              }
            }}
          />
          <AssetField
            token={props.value}
            fieldInfo={{
              name:'tokenName',
              props:{
                fontSize:[1,2],
                fontWeight:500,
                color:'copyColor'
              }
            }}
          />
        </Flex>
      );
    }

    return (
      <GenericSelector
        name={"assets"}
        options={options}
        defaultValue={defaultValue}
        onChange={this.props.changeToken}
        innerProps={this.props.innerProps}
        CustomOptionValue={CustomOptionValue}
      />
    );
  }
}

export default AssetSelector;
