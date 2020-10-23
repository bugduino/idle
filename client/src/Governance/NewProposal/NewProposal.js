import Title from '../../Title/Title';
import React, { Component } from 'react';
import styles from './NewProposal.module.scss';
import RoundButton from '../../RoundButton/RoundButton';
import FunctionsUtil from '../../utilities/FunctionsUtil';
import DashboardCard from '../../DashboardCard/DashboardCard';
import { Flex, Text, Heading, Input, Form, Field, Textarea, Icon, Select } from "rimble-ui";

class NewProposal extends Component {

  state = {
    title:'',
    actions:[],
    description:'',
    validated:false,
    newAction:false,
    contractOptions:[],
    newActionInputs:null,
    functionsOptions:null,
    selectedContract:null,
    availableContracts:null,
  }

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
    this.loadData();
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
    this.validateForm();
  }

  loadData(){
    const availableContracts = this.functionsUtil.getGlobalConfig(['governance','props','availableContracts']);
    const contractOptions = [
      {label:'Select a Contract',value:null}
    ];

    Object.keys(availableContracts).forEach( contractName => {
      contractOptions.push({label:contractName,value:contractName});
    });

    this.setState({
      contractOptions,
      availableContracts
    });
  }

  handleInput(field,e){
    const value = e.target.value;
    const curState = this.state;
    curState[field] = value;
    this.setState({
      curState
    });
  }

  validateForm(){
    const validated = this.state.title.length>0 && this.state.description.length>0 && this.state.actions.length>0;
    if (validated !== this.state.validated){
      this.setState({
        validated
      });
    }
  }

  changeContract(e){
    const selectedContract = e.target.value;

    let functionsOptions = null;
    const selectedFunction = null;

    const contractABI = this.state.availableContracts[selectedContract];
    if (selectedContract && contractABI){
      functionsOptions = contractABI
                          .filter( f => (!f.constant && f.type === 'function' && f.inputs.length>0) )
                          .map( f => ({
                            label:f.name,
                            value:f.signature,
                          }));

      // Add default option
      functionsOptions.unshift({label:'Select a Function',value:null});
    }

    this.setState({
      selectedContract,
      selectedFunction,
      functionsOptions
    });
  }

  changeFunction(e){
    const functionSignature = e.target.value;
    const contractABI = this.state.availableContracts[this.state.selectedContract];
    const selectedFunction = contractABI.find( f => (f.signature === functionSignature) );
    const newActionInputs = new Array(selectedFunction.inputs.length);
    this.setState({
      newActionInputs,
      selectedFunction
    })
  }

  inputChange(e,inputIndex){
    const inputValue = e.target.value;

    this.setState((prevState) => ({
      newActionInputs:{
        ...prevState.newActionInputs,
        [inputIndex]:inputValue
      }
    }));
  }

  setNewAction(newAction){
    this.setState({
      newAction
    });
  }

  handleSubmit(){

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
        // Has balance
        this.props.votes && this.props.votes.gte(this.props.proposalThreshold) ? (
          <Form
            width={1}
            onSubmit={this.handleSubmit}
            validated={this.state.validated}
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
                  <DashboardCard
                    cardProps={{
                      py:2,
                      px:3,
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
                            this.state.selectedContract && 
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
                                />
                              </Field>
                          }
                          {
                            this.state.selectedFunction &&
                              this.state.selectedFunction.inputs.map( (input,inputIndex) => (
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
                                    type={'text'}
                                    className={styles.input}
                                    placeholder={`${input.name} (${input.type})`}
                                    onChange={ e => this.inputChange(e,inputIndex) }
                                    value={this.state.newActionInputs[inputIndex] ? this.state.newActionInputs[inputIndex] : ''}
                                  />
                                </Field>
                              ))
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
                                    px:3,
                                    width:[1,'auto']
                                  }}
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
                </Flex>
              </Flex>
            </Flex>
            <Flex
              width={1}
              alignItems={'center'}
              justifyContent={'center'}
            >
              <RoundButton
                buttonProps={{
                  type:'submit',
                  width:[1,'15em'],
                  disabled:!this.state.validated
                }}
              >
                Submit Proposal
              </RoundButton>
            </Flex>
          </Form>
        ) : (
          <Text
            fontWeight={4}
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