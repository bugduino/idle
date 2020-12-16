import Title from '../../Title/Title';
import React, { Component } from 'react';
import styles from './NewProposal.module.scss';
import DelegateVote from '../DelegateVote/DelegateVote';
import RoundButton from '../../RoundButton/RoundButton';
import GovernanceUtil from '../../utilities/GovernanceUtil';
import DashboardCard from '../../DashboardCard/DashboardCard';
import TxProgressBar from '../../TxProgressBar/TxProgressBar';
import { Flex, Text, Heading, Input, Form, Field, Textarea, Icon, Select, Link } from "rimble-ui";

class NewProposal extends Component {

  state = {
    title:'',
    actions:[],
    txError:false,
    actionValue:0,
    customABI:null,
    description:'',
    processing: {
      txHash:null,
      loading:false
    },
    validated:false,
    newAction:false,
    editAction:null,
    actionInputs:null,
    actionValid:false,
    customAddress:null,
    contractOptions:[],
    proposalCreated:false,
    functionsOptions:null,
    selectedContract:null,
    selectedFunction:null,
    selectedSignature:null,
    availableFunctions:null,
    availableContracts:null
  }

  // Utils
  functionsUtil = null;
  governanceUtil = null;

  loadUtils(){
    if (this.governanceUtil){
      this.governanceUtil.setProps(this.props);
    } else {
      this.governanceUtil = new GovernanceUtil(this.props);
    }

    this.functionsUtil = this.governanceUtil.functionsUtil;
  }

  async componentWillMount(){
    this.loadUtils();
    this.loadData();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
    this.validateForm();
    this.checkInputs();

    const customABIChanged = prevState.customABI !== this.state.customABI;
    // console.log('customABIChanged',customABIChanged,this.state.selectedContract);
    if (customABIChanged && this.state.selectedContract === 'custom'){
      this.loadFunctionsOptions();
    }
  }

  loadData(){
    const availableContracts = this.functionsUtil.getGlobalConfig(['governance','props','availableContracts']);
    const contractOptions = [
      {label:'Select a Contract',value:null}
    ];

    Object.keys(availableContracts).forEach( contractName => {
      contractOptions.push({label:contractName,value:contractName});
    });

    contractOptions.push({label:'Custom',value:'custom'});

    this.setState({
      contractOptions,
      availableContracts
    });
  }

  handleInput(field,e,type=null){
    let value = e.target.value;
    this.setState({
      [field]:value
    });
  }

  validateForm(){
    const validated = this.state.title.length>0 && this.state.description.length>0 && Object.values(this.state.actions).length>0;
    if (validated !== this.state.validated){
      this.setState({
        validated
      });
    }
  }

  getContractABI(selectedContract=null){
    selectedContract = selectedContract ? selectedContract : this.state.selectedContract;

    let contractABI = null;
    try {
      contractABI = selectedContract === 'custom' ? JSON.parse(this.state.customABI) : this.state.availableContracts[selectedContract];
    } catch (err) {
      
    }
    return contractABI;
  }

  loadFunctionsOptions(selectedContract=null){
    let actionInputs = null;
    let functionsOptions = null;
    let selectedFunction = null;
    let selectedSignature = null;
    let availableFunctions = null;

    const contractABI = this.getContractABI(selectedContract);
    if (contractABI){
      availableFunctions = contractABI.filter( f => (!f.constant && f.type === 'function' && f.inputs.length>0 && ['nonpayable','payable'].includes(f.stateMutability)) )
      functionsOptions = availableFunctions.map( (f,index) => ({
                          label:f.name,
                          value:index
                        }));

      // Add default option
      functionsOptions.unshift({label:'Select a Function',value:null});
    }

    // console.log('loadFunctionsOptions',contractABI,functionsOptions);

    this.setState({
      actionInputs,
      functionsOptions,
      selectedFunction,
      selectedSignature,
      availableFunctions
    });
  }

  changeContract(e){
    const selectedContract = e.target.value;
    const selectedContractChanged = selectedContract !== this.state.selectedContract;

    if (selectedContractChanged){

      // Reset function
      let selectedFunction = null;
      let selectedSignature = null;

      const newState = {
        selectedContract,
        selectedFunction,
        selectedSignature
      };

      // Load contract functions
      if (selectedContract !== null){
        const contractABI = this.getContractABI(selectedContract);
        if (contractABI){
          this.loadFunctionsOptions(selectedContract);
        } else {
          newState.functionsOptions = null;
        }
      }

      // console.log('changeContract',newState);

      this.setState(newState);
    }
  }

