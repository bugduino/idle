import FunctionsUtil from './FunctionsUtil';
import VesterABI from '../contracts/Vester.json';

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

  delegateVesting = async (account=null,delegate=null) => {
    account = account ? account : this.props.account;

    const founderVesting = await this.functionsUtil.genericContractCall('VesterFactory','vestingContracts',[account]);
    console.log('founderVesting',account,founderVesting);

    if (parseInt(founderVesting) === 0){
      return false;
    }

    await this.props.initContract('Vester',founderVesting,VesterABI);
    // await this.functionsUtil.contractMethodSendWrapper('IDLE','delegate',[delegate]);
    await this.functionsUtil.contractMethodSendWrapper('Vester','setDelegate',[delegate]);

    console.log('delegates vesterFounder to founder');
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