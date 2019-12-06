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
import { RampInstantSDK } from '@ramp-network/ramp-instant-sdk';
import styles from './Header.module.scss';

const allowedPaymentMethods = ['debit-card','ethereum'];
const fiatPaymentMethods = {
  'wyre':{
    imageSrc:'images/payments/wyre.svg',
    imageProps:{height:'35px',my:'8px'},
    caption:'Buy with',
    captionPos:'top',
    subcaption:'~ 0.75% fee ~'
  },
  'ramp':{
    imageSrc:'images/payments/ramp.png',
    imageProps:{height:'35px',my:'8px'},
    caption:'Buy with',
    captionPos:'top',
    subcaption:(<Text.span textAlign={'center'} color={'darkGray'} fontWeight={1} fontSize={1}>~ 2.5% fee ~<br /><small>GBP ONLY</small></Text.span>)
  },
  'moonpay':{
    imageSrc:'images/payments/moonpay.svg',
    imageProps:{height:'35px',my:'8px'},
    caption:'Buy with',
    captionPos:'top',
    subcaption:'~ 4.5% fee ~'
  }
};

class BuyModal extends React.Component {

  state = {
    selectedMethod:null,
    selectedCountry:null
  }

  renderPaymentMethod = async (e,method) => {

    this.closeModal(e);

    switch (method){
      case 'wyre':
        if (!document.getElementById('wyre-dropin-widget-container')){
          const wyreWidget = document.createElement("div");
          wyreWidget.id = 'wyre-dropin-widget-container';
          document.body.appendChild(wyreWidget);
        }

        // const secretKey = await this.getUniqueDeviceID();

        const params = {
            accountId: 'AC_Q2Y4AARC3TP',
            auth: {
              // type:'metamask'
              type:'secretKey',
              secretKey: this.props.account
            },
            env: 'prod',
            operation: {
                type: 'debitcard-hosted-dialog',
                /*
                  debitcard: Open JS widget with Apple Pay or Debit Card (Error while validating address)
                  debitcard-hosted-dialog: Open a Popup (same as debitcard but hosted) (Error while validating address)
                  debitcardonramp: INVALID TYPE
                  debitcard-whitelabel: ERROR
                  onramp: Attach Bank account, KYC, verifications, ...
                */
                dest: `ethereum:${this.props.account}`,
                destCurrency: this.props.tokenConfig.wyre.destCurrency,
                // sourceAmount: 10.0,
                // paymentMethod: 'google-pay'
            }
        };

        console.log('renderWyre',params);

        const widget = new window.Wyre(params);

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
        new RampInstantSDK({
          hostAppName: 'Idle',
          hostLogoUrl: 'https://beta.idle.finance/images/idle-dai.png',
          // swapAmount: '10000000000000000',
          swapAsset: this.props.tokenConfig.ramp.swapAsset,
          userAddress: this.props.account,
          // url: 'https://ri-widget-staging.firebaseapp.com/', // only specify the url if you want to use testnet widget versions,
          // use variant: 'auto' for automatic mobile / desktop handling,
          // 'mobile' to force mobile version
          // 'desktop' to force desktop version (default)
          variant: this.props.isMobile ? 'mobile' : 'desktop',
        })
          .on('*', console.log)
          .show();
      break;
      case 'ethereum':
        if (window.zeroExInstant){
          const params = {
            orderSource: this.props.tokenConfig.zeroExInstant.orderSource,
            affiliateInfo: this.props.tokenConfig.zeroExInstant.affiliateInfo,
            defaultSelectedAssetData: this.props.tokenConfig.zeroExInstant.assetData,
            availableAssetDatas: [this.props.tokenConfig.zeroExInstant.assetData],
            shouldDisableAnalyticsTracking: true,
            onSuccess: async (txHash) => {
              
            },
            onClose: (e) => {
              if (e){
                e.preventDefault();
              }
            }
          };

          window.zeroExInstant.render(params, 'body');
        }
      break;
      default:
      break;
    }
  }

  resetModal = (e) => {
    e.preventDefault();
    this.setState({
      selectedMethod:null,
      selectedCountry:null
    });
  }

