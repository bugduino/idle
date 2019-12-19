const globalConfigs = {
  baseURL: 'https://beta.idle.finance',
  baseToken: 'ETH',
  countries:{
    'USA':'United States of America',
    'GBR':'United Kingdom',
    'AUS':'Australia',
    'BRA':'Brazil',
    'CHN':'China',
    'CAN':'Canada',
    'MEX':'Mexico',
    'EUR':'Europe',
    'HKG':'Hong Kong',
    'RUS':'Russia',
    'ZAF':'South Africa',
    'KOR':'South Korea'
  },
  payments: {
    methods:{
      'bank':{
        props:{
          imageSrc:'images/bank.png',
          caption:'Bank Account',
          imageProps:{height:'70px'}
        }
      },
      'card':{
        props:{
          imageSrc:'images/debit-card.png',
          caption:'Credit Card',
          imageProps:{height:'70px'}
        }
      },
      'wallet':{
        props:{
          imageSrc:'images/tokens/ETH.svg',
          caption:'Ethereum Wallet',
          imageProps:{p:[2,3],height:'70px'}
        }
      },
    },
    providers: {
      wyre: {
        enabled: false,
        imageSrc: 'images/payments/wyre.svg',
        imageProps: {
          height: '35px',
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
            'card':'debitcard-hosted-dialog'
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
          height: '35px',
          my: '8px'
        },
        caption: 'Buy with',
        captionPos: 'top',
        subcaption:`~ 2.5% fee ~\nGBP ONLY`,
        supportedMethods:['bank'],
        supportedCountries:['GBR','EUR'],
        supportedTokens:['SAI','ETH'],
        getInitParams: (props,globalConfigs,buyParams) => {
        	return {
	          hostAppName: 'Idle',
	          hostLogoUrl: `${globalConfigs.baseURL}/images/idle-dai.png`,
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
          height: '35px',
          my: '8px'
        },
        caption: 'Buy with',
        captionPos: 'top',
        subcaption: '~ 4.5% fee ~',
        supportedMethods:['card','bank'],
        supportedCountries:['GBR','EUR','AUS','BRA','CHN','MEX','CAN','HKG','RUS','ZAF','KOR'],
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
        getInitParams: (props,globalConfigs,buyParams) => {
          const env = globalConfigs.payments.providers.moonpay.env;
          const envParams = globalConfigs.payments.providers.moonpay.envParams[env];
          const apiKey = envParams.apiKey;
          const params = {
            apiKey,
            currencyCode: buyParams.selectedToken ? buyParams.selectedToken.toLowerCase() : ( props.tokenConfig.moonpay && props.tokenConfig.moonpay.currencyCode ? props.tokenConfig.moonpay.currencyCode : props.selectedToken.toLowerCase()),
            walletAddress:props.account
          };

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
      'zeroExInstant': {
          enabled:true,
          imageSrc: 'images/payments/zeroexinstant.svg',
          imageProps: {
            height: '35px',
            my: '8px'
          },
          caption: 'Buy with',
          captionPos: 'top',
          subcaption: '~ 0.75% fee ~',
          supportedMethods:['wallet'],
          supportedTokens:['USDC','DAI','SAI'],
          remoteResources:{'https://instant.0x.org/instant.js':{}},
          getInitParams: (props,globalConfigs) => {
            return {
              orderSource: props.tokenConfig.zeroExInstant.orderSource,
              affiliateInfo: props.tokenConfig.zeroExInstant.affiliateInfo,
              defaultSelectedAssetData: props.tokenConfig.zeroExInstant.assetData,
              availableAssetDatas: [props.tokenConfig.zeroExInstant.assetData],
              shouldDisableAnalyticsTracking: true,
              onSuccess: async (txHash) => {
                
              },
              onClose: (e) => {
                if (e){
                  e.preventDefault();
                }
              }
            };
          }
      }
    }
  }
};

export default globalConfigs;