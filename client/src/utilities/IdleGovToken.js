import FunctionsUtil from './FunctionsUtil';

class IdleGovToken{
  // Attributes
  props = {};
  tokenName = null;
  functionsUtil = null;

  // Constructor
  constructor(props){
    this.setProps(props);
  }

  // Methods
  setProps = props => {
    this.props = props;

    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }

    this.tokenName = this.functionsUtil.getGlobalConfig(['governance','props','tokenName']);
  }

  getBalance = async () => {
    return await this.functionsUtil.getTokenBalance(this.tokenName,this.props.account);
  }

  claimRewards = async (callback,callbackReceipt) => {
    return this.functionsUtil.contractMethodSendWrapper('EarlyRewards', 'claim', [], callback, callbackReceipt);
  }

  getUnclaimedTokens = async () => {
    return this.functionsUtil.BNify(0);
    // return await this.genericContractCall('EarlyRewards','rewards',[this.props.account]);
  }

  getAPR = async (token,tokenConfig,conversionRate=null) => {

    return this.functionsUtil.BNify(5);

    const IDLETokenConfig = this.functionsUtil.getGlobalConfig(['govTokens',this.tokenName]);
    if (!IDLETokenConfig.enabled){
      return false;
    }

    const cachedDataKey = `getIdleAPR_${tokenConfig.idle.token}_${conversionRate}`;
    const cachedData = this.functionsUtil.getCachedData(cachedDataKey);
    if (cachedData !== null && !this.functionsUtil.BNify(cachedData).isNaN()){
      return cachedData;
    }

    let APR = this.functionsUtil.BNify(0);

    const [
      idleDistribution,
      tokenAllocation
    ] = await Promise.all([
      this.getDistribution(tokenConfig),
      this.functionsUtil.getTokenAllocation(tokenConfig,false,false)
    ]);

    if (idleDistribution && tokenAllocation){

      const DAITokenConfig = this.functionsUtil.getGlobalConfig(['stats','tokens','DAI']);
        
      // Get IDLE conversion rate
      if (!conversionRate){
        conversionRate = await this.functionsUtil.getUniswapConversionRate(DAITokenConfig,IDLETokenConfig);
        if (!conversionRate || conversionRate.isNaN()){
          conversionRate = this.functionsUtil.BNify(1);
        }
      }

      const idleDistributedPerYearUSD = this.functionsUtil.BNify(conversionRate).times(idleDistribution);
      APR = idleDistributedPerYearUSD.div(tokenAllocation.totalAllocation).times(100);
      return this.functionsUtil.setCachedData(cachedDataKey,APR);
    }

    return APR;
  }

  getDistribution = async (tokenConfig) => {

    const cachedDataKey = `getIdleDistribution_${tokenConfig.idle.token}`;
    const cachedData = this.functionsUtil.getCachedData(cachedDataKey);
    if (cachedData !== null && !this.functionsUtil.BNify(cachedData).isNaN()){
      return cachedData;
    }

    // Get IDLE distribution speed and Total Supply
    const idleSpeeds = await this.functionsUtil.genericContractCall('IdleController','idleSpeeds',[tokenConfig.idle.address]);

    if (idleSpeeds){

      // Get IDLE distribution for Idle in a Year
      const blocksPerYear = this.functionsUtil.getGlobalConfig(['network','blocksPerYear']);

      // Take 50% of distrubution for lenders side
      const distribution = this.functionsUtil.BNify(idleSpeeds).times(this.functionsUtil.BNify(blocksPerYear)).div(1e18);

      return this.functionsUtil.setCachedData(cachedDataKey,distribution);
    }

    return null;
  }

  getAvgApr = async (availableTokens=null) => {
    if (!availableTokens){
      availableTokens = this.props.availableStrategies[this.props.selectedStrategy];
    }
    let output = this.functionsUtil.BNify(0);
    let totalAllocation = this.functionsUtil.BNify(0);
    await this.asyncForEach(Object.keys(availableTokens),async (token) => {
      const tokenConfig = availableTokens[token];
      const [idleApr,tokenAllocation] = await Promise.all([
        this.getAPR(token,tokenConfig),
        this.getTokenAllocation(tokenConfig,false,false)
      ]);
      
      if (idleApr && tokenAllocation){
        output = output.plus(idleApr.times(tokenAllocation.totalAllocation));
        totalAllocation = totalAllocation.plus(tokenAllocation.totalAllocation);
      }
    });

    output = output.div(totalAllocation);

    return output;
  }

}

export default IdleGovToken;