  closeModal = (e) => {
    this.resetModal(e);
    this.props.closeModal(e);
  }

  selectMethod = (e,selectedMethod) => {
    if (e){
      e.preventDefault();
    }

    if (allowedPaymentMethods.indexOf(selectedMethod) !== -1){
      this.setState({
        selectedMethod
      });
    }
  }

  handleCountryChange = selectedCountry => {
    // console.log(selectedCountry);
    this.setState({
      selectedCountry
    });
  }

  render() {

    let title = 'BUY '+this.props.selectedToken;
    if (this.state.selectedMethod !== null){
      switch(this.state.selectedMethod){
        case 'debit-card':
          title += ' - DEBIT CARD';
        break;
        case 'ethereum':
          title += ' - ETHEREUM WALLET';
        break;
        default:
        break;
      }
    }

    const countries_options = [
      { methods: ['wyre'], label: 'United States of America', value:'usa'},
      { methods: ['wyre','ramp','moonpay'], label: 'United Kingdom', value:'uk' },
      { methods: ['ramp','moonpay'], label: 'Europe', value:'eu' },
      { methods: ['wyre','moonpay'], label: 'Australia', value:'australia' },
      { methods: ['wyre','moonpay'], label: 'Brazil', value:'brazil' },
      { methods: ['wyre'], label: 'China', value:'china' },
      { methods: ['wyre','moonpay'], label: 'Mexico', value:'mexico' },
      { methods: ['moonpay'], label: 'Canada', value:'canada' },
      { methods: ['moonpay'], label: 'Hong Kong', value:'hong-kong' },
      { methods: ['moonpay'], label: 'Russia', value:'russia' },
      { methods: ['moonpay'], label: 'South Africa', value:'south-africa' },
      { methods: ['moonpay'], label: 'South Korea', value:'south-korea' },
    ];

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
                    <ImageButton caption={'Bank / Debit Card'} imageSrc={'images/debit-card.png'} imageProps={{height:'70px'}} handleClick={ e => this.selectMethod(e,'debit-card') } />
                    <ImageButton caption={'Ethereum Wallet'} imageSrc={'images/tokens/ETH.svg'} imageProps={{p:[2,3],height:'70px'}} handleClick={ e => {this.renderPaymentMethod(e,'ethereum') } } />
                  </Flex>
                </Box>
              ) :
                this.state.selectedMethod === 'debit-card' ? (
                  <Box>
                    <Box mt={2} mb={3}>
                      <Text textAlign={'center'} fontWeight={3} fontSize={2} mb={2}>
                        Select your country:
                      </Text>
                      <Select
                        value={this.state.selectedCountry}
                        onChange={this.handleCountryChange}
                        options={countries_options}
                      />
                    </Box>
                    <Flex flexDirection={'column'} justifyContent={'center'} alignItems={'center'} minHeight={'200px'}>
                      {
                        this.state.selectedCountry !== null ? (
                          <Box width={'100%'}>
                            <Text textAlign={'center'} fontWeight={2} fontSize={2} mb={2}>
                              Choose your preferred payment method:
                            </Text>
                            <Flex mb={4} flexDirection={['column','row']} alignItems={'center'} justifyContent={'center'}>
                            {
                              this.state.selectedCountry.methods.map((method,i) => {
                                const methodInfo = fiatPaymentMethods[method];
                                return (
                                  <ImageButton key={`payment_${method}`} {...methodInfo} handleClick={ e => {this.renderPaymentMethod(e,method) } } />
                                );
                              })
                            }
                            </Flex>
                          </Box>
                        ) : (
                          <Text textAlign={'center'} fontWeight={2} fontSize={2} mb={2}>
                            Select the country to load the payment methods.
                          </Text>
                        )
                      }
                    </Flex>
                  </Box>
                ) :
                  this.state.selectedMethod === 'ethereum' ? (
                    <Box mt={2} mb={3}>
                      <Text textAlign={'center'} fontWeight={3} fontSize={2} my={0}>
                        Crypto
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
                    onClick={ e => this.resetModal(e) }
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