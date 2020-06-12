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
    selectedToken:null,
    migrationSucceeded:false
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
    const selectedToken = Object.keys(this.props.toolProps.availableTokens)[0];

    await this.functionsUtil.asyncForEach(Object.keys(this.props.toolProps.availableTokens),async (token) => {
      const tokenConfig = this.props.toolProps.availableTokens[token];
      const tokenContract = this.functionsUtil.getContractByName(tokenConfig.token);
      if (!tokenContract && tokenConfig.abi){
        await this.props.initContract(tokenConfig.token,tokenConfig.address,tokenConfig.abi);
      }
    });

    this.setState({
      selectedToken
    },() => {
      this.selectToken(selectedToken);
    });
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
  }

  selectToken = async (selectedToken) => {

    const tokenInfo = this.props.toolProps.availableTokens[selectedToken];
    const strategyTokens = this.props.availableStrategies[this.props.toolProps.selectedStrategy];
    const baseTokenConfig = strategyTokens[tokenInfo.baseToken];

    const tokenConfig = {
      token:tokenInfo.baseToken,
      address:baseTokenConfig.address,
      decimals:baseTokenConfig.decimals
    };

    // Add Idle Token config
    tokenConfig.idle = baseTokenConfig.idle;

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

    this.setState({
      tokenConfig,
      selectedToken
    });
  }

  migrationCallback = () => {
    this.setState({
      migrationSucceeded:true
    });
  }

  render() {

    if (!this.state.selectedToken){
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
              Select your asset:
            </Text>
            <AssetSelector
              {...this.props}
              showBalance={true}
              onChange={this.selectToken}
              selectedToken={this.state.selectedToken}
              availableTokens={this.props.toolProps.availableTokens}
            />
          </Box>
          <Migrate
            {...this.props}
            showActions={false}
            getTokenPrice={false}
            isMigrationTool={true}
            tokenConfig={this.state.tokenConfig}
            selectedToken={this.state.selectedToken}
            migrationCallback={this.migrationCallback}
            selectedStrategy={this.props.toolProps.selectedStrategy}
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
                          Your {this.state.selectedToken} have been successfully migrated!
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
                          You don't have any {this.state.selectedToken} in your wallet.
                        </Text>
                      </Flex>
                    )
                  }
                </DashboardCard>
              )
            }
          </Migrate>
        </Flex>
      </Flex>
    );
  }
}

export default TokenMigration;
