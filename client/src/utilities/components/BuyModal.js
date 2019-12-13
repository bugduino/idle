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
import globalConfigs from '../../globalConfigs';

const BNify = s => new BigNumber(String(s));

class BuyModal extends React.Component {

  state = {
    availableProviders:null,
    selectedMethod:null,
    selectedProvider:null,
    selectedCountry:null
  }

  renderPaymentMethod = async (e,provider,token) => {

    token = token ? token : this.props.selectedToken;

    this.closeModal(e);

    const initParams = globalConfigs.payments.providers[provider] && globalConfigs.payments.providers[provider].getInitParams ? globalConfigs.payments.providers[provider].getInitParams(this.props,globalConfigs,token) : null;

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
            // widget.open();
        });

        widget.open();
      break;
      case 'ramp':
        new RampInstantSDK(initParams)
          .on('*', async (event) => {
            let tokenDecimals = null;
            let tokenAmount = null;

            console.log('Ramp event:',event);

            switch (event.type){
              case 'PURCHASE_SUCCESSFUL':
                // Update balance
                this.props.getAccountBalance();

                tokenDecimals = await this.props.getTokenDecimals();

                tokenAmount = event.payload.purchase.tokenAmount;
                tokenAmount = BNify(tokenAmount.toString()).div(BNify(Math.pow(10,parseInt(tokenDecimals)).toString())).toString();

                // Toast message
                window.toastProvider.addMessage(`Payment completed`, {
                  secondaryMessage: `${tokenAmount} ${this.props.selectedToken} are now in your wallet`,
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
                    frameborder="0"
                    height="100%"
                    src="https://buy-staging.moonpay.io?${initParams}"
                    width="100%"
                  >
                    <p>Your browser does not support iframes.</p>
                  </iframe>
                </div>
              </div>
            </div>
          `;
          document.body.appendChild(iframeBox);
        } else {
          moonpayWidget.style.display = 'block';
        }
        // window.open(`https://buy-staging.moonpay.io?${initParams}`);
      break;
      case 'zeroExInstant':
        if (window.zeroExInstant){
          window.zeroExInstant.render(initParams, 'body');
        }
      break;
      default:
      break;
    }
  }

  goBack = (e) => {
    e.preventDefault();

    if (this.state.selectedProvider){
      this.setState({
        selectedProvider:null
      });
    } else if (this.state.selectedMethod){
      this.setState({
        selectedCountry:null,
        selectedMethod:null
      });
    } else {
      this.resetModal(e);
    }
  }

  resetModal = (e) => {
    e.preventDefault();
    this.setState({
      availableProviders:null,
      selectedMethod:null,
      selectedProvider:null,
      selectedCountry:null
    });
  }

  closeModal = (e) => {
    this.resetModal(e);
    this.props.closeModal(e);
  }

  getAvailablePaymentProviders = (selectedMethod) => {
    const availableProviders = [];
    Object.keys(globalConfigs.payments.providers).forEach((provider,i) => {
      const providerInfo = globalConfigs.payments.providers[provider];
      if (providerInfo.enabled && providerInfo.supportedMethods.indexOf(selectedMethod) !== -1 && (providerInfo.supportedTokens.indexOf(this.props.selectedToken) !== -1 || providerInfo.supportedTokens.indexOf(globalConfigs.baseToken) !== -1) ){
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
        this.renderPaymentMethod(e,selectedProvider,this.props.selectedToken);
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
      const availableProviders = this.getAvailablePaymentProviders(selectedMethod);
      this.setState({
        availableProviders,
        selectedMethod
      });
    }
  }

  handleCountryChange = selectedCountry => {
    this.setState({
      selectedCountry
    });
  }

  getAvailableCountries = () => {
    const availableCountries = {};
    Object.keys(globalConfigs.payments.providers).forEach((provider,i) => {
      const providerInfo = globalConfigs.payments.providers[provider];
      // Skip disabled provider, not supported selected method or not supported token
      if (!providerInfo.enabled || providerInfo.supportedMethods.indexOf(this.state.selectedMethod) === -1 || (providerInfo.supportedTokens.indexOf(this.props.selectedToken) === -1 && providerInfo.supportedTokens.indexOf(globalConfigs.baseToken) === -1 ) ){
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

    let title = 'BUY '+this.props.selectedToken;
    if (this.state.selectedMethod !== null){
      title += ' - '+globalConfigs.payments.methods[this.state.selectedMethod].props.caption;
    }

    return (
      <Modal isOpen={this.props.isOpen}>
        <ModalCard closeFunc={this.closeModal}>
          <ModalCard.Header title={title}>
          </ModalCard.Header>
          <ModalCard.Body>
            <Box minWidth={['auto','35em']}>
            {
              this.state.selectedMethod === null ? (
                <Box>
                  <Flex mb={3} flexDirection={'column'} justifyContent={'center'} alignItems={'center'}>
                    <Image height={2} mb={2} src={`images/tokens/${this.props.selectedToken}.svg`} />
                    <Text textAlign={'center'} fontWeight={3} fontSize={2} my={0}>
                      Choose which way you want to buy {this.props.selectedToken}:
                    </Text>
                  </Flex>
                  <Flex mb={4} flexDirection={['column','row']} alignItems={'center'} justifyContent={'center'}>
                    {
                      Object.keys(globalConfigs.payments.methods).map((method,i) => {
                        const methodInfo = globalConfigs.payments.methods[method];
                        return (
                          <ImageButton key={`method_${method}`} {...methodInfo.props} handleClick={ e => this.selectMethod(e,method) } />
                        );
                      })
                    }
                  </Flex>
                </Box>
              ) :
                this.state.selectedMethod === 'bank' ? (
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
                                    const providerInfo = globalConfigs.payments.providers[provider];
                                    return (
                                      <ImageButton key={`payment_${provider}`} {...providerInfo} handleClick={ e => {this.selectProvider(e,provider) } } />
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
                        :
                        this.state.availableTokens && this.state.availableTokens.length && (
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
                                  <ImageButton key={`token_${token}`} imageSrc={`images/tokens/${token}.svg`} caption={token} imageProps={{p:[2,3],height:'80px'}} handleClick={ e => { this.renderPaymentMethod(e,this.state.selectedProvider,token); } } />
                                );
                              })
                            }
                            </Flex>
                          </Box>
                        )
                      }
                    </Flex>
                  </Box>
                ) :
                  this.state.selectedMethod === 'wallet' ? (
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
                                        const providerInfo = globalConfigs.payments.providers[provider];
                                        return (
                                          <ImageButton key={`payment_${provider}`} {...providerInfo} handleClick={ e => { this.renderPaymentMethod(e,provider); } } />
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
                  ) : null
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
                this.state.selectedMethod !== null && (
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