import React, { Component } from 'react';
import FunctionsUtil from '../utilities/FunctionsUtil';
import ButtonLoader from '../ButtonLoader/ButtonLoader';
import AssetSelector from '../AssetSelector/AssetSelector';
import { Flex, Box, Text, Input, Link, Progress } from "rimble-ui";

class NexusMutual extends Component {

  state = {
    step:1,
    steps:{
      1:'Get Quote',
      2:'Enable NXS',
      3:'Buy Cover'
    },
    loading:false,
    amountValue:'',
    periodValue:'',
    quoteResponse:null,
    selectedToken:'DAI'
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
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();
  }

  async changeSelectedToken(selectedToken){
    this.setState({
      selectedToken
    });
  }

  changeAmount = (e) => {
    const amountValue = e.target.value.length && !isNaN(e.target.value) ? e.target.value : '';
    this.setState({
      amountValue
    });
  }

  changePeriod = (e) => {

    const periodValue = e.target.value.length && !isNaN(e.target.value) ? e.target.value : '';
    this.setState({
      periodValue
    });
  }

  async getQuote() {

    this.setState({
      loading:true
    });

    let quoteResponse = await this.functionsUtil.makeRequest(`https://api.nexusmutual.io/getQuote/${this.state.amountValue}/${this.state.selectedToken}/${this.state.periodValue}/0x78751B12Da02728F467A44eAc40F5cbc16Bd7934/M1`);

    const newState = {
      loading:false
    };

    if (quoteResponse){
      newState.quoteResponse = quoteResponse.data;
    }

    this.setState({
      quoteResponse
    });
  }

  render() {

    return (
      <Flex
        width={1}
        mt={[2,3]}
        alignItems={'center'}
        flexDirection={'column'}
        justifyContent={'center'}
      >
        <Flex
          mb={3}
          width={[1,0.36]}
          flexDirection={'column'}
        >
          <Flex
            mb={1}
            width={1}
            flexDirection={'row'}
            justifyContent={'space-between'}
          >
            {
              Object.keys(this.state.steps).map( stepIndex => (
                <Link
                  style={{
                    flexBasis:'0',
                    flex:'1 1 0px',
                    textDecoration:'none',
                    cursor:this.state.step>=stepIndex ? 'pointer' : 'default'
                  }}
                  fontSize={2}
                  textAlign={'center'}
                  key={`step_${stepIndex}`}
                  color={ this.state.step>=stepIndex ? 'blue' : 'cellText' }
                  hoverColor={ this.state.step>=stepIndex ? 'blue' : 'cellText' }
                  activeColor={ this.state.step>=stepIndex ? 'blue' : 'cellText' }
                >
                  {this.state.steps[stepIndex]}
                </Link>
              ) )
            }
          </Flex>
          <Flex
            width={1}
            flexDirection={'column'}
          >
            <Progress
              style={{
                width:'100%',
                height:'15px'
              }}
              value={(1/Object.keys(this.state.steps).length)*this.state.step}
            />
          </Flex>
        </Flex>
        <Flex
          width={[1,0.36]}
          alignItems={'stretch'}
          flexDirection={'column'}
          justifyContent={'center'}
        >
          <Box
            width={1}
          >
            <Text
              mb={1}>
              Select asset:
            </Text>
            <AssetSelector
              {...this.props}
              showBalance={false}
              selectedToken={this.state.selectedToken}
              onChange={this.changeSelectedToken.bind(this)}
              availableTokens={this.props.toolProps.availableTokens}
            />
          </Box>
          <Box
            mt={2}
            width={1}
          >
            <Text
              mb={1}
            >
              How much do you want to cover?
            </Text>
            <Input
              min={0}
              width={'100%'}
              type={"number"}
              required={true}
              height={'3.4em'}
              borderRadius={2}
              fontWeight={500}
              boxShadow={'none !important'}
              value={this.state.amountValue}
              onChange={this.changeAmount.bind(this)}
              border={`1px solid ${this.props.theme.colors.divider}`}
              placeholder={`Insert ${this.state.selectedToken.toUpperCase()} amount`}
            />
          </Box>
          <Box
            mt={2}
            width={1}
          >
            <Text
              mb={1}
            >
              For how many days?
            </Text>
            <Input
              min={0}
              width={'100%'}
              type={"number"}
              required={true}
              height={'3.4em'}
              borderRadius={2}
              fontWeight={500}
              boxShadow={'none !important'}
              value={this.state.periodValue}
              placeholder={'Insert days of coverage'}
              onChange={this.changePeriod.bind(this)}
              border={`1px solid ${this.props.theme.colors.divider}`}
            />
          </Box>
          <Flex
            mt={2}
            width={1}
            justifyContent={'center'}
          >
            <ButtonLoader
              buttonProps={{
                my:2,
                mx:[0, 2],
                size:'medium',
                borderRadius:4,
                mainColor:'blue',
                disabled:(!this.state.amountValue || !this.state.selectedToken || !this.state.periodValue)
              }}
              buttonText={'GET QUOTE'}
              isLoading={this.state.loading}
              handleClick={ e => this.getQuote(e) }
            />
          </Flex>
        </Flex>
      </Flex>
    );
  }
}

export default NexusMutual;