  changeFunction(e){
    const actionValue = 0;
    let actionInputs = null;
    const selectedSignature = e.target.value;
    let selectedFunction = this.state.availableFunctions.find( (f,index) => (index === parseInt(selectedSignature)) );

    if (selectedFunction){
      actionInputs = new Array(selectedFunction.inputs.length);
    } else {
      selectedFunction  = null;
    }

    this.setState({
      actionValue,
      actionInputs,
      selectedFunction,
      selectedSignature
    })
  }
  validateField(value,type){
    if (value===null){
      return false;
    }
    let valid = true;
    if (type === 'json'){
      valid = this.functionsUtil.isValidJSON(value);
    } else {
      const fieldPattern = this.getPatternByFieldType(type);
      if (fieldPattern){
        valid = value.toString().match(fieldPattern) !== null;
      }
    }
    return valid;
  }
  getPatternByFieldType(type,returnString=false){
    let fieldPattern = null;
    switch (type){
      case 'address':
        fieldPattern = '^0x[a-fA-F0-9]{40}$';
      break;
      case 'address[]':
        fieldPattern = '^((0x[a-fA-F0-9]{40})[,]?)+$';
      break;
      case 'string':
        fieldPattern = '[\\w]+';
      break;
      case 'bool':
        fieldPattern = '(0|1)';
      break;
      case 'uint256':
      case 'uint8':
        fieldPattern = '[\\d]+';
      break;
      default:
        fieldPattern = null;
      break;
    }

    if (!returnString && fieldPattern){
      fieldPattern = new RegExp(fieldPattern);
    }

    return fieldPattern;
  }

  checkInputs(){

    if (!this.state.actionInputs || !this.state.selectedFunction){
      return false;
    }

    const inputs = this.state.selectedFunction.inputs;
    let actionValid = Object.values(this.state.actionInputs).length === inputs.length;

    if (actionValid){
      Object.values(this.state.actionInputs).forEach( (inputValue,inputIndex) => {
        const inputInfo = inputs[inputIndex];
        const fieldPattern = this.getPatternByFieldType(inputInfo.type);
        const inputValid = fieldPattern ? inputValue.match(fieldPattern) !== null : true;
        actionValid = actionValid && inputValid;
        // console.log('checkInputs',inputInfo.name,inputInfo.type,inputValue,inputValid,actionValid);
      });
    }

    // Check custom token
    if (actionValid && this.state.selectedContract === 'custom'){
      actionValid = actionValid && this.validateField(this.state.customABI,'json') && this.validateField(this.state.customAddress,'address');
    }

    // console.log('actionValid',this.state.selectedContract,this.validateField(this.state.customABI,'json'),this.state.customAddress,this.validateField(this.state.customAddress,'address'),actionValid);

    if (actionValid !== this.state.actionValid){
      this.setState({
        actionValid
      });
    }
  }

  valueChange(e,inputIndex){
    let actionValue = e.target.value;
    this.setState({
      actionValue
    });
  }

  inputChange(e,inputIndex){
    let inputValue = e.target.value;

    this.setState((prevState) => ({
      actionInputs:{
        ...prevState.actionInputs,
        [inputIndex]:inputValue
      }
    }));
  }

  deleteAction(){
    if (this.state.editAction !== null){
      let actions = this.state.actions;
      if (actions[this.state.editAction]){
        delete actions[this.state.editAction];
        actions = Object.values(actions);
        const editAction = null;
        const actionInputs = null;
        const selectedContract = null;
        const selectedFunction = null;
        const selectedSignature = null;

        this.setState({
          actions,
          editAction,
          actionInputs,
          selectedContract,
          selectedFunction,
          selectedSignature
        });
      }
    }
  }

