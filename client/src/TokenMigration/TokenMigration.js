import Migrate from '../Migrate/Migrate';
import React, { Component } from 'react';
import { Flex, Box, Text, Icon } from "rimble-ui";
import RoundButton from '../RoundButton/RoundButton';
import FunctionsUtil from '../utilities/FunctionsUtil';
import AssetSelector from '../AssetSelector/AssetSelector';
import DashboardCard from '../DashboardCard/DashboardCard';

class TokenMigration extends Component {

  state = {
    tokenConfig:null,
    selectedFromToken:null,
    selectedDestToken:null,
    migrationSucceeded:false,
    availableDestinationTokens:null,
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
    await this.loadTokens();
  }

  async loadTokens(){
    const selectedFromToken = this.props.urlParams.param2 && this.props.toolProps.availableTokens[this.props.urlParams.param2] ? this.props.urlParams.param2 : Object.keys(this.props.toolProps.availableTokens)[0];

    await this.functionsUtil.asyncForEach(Object.keys(this.props.toolProps.availableTokens),async (token) => {
      const tokenConfig = this.props.toolProps.availableTokens[token];
      const tokenContract = this.functionsUtil.getContractByName(tokenConfig.token);
      if (!tokenContract && tokenConfig.abi){
        await this.props.initContract(tokenConfig.token,tokenConfig.address,tokenConfig.abi);
      }
    });

    if (selectedFromToken && selectedFromToken !== this.props.urlParams.param2){
      this.changeFromToken(selectedFromToken);
    }

    this.selectFromToken(selectedFromToken);
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    const tokenFromChanged = prevProps.urlParams.param2 !== this.props.urlParams.param2;
    if (tokenFromChanged){
      await this.loadTokens();
    }
  }

  changeFromToken = (selectedToken) => {
    const convertTool = this.functionsUtil.getGlobalConfig(['tools','tokenMigration']);
    this.props.goToSection(`tools/${convertTool.route}/${selectedToken}`);
  }

  selectFromToken = async (selectedFromToken) => {
    const tokenInfo = this.props.toolProps.availableTokens[selectedFromToken];

    let selectedDestToken = null;
    const availableDestinationTokens = {};

    const availableStrategies = typeof this.props.toolProps.availableStrategies !== 'undefined' ? this.props.toolProps.availableStrategies : Object.keys(this.props.availableStrategies);

    availableStrategies.forEach( strategy => {
      const strategyAvailableTokens =  this.props.availableStrategies[strategy];
      const baseTokenConfig = strategyAvailableTokens[tokenInfo.baseToken];
      if (!baseTokenConfig){
        return false;
      }

      // Remove icon
      delete baseTokenConfig.icon;

      if (!selectedDestToken){
        selectedDestToken = baseTokenConfig.idle.token;
      }
      baseTokenConfig.strategy = strategy;
      baseTokenConfig.baseToken = tokenInfo.baseToken;
      availableDestinationTokens[baseTokenConfig.idle.token] = baseTokenConfig;
    });

    this.setState({
      tokenConfig:null,
      selectedFromToken,
      availableDestinationTokens
    },() => {
      this.selectDestToken(selectedDestToken);
    });
  }

  selectDestToken = async (selectedDestToken) => {

    const destTokenConfig = this.state.availableDestinationTokens[selectedDestToken];
    const tokenInfo = this.props.toolProps.availableTokens[this.state.selectedFromToken];

    const tokenConfig = {
      token:destTokenConfig.baseToken,
      address:destTokenConfig.address,
      decimals:destTokenConfig.decimals
    };

    // Add Idle Token config
    tokenConfig.idle = destTokenConfig.idle;

    // Add migration info
    const oldContract = {
      abi:tokenInfo.abi,
      name:tokenInfo.token,
      token:tokenInfo.token,
      address:tokenInfo.address
    };
    
    const migrationContract = this.props.toolProps.migrationContract;

    // Add migration function
    if (tokenInfo.migrateFunction){
      migrationContract.functions[0].name = tokenInfo.migrateFunction;
    }

    tokenConfig.migration = {
      enabled:true,
      oldContract,
      migrationContract,
      migrationSucceeded:false
    };

    await this.props.setStrategyToken(destTokenConfig.strategy,tokenInfo.baseToken);

    this.setState({
      tokenConfig,
      selectedDestToken
    });
  }

