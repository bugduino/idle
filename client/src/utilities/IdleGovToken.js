import FunctionsUtil from './FunctionsUtil';

class IdleGovToken{
  // Attributes
  props = {};
  tokenName = null;
  tokenConfig = null;
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
    this.tokenConfig = this.functionsUtil.getGlobalConfig(['govTokens',this.tokenName]);
  }

  getBalance = async () => {
    let balance = await this.functionsUtil.getTokenBalance(this.tokenName,this.props.account);
    if (!balance || this.functionsUtil.BNify(balance).isNaN()){
      balance = this.functionsUtil.BNify(0);
    }
    return balance;
  }

  claimRewards = async (callback,callbackReceipt) => {
    return this.functionsUtil.contractMethodSendWrapper('EarlyRewards', 'claim', [], callback, callbackReceipt);
  }

  getPriorVotes = async (account=null) => {
    account = account ? account : this.props.account;
    let priorVotes = await this.functionsUtil.genericContractCall(this.tokenName,'getPriorVotes',[account]);
    if (priorVotes){
      return this.functionsUtil.BNify(priorVotes);
    }
    return null;
  }

  refreshIdleSpeed = async () => {
    return this.functionsUtil.genericContractCall('IdleController','refreshIdleSpeeds');
  }

  getUnclaimedTokens = async () => {
    let rewards =  await this.functionsUtil.genericContractCall('EarlyRewards','rewards',[this.props.account]);
    if (rewards){
      return this.functionsUtil.fixTokenDecimals(rewards,this.tokenConfig.decimals);
    }
    return this.functionsUtil.BNify(0);
  }

  getAPR = async (token,tokenConfig,conversionRate=null) => {
    const IDLETokenConfig = this.functionsUtil.getGlobalConfig(['govTokens',this.tokenName]);
    if (!IDLETokenConfig.enabled){
      return false;
    }

    const cachedDataKey = `getIdleAPR_${tokenConfig.idle.token}_${conversionRate}`;
    /*
    const cachedData = this.functionsUtil.getCachedData(cachedDataKey);
    if (cachedData !== null && !this.functionsUtil.BNify(cachedData).isNaN()){
      return cachedData;
    }
    */

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
        
      // Get IDLE oconversion rate
      if (!conversionRate){
        try {
          conversionRate = await this.functionsUtil.getUniswapConversionRate(DAITokenConfig,IDLETokenConfig);
        } catch (error) {

        }
        if (!conversionRate || conversionRate.isNaN()){
          conversionRate = this.functionsUtil.BNify(0);
        }
      }

      if (!conversionRate || this.functionsUtil.BNify(conversionRate).lte(0)){
        return this.functionsUtil.BNify(0);
      }

      const tokenPool = await this.functionsUtil.convertTokenBalance(tokenAllocation.totalAllocationWithUnlent,token,tokenConfig);

      const idleDistributedPerYearUSD = this.functionsUtil.BNify(conversionRate).times(idleDistribution);
      APR = idleDistributedPerYearUSD.div(tokenPool).times(100);

      // console.log(token,idleDistributedPerYearUSD.toFixed(5),conversionRate.toFixed(5),APR.toFixed(5));

      return this.functionsUtil.setCachedData(cachedDataKey,APR);
    }

    return APR;
  }

  // Get IDLE distribution speed
  getSpeed = async (idleTokenAddress) => {

    const cachedDataKey = `getIdleSpeed_${idleTokenAddress}`;
    const cachedData = this.functionsUtil.getCachedDataWithLocalStorage(cachedDataKey);
    if (cachedData !== null && !this.functionsUtil.BNify(cachedData).isNaN()){
      return this.functionsUtil.BNify(cachedData);
    }

    let idleSpeeds = await this.functionsUtil.genericContractCall('IdleController','idleSpeeds',[idleTokenAddress]);
    if (idleSpeeds && !this.functionsUtil.BNify(idleSpeeds).isNaN()){
      idleSpeeds = this.functionsUtil.BNify(idleSpeeds);
      return this.functionsUtil.setCachedDataWithLocalStorage(cachedDataKey,idleSpeeds);
    }
    return null;
  }

  getDistribution = async (tokenConfig) => {

    const cachedDataKey = `getIdleDistribution_${tokenConfig.idle.token}`;
    const cachedData = this.functionsUtil.getCachedDataWithLocalStorage(cachedDataKey);
    if (cachedData !== null && !this.functionsUtil.BNify(cachedData).isNaN()){
      return this.functionsUtil.BNify(cachedData);
    }

    // Get IDLE distribution speed and Total Supply
    const idleSpeeds = await this.getSpeed(tokenConfig.idle.address);

    if (idleSpeeds){

      // Get IDLE distribution for Idle in a Year
      const blocksPerYear = this.functionsUtil.getGlobalConfig(['network','blocksPerYear']);

      // Take 50% of distrubution for lenders side
      const distribution = this.functionsUtil.BNify(idleSpeeds).times(this.functionsUtil.BNify(blocksPerYear)).div(1e18);

      if (!this.functionsUtil.BNify(distribution).isNaN()){
        return this.functionsUtil.setCachedDataWithLocalStorage(cachedDataKey,distribution);
      }
    }

    return null;
  }

  getUserDistribution = async (account=null,availableTokens=null,fixByFrequency=false) => {
    if (!account){
      account = this.props.account;
    }
    if (!availableTokens && this.props.selectedStrategy){
      availableTokens = this.props.availableStrategies[this.props.selectedStrategy];
    }

    if (!account || !availableTokens){
      return false;
    }

    let totalSpeed = this.functionsUtil.BNify(0);
    await this.functionsUtil.asyncForEach(Object.keys(availableTokens),async (token) => {
      const tokenConfig = availableTokens[token];
      const [
        idleSpeed,
        userPoolShare
      ] = await Promise.all([
        this.getSpeed(tokenConfig.idle.address),
        this.functionsUtil.getUserPoolShare(account,tokenConfig)
      ]);

      if (idleSpeed && userPoolShare){
        const tokenSpeed = idleSpeed.times(userPoolShare);
        totalSpeed = totalSpeed.plus(tokenSpeed);
      }
    });

    if (fixByFrequency){
      totalSpeed = this.functionsUtil.fixTokenDecimals(totalSpeed,this.tokenConfig.decimals);
      totalSpeed = this.functionsUtil.fixDistributionSpeed(totalSpeed,this.tokenConfig.distributionFrequency)
    }

    return totalSpeed;
  }

  getAvgApr = async (availableTokens=null) => {
    if (!availableTokens){
      availableTokens = this.props.availableStrategies[this.props.selectedStrategy];
    }
    let output = this.functionsUtil.BNify(0);
    let totalAllocation = this.functionsUtil.BNify(0);
    await this.functionsUtil.asyncForEach(Object.keys(availableTokens),async (token) => {
      const tokenConfig = availableTokens[token];
      const [idleApr,tokenAllocation] = await Promise.all([
        this.getAPR(token,tokenConfig),
        this.functionsUtil.getTokenAllocation(tokenConfig,false,false)
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