import { Web3Versions } from '@terminal-packages/sdk';
import { RampInstantSDK } from '@ramp-network/ramp-instant-sdk';
import FunctionsUtil from '../utilities/FunctionsUtil';

const globalConfigs = {
  appName: 'Idle',
  baseURL: 'https://beta.idle.finance',
  baseToken: 'ETH',
  countries:{
    'USA':'United States of America',
    'GBR':'United Kingdom',
    'AUS':'Australia',
    'BRA':'Brazil',
    'CHN':'China',
    'CAN':'Canada',
    'EUR':'Europe',
    'HKG':'Hong Kong',
    'IND':'India',
    'MEX':'Mexico',
    'RUS':'Russia',
    'ZAF':'South Africa',
    'KOR':'South Korea'
  },
  logs:{ // Enable logs levels
    messagesEnabled:false,
    errorsEnabled:false
  },
  connectors:{ // Connectors props
    metamask:{
      subcaption:'Browser extension'
    },
    walletconnect:{
      subcaption:'Connect with Walletconnect'
    },
    fortmatic:{
      subcaption:'Login with phone-number'
    },
    portis:{
      subcaption:'Login with e-mail'
    },
    trezor:{
      subcaption:'Hardware wallet'
    },
    ledger:{
      subcaption:'Hardware wallet'
    },
  },
  newsletterSubscription:{
    endpoint:'https://dev.lapisgroup.it/idle/newsletter.php'
  },
  modals:{ // Enable modals
    first_deposit_referral:false, // Referral share modal
    first_deposit_share:true, // First deposit share modal
    welcome:true // Welcome modal
  },
  network:{ // Network configurations
    availableNetworks:{
      1:'Main',
      3:'Ropsten',
      4:'Rinkeby',
      42:'Kovan'
    },
    requiredConfirmations: 1,
    accountBalanceMinimum: 0, // in ETH for gas fees
    requiredNetwork: 42, // { 1: Mainnet, 3: Ropsten, 42: Kovan }
    isForked: false, // If TRUE the tx confirmation callback is fired on the receipt
    providers:{
      infura:{
        1: 'https://mainnet.infura.io/v3/',
        42: 'https://kovan.infura.io/v3/'
      },
      etherscan:{
        enabled:true, // False for empty txs list (try new wallet)
        endpoints:{
          1: 'https://api.etherscan.io/api',
          42: 'https://api-kovan.etherscan.io/api'
        }
      },
      terminal:{
        enabled:false,
        supportedNetworks:[1,42],
        params:{
          apiKey: 'LonotCXiu7FEVd8Zl2W68A==',
          projectId: 'DYLRXdlpqKVzPmZr',
          source: null,
          web3Version: Web3Versions.one
        }
      },
      simpleID:{
        enabled:true,
        supportedNetworks:[1,42],
        getNetwork:(networkId,availableNetworks) => {
          let networkName = null;
          switch (networkId){
            case 1:
              networkName = 'mainnet';
            break;
            default:
              networkName = availableNetworks[networkId] ? availableNetworks[networkId].toLowerCase() : 'mainnet';
            break;
          }
          return networkName;
        },
        params:{
          appOrigin: window.location.origin,
          appName: "Idle",
          appId: "eb4d1754-a76e-4c58-8422-54b5ca2395e7",
          useSimpledIdWidget: true,
          network: 'mainnet'
        }
      }
    }
  },
  payments: { // Payment methods & providers
    methods:{
      bank:{
        defaultProvider:null,
        showDefaultOnly:false,
        props:{
          imageSrc:'images/bank.png',
          caption:'Bank Account'
        }
      },
      card:{
        defaultProvider:null,
        showDefaultOnly:false,
        props:{
          imageSrc:'images/debit-card.png',
          caption:'Credit Card'
        }
      },
      wallet:{
        defaultProvider:'zeroExInstant',
        showDefaultOnly:true,
        props:{
          imageSrc:'images/ethereum-wallet.svg',
          caption:'Ethereum Wallet',
          imageProps:{
            padding:['0','5px']
          }
        }
      },
    },
    providers: {
      wyre: {
        enabled: true,
        imageSrc: 'images/payments/wyre.svg',
        imageProps: {
          width: ['100%','auto'],
          height: ['auto','35px'],
          my: '8px'
        },
        caption: 'Buy with',
        captionPos: 'top',
        subcaption: '~ 0.75% fee ~',
        supportedMethods:['card'],
        supportedCountries:['USA','GBR','AUS','BRA','CHN','MEX'],
        supportedTokens:['USDC','DAI','ETH'],
        remoteResources:{},
        env:'prod',
        envParams:{
          test:{
            accountId:'AC_Q2Y4AARC3TP'
          },
          prod:{
            accountId:'AC_PQQBX33XVEQ'
          }
        },
        getInfo: (props) => {
          const info = {};
          if (props.selectedMethod && props.selectedMethod){
            switch (props.selectedMethod){
              case 'bank':
                info.subcaption = `~ 0.75% fee ~\nKYC REQUIRED`;
              break;
              case 'card':
                info.subcaption = `~ 3.2% fee ~\n$250.00/day`;
              break;
              default:
              break;
            }
          }
          return info;
        },
        getInitParams: (props,globalConfigs,buyParams) => {
          const env = globalConfigs.payments.providers.wyre.env;
          const envParams = globalConfigs.payments.providers.wyre.envParams[env];
          const referrerAccountId = envParams.accountId;
          const url = 'https://pay.sendwyre.com/purchase';

          const params = {
            dest: `ethereum:${props.account}`,
            destCurrency: buyParams.selectedToken ? buyParams.selectedToken : ( props.tokenConfig.wyre && props.tokenConfig.wyre.destCurrency ? props.tokenConfig.wyre.destCurrency : props.selectedToken ),
            referrerAccountId,
            redirectUrl:globalConfigs.baseURL
            // failureRedirectUrl:globalConfigs.baseURL
          };

          return `${url}?`+Object.keys(params)
              .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
              .join('&');
        },
        render: (initParams,amount,props,globalConfigs) => {
          const wyreWidget = document.getElementById('wyre-widget');
          if (!wyreWidget){
            const iframeBox = document.createElement("div");
            iframeBox.innerHTML = `
              <div id="wyre-widget" class="wyre-widget" style="position:fixed;display:flex;justify-content:center;align-items:center;top:0;left:0;width:100%;height:100%;z-index:999">
                <div id="wyre-widget-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:1"></div>
                <a class="wyre-close-button" href="javascript:void(0);" onclick="document.getElementById('wyre-widget').remove();" style="position:absolute;width:30px;height:30px;top:10px;right:10px;font-size:22px;line-height:30px;text-align:center;color:#fff;font-weight:bold;z-index:10;text-decoration:none">✕</a>
                <div id="wyre-widget-container" style="position:relative;z-index:2;width:400px;height:650px">
                  <iframe
                    style="position:relative;z-index:2;"
                    frameborder="0"
                    height="100%"
                    src="${initParams}"
                    width="100%"
                  >
                    <p>Your browser does not support iframes.</p>
                  </iframe>
                  <div id="wyre-widget-loading-placeholder" style="position:absolute;background:#fff;width:100%;height:100%;z-index:1;top:0;display:flex;justify-content:center;align-items:center;">
                    <div style="display:flex;flex-direction:row;align-items:center">
                      <img src="${globalConfigs.payments.providers.wyre.imageSrc}" style="height:50px;" />
                      <h3 style="font-weight:600;font-style:italic;color:#000;padding-left:10px">is loading...</h3>
                    </div>
                  </div>
                </div>
              </div>
            `;
            document.body.appendChild(iframeBox);

            // Add wyre Widget style (mobile)
            if (!document.getElementById('wyreWidget_style')){
              const wyreStyle = document.createElement('style');
              wyreStyle.id = 'wyreWidget_style';
              wyreStyle.innerHTML = `
              @media (max-width: 40em){
                #wyre-widget {
                  align-items: flex-start !important;
                }
                #wyre-widget-overlay{
                  background:#fff !important;
                }
                #wyre-widget-container{
                  width:100vw;
                  min-height: calc( 100vh - 60px ) !important;
                }
              }`;
              document.body.appendChild(wyreStyle);
            }
          }
        },
        getInitParams_old: (props,globalConfigs,buyParams) => {

          const generateSecretKey = () => {
            let secretKey = null;
            if (localStorage) {
              if (!(secretKey = localStorage.getItem('wyreSecretKey'))){
                secretKey = 'xxxxxxxx-xxxx-yxxx-yxxx-xxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                  // eslint-disable-next-line
                  var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                  return v.toString(16);
                });
                localStorage.setItem('wyreSecretKey',secretKey);
              }
            }
            return secretKey;
          }

          const methods = {
            'bank':'onramp',
            'card':'debitcard'
          };

          const secretKey = generateSecretKey();
          const env = globalConfigs.payments.providers.wyre.env;
          const envParams = globalConfigs.payments.providers.wyre.envParams[env];
          const accountId = envParams.accountId;

          return {
            accountId,
            auth: {
              type: 'secretKey',
              secretKey
            },
            env,
            operation: {
              type: methods[buyParams.selectedMethod],
              dest: `ethereum:${props.account}`,
              destCurrency: buyParams.selectedToken ? buyParams.selectedToken : ( props.tokenConfig.wyre && props.tokenConfig.wyre.destCurrency ? props.tokenConfig.wyre.destCurrency : props.selectedToken ),
            }
          };
        }
      },
      ramp: {
        enabled:true,
        imageSrc: 'images/payments/ramp.png',
        imageProps: {
          width: ['100%','auto'],
          height: ['auto','35px'],
          my: '8px'
        },
        caption: 'Buy with',
        captionPos: 'top',
        subcaption:`~ 2.5% fee ~\nGBP ONLY`,
        supportedMethods:['bank'],
        badge: {
          text:'REVOLUT',
          color:'#fff',
          bgColor:'#0cade4'
        },
        supportedCountries:['GBR','EUR'],
        supportedTokens:['ETH','DAI'],
        getInitParams: (props,globalConfigs,buyParams) => {
        	return {
	          hostAppName: 'Idle',
	          hostLogoUrl: `${globalConfigs.baseURL}/images/idle-round.png`,
	          swapAsset: buyParams.selectedToken ? buyParams.selectedToken : ( props.tokenConfig.ramp && props.tokenConfig.ramp.swapAsset ? props.tokenConfig.ramp.swapAsset : props.selectedToken ),
	          userAddress: props.account,
	          variant: props.isMobile ? 'mobile' : 'desktop',
        	};
        },
        render: (initParams,amount,props,globalConfigs) => {
          new RampInstantSDK(initParams)
            .on('*', async (event) => {
              const functionsUtil = new FunctionsUtil(props);
              let tokenDecimals = null;
              let tokenAmount = null;

              switch (event.type){
                case 'PURCHASE_SUCCESSFUL':
                  // Update balance
                  props.getAccountBalance();

                  tokenDecimals = await props.getTokenDecimals();

                  tokenAmount = event.payload.purchase.tokenAmount;
                  tokenAmount = functionsUtil.BNify(tokenAmount.toString()).div(functionsUtil.BNify(Math.pow(10,parseInt(tokenDecimals)).toString())).toString();

                  // Toast message
                  window.toastProvider.addMessage(`Payment completed`, {
                    secondaryMessage: `${tokenAmount} ${props.selectedToken} are now in your wallet`,
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
        }
      },
      moonpay: {
        enabled:true,
        imageSrc: 'images/payments/moonpay.svg',
        imageProps: {
          width: ['100%','auto'],
          height: ['auto','35px'],
          my: '8px'
        },
        caption: 'Buy with',
        captionPos: 'top',
        subcaption: '~ 4.5% fee ~',
        supportedMethods:['card','bank'],
        supportedCountries:['USA','GBR','EUR','AUS','BRA','CHN','MEX','CAN','HKG','RUS','ZAF','KOR'],
        supportedTokens:['USDC','DAI','ETH'],
        env:'prod',
        envParams:{
          test:{
            url:'https://buy-staging.moonpay.io',
            apiKey:'pk_test_xZO2dhqZb9gO65wHKCCFmMJ5fbSyHSI'
          },
          prod:{
            url:'https://buy.moonpay.io',
            apiKey:'pk_live_iPIpLBe5GGSL73fpAKtGBZTfshXfBwu'
          }
        },
        getInfo: (props) => {
          const info = {};
          if (props.selectedMethod && props.selectedMethod){
            switch (props.selectedMethod){
              case 'bank':
                if (props.selectedCountry && props.selectedCountry.value){
                  switch (props.selectedCountry.value.toUpperCase()){
                    case 'EUR':
                      info.badge = {
                        text:'SEPA',
                        color:'#f7cb05 ',
                        bgColor:'#10288a'
                      }
                      info.subcaption = `~ 1.5% fee ~\nEUR ONLY`;
                    break;
                    case 'GBR':
                      info.badge = {
                        text:'GBP',
                      }
                      info.subcaption = `~ 1.5% fee ~\nGBP ONLY`;
                    break;
                    default:
                      info.badge = null;
                      info.subcaption = `~ 1.5% fee ~\nEUR/GBP ONLY`;
                    break;
                  }
                }
              break;
              case 'card':
                info.badge = null;
                info.subcaption = `~ 5% fee ~`;
              break;
              default:
              break;
            }
          }
          return info;
        },
        getInitParams: (props,globalConfigs,buyParams) => {
          const env = globalConfigs.payments.providers.moonpay.env;
          const envParams = globalConfigs.payments.providers.moonpay.envParams[env];
          const apiKey = envParams.apiKey;
          const params = {
            apiKey,
            currencyCode: buyParams.selectedToken ? buyParams.selectedToken.toLowerCase() : ( props.tokenConfig.moonpay && props.tokenConfig.moonpay.currencyCode ? props.tokenConfig.moonpay.currencyCode : props.selectedToken.toLowerCase()),
            walletAddress:props.account,
            baseCurrencyCode:'USD',
            showWalletAddressForm: true
          };

          const methods = {
            'bank':{
              'GBR':'gbp_bank_transfer',
              'EUR':'sepa_bank_transfer'
            },
            'card':'credit_debit_card'
          };

          const selectedCountry = buyParams.selectedCountry && buyParams.selectedCountry.value ? buyParams.selectedCountry.value.toUpperCase() : null;

          // Set payment method
          if (buyParams.selectedMethod){
            switch (buyParams.selectedMethod){
              case 'bank':
                params.enabledPaymentMethods = methods[buyParams.selectedMethod]['EUR'];
                switch (selectedCountry){
                  case 'GBR':
                  case 'EUR':
                    params.enabledPaymentMethods = methods[buyParams.selectedMethod][selectedCountry];
                  break;
                  default:
                    params.enabledPaymentMethods = Object.values(methods[buyParams.selectedMethod]).join(',');
                  break;
                }
              break;
              case 'card':
              default:
                params.enabledPaymentMethods = methods[buyParams.selectedMethod];
              break;
            }
          }

          // Set baseCurrencyCode
          switch (selectedCountry){
            case 'GBR':
              params.baseCurrencyCode = 'GBP';
            break;
            case 'EUR':
              params.baseCurrencyCode = 'EUR';
            break;
            default:
              params.baseCurrencyCode = 'USD';
            break;
          }

          let url = envParams.url;

          // Safari Fix
          var isSafari = navigator.userAgent.indexOf("Safari") > -1;
          if (isSafari) {
            if (!document.cookie.match(/^(.*;)?\s*moonpay-fixed\s*=\s*[^;]+(.*)?$/)) {
              document.cookie = "moonpay-fixed=fixed; expires=Tue, 19 Jan 2038 03:14:07 UTC; path=/";
              url += "/safari_fix";
            }
          }

          return `${url}?`+Object.keys(params)
              .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
              .join('&');
        },
        render: (initParams,amount,props,globalConfigs) => {
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
                  width:100vw;
                  min-height: calc( 100vh - 60px ) !important;
                }
              }`;
              document.body.appendChild(moonpayStyle);
            }
          }
        }
      },
      transak: {
        enabled:true,
        imageSrc: 'images/payments/transak.png',
        imageProps: {
          width: ['100%','auto'],
          height: ['auto','35px'],
          my: '8px'
        },
        caption: 'Buy with',
        captionPos: 'top',
        subcaption:`~ 2.5% fee ~\nGBP ONLY`,
        supportedMethods:['bank'],
        supportedCountries:['GBR','IND'],
        supportedTokens:['DAI','SAI','USDC'],
        remoteResources:{'https://global.transak.com/v1/widget.js':{}},
        env:'prod',
        badge:{
          text:'KYC'
        },
        envParams:{
          test:{
            apiKey:'test',
            url:'https://global.transak.com'
          },
          prod:{
            apiKey:'a135bd06-b7f9-4f9e-87f6-c59321f137b2',
            url:'https://global.transak.com'
          }
        },
        getInfo: (props) => {
          const info = {};
          if (props.selectedCountry && props.selectedCountry.value){
            switch (props.selectedCountry.value.toUpperCase()){
              case 'GBR':
                info.subcaption = `~ 2.5% fee ~\nGBP ONLY`;
              break;
              case 'IND':
                info.subcaption = `~ 2.5% fee ~\nINR ONLY`;
              break;
              default:
              break;
            }
          }
          return info;
        },
        getInitParams: (props,globalConfigs,buyParams) => {
          const env = globalConfigs.payments.providers.transak.env;
          const envParams = globalConfigs.payments.providers.transak.envParams[env];

          let fiatCurrency = null;

          if (buyParams.selectedCountry && buyParams.selectedCountry.value){
            switch (buyParams.selectedCountry.value.toUpperCase()){
              case 'IND':
                fiatCurrency = 'INR';
              break;
              case 'GBR':
              default:
                fiatCurrency = 'GBP';
              break;
            }
          }

          let cryptoCurrencyCode = buyParams.selectedToken ? buyParams.selectedToken.toLowerCase() : ( props.tokenConfig.transak && props.tokenConfig.transak.currencyCode ? props.tokenConfig.transak.currencyCode : props.selectedToken);
          cryptoCurrencyCode = cryptoCurrencyCode.toUpperCase();

          const apiKey = envParams.apiKey;
          const walletAddress = props.account;
          const partnerCustomerId = props.account;
          const disableWalletAddressForm = true;

          return {
            apiKey,
            cryptoCurrencyCode,
            walletAddress,
            fiatCurrency,
            partnerCustomerId,
            disableWalletAddressForm,
            width:'100%',
            height:'100%'
            // email,
          };
        },
        render: (initParams,amount,props,globalConfigs) => {
          if (window.transakGlobal){

            const transakWidget = document.getElementById('transak-widget');
            if (!transakWidget){
              const iframeBox = document.createElement("div");
              iframeBox.innerHTML = `
                <div id="transak-widget" class="transak-widget" style="position:fixed;display:flex;justify-content:center;align-items:center;top:0;left:0;width:100%;height:100%;z-index:999">
                  <div id="transak-widget-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:1"></div>
                  <a class="transak-close-button" href="javascript:void(0);" onclick="document.getElementById('transak-widget').remove();" style="position:absolute;width:30px;height:30px;top:10px;right:10px;font-size:22px;line-height:30px;text-align:center;color:#fff;font-weight:bold;z-index:10;text-decoration:none">✕</a>
                  <div class="transak-widget-container" style="position:relative;z-index:2;width:500px;height:550px">
                    <div id="transak-widget-container" style="position:relative;z-index:2;width:500px;height:550px"></div>
                    <div id="transak-widget-loading-placeholder" style="position:absolute;background:#fff;width:100%;height:100%;z-index:1;top:0;display:flex;justify-content:center;align-items:center;">
                      <div style="display:flex;flex-direction:row;align-items:center">
                        <img src="${globalConfigs.payments.providers.transak.imageSrc}" style="height:50px;" />
                        <h3 style="font-weight:600;font-style:italic;color:#0040ca">is loading...</h3>
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
                    width:100vw;
                    min-height: calc( 100vh - 60px ) !important;
                  }
                }`;
                document.body.appendChild(transakStyle);
              }
            }

            window.transakGlobal.render(initParams, 'transak-widget-container');
          }
        }
      },
      zeroExInstant: {
        enabled: true,
        imageSrc: 'images/payments/zeroexinstant.svg',
        imageProps: {
          width: ['100%','auto'],
          height: ['auto','35px'],
          my: '8px'
        },
        caption: 'Buy with',
        captionPos: 'top',
        subcaption: '~ 0.75% fee ~',
        supportedMethods:['wallet'],
        supportedTokens:['USDC','DAI'],
        remoteResources:{'https://instant.0x.org/v3/instant.js':{}},
        getInitParams: (props,globalConfigs,onSuccess,onClose) => {
          const connectorName = window.RimbleWeb3_context ? window.RimbleWeb3_context.connectorName : null;
          return {
            provider: connectorName && connectorName!=='Injected' && window.RimbleWeb3_context.connector[connectorName.toLowerCase()] ? window.RimbleWeb3_context.connector[window.RimbleWeb3_context.connectorName.toLowerCase()].provider : window.ethereum,
            orderSource: props.tokenConfig.zeroExInstant.orderSource,
            affiliateInfo: props.tokenConfig.zeroExInstant.affiliateInfo,
            defaultSelectedAssetData: props.tokenConfig.zeroExInstant.assetData,
            availableAssetDatas: [props.tokenConfig.zeroExInstant.assetData],
            shouldDisableAnalyticsTracking: true,
            onSuccess: onSuccess ? onSuccess : () => {},
            onClose: onClose ? onClose : () => {}
          };
        },
        render: (initParams,amount) => {
          if (window.zeroExInstant){
            if (amount){
              initParams.defaultAssetBuyAmount = parseFloat(amount);
            }
            window.zeroExInstant.render(initParams, 'body');
          }
        }
      },
      kyberSwap: {
        enabled: true,
        imageSrc: 'images/payments/kyber.svg',
        imageProps: {
          width: ['100%','auto'],
          height: ['auto','35px'],
          my: '8px'
        },
        caption: 'Swap with',
        captionPos: 'top',
        subcaption: '~ 0.075% fee ~',
        supportedMethods:['wallet'],
        supportedTokens:['USDC','DAI','SAI'],
        remoteResources:{
          'https://widget.kyber.network/v0.7.4/widget.css':{},
          'https://widget.kyber.network/v0.7.4/widget.js':{
            parentElement:document.body,
            precall: (props,globalConfigs,providerInfo) => {

              // Remove previous elements
              const buttons = document.querySelectorAll('.kyber-widget-button');
              for (let i=0;i<buttons.length;i++){
                buttons[i].remove();
              }
              const scripts = document.querySelectorAll('.script_kyberSwap');
              for (let i=0;i<scripts.length;i++){
                scripts[i].remove();
              }

              const buttonId = `kyber-swapper-${props.selectedToken}`;
              if (!document.getElementById(buttonId)){
                const a = document.createElement('a');
                a.id = buttonId;
                a.href = providerInfo.getInitParams(props,globalConfigs);
                a.target = '_blank';
                a.className = 'kyber-widget-button theme-ocean theme-supported';
                a.title = 'Swap with Kyber';
                a.style = 'display:none;';
                document.body.appendChild(a);
              }
            }
          }
        },
        getInitParams: (props,globalConfigs) => {
          const params = {
            type:'swap',
            mode:'popup',
            title:`Swap token for ${props.selectedToken}`,
            lang:'en',
            pinnedTokens:props.selectedToken,
            defaultPair:`ETH_${props.selectedToken}`,
            callback:'https://kyberpay-sample.knstats.com/callback',
            paramForwarding:true,
            network: globalConfigs.network.requiredNetwork === 1 ? 'mainnet' : 'test',
            commissionId:'0x4215606a720477178AdFCd5A59775C63138711e8',
            theme:'theme-ocean'
          };

          const url  = 'https://widget.kyber.network/v0.7.4/';

          return `${url}?`+Object.keys(params)
              .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
              .join('&');
        },
        render: (initParams,amount,props) => {
          const buttonId = `kyber-swapper-${props.selectedToken}`;
          const a = document.getElementById(buttonId);
          if (a){
            a.click();
          }
        }
      },
      airSwap: {
        enabled: false,
        imageSrc: 'images/payments/airswap.svg',
        imageProps: {
          width: ['100%','auto'],
          height: ['auto','35px'],
          my: '8px'
        },
        caption: 'Buy with',
        captionPos: 'top',
        subcaption: '~ 0% fee ~',
        supportedMethods:['wallet'],
        supportedTokens:['USDC','DAI','SAI'],
        env:'production',
        remoteResources:{'https://cdn.airswap.io/airswap-instant-widget.js':{}},
        getInitParams: (props,globalConfigs,onComplete,onClose) => {
          return {
            env: 'production',
            mode: 'buy',
            token: props.tokenConfig.address,
            baseToken: 'ETH',
            onComplete: onComplete ? onComplete : () => {},
            onClose: onClose ? onClose : () => {}
          };
        },
        render: (initParams,amount,props) => {
          if (window.AirSwapInstant){
            if (amount){
              initParams.amount = amount.toString();
            }
            window.AirSwapInstant.render(initParams,'body');
          }
        }
      },
      totle: {
        enabled: false,
        imageSrc: 'images/payments/totle.svg',
        imageProps: {
          width: ['100%','auto'],
          height: ['auto','35px'],
          my: '8px'
        },
        caption: 'Buy with',
        captionPos: 'top',
        subcaption: '~ 0% fee ~',
        supportedMethods:['wallet'],
        supportedTokens:['USDC','DAI','SAI'],
        env:'production',
        remoteResources:{'https://widget.totle.com/latest/dist.js':{}},
        getInitParams: (props,globalConfigs,onComplete,onClose) => {
          return {
            sourceAssetAddress: null,
            sourceAmountDecimal: null,
            destinationAssetAddress: null,
            destinationAmountDecimal: null,
            apiKey: null,
            partnerContractAddress: null,
          };
        },
        render: (initParams,amount,props) => {
          if (window.TotleWidget){
            const nodeId = 'totle-widget';
            if (!document.getElementById(nodeId)){
              const totleWidgetContainer = document.createElement("div");
              totleWidgetContainer.id = nodeId;
              document.body.appendChild(totleWidgetContainer);
            }

            window.TotleWidget.default.run(initParams,document.getElementById(nodeId));
          }
        }
      }
    }
  }
};

export default globalConfigs;