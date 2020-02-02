import React from "react";
import {
  Text,
  Modal,
  Box,
  Button,
  Flex,
  Image
} from "rimble-ui";
import Select from 'react-select';
import ModalCard from './ModalCard';
import ImageButton from '../../ImageButton/ImageButton';
import styles from './Header.module.scss';
import globalConfigs from '../../configs/globalConfigs';

class BuyModal extends React.Component {

  state = {
    availableProviders:null,
    selectedMethod:null,
    selectedProvider:null,
    selectedToken:null,
    selectedCountry:null
  }

  async loadRemoteResources() {
    // Load payments providers external remote resources
    Object.keys(globalConfigs.payments.providers).forEach((provider,i) => {

      const providerInfo = globalConfigs.payments.providers[provider];
      if (providerInfo.enabled && providerInfo.remoteResources && (providerInfo.supportedTokens.indexOf(this.props.selectedToken) !== -1 || providerInfo.supportedTokens.indexOf(globalConfigs.baseToken) !== -1) ){
        
        const remoteResources = providerInfo.remoteResources;

        Object.keys(remoteResources).forEach((url,j) => {

          const resourceType = url.split('.').pop().toLowerCase();

          switch (resourceType){
            case 'js':
              const scriptID = `script_${provider}_${j}_${this.props.selectedToken}`;

              if (!document.getElementById(scriptID)){
                const script = document.createElement("script");
                const remoteResourceParams = remoteResources[url];
                const callback = remoteResourceParams && remoteResourceParams.callback ? remoteResourceParams.callback : null;
                const precall = remoteResourceParams && remoteResourceParams.precall ? remoteResourceParams.precall : null;

                if (precall && typeof precall === 'function'){
                  precall(this.props,globalConfigs,providerInfo);
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
    });
  }

  async componentDidMount() {

    this.setState({
      selectToken:this.props.buyToken
    });

    this.loadRemoteResources();
  }

  async componentDidUpdate(prevProps) {
    if ( this.props.buyToken && prevProps.buyToken !== this.props.buyToken){
      this.selectToken(null,this.props.buyToken);
    }

    this.loadRemoteResources();
  }

  renderPaymentMethod = async (e,provider,buyParams) => {

    // Send Google Analytics event
    if (window.ga){

      await (new Promise( async (resolve, reject) => {
        const eventData = {
           'eventCategory': 'Buy', //required
           'eventAction': 'select_provider', //required
           'eventLabel': provider,
           'hitCallback': () => {
              resolve(true);
            },
           'hitCallbackFail' : () => {
              reject();
           }
        };
        window.ga('send', 'event', eventData);
      }));

      this.closeModal(e);
    } else {
      this.closeModal(e);
    }

    const paymentProvider = globalConfigs.payments.providers[provider];
    const initParams = paymentProvider && paymentProvider.getInitParams ? paymentProvider.getInitParams(this.props,globalConfigs,buyParams) : null;

    // Render the Payment Provider
    switch (provider){
      default:
        if (typeof paymentProvider.render === 'function'){
          paymentProvider.render(initParams,null,this.state,globalConfigs);
        }
      break;
    }
  }

  goBack = (e) => {
    e.preventDefault();

    if (this.state.selectedProvider){
      this.setState({
        selectedProvider:null,
      });
    } else if (this.state.selectedMethod){
      this.setState({
        selectedProvider:null,
        selectedCountry:null,
        selectedMethod:null
      });
    } else if (this.state.selectedToken){
      this.setState({
        selectedProvider:null,
        selectedCountry:null,
        selectedMethod:null,
        selectedToken:null
      });
    } else {
      this.resetModal();
    }
  }

  resetModal = () => {
    this.setState({
      availableProviders:null,
      selectedMethod:null,
      selectedProvider:null,
      selectedToken:null,
      selectedCountry:null
    });
  }

  closeModal = (e) => {
    this.resetModal();
    this.props.closeModal();
  }

  getProviderInfo = (provider) => {
    if (!globalConfigs.payments.providers[provider]){
      return false;
    }
    let providerInfo = globalConfigs.payments.providers[provider];
    if (typeof providerInfo.getInfo === 'function'){
      const newProviderInfo = providerInfo.getInfo(this.state);
      if (newProviderInfo && Object.keys(newProviderInfo).length){
        providerInfo = Object.assign(providerInfo,newProviderInfo);
      }
    }
    return providerInfo;
  }

  getDefaultPaymentProvider = (selectedMethod) => {
    const paymentMethod = globalConfigs.payments.methods[selectedMethod];
    if (paymentMethod.defaultProvider){
      return paymentMethod.defaultProvider;
    }
    return null;
  }

  getAvailablePaymentProviders = (selectedMethod,selectedToken) => {
    const availableProviders = [];

    Object.keys(globalConfigs.payments.providers).map((provider,i) => {
      const providerInfo = globalConfigs.payments.providers[provider];
      const providerSupportMethod = providerInfo.supportedMethods.indexOf(selectedMethod) !== -1;
      const providerSupportToken = selectedToken ? providerInfo.supportedTokens.indexOf(selectedToken) !== -1 : (providerInfo.supportedTokens.indexOf(this.props.selectedToken) !== -1 || providerInfo.supportedTokens.indexOf(globalConfigs.baseToken) !== -1);
      if (providerInfo.enabled && providerSupportMethod && providerSupportToken ){
        availableProviders.push(provider);
      }
      return provider;
    });

    const defaultPaymentProvider = this.getDefaultPaymentProvider(selectedMethod);

    if (defaultPaymentProvider && globalConfigs.payments.methods[selectedMethod].showDefaultOnly && availableProviders.indexOf(defaultPaymentProvider) !== -1){
      return [defaultPaymentProvider];
    }

    return availableProviders;
  }

  selectProvider = (e,selectedProvider) => {
    if (e){
      e.preventDefault();
    }
    
    if (!selectedProvider || !globalConfigs.payments.providers[selectedProvider]){
      return this.setState({
        selectedProvider:null
      });
    }


    const providerInfo = globalConfigs.payments.providers[selectedProvider];
    if (providerInfo){

      if (this.state.selectedToken){
        this.renderPaymentMethod(e,selectedProvider,this.state);
        return;
      }

      const ethAvailable = providerInfo.supportedTokens.indexOf(globalConfigs.baseToken) !== -1;
      const tokenAvailable = providerInfo.supportedTokens.indexOf(this.props.selectedToken) !== -1;

      // Show tokens to buy if more are available or if the selected one is not
      const availableTokens = [];
      if ( (ethAvailable && tokenAvailable) || !tokenAvailable ){
        if (ethAvailable){
          availableTokens.push(globalConfigs.baseToken);
        }
        if (tokenAvailable){
          availableTokens.push(this.props.selectedToken);
        }
      } else {
        this.renderPaymentMethod(e,selectedProvider,this.state);
        return;
      }

      this.setState({
        availableTokens,
        selectedProvider
      });
    }
  }

  selectMethod = (e,selectedMethod) => {
    if (e){
      e.preventDefault();
    }

    if (Object.keys(globalConfigs.payments.methods).indexOf(selectedMethod) !== -1){
      const availableProviders = this.getAvailablePaymentProviders(selectedMethod,this.state.selectedToken);

      // Send Google Analytics event
      if (window.ga){
        window.ga('send', 'event', 'Buy', 'select_method', selectedMethod);
      }

      this.setState({
        availableProviders,
        selectedMethod
      });
    }
  }

  selectToken = (e,selectedToken) => {
    if (e){
      e.preventDefault();
    }

    // Send Google Analytics event
    if (window.ga){
      window.ga('send', 'event', 'Buy', 'select_token', selectedToken);
    }

    this.setState({ selectedToken }, async () => {
      if (this.state.selectedProvider){
        return this.renderPaymentMethod(e,this.state.selectedProvider,this.state);
      }
    });
  }

  handleCountryChange = selectedCountry => {

    // Send Google Analytics event
    if (window.ga && selectedCountry){
      window.ga('send', 'event', 'Buy', 'select_country', selectedCountry.value);
    }

    this.setState({
      selectedCountry
    });
  }

  getAvailableCountries = () => {
    const availableCountries = {};
    this.state.availableProviders.forEach((provider,i) => {
      const providerInfo = globalConfigs.payments.providers[provider];
      const providerSupportMethod = providerInfo.supportedMethods.indexOf(this.state.selectedMethod) !== -1;
      const providerSupportToken = this.state.selectedToken ? providerInfo.supportedTokens.indexOf(this.state.selectedToken) !== -1 : (providerInfo.supportedTokens.indexOf(this.props.selectedToken) !== -1 || providerInfo.supportedTokens.indexOf(globalConfigs.baseToken) !== -1);

      // Skip disabled provider, not supported selected method or not supported token
      if (!providerInfo.enabled || !providerSupportMethod || !providerSupportToken ){
        return;
      }

      // Get available providers and countries
      providerInfo.supportedCountries.forEach((countryCode,j) => {
        if (!availableCountries[countryCode]){
          availableCountries[countryCode] = {
            providers:[],
            label:globalConfigs.countries[countryCode],
            value:countryCode
          };
        }
        availableCountries[countryCode].providers.push(provider);
      });
    });

    return Object.values(availableCountries);
  }

  render() {

    let title = null;
    if (this.state.selectedToken === null){
      title = 'BUY TOKEN';
    } else {
      title = 'BUY '+this.state.selectedToken;
      if (this.state.selectedMethod !== null){
        title += ' - '+globalConfigs.payments.methods[this.state.selectedMethod].props.caption;
      }
    }

    return (
      <Modal isOpen={this.props.isOpen}>
        <ModalCard closeFunc={this.closeModal}>
          <ModalCard.Header title={title}>
          </ModalCard.Header>
          <ModalCard.Body>
            <Box minWidth={['auto','35em']}>
            {
              this.state.selectedToken === null ? (
                <Box mb={2}>
                  <Text textAlign={'center'} fontWeight={2} fontSize={[2,3]} mb={[2,3]}>
                    Which token do you want to buy?
                  </Text>
                  <Flex mb={4} flexDirection={['column','row']} alignItems={'center'} justifyContent={'center'}>
                  {
                    [globalConfigs.baseToken,this.props.selectedToken].map((token,i) => {
                      return (
                        <ImageButton key={`token_${token}`} isMobile={this.props.isMobile} imageSrc={`images/tokens/${token}.svg`} imageProps={ this.props.isMobile ? {height:'42px'} : {p:[2,3],height:'80px'}} caption={token} handleClick={ e => { this.selectToken(e,token); } } />
                      );
                    })
                  }
                  </Flex>
                </Box>
              ) : this.state.selectedMethod === null ? (
                <Box>
                  <Flex mb={3} flexDirection={'column'} justifyContent={'center'} alignItems={'center'}>
                    <Image height={2} mb={2} src={`images/tokens/${this.state.selectedToken}.svg`} />
                    <Text textAlign={'center'} fontWeight={2} fontSize={[2,3]} my={0}>
                      How do you prefer do buy {this.state.selectedToken}?
                    </Text>
                  </Flex>
                  <Flex mb={4} flexDirection={['column','row']} alignItems={'center'} justifyContent={'center'}>
                    {
                      Object.keys(globalConfigs.payments.methods).map((method,i) => {
                        const methodInfo = globalConfigs.payments.methods[method];
                        const availableProviders = this.getAvailablePaymentProviders(method,this.state.selectedToken);
                        if (!availableProviders || !availableProviders.length){
                          return false;
                        }

                        let imageProps = methodInfo.props && methodInfo.props.imageProps ? methodInfo.props.imageProps : {};
                        const imagePropsExtended = this.props.isMobile ? {height:'42px'} : {height:'70px'};
                        imageProps = Object.assign(imageProps,imagePropsExtended);

                        return (
                          <ImageButton isMobile={ this.props.isMobile } key={`method_${method}`} {...methodInfo.props} imageProps={ imageProps } handleClick={ e => this.selectMethod(e,method) } />
                        );
                      })
                    }
                  </Flex>
                </Box>
              ) : this.state.selectedMethod === 'wallet' ? (
                    <Box mt={2} mb={3}>
                      <Text textAlign={'center'} fontWeight={3} fontSize={2} my={0}>
                        <Box width={'100%'}>
                            <Flex mb={4} flexDirection={['column','row']} alignItems={'center'} justifyContent={'center'}>
                            {
                              this.state.availableProviders.length ?
                                (
                                  <Box>
                                    <Text textAlign={'center'} fontWeight={2} fontSize={2} mb={[2,3]}>
                                      Choose your preferred payment provider:
                                    </Text>
                                    {
                                      this.state.availableProviders.map((provider,i) => {
                                        const providerInfo = this.getProviderInfo(provider);
                                        return (
                                          <ImageButton key={`payment_provider_${provider}`} {...providerInfo} handleClick={ e => { this.renderPaymentMethod(e,provider,this.state); } } />
                                        );
                                      })
                                    }
                                  </Box>
                                )
                              : (
                                <Text textAlign={'center'} fontWeight={3} fontSize={2} my={2}>
                                  Sorry, there are no providers available for the selected method.
                                </Text>
                              )
                            }
                            </Flex>
                          </Box>
                      </Text>
                    </Box>
                  ) : (
                  <Box>
                    {
                      !this.state.selectedProvider &&
                      <Box mb={3}>
                        <Flex flexDirection={'column'} justifyContent={'center'} alignItems={'center'}>
                          <Image height={2} mb={2} src={`images/tokens/${this.state.selectedToken}.svg`} />
                        </Flex>
                        <Text textAlign={'center'} fontWeight={3} fontSize={2} mb={2}>
                          Select your country:
                        </Text>
                        <Select
                          placeholder={'Select your country'}
                          noOptionsMessage={ (inputValue) => 'For European countries select Europe' }
                          value={this.state.selectedCountry}
                          onChange={this.handleCountryChange}
                          options={this.getAvailableCountries()}
                        />
                      </Box>
                    }
                    <Flex flexDirection={'column'} justifyContent={'center'} alignItems={'center'} minHeight={'200px'}>
                      {
                        !this.state.selectedProvider ?
                          this.state.selectedCountry !== null ? (
                            <Box width={'100%'}>
                              <Text textAlign={'center'} fontWeight={2} fontSize={2} mb={[2,3]}>
                                Choose your preferred payment provider:
                              </Text>
                              <Flex mb={4} flexDirection={['column','row']} alignItems={'center'} justifyContent={'center'}>
                              {
                                this.state.selectedCountry.providers.length ?
                                  this.state.selectedCountry.providers.map((provider,i) => {
                                    const providerInfo = this.getProviderInfo(provider);
                                    return (
                                      <ImageButton key={`payment_provider_${provider}`} {...providerInfo} handleClick={ e => {this.selectProvider(e,provider) } } />
                                    );
                                  })
                                : (
                                  <Text textAlign={'center'} fontWeight={3} fontSize={2} mb={2}>
                                    Sorry, there are no providers available for the selected method.
                                  </Text>
                                )
                              }
                              </Flex>
                            </Box>
                          ) : (
                            <Text textAlign={'center'} fontWeight={2} fontSize={2} mb={2}>
                              Select the country to load the payment providers.
                            </Text>
                          )
                        : false && this.state.availableTokens && this.state.availableTokens.length && (
                          <Box mb={2}>
                            <Flex justifyContent={'center'} my={2}>
                              <Image src={ globalConfigs.payments.providers[this.state.selectedProvider].imageSrc } height={'35px'} />
                            </Flex>
                            <Text textAlign={'center'} fontWeight={2} fontSize={2} mb={[2,3]}>
                              Choose which token do you want to buy:
                            </Text>
                            <Flex mb={4} flexDirection={['column','row']} alignItems={'center'} justifyContent={'center'}>
                            {
                              this.state.availableTokens.map((token,i) => {
                                return (
                                  <ImageButton key={`token_${token}`} imageSrc={`images/tokens/${token}.svg`} caption={token} imageProps={{p:[2,3],height:'80px'}} handleClick={ e => { this.selectToken(e,token); } } />
                                );
                              })
                            }
                            </Flex>
                          </Box>
                        )
                      }
                    </Flex>
                  </Box>
                )
            }
            </Box>
          </ModalCard.Body>
          <ModalCard.Footer>
            <Flex px={[2,0]} flexDirection={['column', 'row']} width={1} justifyContent={'center'}>
              <Button
                borderRadius={4}
                my={2}
                mx={[0, 2]}
                size={this.props.isMobile ? 'small' : 'medium'}
                onClick={ e => this.closeModal(e) }
              >
              CLOSE
              </Button>
              {
                this.state.selectedToken !== null && (
                  <Button
                    className={styles.gradientButton}
                    borderRadius={4}
                    my={2}
                    mx={[0, 2]}
                    size={this.props.isMobile ? 'small' : 'medium'}
                    onClick={ e => this.goBack(e) }
                  >
                    GO BACK
                  </Button>
                )
              }
            </Flex>
          </ModalCard.Footer>
        </ModalCard>
      </Modal>
    );
  }
}

export default BuyModal;