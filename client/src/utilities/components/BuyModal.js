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
import BigNumber from 'bignumber.js';
import ImageButton from '../../ImageButton/ImageButton';
import { RampInstantSDK } from '@ramp-network/ramp-instant-sdk';
import styles from './Header.module.scss';
import globalConfigs from '../../configs/globalConfigs';

const BNify = s => new BigNumber(String(s));

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
          const scriptID = `script_${provider}_${j}`;

          if (!document.getElementById(scriptID)){
            const script = document.createElement("script");
            const callback = remoteResources[url];

            if (typeof callback === 'function'){
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
            script.src = url;
            script.async = true;

            document.head.appendChild(script);
          }
        });
      }
    });
  }

  async componentDidMount() {
    this.loadRemoteResources();
  }

  async componentDidUpdate() {
    this.loadRemoteResources();
  }

  renderPaymentMethod = async (e,provider,buyParams) => {

    this.closeModal(e);

    const paymentProvider = globalConfigs.payments.providers[provider];
    const initParams = paymentProvider && paymentProvider.getInitParams ? paymentProvider.getInitParams(this.props,globalConfigs,buyParams) : null;

    switch (provider){
      case 'wyre':
        if (!document.getElementById('wyre-dropin-widget-container')){
          const wyreWidget = document.createElement("div");
          wyreWidget.id = 'wyre-dropin-widget-container';
          document.body.appendChild(wyreWidget);
        }

        const widget = new window.Wyre(initParams);

        widget.on("exit", function (e) {
            console.log("Wyre exit", e);
        })

        widget.on("error", function (e) {
            console.log("Wyre error", e);
        });

        widget.on("complete", function (e) {
            console.log("Wyre complete", e );
        });

        widget.on('ready', function(e) {
            console.log("Wyre ready", e );
        });

        widget.open();
      break;
      case 'ramp':
        new RampInstantSDK(initParams)
          .on('*', async (event) => {
            let tokenDecimals = null;
            let tokenAmount = null;

            switch (event.type){
              case 'PURCHASE_SUCCESSFUL':
                // Update balance
                this.props.getAccountBalance();

                tokenDecimals = await this.props.getTokenDecimals();

                tokenAmount = event.payload.purchase.tokenAmount;
                tokenAmount = BNify(tokenAmount.toString()).div(BNify(Math.pow(10,parseInt(tokenDecimals)).toString())).toString();

                // Toast message
                window.toastProvider.addMessage(`Payment completed`, {
                  secondaryMessage: `${tokenAmount} ${this.state.selectedToken} are now in your wallet`,
                  colorTheme: 'light',
                  actionHref: "",
                  actionText: "",
                  variant: "success",
                });

              break;
              default:
              break;
            }
          })
          .show();
      break;
      case 'moonpay':
        const moonpayWidget = document.getElementById('moonpay-widget');
        if (!moonpayWidget){
          const iframeBox = document.createElement("div");
          iframeBox.innerHTML = `
            <div id="moonpay-widget" class="moonpay-widget" style="position:fixed;display:flex;justify-content:center;align-items:center;top:0;left:0;width:100%;height:100%;z-index:999">
              <div id="moonpay-widget-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:1"></div>
                <div id="moonpay-widget-container" style="position:relative;z-index:2;width:500px;height:490px">
                  <iframe
                    style="position:relative;z-index:2;"
                    frameborder="0"
                    height="100%"
                    src="${initParams}"
                    width="100%"
                  >
                    <p>Your browser does not support iframes.</p>
                  </iframe>
                  <div id="moonpay-widget-loading-placeholder" style="position:absolute;background:#fff;width:100%;height:100%;z-index:1;top:0;display:flex;justify-content:center;align-items:center;">
                    <div style="display:flex;flex-direction:row;align-items:end">
                      <img src="${globalConfigs.payments.providers.moonpay.imageSrc}" style="height:50px;" />
                      <h3 style="padding-left:5px;font-weight:600;font-style:italic;">is loading...</h3>
                    </div>
                  </div>
                  <div id="moonpay-widget-footer" style="position:relative;display:flex;justify-content:center;align-items:center;padding:8px 16px;width:100%;background:#fff;top:-20px;z-index:3">
                    <button style="background:#000;color:#fff;text-align:center;border-radius:5px;width:100%;height:51px;line-height:51px;font-weight:500;border:0;cursor:pointer" onclick="document.getElementById('moonpay-widget').remove();">Close</button>
                  </div>
                </div>
              </div>
            </div>
          `;
          document.body.appendChild(iframeBox);

          // Add Moonpay Widget style (mobile)
          if (!document.getElementById('moonpayWidget_style')){
            const moonpayStyle = document.createElement('style');
            moonpayStyle.id = 'moonpayWidget_style';
            moonpayStyle.innerHTML = `
            @media (max-width: 40em){
              #moonpay-widget {
                align-items: flex-start !important;
              }
              #moonpay-widget-overlay{
                background:#fff !important;
              }
              #moonpay-widget-container{
                min-height: calc( 100vh - 60px ) !important;
              }
            }`;
            document.body.appendChild(moonpayStyle);
          }
        }
      break;
      case 'transak':
        const transakWidget = document.getElementById('transak-widget');
        if (!transakWidget){
          const iframeBox = document.createElement("div");
          iframeBox.innerHTML = `
            <div id="transak-widget" class="transak-widget" style="position:fixed;display:flex;justify-content:center;align-items:center;top:0;left:0;width:100%;height:100%;z-index:999">
              <div id="transak-widget-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:1"></div>
                <div id="transak-widget-container" style="position:relative;z-index:2;width:500px;height:495px">
                  <iframe
                    style="position:relative;z-index:2;"
                    frameborder="0"
                    height="100%"
                    src="${initParams}"
                    width="100%"
                  >
                    <p>Your browser does not support iframes.</p>
                  </iframe>
                  <div id="transak-widget-loading-placeholder" style="position:absolute;background:#fff;width:100%;height:100%;z-index:1;top:0;display:flex;justify-content:center;align-items:center;">
                    <div style="display:flex;flex-direction:row;align-items:center">
                      <img src="${globalConfigs.payments.providers.transak.imageSrc}" style="height:50px;" />
                      <h3 style="font-weight:600;font-style:italic;color:#0040ca">is loading...</h3>
                    </div>
                  </div>
                  <div id="transak-widget-footer" style="position:relative;display:flex;justify-content:center;align-items:center;padding:16px;width:100%;background:#fff;top:-20px;z-index:3">
                    <button style="box-shadow: 0 0.125rem 0.625rem rgba(58,196,125,.4), 0 0.0625rem 0.125rem rgba(58,196,125,.5);font-size: 1.1rem;line-height: 1.5;border-radius:.3rem;width:100%!important;max-width: 300px!important;padding: .7rem!important;position: relative;color: #fff;background-color: #3ac47d;border-color: #3ac47d;font-weight: 500;outline: none!important;display: inline-block;text-align: center;vertical-align: middle;border: 1px solid transparent;" onclick="document.getElementById('transak-widget').remove();">Close</button>
                  </div>
                </div>
              </div>
            </div>
          `;
          document.body.appendChild(iframeBox);

          // Add transak Widget style (mobile)
          if (!document.getElementById('transakWidget_style')){
            const transakStyle = document.createElement('style');
            transakStyle.id = 'transakWidget_style';
            transakStyle.innerHTML = `
            @media (max-width: 40em){
              #transak-widget {
                align-items: flex-start !important;
              }
              #transak-widget-overlay{
                background:#fff !important;
              }
              #transak-widget-container{
                min-height: calc( 100vh - 60px ) !important;
              }
            }`;
            document.body.appendChild(transakStyle);
          }
        }
      break;
      case 'zeroExInstant':
        paymentProvider.render(initParams);
      break;
      case 'airSwap':
        paymentProvider.render(initParams);
      break;
      default:
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

  getAvailablePaymentProviders = (selectedMethod,selectedToken) => {
    selectedToken = selectedToken ? selectedToken : null;
    const availableProviders = [];
    Object.keys(globalConfigs.payments.providers).forEach((provider,i) => {
      const providerInfo = globalConfigs.payments.providers[provider];
      const providerSupportMethod = providerInfo.supportedMethods.indexOf(selectedMethod) !== -1;
      const providerSupportToken = selectedToken ? providerInfo.supportedTokens.indexOf(selectedToken) !== -1 : (providerInfo.supportedTokens.indexOf(this.props.selectedToken) !== -1 || providerInfo.supportedTokens.indexOf(globalConfigs.baseToken) !== -1);
      if (providerInfo.enabled && providerSupportMethod && providerSupportToken ){
        availableProviders.push(provider);
      }
    });
    return availableProviders;
  }

  selectProvider = (e,selectedProvider) => {
    if (e){
      e.preventDefault();
    }
    
    if (!selectedProvider || !globalConfigs.payments.providers[selectedProvider]){
      this.setState({
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

    this.setState({ selectedToken }, async () => {
      if (this.state.selectedProvider){
        return this.renderPaymentMethod(e,this.state.selectedProvider,this.state);
      }
    });
  }

  handleCountryChange = selectedCountry => {
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
      title = 'CHOOSE YOUR TOKEN';
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
                  <Text textAlign={'center'} fontWeight={3} fontSize={2} mb={[2,3]}>
                    Choose which token do you want to buy:
                  </Text>
                  <Flex mb={4} flexDirection={['column','row']} alignItems={'center'} justifyContent={'center'}>
                  {
                    ['ETH',this.props.selectedToken].map((token,i) => {
                      return (
                        <ImageButton key={`token_${token}`} imageSrc={`images/tokens/${token}.svg`} caption={token} imageProps={{p:[2,3],height:'80px'}} handleClick={ e => { this.selectToken(e,token); } } />
                      );
                    })
                  }
                  </Flex>
                </Box>
              ) : this.state.selectedMethod === null ? (
                <Box>
                  <Flex mb={3} flexDirection={'column'} justifyContent={'center'} alignItems={'center'}>
                    <Image height={2} mb={2} src={`images/tokens/${this.state.selectedToken}.svg`} />
                    <Text textAlign={'center'} fontWeight={3} fontSize={2} my={0}>
                      Choose which way you want to buy {this.state.selectedToken}:
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
                        return (
                          <ImageButton key={`method_${method}`} {...methodInfo.props} handleClick={ e => this.selectMethod(e,method) } />
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
                                          <ImageButton key={`payment_provider_${provider}`} {...providerInfo} handleClick={ e => { this.renderPaymentMethod(e,provider); } } />
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
                      <Box mt={2} mb={3}>
                        <Text textAlign={'center'} fontWeight={3} fontSize={2} mb={2}>
                          Select your country:
                        </Text>
                        <Select
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
            <Flex flexDirection={['column', 'row']} width={1} justifyContent={'center'}>
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