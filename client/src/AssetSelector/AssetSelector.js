import { Flex } from "rimble-ui";
import React, { Component } from 'react';
import AssetField from '../AssetField/AssetField';
import FunctionsUtil from '../utilities/FunctionsUtil';
import GenericSelector from '../GenericSelector/GenericSelector';

class AssetSelector extends Component {

  state = {
    options:null,
    defaultValue:null,
    CustomOptionValue:null,
    CustomValueContainer:null
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

  loadComponents(){
    const options = Object.keys(this.props.availableTokens).map(token => {
      const tokenConfig = this.props.availableTokens[token];
      return {
        value:token,
        label:token,
        tokenConfig
      };
    });

    const defaultValue = this.props.selectedToken ? options.find(v => (v.value.toUpperCase() === this.props.selectedToken.toUpperCase())) : null;

    const CustomOptionValue = props => {
      const token = props.value;
      const tokenConfig = props.data.tokenConfig;

      return (
        <Flex
          width={1}
          alignItems={'center'}
          flexDirection={'row'}
          justifyContent={'space-between'}
        >
          <Flex
            alignItems={'center'}
          >
            <AssetField
              token={token}
              tokenConfig={tokenConfig}
              fieldInfo={{
                name:'icon',
                props:{
                  mr:2,
                  width:'2em',
                  height:'2em'
                }
              }}
            />
            <AssetField
              token={token}
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
          {
            this.state.props.showCustomField ? (
              <Flex
                alignItems={'center'}
                justifyContent={'flex-end'}
              >
                <AssetField
                  token={token}
                  {...this.state.props}
                  fieldInfo={{
                    name:this.state.props.showCustomField,
                    props:{
                      fontSize:[1,2],
                      fontWeight:500,
                      color:'cellText'
                    }
                  }}
                  tokenConfig={tokenConfig}
                  account={this.state.props.account}
                  cachedData={this.props.cachedData}
                  setCachedData={this.props.setCachedData}
                />
              </Flex>
            ) : this.props.showBalance &&
              <Flex
                alignItems={'center'}
                justifyContent={'flex-end'}
              >
                <AssetField
                  token={token}
                  {...this.state.props}
                  fieldInfo={{
                    name:'tokenBalance',
                    props:{
                      fontSize:[1,2],
                      fontWeight:500,
                      color:'cellText'
                    }
                  }}
                  tokenConfig={tokenConfig}
                  account={this.state.props.account}
                  cachedData={this.props.cachedData}
                  setCachedData={this.props.setCachedData}
                />
              </Flex>
          }
        </Flex>
      );
    }

    const CustomValueContainer = props => {
      const options = props.selectProps.options;
      const selectProps = options.indexOf(props.selectProps.value) !== -1 ? props.selectProps.value : defaultValue;

      if (!selectProps){
        return null;
      }

      const token = selectProps.value;
      const tokenConfig = selectProps.tokenConfig;
      return (
        <Flex
          style={{
            flex:'1'
          }}
          justifyContent={'space-between'}
          {...props.innerProps}
        >
          <Flex
            p={0}
            width={1}
            {...props.innerProps}
            alignItems={'center'}
            flexDirection={'row'}
            style={{cursor:'pointer'}}
            justifyContent={'flex-start'}
          >
            <AssetField
              token={token}
              tokenConfig={tokenConfig}
              fieldInfo={{
                name:'icon',
                props:{
                  mr:2,
                  height:'2em'
                }
              }}
            />
            <AssetField
              token={token}
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

          {
            this.props.showBalance &&
              <Flex
                alignItems={'center'}
                justifyContent={'flex-end'}
              >
                <AssetField
                  token={token}
                  {...this.state.props}
                  fieldInfo={{
                    name:'tokenBalance',
                    props:{
                      fontSize:[1,2],
                      fontWeight:500,
                      color:'cellText'
                    }
                  }}
                  tokenConfig={tokenConfig}
                  account={this.state.props.account}
                  cachedData={this.props.cachedData}
                  setCachedData={this.props.setCachedData}
                />
              </Flex>
          }
        </Flex>
      );
    }

    this.setState({
      options,
      defaultValue,
      CustomOptionValue,
      CustomValueContainer
    });
  }

  async componentWillMount(){
    this.loadUtils();
    this.loadComponents();

    this.setState({
      props:this.props
    });
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    const selectedTokenChanged = prevProps.selectedToken !== this.props.selectedToken;
    const availableTokensChanged = JSON.stringify(Object.keys(prevProps.availableTokens)) !== JSON.stringify(Object.keys(this.props.availableTokens));
    if (availableTokensChanged || selectedTokenChanged){
      this.loadComponents();
    }
  }

  render() {
    if (!this.state.options || !this.state.defaultValue || !this.state.CustomOptionValue || !this.state.CustomValueContainer || !this.props.availableTokens || !Object.keys(this.props.availableTokens).length){
      return null;
    }

    return (
      <GenericSelector
        name={'assets'}
        options={this.state.options}
        innerProps={this.props.innerProps}
        isSearchable={this.props.isSearchable}
        defaultValue={this.state.defaultValue}
        selectedToken={this.props.selectedToken}
        CustomOptionValue={this.state.CustomOptionValue}
        CustomValueContainer={this.state.CustomValueContainer}
        onChange={ this.props.onChange ? this.props.onChange : this.props.changeToken}
      />
    );
  }
}

export default AssetSelector;