  migrationCallback = () => {
    this.setState({
      migrationSucceeded:true
    });
  }

  render() {

    if (!this.state.selectedFromToken){
      return null;
    }

    return (
      <Flex
        width={1}
        mt={[2,3]}
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
              Select asset to migrate:
            </Text>
            <AssetSelector
              {...this.props}
              id={'token-from'}
              showBalance={true}
              isSearchable={true}
              onChange={this.changeFromToken}
              selectedToken={this.state.selectedFromToken}
              availableTokens={this.props.toolProps.availableTokens}
            />
          </Box>
          {
            this.state.availableDestinationTokens && this.state.selectedDestToken && 
              <Box
                mt={2}
                width={1}
              >
                <Text mb={1}>
                  Select destination asset:
                </Text>
                <AssetSelector
                  {...this.props}
                  id={'token-dest'}
                  showBalance={false}
                  onChange={this.selectDestToken}
                  selectedToken={this.state.selectedDestToken}
                  availableTokens={this.state.availableDestinationTokens}
                />
              </Box>
          }
          {
            this.state.selectedFromToken && this.state.selectedDestToken ? (
              <Migrate
                {...this.props}
                showActions={false}
                getTokenPrice={false}
                isMigrationTool={true}
                tokenConfig={this.state.tokenConfig}
                migrationCallback={this.migrationCallback}
                selectedToken={this.state.selectedFromToken}
                selectedStrategy={this.props.selectedStrategy}
              >
                {
                  !this.props.account ? (
                    <DashboardCard
                      cardProps={{
                        p:3,
                        mt:3
                      }}
                    >
                      <Flex
                        alignItems={'center'}
                        flexDirection={'column'}
                      >
                        <Icon
                          size={'2.3em'}
                          name={'Input'}
                          color={'cellText'}
                        />
                        <Text
                          mt={2}
                          fontSize={2}
                          color={'cellText'}
                          textAlign={'center'}
                        >
                          Please connect with your wallet interact with Idle.
                        </Text>
                        <RoundButton
                          buttonProps={{
                            mt:2,
                            width:[1,1/2]
                          }}
                          handleClick={this.props.connectAndValidateAccount}
                        >
                          Connect
                        </RoundButton>
                      </Flex>
                    </DashboardCard>
                  ) : (
                    <DashboardCard
                      cardProps={{
                        p:3,
                        mt:3
                      }}
                    >
                      {
                        this.state.migrationSucceeded ? (
                          <Flex
                            alignItems={'center'}
                            flexDirection={'column'}
                          >
                            <Icon
                              size={'2.3em'}
                              name={'DoneAll'}
                              color={this.props.theme.colors.transactions.status.completed}
                            />
                            <Text
                              mt={2}
                              fontSize={2}
                              color={'cellText'}
                              textAlign={'center'}
                            >
                              Your {this.state.selectedFromToken} have been successfully migrated!
                            </Text>
                          </Flex>
                        ) : (
                          <Flex
                            alignItems={'center'}
                            flexDirection={'column'}
                          >
                            <Icon
                              size={'2.3em'}
                              name={'MoneyOff'}
                              color={'cellText'}
                            />
                            <Text
                              mt={2}
                              fontSize={2}
                              color={'cellText'}
                              textAlign={'center'}
                            >
                              You don't have any {this.state.selectedFromToken} in your wallet.
                            </Text>
                          </Flex>
                        )
                      }
                    </DashboardCard>
                  )
                }
              </Migrate>
            ) : null
          }
        </Flex>
      </Flex>
    );
  }
}

export default TokenMigration;
