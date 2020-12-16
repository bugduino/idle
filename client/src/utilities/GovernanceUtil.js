import Batcher from 'web3-batched-send';
import FunctionsUtil from './FunctionsUtil';
import VesterABI from '../contracts/Vester.json';

// const env = process.env;

class GovernanceUtil {
  // Attributes
  props = {};
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
  }

  getTotalSupply = async () => {

    // Check for cached data
    const cachedDataKey = `getTotalSupply`;
    const cachedData = this.functionsUtil.getCachedDataWithLocalStorage(cachedDataKey);
    if (cachedData && !this.functionsUtil.BNify(cachedData).isNaN()){
      return cachedData;
    }

    const contractName = this.functionsUtil.getGlobalConfig(['governance','contracts','delegates']);
    let totalSupply = await this.functionsUtil.genericContractCall(contractName,'totalSupply');
    if (totalSupply){
      totalSupply = this.functionsUtil.fixTokenDecimals(totalSupply,18);
      return this.functionsUtil.setCachedDataWithLocalStorage(cachedDataKey,totalSupply,null);
    }

    return null;
  }

  getTokensBalance = async (account=null) => {

    account = account ? account : this.props.account;
    if (account){

      // Check for cached data
      const cachedDataKey = `getTokensBalance_${account}`;
      const cachedData = this.functionsUtil.getCachedDataWithLocalStorage(cachedDataKey);
      if (cachedData && !this.functionsUtil.BNify(cachedData).isNaN()){
        return cachedData;
      }

      const contractName = this.functionsUtil.getGlobalConfig(['governance','contracts','delegates']);
      const balance = await this.functionsUtil.getContractBalance(contractName, account);
      if (balance && !this.functionsUtil.BNify(balance).isNaN()){
        return this.functionsUtil.setCachedDataWithLocalStorage(cachedDataKey,this.functionsUtil.BNify(balance));
      }
    }
    return null;
  }

  getVestingContract = async (account=null) => {
    account = account ? account : this.props.account;
    const vestingContract = await this.functionsUtil.genericContractCall('VesterFactory','vestingContracts',[account]);

    if (parseInt(vestingContract) === 0){
      return null;
    }
    // Init vesting contract
    await this.props.initContract('VestingContract',vestingContract,VesterABI);
    return vestingContract;
  }

  delegateVesting = async (account=null,delegate=null,callback=null,callbackReceipt=null) => {
    account = account ? account : this.props.account;
    const founderVesting = await this.getVestingContract(account);
    if (founderVesting){
      // await this.functionsUtil.contractMethodSendWrapper('IDLE','delegate',[delegate]);
      return await this.functionsUtil.contractMethodSendWrapper('VestingContract','setDelegate',[delegate],callback,callbackReceipt);
    }
    return null;
  }

  getVestingAmount = async (account=null) => {
    account = account ? account : this.props.account;
    const founderVesting = await this.getVestingContract(account);
    if (founderVesting){
      let vestingAmount = await this.functionsUtil.genericContractCall('VestingContract','vestingAmount');
      if (vestingAmount){
        return this.functionsUtil.BNify(vestingAmount);
      }
    }
    return null;
  }

  getCurrentDelegate = async (account=null) => {

    account = account ? account : this.props.account;
    if (account){

      // Check for cached data
      const cachedDataKey = `getCurrentDelegate_${account}`;
      const cachedData = this.functionsUtil.getCachedDataWithLocalStorage(cachedDataKey);
      if (cachedData){
        return cachedData;
      }

      const contractName = this.functionsUtil.getGlobalConfig(['governance','contracts','delegates']);
      const delegate = await this.functionsUtil.genericContractCall(contractName, 'delegates', [account]);

      return this.functionsUtil.setCachedDataWithLocalStorage(cachedDataKey,delegate);
    }

    return null;
  }

  getCurrentVotes = async (account=null) => {

    account = account ? account : this.props.account;
    if (account){
      // Check for cached data
      const cachedDataKey = `getCurrentVotes_${account}`;
      const cachedData = this.functionsUtil.getCachedDataWithLocalStorage(cachedDataKey);
      if (cachedData){
        return cachedData;
      }

      const contractName = this.functionsUtil.getGlobalConfig(['governance','contracts','delegates']);
      const votes = await this.functionsUtil.genericContractCall(contractName, 'getCurrentVotes', [account]);
      if (votes && !this.functionsUtil.BNify(votes).isNaN() ){
        return this.functionsUtil.setCachedDataWithLocalStorage(cachedDataKey,this.functionsUtil.BNify(votes));
      }
    }

    return null;
  }

  queueProposal = async (proposalId,callback=null,callbackReceipt=null) => {
    const contractName = this.functionsUtil.getGlobalConfig(['governance','contracts','governance']);
    await this.functionsUtil.contractMethodSendWrapper(contractName,'queue',[this.functionsUtil.BNify(proposalId)],callback,callbackReceipt);
  }

  executeProposal = async (proposalId,callback=null,callbackReceipt=null) => {
    const contractName = this.functionsUtil.getGlobalConfig(['governance','contracts','governance']);
    await this.functionsUtil.contractMethodSendWrapper(contractName,'execute',[this.functionsUtil.BNify(proposalId)],callback,callbackReceipt);
  }

  proposeAndVoteFor = async (targets, values, signatures, calldatas, description) => {
    const batcher = new Batcher(this.props.web3,'0x741A4dCaD4f72B83bE9103a383911d78362611cf');

    const contractName = this.functionsUtil.getGlobalConfig(['governance','contracts','governance']);
    const contract = this.functionsUtil.getContractByName(contractName);

    const txs = [
      {
        to:contract._address,
        method:contract.methods.propose,
        args:[targets, values, signatures, calldatas, description]
      },
      {
        to:contract._address,
        method:contract.methods.castVote,
        args:[this.functionsUtil.BNify(3), true],
      }
    ];

    batcher(txs);
  }

  propose = async (targets, values, signatures, calldatas, description, callback=null,callbackReceipt=null) => {
    const contractName = this.functionsUtil.getGlobalConfig(['governance','contracts','governance']);
    return await this.props.contractMethodSendWrapper(contractName, 'propose', [targets, values, signatures, calldatas, description], null, callback, callbackReceipt);
  }

  castVote = async (proposalId,support,callback=null,callbackReceipt=null) => {
    proposalId = this.functionsUtil.toBN(proposalId);
    const contractName = this.functionsUtil.getGlobalConfig(['governance','contracts','governance']);
    return await this.props.contractMethodSendWrapper(contractName, 'castVote', [proposalId, support], null, callback, callbackReceipt);
  }

  setDelegate = async (delegate,callback=null,callbackReceipt=null) => {
    const contractName = this.functionsUtil.getGlobalConfig(['governance','contracts','delegates']);
    return await this.props.contractMethodSendWrapper(contractName, 'delegate', [delegate], null, callback, callbackReceipt);
  }

  getDelegatesChanges = async () => {

    const lastBlockNumber = await this.props.web3.eth.getBlockNumber();

    const delegationsCalls = [];
    const blocksPerCall = 100000;
    const fromBlock = this.functionsUtil.getGlobalConfig(['governance','startBlock']);
    const delegatesContractName = this.functionsUtil.getGlobalConfig(['governance','contracts','delegates']);

    for (var blockNumber = fromBlock; blockNumber < lastBlockNumber; blockNumber+=blocksPerCall) {
      const toBlock = Math.min(blockNumber+blocksPerCall,lastBlockNumber);
      delegationsCalls.push(this.functionsUtil.getContractPastEvents(delegatesContractName,'DelegateChanged', {fromBlock: blockNumber, toBlock}))
    }

    const all_delegations = await Promise.all(delegationsCalls);

    return all_delegations.reduce( (delegations,d) => {
      delegations = delegations.concat(d);
      return delegations;
    },[]);
  }

  getDelegatesVotesChanges = async () => {

    const lastBlockNumber = await this.props.web3.eth.getBlockNumber();

    const delegationsCalls = [];
    const blocksPerCall = 100000;
    const fromBlock = this.functionsUtil.getGlobalConfig(['governance','startBlock']);
    const delegatesContractName = this.functionsUtil.getGlobalConfig(['governance','contracts','delegates']);

    for (var blockNumber = fromBlock; blockNumber < lastBlockNumber; blockNumber+=blocksPerCall) {
      const toBlock = Math.min(blockNumber+blocksPerCall,lastBlockNumber);
      delegationsCalls.push(this.functionsUtil.getContractPastEvents(delegatesContractName,'DelegateVotesChanged', {fromBlock: blockNumber, toBlock}))
    }

    const all_delegations = await Promise.all(delegationsCalls);

    return all_delegations.reduce( (delegations,d) => {
      delegations = delegations.concat(d);
      return delegations;
    },[]);
  }

  getDelegates = async (limit=null) => {

    // Check for cached data
    const cachedDataKey = `getDelegates`;
    const cachedData = this.functionsUtil.getCachedDataWithLocalStorage(cachedDataKey);
    if (cachedData){
      return cachedData;
    }

    const [
      all_votes,
      totalSupply,
      delegations,
    ] = await Promise.all([
      this.getVotes(),
      this.getTotalSupply(),
      this.getDelegatesVotesChanges()
    ]);

    const delegateAccounts = {};
    delegations.forEach(e => {
      const { delegate, newBalance } = e.returnValues;
      delegateAccounts[delegate] = newBalance;
    });

    let delegates = [];
    Object.keys(delegateAccounts).forEach((account) => {
      const votes = +delegateAccounts[account];
      if (votes === 0) return;
      delegates.push({
        votes: votes/1e18,
        delegate: account
      });
    });

    delegates.sort((a, b) => {
      return a.votes < b.votes ? 1 : -1;
    });

    delegates.forEach( (d,index) => {
      d.rank = index+1;
      d.votes = d.votes.toFixed(6);
      d.vote_weight = (100 * (d.votes / parseFloat(totalSupply))).toFixed(4) + '%';
      d.proposals = all_votes.filter( v => (v.voter.toLowerCase() === d.delegate.toLowerCase()) ).length;
    });

    this.functionsUtil.setCachedDataWithLocalStorage(cachedDataKey,delegates);

    if (limit !== null){
      delegates = delegates.splice(0,limit);
    }

    return delegates;
  }

  getProposalParams = async () => {

    // Check for cached data
    const cachedDataKey = `getProposalParams`;
    const cachedData = this.functionsUtil.getCachedData(cachedDataKey);
    if (cachedData){
      return cachedData;
    }

    const govContractName = this.functionsUtil.getGlobalConfig(['governance','contracts','governance']);
    let [
      proposalThreshold,
      proposalMaxOperations
    ] = await Promise.all([
      this.functionsUtil.genericContractCall(govContractName,'proposalThreshold'),
      this.functionsUtil.genericContractCall(govContractName,'proposalMaxOperations')
    ]);

    if (proposalThreshold){
      proposalThreshold = this.functionsUtil.BNify(proposalThreshold);
    }

    const params = {
      proposalThreshold,
      proposalMaxOperations
    };

    return this.functionsUtil.setCachedData(cachedDataKey,params);
  }

  getVotes = async () => {

    // Check for cached data
    const cachedDataKey = `getVotes`;
    const cachedData = this.functionsUtil.getCachedData(cachedDataKey);
    if (cachedData){
      return cachedData;
    }

    const governanceContractName = this.functionsUtil.getGlobalConfig(['governance','contracts','governance']);

    let votes = await this.functionsUtil.getContractPastEvents(governanceContractName,'VoteCast', {fromBlock: 0, toBlock: 'latest'});

    if (votes){
      votes = votes.map( e => {
        const {
            voter,
            votes,
            support,
            proposalId
        } = e.returnValues;
        return {
          votes,
          voter,
          support,
          proposalId
        }
      });
    }

    return this.functionsUtil.setCachedData(cachedDataKey,votes);
  }

  getProposals = async (voted_by=null) => {

    // Check for cached data
    const cachedDataKey = 'getProposals';
    let cachedData = this.functionsUtil.getCachedDataWithLocalStorage(cachedDataKey);
    if (cachedData){
      if (voted_by !== null){
        cachedData = cachedData.filter( p => (p.votes.find( v => (v.voter.toLowerCase() === voted_by.toLowerCase()) )) );
      }
      return cachedData;
    }

    const enumerateProposalState = (state) => {
      const proposalStates = ['Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed'];
      return proposalStates[state];
    };

    const governanceContractName = this.functionsUtil.getGlobalConfig(['governance','contracts','governance']);
    const proposalCount = await this.functionsUtil.genericContractCall(governanceContractName,'proposalCount');

    if (!proposalCount){
      return [];
    }

    const proposalGets = [];
    const proposalStateGets = [];
    for (const i of Array.from(Array(parseInt(proposalCount)),(n,i) => i+1)) {
      proposalGets.push(this.functionsUtil.genericContractCall(governanceContractName,'proposals',[i]));
      proposalStateGets.push(this.functionsUtil.genericContractCall(governanceContractName,'state',[i]));
    }

    const [
      votes,
      proposals,
      proposalStates,
      proposalQueuedEvents,
      proposalCreatedEvents,
      proposalCanceledEvents,
      proposalExecutedEvents,
    ] = await Promise.all([
      this.getVotes(),
      Promise.all(proposalGets),
      Promise.all(proposalStateGets),
      this.functionsUtil.getContractPastEvents(governanceContractName,'ProposalQueued', {fromBlock: 0, toBlock: 'latest'}),
      this.functionsUtil.getContractPastEvents(governanceContractName,'ProposalCreated', {fromBlock: 0, toBlock: 'latest'}),
      this.functionsUtil.getContractPastEvents(governanceContractName,'ProposalCanceled', {fromBlock: 0, toBlock: 'latest'}),
      this.functionsUtil.getContractPastEvents(governanceContractName,'ProposalExecuted', {fromBlock: 0, toBlock: 'latest'}),
    ]);

    /*
    console.log(
      votes,
      proposals,
      proposalStates,
      proposalQueuedEvents,
      proposalCreatedEvents,
      proposalCanceledEvents,
      proposalExecutedEvents
    );
    */

    proposals.reverse();
    proposalStates.reverse();
    proposalQueuedEvents.reverse();
    proposalCreatedEvents.reverse();
    proposalCanceledEvents.reverse();
    proposalExecutedEvents.reverse();

    await this.functionsUtil.asyncForEach(proposals, async (p,i) => {
      const proposalId = parseInt(p.id);

      const createdEvent = proposalCreatedEvents[i];
      const canceledEvent = proposalCanceledEvents.find( e => (parseInt(e.returnValues.id) === proposalId ) );
      const executedEvent = proposalExecutedEvents.find( e => (parseInt(e.returnValues.id) === proposalId ) );
      const queuedEvent = proposalQueuedEvents.find( e => (parseInt(e.returnValues.id) === proposalId ) );

      // Init states array
      p.states = [];

      // Create created state
      const createdBlockInfo = await this.props.web3.eth.getBlock(createdEvent.blockNumber);
      const createdState = {
        state: "Pending",
        end_time: createdBlockInfo.timestamp,
        start_time: createdBlockInfo.timestamp,
        trx_hash: createdEvent.transactionHash
      };
      p.states.push(createdState);

      // Push active state
      const activeState = {
        state: "Active",
        end_time: null,
        start_time: createdState.start_time,
        trx_hash: null
      };
      p.states.push(activeState);

      // Push canceled state
      if (canceledEvent){
        const canceledBlockInfo = await this.props.web3.eth.getBlock(canceledEvent.blockNumber);
        const canceledState = {
          state: "Canceled",
          end_time: null,
          start_time: canceledBlockInfo.timestamp,
          trx_hash: canceledEvent.transactionHash
        }
        // Update previous state end_time
        p.states[p.states.length-1].end_time = canceledBlockInfo.timestamp;
        p.states.push(canceledState);
      } else {
        // Push queued state
        if (queuedEvent){
          const queuedBlockInfo = await this.props.web3.eth.getBlock(queuedEvent.blockNumber);
          const succeededState = {
            state: "Succeeded",
            end_time: null,
            trx_hash: null,
            start_time: queuedBlockInfo.timestamp,
          };

          const queuedState = {
            state: "Queued",
            end_time: null,
            start_time: queuedBlockInfo.timestamp,
            trx_hash: queuedEvent.transactionHash
          };

          // Update previous state end_time
          p.states[p.states.length-1].end_time = queuedBlockInfo.timestamp;
          // Push Succeeded state
          p.states.push(succeededState);
          // Push queued state
          p.states.push(queuedState);
        }

        // Push executed state
        if (executedEvent){
          const executedBlockInfo = await this.props.web3.eth.getBlock(executedEvent.blockNumber);
          const executedState = {
            state: "Executed",
            end_time: null,
            start_time: executedBlockInfo.timestamp,
            trx_hash: executedEvent.transactionHash
          }
          // Update previous state end_time
          p.states[p.states.length-1].end_time = executedBlockInfo.timestamp;
          p.states.push(executedState);
        }
      }

      // Check for defeated or expired
      p.state = enumerateProposalState(proposalStates[i]);
      const foundState = p.states.find( s => (s.state === p.state) );
      if (!foundState){
        const endBlockInfo = await this.props.web3.eth.getBlock(p.endBlock);
        const endState = {
          state: p.state,
          end_time: null,
          trx_hash: null,
          start_time: endBlockInfo.timestamp,
        }
        // Update previous state end_time
        p.states[p.states.length-1].end_time = endBlockInfo.timestamp;
        p.states.push(endState);
      }

      p.votes = votes.filter( v => (parseInt(v.proposalId)===proposalId) );

      const { description, signatures, targets, values, calldatas } = createdEvent.returnValues;
      p.timestamp = createdBlockInfo ? createdBlockInfo.timestamp : null;

      
      // Idle
      p.title = description.split(/# |\n|↵/g)[0].replace(/^#/,'') || 'Untitled';
      p.description = description.split(/\n|↵/g);
      p.description.shift();
      p.description = p.description.join("\n");

      // Compound
      // p.title = description.split(/# |\n/g)[1] || 'Untitled';
      // p.description = description.split(/# |\n/g)[2] || 'No description.';

      // Save proposal
      proposals[i] = {
        eta:p.eta,
        actions:{
          values,
          targets,
          calldatas,
          signatures
        },
        id:proposalId,
        title:p.title,
        state:p.state,
        votes:p.votes,
        states:p.states,
        executed:p.executed,
        endBlock:p.endBlock,
        canceled:p.canceled,
        forVotes:p.forVotes,
        proposer:p.proposer,
        timestamp:p.timestamp,
        startBlock:p.startBlock,
        description:p.description,
        againstVotes:p.againstVotes
      };
    });

    this.functionsUtil.setCachedDataWithLocalStorage(cachedDataKey,proposals)
    
    if (voted_by === null) {
      return proposals;
    } else {
      return proposals.filter( p => (p.votes.find( v => (v.voter.toLowerCase() === voted_by.toLowerCase()) )) );
    }
  }
}

export default GovernanceUtil;