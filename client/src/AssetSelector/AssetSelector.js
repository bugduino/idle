import { Flex } from "rimble-ui";
import React, { Component } from 'react';
import AssetField from '../AssetField/AssetField';
import FunctionsUtil from '../utilities/FunctionsUtil';
import GenericSelector from '../GenericSelector/GenericSelector';

class AssetSelector extends Component {

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

    this.setState({
      props:this.props
    });
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
  }

  render() {

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
            this.state.props.showBalance &&
              <Flex
                alignItems={'center'}
                justifyContent={'flex-end'}
              >
                <AssetField
                  token={token}
                  {...this.state.props}
                  tokenConfig={tokenConfig}
                  account={this.state.props.account}
                  fieldInfo={{
                    name:'tokenBalance',
                    props:{
                      fontSize:[1,2],
                      fontWeight:500,
                      color:'cellText'
                    }
                  }}
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
            this.state.props.showBalance &&
              <Flex
                alignItems={'center'}
                justifyContent={'flex-end'}
              >
                <AssetField
                  token={token}
                  {...this.state.props}
                  tokenConfig={tokenConfig}
                  account={this.state.props.account}
                  fieldInfo={{
                    name:'tokenBalance',
                    props:{
                      fontSize:[1,2],
                      fontWeight:500,
                      color:'cellText'
                    }
                  }}
                />
              </Flex>
          }
        </Flex>
      );
    }

    return (
      <GenericSelector
        name={'assets'}
        options={options}
        defaultValue={defaultValue}
        innerProps={this.props.innerProps}
        CustomOptionValue={CustomOptionValue}
        CustomValueContainer={CustomValueContainer}
        onChange={ this.props.onChange ? this.props.onChange : this.props.changeToken}
      />
    );
  }
}

export default AssetSelector;