  addAction(){

    // Check inputs number
    const inputs = Object
                    .values(this.state.actionInputs).filter( v => v.length>0 )
                    .map( (inputValue,inputIndex) => {
                      const inputInfo = this.state.selectedFunction.inputs[inputIndex];
                      switch (inputInfo.type){
                        case 'address[]':
                          inputValue = inputValue.split(',');
                        break;
                        case 'uint256[]':
                          inputValue = inputValue.split(',').map( n => this.functionsUtil.toBN(n) );
                        break;
                        case 'uint256':
                          inputValue = this.functionsUtil.toBN(inputValue);
                        break;
                        default:
                          if (inputInfo.type.substr(-2) === '[]'){
                            inputValue = inputValue.split(',');
                          }
                        break;
                      }

                      return inputValue;
                    });

    if (inputs.length<this.state.selectedFunction.inputs.length){
      return false;
    }

    // Check contract
    let target = null;
    if (this.state.selectedContract !== 'custom'){
      const contract = this.functionsUtil.getContractByName(this.state.selectedContract);
      if (!contract){
        return false;
      } else {
        target = contract._address;
      }
    } else {
      const contractABIValid = this.functionsUtil.isValidJSON(this.state.customABI);
      if (!contractABIValid){
        return false;
      } else {
        target = this.state.customAddress;
      }
    }
    
    const customABI = this.state.customABI;
    const customAddress = this.state.customAddress;
    const inputTypes = this.state.selectedFunction.inputs.map( i => (i.type) );
    const calldata = this.props.web3.eth.abi.encodeParameters(inputTypes,inputs);
    const signature = this.state.selectedFunction.name+'('+inputTypes.join(',')+')';
    const value = this.state.actionValue ? this.functionsUtil.BNify(this.state.actionValue).toFixed(0) : this.functionsUtil.BNify(0).toFixed(0);

    const action = {
      params:{
        value,
        target,
        calldata,
        signature
      },
      customABI,
      customAddress,
      inputs:this.state.actionInputs,
      function:this.state.selectedFunction,
      contract:this.state.selectedContract,
      signature:this.state.selectedSignature
    };

    const newAction = false;
    const actions = Object.values(this.state.actions);

    if (this.state.editAction === null){
      actions.push(action);
    } else {
      actions[this.state.editAction] = action;
    }

    const editAction = null;

    this.setState({
      actions,
      newAction,
      editAction
    });
  }

  setEditAction(editAction){

    if (!this.state.actions[editAction]){
      return false;
    }

    if (editAction === this.state.editAction){
      return false;
    }

    const action = this.state.actions[editAction];

    const newAction = false;
    const actionInputs = action.inputs;
    const customABI = action.customABI;
    const actionValue = action.params.value;
    const selectedContract = action.contract;
    const selectedFunction = action.function;
    const customAddress = action.customAddress;
    const selectedSignature = action.signature;

    this.setState({
      customABI,
      newAction,
      editAction,
      actionValue,
      actionInputs,
      customAddress,
      selectedContract,
      selectedFunction,
      selectedSignature
    });
  }

  setNewAction(newAction){
    if (newAction === this.state.newAction){
      return false;
    }

    const editAction = null;
    const selectedContract = null;
    const selectedFunction = null;

    this.setState({
      newAction,
      editAction,
      selectedContract,
      selectedFunction
    });
  }

  async cancelTransaction(){
    this.setState({
      processing: {
        txHash:null,
        loading:false
      }
    });
  }

  handleSubmit(e){
    e.preventDefault();

    const callback = (tx,error) => {
      // Send Google Analytics event
      const eventData = {
        eventLabel: tx.status,
        eventAction: 'propose',
        eventCategory: 'Proposal',
      };

      if (error){
        eventData.eventLabel = this.functionsUtil.getTransactionError(error);
      }

      // Send Google Analytics event
      if (error || eventData.status !== 'error'){
        this.functionsUtil.sendGoogleAnalyticsEvent(eventData);
      }

      const txSucceeded = tx.status === 'success';

      const newState = {
        processing: {
          txHash:null,
          loading:false
        }
      };
      
      if (txSucceeded){
        newState.actionValue = 0;
        newState.customABI = null;
        newState.newAction = null;
        newState.editAction = null;
        newState.actionInputs = null;
        newState.customAddress = null;
        newState.proposalCreated = true;
        newState.selectedContract = null;
        newState.functionsOptions = null;
        newState.selectedFunction = null;
        newState.selectedSignature = null;
      } else {
        newState.txError = true;
      }

      this.setState(newState);
    };

    const callbackReceipt = (tx) => {
      const txHash = tx.transactionHash;
      this.setState((prevState) => ({
        processing: {
          ...prevState.processing,
          txHash
        }
      }));
    };

    const targets = [];
    const values = [];
    const signatures = [];
    const calldatas = [];
    const description = '#'+this.state.title+"\n"+this.state.description;

    Object.values(this.state.actions).forEach( action => {
      values.push(action.params.value);
      targets.push(action.params.target);
      calldatas.push(action.params.calldata);
      signatures.push(action.params.signature);
    });

    this.governanceUtil.propose(targets, values, signatures, calldatas, description, callback, callbackReceipt);
    // this.governanceUtil.proposeAndVoteFor(targets, values, signatures, calldatas, description, callback, callbackReceipt);

    this.setState((prevState) => ({
      processing: {
        ...prevState.processing,
        loading:true
      }
    }));

    return false;
  }

