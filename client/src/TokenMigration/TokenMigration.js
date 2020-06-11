import Migrate from '../Migrate/Migrate';
import React, { Component } from 'react';
import { Flex, Box, Text } from "rimble-ui";
import FunctionsUtil from '../utilities/FunctionsUtil';
import AssetSelector from '../AssetSelector/AssetSelector';

class TokenMigration extends Component {

  state = {
    tokenConfig:null,
    selectedToken:null,
    availableTokens:null,
    baseTokenConfig:null
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

  async componentWillMount(){
    this.loadUtils();
    this.loadTokens();
  }

  async loadTokens(){
    let selectedToken = null;
    let baseTokenConfig = null;
    const availableTokens = {};
    const strategies = Object.keys(this.props.availableStrategies);
    const strategyTokens = this.props.availableStrategies[strategies[0]];

    Object.keys(strategyTokens).forEach( token => {
      const tokenConfig = strategyTokens[token];
      tokenConfig.protocols.forEach( protocolToken => {
        if (!selectedToken){
          selectedToken = protocolToken.token;
          baseTokenConfig = tokenConfig;
        }
        availableTokens[protocolToken.token] = protocolToken;
      });
    });

    this.setState({
      selectedToken,
      baseTokenConfig,
      availableTokens
    },() => {
      this.selectToken(selectedToken);
    });
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
  }

  selectToken = async (selectedToken) => {

    const tokenConfig = this.state.availableTokens[selectedToken];

    const oldContract = {
      abi:tokenConfig.abi,
      token:tokenConfig.token,
      name:tokenConfig.token,
      address:tokenConfig.address
    };

    tokenConfig.migration = {
      enabled:true,
      oldContract,
      migrationContract:this.state.baseTokenConfig.migration.migrationContract
    };

    this.setState({
      tokenConfig,
      selectedToken
    });
  }

  render() {

    console.log(this.state.selectedToken,this.state.tokenConfig);

    return (
      <Flex
        width={1}
        alignItems={'center'}
        flexDirection={'column'}
        justifyContent={'center'}
      >
        <Flex
          width={[1,0.36]}
          alignItems={'stretch'}
          flexDirection={'column'}
          justifyContent={'center'}
        >
          <Box
            width={1}
          >
            <Text mb={1}>
              Select your asset:
            </Text>
            <AssetSelector
              {...this.props}
              onChange={this.selectToken}
              selectedToken={this.state.selectedToken}
              availableTokens={this.state.availableTokens}
            />
          </Box>
          <Migrate
            {...this.props}
            tokenConfig={this.state.tokenConfig}
            selectedToken={this.state.selectedToken}
          />
        </Flex>
      </Flex>
    );
  }
}

export default TokenMigration;
