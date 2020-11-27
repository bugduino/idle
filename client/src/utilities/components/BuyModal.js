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
import FunctionsUtil from '../../utilities/FunctionsUtil';

class BuyModal extends React.Component {

  state = {
    selectedMethod:null,
    availableMethods:[],
    selectedCountry:null,
    selectedProvider:null,
    availableProviders:null,
    selectedToken:this.props.buyToken,
  }

  async loadRemoteResources() {

    if (!this.state.selectedToken){
      return false;
    }

    // Load payments providers external remote resources
    Object.keys(globalConfigs.payments.providers).forEach((provider,i) => {

      const providerInfo = globalConfigs.payments.providers[provider];
      if (providerInfo.enabled && providerInfo.remoteResources && (providerInfo.supportedTokens.indexOf(this.state.selectedToken) !== -1 || providerInfo.supportedTokens.indexOf(globalConfigs.baseToken) !== -1)){
        
        const remoteResources = providerInfo.remoteResources;

        Object.keys(remoteResources).forEach((url,j) => {

          const resourceType = url.split('.').pop().toLowerCase();

          switch (resourceType){
            case 'js':
              const scriptID = `script_${provider}_${j}_${this.state.selectedToken}`;

              if (!document.getElementById(scriptID)){
                const script = document.createElement("script");
                const remoteResourceParams = remoteResources[url];
                const callback = remoteResourceParams && remoteResourceParams.callback ? remoteResourceParams.callback : null;
                const precall = remoteResourceParams && remoteResourceParams.precall ? remoteResourceParams.precall : null;

                if (precall && typeof precall === 'function'){
                  precall(this.state,globalConfigs,providerInfo);
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

  // Utils
  functionsUtil = null;
  loadUtils(){
    if (this.functionsUtil){
      this.functionsUtil.setProps(this.props);
    } else {
      this.functionsUtil = new FunctionsUtil(this.props);
    }
  }

  loadAvailableMethods(){
    const availableMethods = {};
    const availableMethodsKeys = this.props.availableMethods && this.props.availableMethods.length ? this.props.availableMethods : Object.keys(globalConfigs.payments.methods);

    availableMethodsKeys.forEach(method => {
      availableMethods[method] = globalConfigs.payments.methods[method];
    });

    this.setState({
      availableMethods
    });
  }

  componentWillMount() {
    this.loadUtils();

    this.loadAvailableMethods();
    this.loadRemoteResources();
  }

  async componentDidMount() {
    this.loadUtils();
  }

  async componentDidUpdate(prevProps) {

    this.loadUtils();

    if ( this.props.buyToken && prevProps.buyToken !== this.props.buyToken){
      this.selectToken(null,this.props.buyToken);
    }
  }

  renderPaymentMethod = async (e,provider,buyParams) => {

    const onSuccess = async (tx) => {
      // Toast message
      window.toastProvider.addMessage(`Deposit completed`, {
        secondaryMessage: `Your ${this.state.selectedToken} have been deposited`,
        colorTheme: 'light',
        actionHref: "",
        actionText: "",
        variant: "success",
      });

      this.props.getAccountBalance();
    };

    const onClose = async (e) => {
      return true;
    }

    const paymentProvider = globalConfigs.payments.providers[provider];
    const initParams = paymentProvider && paymentProvider.getInitParams ? paymentProvider.getInitParams(this.props,globalConfigs,buyParams,onSuccess,onClose) : null;

    // Render the Payment Provider
    switch (provider){
      default:
        if (typeof paymentProvider.render === 'function'){
          const currentState = Object.assign({},this.state);
          paymentProvider.render(initParams,null,currentState,globalConfigs);
        }
      break;
    }

    // Send Google Analytics event
    if (globalConfigs.analytics.google.events.enabled){
      await this.functionsUtil.sendGoogleAnalyticsEvent({
        eventCategory: 'Buy',
        eventAction: 'select_provider',
        eventLabel: provider
      });

      this.closeModal(e);
    } else {
      this.closeModal(e);
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
        selectedMethod:null,
        selectedCountry:null,
        selectedProvider:null,
      });
    } else if (this.state.selectedToken){
      this.setState({
        selectedMethod:null,
        selectedCountry:null,
        selectedProvider:null,
        selectedToken:this.props.buyToken,
      });
    } else {
      this.resetModal();
    }
  }

  resetModal = () => {
    this.setState({
      selectedMethod:null,
      selectedCountry:null,
      selectedProvider:null,
      availableProviders:null,
      selectedToken:this.props.buyToken
    });

    this.componentWillMount();
  }

  closeModal = (e) => {
    this.resetModal();
    if (!this.props.showInline && typeof this.props.closeModal === 'function'){
      this.props.closeModal();
    }
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
    const paymentMethod = this.state.availableMethods[selectedMethod];
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

    if (defaultPaymentProvider && this.state.availableMethods[selectedMethod].showDefaultOnly && availableProviders.indexOf(defaultPaymentProvider) !== -1){
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

    if (Object.keys(this.state.availableMethods).indexOf(selectedMethod) !== -1){
      const availableProviders = this.getAvailablePaymentProviders(selectedMethod,this.state.selectedToken);

      // Send Google Analytics event
      this.functionsUtil.sendGoogleAnalyticsEvent({
        eventCategory: 'Buy',
        eventAction: 'select_method',
        eventLabel: selectedMethod
      });

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
    this.functionsUtil.sendGoogleAnalyticsEvent({
      eventCategory: 'Buy',
      eventAction: 'select_token',
      eventLabel: selectedToken
    });

    this.setState({ selectedToken }, async () => {
      if (this.state.selectedProvider){
        return this.renderPaymentMethod(e,this.state.selectedProvider,this.state);
      } else {
        this.loadRemoteResources();
      }
    });
  }

  handleCountryChange = selectedCountry => {

    // Send Google Analytics event
    if (globalConfigs.analytics.google.events.enabled && selectedCountry){
      this.functionsUtil.sendGoogleAnalyticsEvent({
        eventCategory: 'Buy',
        eventAction: 'select_country',
        eventLabel: selectedCountry.value
      });
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
        title += ' - '+this.state.availableMethods[this.state.selectedMethod].props.caption;
      }
    }

    let availableTokens = this.props.availableTokens && Object.keys(this.props.availableTokens).length>0 ? [globalConfigs.baseToken,...Object.keys(this.props.availableTokens)] : [globalConfigs.baseToken];

    // Show all tokens
    if (this.props.showAllTokens){
      availableTokens = [];
      Object.keys(globalConfigs.payments.providers).forEach( provider => {
        const providerInfo = globalConfigs.payments.providers[provider];
        if (providerInfo.supportedTokens){
          providerInfo.supportedTokens.forEach(token => {
            if (!availableTokens.includes(token)){
              availableTokens.push(token);
            }
          })
        }
      });
    }

    const InnerComponent = props => (
      <Box minWidth={ this.props.showInline ? 'auto' : ['auto','35em'] }>
      {
        this.state.selectedToken === null ? (
          <Box mb={2}>
            <Text
              mb={[2,3]}
              fontWeight={2}
              textAlign={'center'}
              fontSize={[2, this.props.showInline ? 2 : 3]}
            >
              Which token do you want to buy?
            </Text>
            <Flex
              mb={4}
              style={{
                flexWrap:'wrap'
              }}
              alignItems={'center'}
              justifyContent={'center'}
              flexDirection={['column','row']}
            >
            {
              availableTokens.map((token,i) => {
                return (
                  <ImageButton
                    caption={token}
                    key={`token_${token}`}
                    isMobile={this.props.isMobile}
                    imageSrc={`images/tokens/${token}.svg`}
                    handleClick={ e => { this.selectToken(e,token); } }
                    imageProps={ this.props.isMobile ? {height:'42px'} : {p:[2,3],height:'80px'}}
                    buttonProps={ !this.props.isMobile ? {
                      style:{
                        'flex':'0 0 170px'
                      }
                    } : null}
                  />
                );
              })
            }
            </Flex>
          </Box>
        ) : this.state.selectedMethod === null ? (
          <Box>
            <Flex mb={3} flexDirection={'column'} justifyContent={'center'} alignItems={'center'}>
              {
                !this.props.showInline &&
                  <Image height={2} mb={2} src={`images/tokens/${this.state.selectedToken}.svg`} />
              }
              <Text textAlign={'center'} fontWeight={500} fontSize={[2, this.props.showInline ? 2 : 3]} my={0}>
                {
                  this.props.showInline && this.props.buyToken ? `Ops... you don't have any ${this.props.buyToken} in your wallet, how do you prefer do buy some?` : `How do you prefer to buy ${this.state.selectedToken}?`
                }
              </Text>
            </Flex>
            <Flex mb={this.props.showInline ? 2 : 4} flexDirection={['column','row']} alignItems={'center'} justifyContent={'center'}>
              {
                Object.keys(this.state.availableMethods).map((method,i) => {
                  const methodInfo = this.state.availableMethods[method];
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
                      <Flex mb={this.props.showInline ? 2 : 4} flexDirection={['column','row']} alignItems={'center'} justifyContent={'center'}>
                      {
                        this.state.availableProviders.length > 0 ?
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
            <Flex
              width={1}
              alignItems={'center'}
              flexDirection={'column'}
              justifyContent={'flex-start'}
            >
              {
                !this.state.selectedProvider &&
                <Box
                  mb={3}
                  maxWidth={ this.props.showInline ? '35em' : 'initial' }
                  width={ (this.props.showInline && !this.props.isMobile) ? 0.72 : 1 }
                >
                  {
                    !this.props.showInline &&
                      <Flex flexDirection={'column'} justifyContent={'center'} alignItems={'center'}>
                        <Image height={2} mb={2} src={`images/tokens/${this.state.selectedToken}.svg`} />
                      </Flex>
                  }
                  <Text textAlign={'center'} fontWeight={ this.props.showInline ? 2 : 3 } fontSize={2} mb={2}>
                    Select your country:
                  </Text>
                  <Select
                    maxWidth={ this.props.showInline && !this.props.isMobile ? '25em' : 'auto' }
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
                        <Flex mb={this.props.showInline ? 2 : 4} flexDirection={['column','row']} alignItems={'center'} justifyContent={'center'}>
                        {
                          this.state.selectedCountry.providers.length > 0 ?
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
                  : false && this.state.availableTokens && this.state.availableTokens.length > 0 && (
                    <Box mb={2}>
                      <Flex justifyContent={'center'} my={2}>
                        <Image src={ globalConfigs.payments.providers[this.state.selectedProvider].imageSrc } height={'35px'} />
                      </Flex>
                      <Text textAlign={'center'} fontWeight={2} fontSize={2} mb={[2,3]}>
                        Choose which token do you want to buy:
                      </Text>
                      <Flex mb={this.props.showInline ? 2 : 4} flexDirection={['column','row']} alignItems={'center'} justifyContent={'center'}>
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
            </Flex>
          )
      }
        {
          this.props.showInline && this.state.selectedToken !== null  && (this.props.buyToken === null || this.state.selectedMethod !== null) && (
            <Flex
              alignItems={'center'}
              justifyContent={'center'}
            >
              <Button
                my={2}
                mx={[0, 2]}
                size={'medium'}
                borderRadius={4}
                mainColor={'blue'}
                onClick={ e => this.goBack(e) }
              >
                GO BACK
              </Button>
            </Flex>
          )
        }
      </Box>
    );

    if (this.props.showInline){
      return (
        <InnerComponent
          {...this.props}
        />
      );
    }

    return (
      <Modal isOpen={this.props.isOpen}>
        <ModalCard closeFunc={this.closeModal}>
          <ModalCard.Header title={title}>
          </ModalCard.Header>
          <ModalCard.Body>
            <InnerComponent/>
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
                this.state.selectedToken !== null && (this.props.buyToken === null || this.state.selectedMethod !== null) && (
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