  formValidated(){

  }

  render() {

    return (
      <Flex
        width={1}
        alignItems={'center'}
        flexDirection={'column'}
        justifyContent={'center'}
      >
        <Title
          mb={[3,4]}
        >
          Create Proposal
        </Title>
        {
        this.state.proposalCreated ? (
          <DashboardCard
            cardProps={{
              py:3,
              px:4,
              width:[1,'auto']
            }}
          >
            <Flex
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={'center'}
            >
              <Icon
                name={'Done'}
                align={'center'}
                size={ this.props.isMobile ? '1.4em' : '2.2em' }
                color={this.props.theme.colors.transactions.status.completed}
              />
              <Text
                mt={1}
                fontWeight={3}
                fontSize={[2,3]}
                color={'dark-gray'}
                textAlign={'center'}
              >
                The proposal has been successfully created
              </Text>
            </Flex>
          </DashboardCard>
        ) : 
        // Has balance
        this.props.votes && this.props.votes.gte(this.props.proposalThreshold) ? (
          <Form
            width={1}
            validated={this.state.validated}
            onSubmit={this.handleSubmit.bind(this)}
          >
            <Flex
              mb={2}
              width={1}
              flexDirection={['column','row']}
              justifyContent={['center','space-between']}
            >
              <Flex
                width={[1,0.48]}
                flexDirection={'column'}
              >
                <Flex
                  pb={2}
                  width={1}
                  mb={[2,3]}
                  borderColor={'divider'}
                  borderBottom={'1px solid transparent'}
                >
                  <Heading.h4
                    fontSize={[2,3]}
                    fontWeight={[2,3]}
                  >
                    Proposal Description
                  </Heading.h4>
                </Flex>
                <Flex
                  flexDirection={'column'}
                >
                  <Field
                    width={1}
                    label={"Title"}
                    validated={this.state.validated}
                  >
                    <Input
                      required
                      width={1}
                      type={'text'}
                      className={styles.input}
                      value={this.state.title}
                      placeholder={'Title of your proposal'}
                      onChange={ e => this.handleInput('title',e) }
                    />
                  </Field>
                </Flex>
                <Flex
                  flexDirection={'column'}
                >
                  <Field
                    width={1}
                    label={'Description'}
                    validated={this.state.validated}
                  >
                    <Textarea
                      required
                      rows={8}
                      width={1}
                      className={styles.input}
                      value={this.state.description}
                      placeholder={'Description of your proposal'}
                      onChange={ e => this.handleInput('description',e) }
                    />
                  </Field>
                </Flex>
              </Flex>

              <Flex
                width={[1,0.48]}
                flexDirection={'column'}
              >
                <Flex
                  pb={2}
                  width={1}
                  mb={[2,3]}
                  borderColor={'divider'}
                  borderBottom={'1px solid transparent'}
                >
                  <Heading.h4
                    fontSize={[2,3]}
                    fontWeight={[2,3]}
                  >
                    Actions
                  </Heading.h4>
                </Flex>
                <Flex
                  flexDirection={'column'}
                >
                  {
                    Object.values(this.state.actions).map( (action,actionIndex) => {
                      return (
                        <DashboardCard
                          cardProps={{
                            py:2,
                            px:3,
                            mb:3,
                            width:1
                          }}
                          titleParentProps={{
                            ml:0,
                            my:1,
                            justifyContent:'center'
                          }}
                          titleProps={{
                            fontSize:2,
                            fontWeight:3
                          }}
                          isInteractive={true}
                          key={`action_${actionIndex}`}
                          handleClick={ e => this.setEditAction(actionIndex) }
                          title={ this.state.editAction === actionIndex ? 'Edit Action' : null }
                        >
                          {
                            this.state.editAction === actionIndex ? (
                              <Flex
                                width={1}
                                alignItems={'center'}
                                flexDirection={'column'}
                                justifyContent={'center'}
                              >
                                <Field
                                  style={{
                                    width:'100%',
                                    display:'flex',
                                    alignItems:'stretch',
                                    flexDirection:'column'
                                  }}
                                  label={"Select Contract"}
                                >
                                  <Select
                                    style={{
                                      width:'100%'
                                    }}
                                    required={true}
                                    value={this.state.selectedContract}
                                    options={this.state.contractOptions}
                                    onChange={this.changeContract.bind(this)}
                                  />
                                </Field>
                                {
                                  this.state.selectedContract && this.state.selectedContract === 'custom' &&
                                  (
                                    <Flex
                                      width={1}
                                      flexDirection={'column'}
                                    >
                                      <Field
                                        width={1}
                                        label={"Contract Address"}
                                        validated={this.state.validated}
                                      >
                                        <Input
                                          required
                                          width={1}
                                          type={'text'}
                                          className={styles.input}
                                          placeholder={'Custom contract address'}
                                          pattern={this.getPatternByFieldType('address',true)}
                                          onChange={ e => this.handleInput('customAddress',e,'address') }
                                          value={this.state.customAddress ? this.state.customAddress : ''}
                                        />
                                      </Field>
                                      <Field
                                        width={1}
                                        label={'Custom ABI'}
                                        validated={this.state.validated}
                                      >
                                        <Textarea
                                          required
                                          rows={8}
                                          width={1}
                                          className={styles.input}
                                          placeholder={'Insert the ABI of your contract'}
                                          onChange={ e => this.handleInput('customABI',e,'json') }
                                          value={this.state.customABI ? this.state.customABI : ''}
                                        />
                                      </Field>
                                    </Flex>
                                  )
                                }
                                {
                                  this.state.selectedContract && this.state.functionsOptions &&
                                    <Field
                                      style={{
                                        width:'100%',
                                        display:'flex',
                                        alignItems:'stretch',
                                        flexDirection:'column'
                                      }}
                                      label={"Select Function"}
                                    >
                                      <Select
                                        style={{
                                          width:'100%'
                                        }}
                                        required={true}
                                        options={this.state.functionsOptions}
                                        onChange={this.changeFunction.bind(this)}
                                        value={this.state.selectedSignature ? this.state.selectedSignature : ''}
                                      />
                                    </Field>
                                }
                                {
                                  this.state.selectedFunction && this.state.selectedFunction.payable && (
                                    <Field
                                      label={`Value`}
                                      style={{
                                        width:'100%',
                                        display:'flex',
                                        alignItems:'stretch',
                                        flexDirection:'column'
                                      }}
                                    >
                                      <Input
                                        required
                                        width={1}
                                        type={'number'}
                                        className={styles.input}
                                        placeholder={`Enter ETH value`}
                                        onChange={ e => this.valueChange(e) }
                                        value={this.state.actionValue ? this.state.actionValue : 0}
                                      />
                                    </Field>
                                  )
                                }
                                {
                                  this.state.selectedFunction &&
                                    this.state.selectedFunction.inputs.map( (input,inputIndex) => {
                                      const fieldType = ['uint256','bool'].includes(input.type) ? 'number' : 'text';
                                      const fieldPattern = this.getPatternByFieldType(input.type,true);
                                      return (
                                        <Field
                                          style={{
                                            width:'100%',
                                            display:'flex',
                                            alignItems:'stretch',
                                            flexDirection:'column'
                                          }}
                                          key={`input_${inputIndex}`}
                                          label={`${input.name} (${input.type})`}
                                        >
                                          <Input
                                            required
                                            width={1}
                                            type={fieldType}
                                            pattern={fieldPattern}
                                            className={styles.input}
                                            placeholder={`${input.name} (${input.type})`}
                                            onChange={ e => this.inputChange(e,inputIndex) }
                                            value={this.state.actionInputs[inputIndex] ? this.state.actionInputs[inputIndex] : ''}
                                          />
                                        </Field>
                                      )
                                    })
                                }
                                {
                                  this.state.selectedContract && this.state.selectedFunction &&
                                    <Flex
                                      mb={2}
                                      width={1}
                                      alignItems={'center'}
                                      flexDirection={'column'}
                                      justifyContent={'center'}
                                    >
                                      <RoundButton
                                        buttonProps={{
                                          px:[0,4],
                                          width:[1,'auto'],
                                          type:'button',
                                          disabled:!this.state.actionValid
                                        }}
                                        handleClick={this.addAction.bind(this)}
                                      >
                                        Save Action
                                      </RoundButton>
                                      <Link
                                        mt={2}
                                        color={'red'}
                                        hoverColor={'red'}
                                        onClick={this.deleteAction.bind(this)}
                                      >
                                        Delete Action
                                      </Link>
                                    </Flex>
                                }
                              </Flex>
                            ) : (
                              <Flex
                                width={1}
                                alignItems={'center'}
                                flexDirection={'row'}
                                justifyContent={'space-between'}
                              >
                                <Text>
                                  {action.contract} - {action.params.signature}
                                </Text>
                                <Flex
                                  p={['4px','7px']}
                                  borderRadius={'50%'}
                                  alignItems={'center'}
                                  justifyContent={'center'}
                                  backgroundColor={ this.props.theme.colors.transactions.actionBg.redeem }
                                >
                                  <Icon
                                    name={'Edit'}
                                    align={'center'}
                                    color={'redeem'}
                                    size={ this.props.isMobile ? '1.2em' : '1.4em' }
                                  />
                                </Flex>
                              </Flex>
                            )
                          }
                        </DashboardCard>
                      );
                    })
                  }
                  {
                    (!this.state.actions || Object.values(this.state.actions).length<this.props.proposalMaxOperations) && (
                      <DashboardCard
                        cardProps={{
                          py:2,
                          px:3,
                          mb:3,
                          width:1
                        }}
                        titleParentProps={{
                          ml:0,
                          my:1,
                          justifyContent:'center'
                        }}
                        titleProps={{
                          fontSize:2,
                          fontWeight:3
                        }}
                        isInteractive={true}
                        handleClick={ e => this.setNewAction(true) }
                        title={ this.state.newAction ? 'Add Action' : null }
                      >
                        {
                          this.state.newAction ? (
                            <Flex
                              width={1}
                              alignItems={'center'}
                              flexDirection={'column'}
                              justifyContent={'center'}
                            >
                              <Field
                                style={{
                                  width:'100%',
                                  display:'flex',
                                  alignItems:'stretch',
                                  flexDirection:'column'
                                }}
                                label={"Select Contract"}
                              >
                                <Select
                                  style={{
                                    width:'100%'
                                  }}
                                  required={true}
                                  options={this.state.contractOptions}
                                  onChange={this.changeContract.bind(this)}
                                />
                              </Field>
                              {
                                this.state.selectedContract && this.state.selectedContract === 'custom' &&
                                (
                                  <Flex
                                    width={1}
                                    flexDirection={'column'}
                                  >
                                    <Field
                                      width={1}
                                      label={"Contract Address"}
                                      validated={this.state.validated}
                                    >
                                      <Input
                                        required
                                        width={1}
                                        type={'text'}
                                        className={styles.input}
                                        placeholder={'Custom contract address'}
                                        pattern={this.getPatternByFieldType('address',true)}
                                        onChange={ e => this.handleInput('customAddress',e,'address') }
                                        value={this.state.customAddress ? this.state.customAddress : ''}
                                      />
                                    </Field>
                                    <Field
                                      width={1}
                                      label={'Custom ABI'}
                                      validated={this.state.validated}
                                    >
                                      <Textarea
                                        required
                                        rows={8}
                                        width={1}
                                        className={styles.input}
                                        placeholder={'Insert the ABI of your contract'}
                                        onChange={ e => this.handleInput('customABI',e,'json') }
                                        value={this.state.customABI ? this.state.customABI : ''}
                                      />
                                    </Field>
                                  </Flex>
                                )
                              }
                              {
                                this.state.selectedContract && this.state.functionsOptions && 
                                  <Field
                                    style={{
                                      width:'100%',
                                      display:'flex',
                                      alignItems:'stretch',
                                      flexDirection:'column'
                                    }}
                                    label={"Select Function"}
                                  >
                                    <Select
                                      style={{
                                        width:'100%'
                                      }}
                                      required={true}
                                      options={this.state.functionsOptions}
                                      onChange={this.changeFunction.bind(this)}
                                      value={this.state.selectedSignature ? this.state.selectedSignature : ''}
                                    />
                                  </Field>
                              }
                              {
                                this.state.selectedFunction && this.state.selectedFunction.payable && (
                                  <Field
                                    label={`Value`}
                                    style={{
                                      width:'100%',
                                      display:'flex',
                                      alignItems:'stretch',
                                      flexDirection:'column'
                                    }}
                                  >
                                    <Input
                                      required
                                      width={1}
                                      type={'number'}
                                      className={styles.input}
                                      placeholder={`Enter ETH value`}
                                      onChange={ e => this.valueChange(e) }
                                      value={this.state.actionValue ? this.state.actionValue : 0}
                                    />
                                  </Field>
                                )
                              }
                              {
                                this.state.selectedFunction &&
                                  this.state.selectedFunction.inputs.map( (input,inputIndex) => {
                                    const fieldType = ['uint256','bool'].includes(input.type) ? 'number' : 'text';
                                    const fieldPattern = this.getPatternByFieldType(input.type,true);
                                    return (
                                      <Field
                                        style={{
                                          width:'100%',
                                          display:'flex',
                                          alignItems:'stretch',
                                          flexDirection:'column'
                                        }}
                                        key={`input_${inputIndex}`}
                                        label={`${input.name} (${input.type})`}
                                      >
                                        <Input
                                          required
                                          width={1}
                                          type={fieldType}
                                          pattern={fieldPattern}
                                          className={styles.input}
                                          placeholder={`${input.name} (${input.type})`}
                                          onChange={ e => this.inputChange(e,inputIndex) }
                                          value={this.state.actionInputs[inputIndex] ? this.state.actionInputs[inputIndex] : ''}
                                        />
                                      </Field>
                                    )
                                  })
                              }
                              {
                                this.state.selectedContract && this.state.selectedFunction &&
                                  <Flex
                                    width={1}
                                    alignItems={'center'}
                                    justifyContent={'center'}
                                  >
                                    <RoundButton
                                      buttonProps={{
                                        px:[0,4],
                                        type:'button',
                                        width:[1,'auto'],
                                        disabled:!this.state.actionValid
                                      }}
                                      handleClick={this.addAction.bind(this)}
                                    >
                                      Add Action
                                    </RoundButton>
                                  </Flex>
                              }
                            </Flex>
                          ) : (
                            <Flex
                              width={1}
                              alignItems={'center'}
                              flexDirection={'row'}
                              justifyContent={'space-between'}
                            >
                              <Text>
                                Add Action
                              </Text>
                              <Flex
                                p={['4px','7px']}
                                borderRadius={'50%'}
                                alignItems={'center'}
                                justifyContent={'center'}
                                backgroundColor={ this.props.theme.colors.transactions.actionBg.redeem }
                              >
                                <Icon
                                  name={'Add'}
                                  align={'center'}
                                  color={'redeem'}
                                  size={ this.props.isMobile ? '1.2em' : '1.4em' }
                                />
                              </Flex>
                            </Flex>
                          )
                        }
                      </DashboardCard>
                    )
                  }

                </Flex>
              </Flex>
            </Flex>
            <Flex
              mb={3}
              width={1}
              alignItems={'center'}
              justifyContent={'center'}
            >
              {
                // Sending transaction
                this.state.processing && this.state.processing.loading ? (
                  <TxProgressBar
                    web3={this.props.web3}
                    hash={this.state.processing.txHash}
                    waitText={`Proposal creation estimated in`}
                    endMessage={`Finalizing proposal creation request...`}
                    cancelTransaction={this.cancelTransaction.bind(this)}
                  />
                ) : (
                  <RoundButton
                    buttonProps={{
                      type:'submit',
                      width:[1,'15em'],
                      disabled:!this.state.validated
                    }}
                  >
                    Submit Proposal
                  </RoundButton>
                )
              }
            </Flex>
          </Form>
        ) : this.props.balance && this.props.balance.gte(this.props.proposalThreshold) ? (
          <Flex
            width={1}
            alignItems={'center'}
            flexDirection={'column'}
            justifyContent={'center'}
          >
            <Text
              mb={3}
              fontWeight={2}
              fontSize={[2,3]}
              color={'dark-gray'}
              textAlign={'center'}
            >
              Please delegate your votes to yourself to create a new proposal.
            </Text>
            <DelegateVote
              {...this.props}
            />
          </Flex>
        ) : (
          <Text
            fontWeight={2}
            fontSize={[2,3]}
            color={'dark-gray'}
            textAlign={'center'}
          >
            You need at least {this.functionsUtil.formatMoney(this.functionsUtil.fixTokenDecimals(this.props.proposalThreshold,18),0)} delegated votes to send a new proposal.
          </Text>
        )
       }
      </Flex>
    );
  }
}

export default NewProposal;