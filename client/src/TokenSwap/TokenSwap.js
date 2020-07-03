import React, { Component } from 'react';
import { Flex, Box, Text, Button } from "rimble-ui";
import FunctionsUtil from '../utilities/FunctionsUtil';
import AssetSelector from '../AssetSelector/AssetSelector';

class TokenSwap extends Component {

  state = {
    tokenConfig:null,
    selectedFromToken:null,
    selectedDestToken:null,
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

  async loadKyberWidget(){

    if (!this.state.selectedFromToken || !this.state.selectedDestToken){
      return false;
    }

    const provider = 'kyberSwap';
    const providerInfo = this.functionsUtil.getGlobalConfig(['payments','providers',provider]);
    if (providerInfo.enabled && providerInfo.remoteResources){

      const globalConfigs = this.functionsUtil.getGlobalConfigs();
      const remoteResources = providerInfo.remoteResources;

      Object.keys(remoteResources).forEach((url,j) => {

        const resourceType = url.split('.').pop().toLowerCase();

        switch (resourceType){
          case 'js':
            const scriptID = `script_${provider}_${j}_${this.state.selectedFromToken}_${this.state.selectedDestToken}`;

            if (!document.getElementById(scriptID)){
              const script = document.createElement("script");
              const remoteResourceParams = remoteResources[url];
              const callback = remoteResourceParams && remoteResourceParams.callback ? remoteResourceParams.callback : null;
              const precall = remoteResourceParams && remoteResourceParams.precall ? remoteResourceParams.precall : null;

              if (precall && typeof precall === 'function'){
                const precallProps = {
                  baseToken:this.state.selectedFromToken,
                  selectedToken:this.state.selectedDestToken,
                  buttonId:`kyber-swapper-${this.state.selectedFromToken}_${this.state.selectedDestToken}`
                };
                precall(precallProps,globalConfigs,providerInfo);
              }

              if (callback && typeof callback === 'function'){
                if (script.readyState) {  // only required for IE <9
                  script.onreadystatechange = function() {
                    if ( script.readyState === 'loaded' || script.readyState === 'complete' ) {
                      script.onreadystatechange = null;
                      callback();
                    }
                  };
                } else {  //Others
                  script.onload = callback;
                }
              }

              script.id = scriptID;
              script.className = `script_${provider}`;
              script.src = url;
              script.async = true;

              if (remoteResourceParams && remoteResourceParams.parentElement){
                remoteResourceParams.parentElement.appendChild(script)
              } else {
                document.head.appendChild(script);
              }
            }
          break;
          case 'css':
            const stylesheetId = `stylesheet_${provider}_${j}`;

            if (!document.getElementById(stylesheetId)){
              const style = document.createElement("link");

              style.id = stylesheetId;
              style.rel = 'stylesheet';
              style.href = url;

              document.head.appendChild(style);
            }
          break;
          default:
          break;
        }
      });
    }

    this.setState({
      providerInfo
    });
  }

  async componentWillMount(){
    this.loadUtils();
    await this.loadTokens();
  }

  async loadTokens(){
    const selectedFromToken = Object.keys(this.props.toolProps.availableTokens)[0];

    await this.functionsUtil.asyncForEach(Object.keys(this.props.toolProps.availableTokens),async (token) => {
      const tokenConfig = this.props.toolProps.availableTokens[token];
      const tokenContract = this.functionsUtil.getContractByName(tokenConfig.token);
      if (!tokenContract && tokenConfig.abi){
        await this.props.initContract(tokenConfig.token,tokenConfig.address,tokenConfig.abi);
      }
    });

    this.selectFromToken(selectedFromToken);
  }

  async componentDidUpdate(prevProps,prevState){
    this.loadUtils();

    const fromTokenChanged = prevState.selectedFromToken !== this.state.selectedFromToken;
    const destTokenChanged = prevState.selectedDestToken !== this.state.selectedDestToken;
    if ((fromTokenChanged ||  destTokenChanged) && this.state.selectedFromToken && this.state.selectedDestToken){
      this.loadKyberWidget();
    }
  }

  selectFromToken = async (selectedFromToken) => {
    let selectedDestToken = null;
    const availableDestinationTokens = {};
    const supportedTokens = this.functionsUtil.getGlobalConfig(['payments','providers','kyberSwap','supportedTokens']);

    supportedTokens.forEach( token => {
      if (token !== selectedFromToken){
        if (!selectedDestToken){
          selectedDestToken = token;
        }
        availableDestinationTokens[token] = {
          token
        };
      }
    });

    const baseToken = this.functionsUtil.getGlobalConfig(['baseToken']);
    if (baseToken !== selectedFromToken){
      availableDestinationTokens[baseToken] = {
        token:baseToken
      };
    }

    this.setState({
      selectedFromToken,
      availableDestinationTokens
    },() => {
      this.selectDestToken(selectedDestToken);
    });
  }

  selectDestToken = async (selectedDestToken) => {
    this.setState({
      selectedDestToken
    });
  }

  swap = () => {
    const globalConfigs = this.functionsUtil.getGlobalConfigs();
    const paymentProvider = this.state.providerInfo;
    const initProps = {
      baseToken:this.state.selectedFromToken,
      selectedToken:this.state.selectedDestToken,
      buttonId:`kyber-swapper-${this.state.selectedFromToken}_${this.state.selectedDestToken}`
    };
    const initParams = paymentProvider && paymentProvider.getInitParams ? paymentProvider.getInitParams(initProps,globalConfigs) : null;

    // Render the Payment Provider
    if (typeof paymentProvider.render === 'function'){
      paymentProvider.render(initParams,null,initProps);
    }

    // Send GA event
    this.functionsUtil.sendGoogleAnalyticsEvent({
      eventCategory: 'Tools',
      eventAction: 'TokenSwap',
      eventLabel: `${this.state.selectedFromToken}_${this.state.selectedDestToken}`
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
              Select asset to swap:
            </Text>
            <AssetSelector
              {...this.props}
              showBalance={false}
              isSearchable={true}
              onChange={this.selectFromToken}
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
                  showBalance={false}
                  isSearchable={true}
                  onChange={this.selectDestToken}
                  selectedToken={this.state.selectedDestToken}
                  availableTokens={this.state.availableDestinationTokens}
                />
              </Box>
          }
          <Flex
            mt={2}
            width={1}
            justifyContent={'center'}
          >
            <Button
              my={2}
              mx={[0, 2]}
              size={'medium'}
              borderRadius={4}
              mainColor={'blue'}
              onClick={ e => this.swap(e) }
              disabled={ !this.state.selectedFromToken || !this.state.selectedDestToken }
            >
              SWAP TOKENS
            </Button>
          </Flex>
        </Flex>
      </Flex>
    );
  }
}

export default TokenSwap;
