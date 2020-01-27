import { Web3Versions } from '@terminal-packages/sdk';
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
  modals:{ // Enable modals
    first_deposit_referral:false, // Referral share modal
    first_deposit_share:true, // First deposit share modal
    welcome:false // Welcome modal
  },
  network:{ // Network configurations
    requiredConfirmations: 1,
    accountBalanceMinimum: 0, // in ETH for gas fees
    requiredNetwork: 42, // { 1: Mainnet, 3: Ropsten, 42: Kovan }
    isForked: true, // If TRUE the tx confirmation callback is fired on the receipt
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
      }
    }
  },
  payments: { // Payment methods & providers
    methods:{
      bank:{
        defaultProvider:null,
        props:{
          imageSrc:'images/bank.png',
          caption:'Bank Account'
        }
      },
      card:{
        defaultProvider:null,
        props:{
          imageSrc:'images/debit-card.png',
          caption:'Credit Card'
        }
      },
      wallet:{
        defaultProvider:'zeroExInstant',
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
        supportedMethods:['bank','card'],
        supportedCountries:['USA','GBR','AUS','BRA','CHN','MEX'],
        supportedTokens:['USDC','DAI','SAI','ETH'],
        remoteResources:{'https://verify.testwyre.com/js/widget-loader.js':{}},
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
                info.subcaption = `~ 0.75% fee ~\nSSN REQUIRED`;
              break;
              default:
              break;
            }
          }
          return info;
        },
        getInitParams: (props,globalConfigs,buyParams) => {

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
                info.subcaption = `~ 1.5% fee ~\nSEPA ONLY`;
              break;
              case 'card':
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
            walletAddress:props.account
          };

          const methods = {
            'bank':'sepa_bank_transfer',
            'card':'credit_debit_card'
          };

          // Set right payment methods
          if (buyParams.selectedMethod){
            params.enabledPaymentMethods = methods[buyParams.selectedMethod];
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
        env:'prod',
        envParams:{
          test:{
            url:'https://global.transak.com'
          },
          prod:{
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
          const params = {
            currencyCode: buyParams.selectedToken ? buyParams.selectedToken.toLowerCase() : ( props.tokenConfig.transak && props.tokenConfig.transak.currencyCode ? props.tokenConfig.transak.currencyCode : props.selectedToken.toLowerCase()),
            walletAddress: props.account,
          };

          let url = envParams.url;

          return `${url}?`+Object.keys(params)
              .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
              .join('&');
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
            network: 'mainnet',
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