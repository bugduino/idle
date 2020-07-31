import cToken from '../abis/compound/cDAI';
import ERC20 from '../abis/tokens/DAI.js';
import CHAI from '../abis/chai/CHAI.json';
import iToken from '../abis/fulcrum/iToken.json';
import aToken from '../abis/aave/AToken.json';
import yToken from '../abis/dydx/yToken.json';
// import idleDAIv1 from '../contracts/IdleDAI.json';
import IdleTokenV2 from '../contracts/IdleTokenV2.json';
import IdleTokenV3 from '../contracts/IdleTokenV3.json';
// import IdleMcdBridgeV1 from '../contracts/IdleMcdBridgeV1.json';
import IdleConverterV2 from '../contracts/IdleConverterV2.json';

const availableTokens = {
  42:{ // Kovan
    /*
    risk:{
      DAI:{
        decimals:18,
        enabled:true,
        abi:ERC20.abi,
        address:'0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa',
        zeroExInstant:{
          orderSource: 'https://api.0x.org/sra/',
          assetData:'0xf47261b00000000000000000000000006b175474e89094c44da98b954eedeac495271d0f',
          affiliateInfo: {
              feeRecipient: '0x4215606a720477178AdFCd5A59775C63138711e8',
              feePercentage: 0.0025
          },
        },
        wyre:{
          destCurrency:'DAI'
        },
        ramp:{
          swapAsset:'DAI'
        },
        defiPrime:{
          token:'dai'
        },
        idle:{
          abi:IdleTokenV2,
          token:'idleDAI',
          address:'0x199e7c55B44fFBD2934bFC3bDeE05F6EC2b547CF'
        },
        migration:{
          enabled:false,
          oldContract:{
            abi:idleDAIv1.abi,
            token:'idleSAI',
            name:'oldContract',
            address:'0x4Cc31d87E658504a9db6c9337102c408A3bdE90d',
          },
          migrationContract:{
            abi:IdleMcdBridgeV1,
            token:'idleSAI',
            name:'migrationContract',
            address:'0xE293a3576f22A6BAF841Ed6bb80953F445e1b22a',
            oldAddresses:['0x556659f45381dEE8BA429C295363E39645abE834'],
            functions:[
              {
                name:'bridgeIdleV1ToIdleV2',
                label:'MIGRATE TO idleSAI v2',
                params:['0x4Cc31d87E658504a9db6c9337102c408A3bdE90d','0x5266C66FC100d2FBE5dbCfE8a8789568D2d2F720']
              },
              {
                name:'bridgeIdleV1ToIdleV2',
                label:'MIGRATE TO idleDAI v2',
                params:['0x4Cc31d87E658504a9db6c9337102c408A3bdE90d','0x199e7c55B44fFBD2934bFC3bDeE05F6EC2b547CF']
              },
            ]
          }
        },
        protocols:[
          {
            name:'compound',
            enabled:true,
            abi:cToken.abi,
            address:'0xe7bc397dbd069fc7d0109c0636d06888bb50668c',
            token:'cDAI',
            decimals:28,
            functions:{
              exchangeRate:{
                name:'exchangeRateStored',
                params:[]
              }
            },
          },
          {
            name:'fulcrum',
            enabled:true,
            abi:iToken,
            address:'0x6c1e2b0f67e00c06c8e2be7dc681ab785163ff4d',
            token:'iDAI',
            decimals:18,
            functions:{
              exchangeRate:{
                name:'tokenPrice',
                params:[]
              }
            },
          }
        ]
      },
      USDC:{
        enabled:false,
        abi:ERC20.abi,
        address:'0xC4375B7De8af5a38a93548eb8453a498222C4fF2',
        zeroExInstant:{
          orderSource: 'https://api.0x.org/sra/',
          assetData:'0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          affiliateInfo: {
              feeRecipient: '0x4215606a720477178AdFCd5A59775C63138711e8',
              feePercentage: 0.0025
          },
        },
        wyre:{
          destCurrency:'USDC'
        },
        defiPrime:{
          token:'usdc'
        },
        idle:{
          abi:IdleTokenV2,
          token:'idleUSDC',
          address:'0x17c5efC8dbd9b1b34457eE46c3C8e0F928e80dbE'
        },
        protocols:[
          {
            name:'compound',
            enabled:true,
            abi:cToken.abi,
            address:'0x63c344bf8651222346dd870be254d4347c9359f7',
            token:'cUSDC',
            decimals:28,
            functions:{
              exchangeRate:{
                name:'exchangeRateStored',
                params:[]
              }
            },
          },
          {
            name:'fulcrum',
            enabled:true,
            abi:iToken,
            address:'0xA1e58F3B1927743393b25f261471E1f2D3D9f0F6',
            token:'iUSDC',
            decimals:18,
            functions:{
              exchangeRate:{
                name:'tokenPrice',
                params:[]
              }
            },
          }
        ]
      }
    },
    best:{
      USDC:{
        enabled:false,
        abi:ERC20.abi,
        address:'0xC4375B7De8af5a38a93548eb8453a498222C4fF2',
        zeroExInstant:{
          orderSource: 'https://api.0x.org/sra/',
          assetData:'0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          affiliateInfo: {
              feeRecipient: '0x4215606a720477178AdFCd5A59775C63138711e8',
              feePercentage: 0.0025
          },
        },
        wyre:{
          destCurrency:'USDC'
        },
        defiPrime:{
          token:'usdc'
        },
        idle:{
          abi:IdleTokenV2,
          token:'idleUSDC',
          address:'0x17c5efC8dbd9b1b34457eE46c3C8e0F928e80dbE'
        },
        protocols:[
          {
            name:'compound',
            enabled:true,
            abi:cToken.abi,
            address:'0x63c344bf8651222346dd870be254d4347c9359f7',
            token:'cUSDC',
            decimals:28,
            functions:{
              exchangeRate:{
                name:'exchangeRateStored',
                params:[]
              }
            },
          },
          {
            name:'fulcrum',
            enabled:true,
            abi:iToken,
            address:'0xA1e58F3B1927743393b25f261471E1f2D3D9f0F6',
            token:'iUSDC',
            decimals:18,
            functions:{
              exchangeRate:{
                name:'tokenPrice',
                params:[]
              }
            },
          }
        ]
      }
    }
    */
  },
  1:{ // Mainnet
    best:{
      DAI:{
        token:'DAI',
        decimals:18,
        enabled:true,
        abi:ERC20.abi,
        color:'hsl(40, 95%, 59%)',
        address:'0x6b175474e89094c44da98b954eedeac495271d0f',
        zeroExInstant:{
          orderSource: 'https://api.0x.org/sra/',
          assetData:'0xf47261b00000000000000000000000006b175474e89094c44da98b954eedeac495271d0f',
          affiliateInfo: {
              feeRecipient: '0x4215606a720477178AdFCd5A59775C63138711e8',
              feePercentage: 0.0025
          },
        },
        wyre:{
          destCurrency:'DAI'
        },
        ramp:{
          swapAsset:'DAI'
        },
        defiPrime:{
          token:'dai'
        },
        idle:{
          abi:IdleTokenV3,
          token:'idleDAIYield',
          address:'0x78751b12da02728f467a44eac40f5cbc16bd7934'
        },
        migration:{
          enabled:true,
          oldContract:{
            abi:IdleTokenV2,
            token:'idleDAI',
            name:'idleDAIOld',
            address:'0x10eC0D497824e342bCB0EDcE00959142aAa766dD',
          },
          migrationContract:{
            abi:IdleConverterV2,
            token:'idleDAI',
            name:'IdleConverterV3',
            address:'0xC74d886ebaA5674E21A1CB0Be3997BDDcE6ad525',
            oldAddresses:['0x60753b3a588ff8fe8204595dc295a132c1bb50ae'],
            functions:[
              {
                label:'Migrate',
                name:'migrateFromToIdle'
              },
            ]
          }
        },
        protocols:[
          {
            name:'compound',
            enabled:true,
            abi:cToken.abi,
            address:'0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
            token:'cDAI',
            decimals:28,
            functions:{
              exchangeRate:{
                name:'exchangeRateStored',
                params:[]
              }
            },
          },
          {
            name:'fulcrum',
            enabled:true,
            abi:iToken,
            address:'0x493c57c4763932315a328269e1adad09653b9081',
            token:'iDAI',
            decimals:18,
            functions:{
              exchangeRate:{
                name:'tokenPrice',
                params:[]
              }
            },
          },
          {
            name:'aave',
            enabled:true,
            abi:aToken,
            address:'0xfC1E690f61EFd961294b3e1Ce3313fBD8aa4f85d',
            token:'aDAI',
            decimals:18,
            functions:{

            }
          },
          {
            name:'dsr',
            enabled:true,
            abi:CHAI,
            address:'0x06AF07097C9Eeb7fD685c692751D5C66dB49c215',
            token:'CHAI',
            decimals:18,
            functions:{

            }
          },
          {
            name:'dydx',
            enabled:true,
            abi:yToken,
            address:'0xF424B10e1e9691ae5FB530FE4c3e6b9971013D49',
            token:'yxDAI',
            decimals:18,
            functions:{
              exchangeRate:{
                name:'price',
                params:[]
              }
            }
          }
        ]
      },
      USDC:{
        decimals:6,
        token:'USDC',
        enabled:true,
        abi:ERC20.abi,
        color:'hsl(211, 67%, 47%)',
        address:'0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        zeroExInstant:{
          orderSource: 'https://api.0x.org/sra/',
          assetData:'0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          affiliateInfo: {
              feeRecipient: '0x4215606a720477178AdFCd5A59775C63138711e8',
              feePercentage: 0.0025
          },
        },
        wyre:{
          destCurrency:'USDC'
        },
        defiPrime:{
          token:'usdc'
        },
        idle:{
          abi:IdleTokenV3,
          token:'idleUSDCYield',
          address:'0x12B98C621E8754Ae70d0fDbBC73D6208bC3e3cA6'
        },
        migration:{
          enabled:true,
          oldContract:{
            abi:IdleTokenV2,
            token:'idleUSDC',
            name:'idleUSDCOld',
            address:'0xeB66ACc3d011056B00ea521F8203580C2E5d3991',
          },
          migrationContract:{
            abi:IdleConverterV2,
            token:'idleUSDC',
            name:'IdleConverterV3',
            address:'0xC74d886ebaA5674E21A1CB0Be3997BDDcE6ad525',
            oldAddresses:['0x60753b3a588ff8fe8204595dc295a132c1bb50ae'],
            functions:[
              {
                label:'Migrate',
                name:'migrateFromToIdle'
              },
            ]
          }
        },
        protocols:[
          {
            name:'compound',
            enabled:true,
            abi:cToken.abi,
            address:'0x39aa39c021dfbae8fac545936693ac917d5e7563',
            token:'cUSDC',
            decimals:16,
            functions:{
              exchangeRate:{
                name:'exchangeRateStored',
                params:[]
              }
            },
          },
          {
            name:'fulcrum',
            enabled:true,
            abi:iToken,
            address:'0xf013406a0b1d544238083df0b93ad0d2cbe0f65f',
            token:'iUSDC',
            decimals:18,
            functions:{
              exchangeRate:{
                name:'tokenPrice',
                params:[]
              }
            },
          },
          {
            name:'aave',
            enabled:true,
            abi:aToken,
            address:'0x9bA00D6856a4eDF4665BcA2C2309936572473B7E',
            token:'aUSDC',
            decimals:18,
            functions:{
              
            }
          },
          {
            name:'dydx',
            enabled:true,
            abi:yToken,
            address:'0x0d81b042bb9939b4d32cdf7861774c442a2685ce',
            token:'yxUSDC',
            decimals:18,
            functions:{
              exchangeRate:{
                name:'price',
                params:[]
              }
            }
          }
        ]
      },
      USDT:{
        decimals:6,
        token:'USDT',
        enabled:true,
        abi:ERC20.abi,
        color:'hsl(211, 67%, 47%)',
        address:'0xdac17f958d2ee523a2206206994597c13d831ec7',
        wyre:{
          destCurrency:'USDT'
        },
        defiPrime:{
          token:'usdt'
        },
        idle:{
          abi:IdleTokenV3,
          token:'idleUSDTYield',
          address:'0x63D27B3DA94A9E871222CB0A32232674B02D2f2D'
        },
        protocols:[
          {
            name:'compound',
            enabled:true,
            abi:cToken.abi,
            address:'0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9',
            token:'cUSDT',
            decimals:16,
            functions:{
              exchangeRate:{
                name:'exchangeRateStored',
                params:[]
              }
            },
          },
          {
            name:'fulcrum',
            enabled:true,
            abi:iToken,
            address:'0x8326645f3aa6de6420102fdb7da9e3a91855045b',
            token:'iUSDT',
            decimals:18,
            functions:{
              exchangeRate:{
                name:'tokenPrice',
                params:[]
              }
            },
          },
          {
            name:'aave',
            enabled:true,
            abi:aToken,
            address:'0x71fc860F7D3A592A4a98740e39dB31d25db65ae8',
            token:'aUSDT',
            decimals:18,
            functions:{
              
            }
          }
        ]
      },
      SUSD:{
        decimals:18,
        token:'SUSD',
        enabled:true,
        abi:ERC20.abi,
        color:'hsl(250, 31%, 15%)',
        icon:'images/tokens/SUSD.svg',
        address:'0x57ab1ec28d129707052df4df418d58a2d46d5f51',
        wyre:{
          destCurrency:'SUSD'
        },
        defiPrime:{
          token:'susd'
        },
        idle:{
          abi:IdleTokenV3,
          token:'idleSUSDYield',
          address:'0xe79e177d2a5c7085027d7c64c8f271c81430fc9b'
        },
        migration:{
          enabled:true,
          message:'A minor issue has been recently discovered in idleSUSD Smart-contract. Please use the section below to migrate or redeem your position.',
          oldContract:{
            abi:IdleTokenV3,
            token:'idleSUSD',
            name:'idleSUSDYieldOld',
            address:'0xb39ca0261a1b2986a6a9Fe38d344B56374963dE5',
          },
          migrationContract:{
            abi:IdleConverterV2,
            token:'IdleConverterV3',
            name:'IdleConverterV3',
            address:'0xC74d886ebaA5674E21A1CB0Be3997BDDcE6ad525',
            oldAddresses:['0x60753b3a588ff8fe8204595dc295a132c1bb50ae'],
            functions:[
              {
                label:'Migrate',
                name:'migrateFromToIdle'
              },
            ]
          }
        },
        protocols:[
          {
            name:'aave',
            enabled:true,
            abi:aToken,
            address:'0x625aE63000f46200499120B906716420bd059240',
            token:'aSUSD',
            decimals:18,
            functions:{
              
            }
          }
        ]
      },
      TUSD:{
        decimals:18,
        token:'TUSD',
        enabled:true,
        abi:ERC20.abi,
        color:'hsl(217, 100%, 20%)',
        address:'0x0000000000085d4780b73119b644ae5ecd22b376',
        wyre:{
          destCurrency:'TUSD'
        },
        defiPrime:{
          token:'tusd'
        },
        idle:{
          abi:IdleTokenV3,
          token:'idleTUSDYield',
          address:'0x51C77689A9c2e8cCBEcD4eC9770a1fA5fA83EeF1'
        },
        migration:{
          enabled:true,
          message:'A minor issue has been recently discovered in idleTUSD Smart-contract. Please use the section below to migrate or redeem your position.',
          oldContract:{
            abi:IdleTokenV3,
            token:'idleTUSD',
            name:'idleTUSDYieldOld',
            address:'0x7DB7A4a50b26602E56536189Aa94678C80F8E5b6',
          },
          migrationContract:{
            abi:IdleConverterV2,
            token:'IdleConverterV3',
            name:'IdleConverterV3',
            address:'0xC74d886ebaA5674E21A1CB0Be3997BDDcE6ad525',
            oldAddresses:['0x60753b3a588ff8fe8204595dc295a132c1bb50ae'],
            functions:[
              {
                label:'Migrate',
                name:'migrateFromToIdle'
              },
            ]
          }
        },
        protocols:[
          {
            name:'aave',
            enabled:true,
            abi:aToken,
            address:'0x4da9b813057d04baef4e5800e36083717b4a0341',
            token:'aTUSD',
            decimals:18,
            functions:{
              
            }
          }
        ]
      },
      WBTC:{
        decimals:8,
        token:'WBTC',
        enabled:true,
        abi:ERC20.abi,
        color:'hsl(29, 81%, 59%)',
        address:'0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
        wyre:{
          destCurrency:'WBTC'
        },
        defiPrime:{
          token:'wbtc'
        },
        idle:{
          abi:IdleTokenV3,
          token:'idleWBTCYield',
          address:'0xD6f279B7ccBCD70F8be439d25B9Df93AEb60eC55'
        },
        protocols:[
          {
            name:'compound',
            enabled:true,
            abi:cToken.abi,
            address:'0xc11b1268c1a384e55c48c2391d8d480264a3a7f4',
            token:'cWBTC',
            decimals:18,
            functions:{
              exchangeRate:{
                name:'exchangeRateStored',
                params:[]
              }
            },
          },
          {
            abi:iToken,
            decimals:18,
            token:'iWBTC',
            enabled:true,
            name:'fulcrum',
            address:'0xba9262578efef8b3aff7f60cd629d6cc8859c8b5',
            functions:{
              exchangeRate:{
                name:'tokenPrice',
                params:[]
              }
            },
          },
          {
            name:'aave',
            enabled:true,
            abi:aToken,
            address:'0xfc4b8ed459e00e5400be803a9bb3954234fd50e3',
            token:'aWBTC',
            decimals:18,
            functions:{
              
            }
          }
        ]
      }
    },
    risk:{
      DAI:{
        decimals:18,
        token:'DAI',
        enabled:true,
        abi:ERC20.abi,
        color:'hsl(40, 95%, 59%)',
        address:'0x6b175474e89094c44da98b954eedeac495271d0f',
        zeroExInstant:{
          orderSource: 'https://api.0x.org/sra/',
          assetData:'0xf47261b00000000000000000000000006b175474e89094c44da98b954eedeac495271d0f',
          affiliateInfo: {
              feeRecipient: '0x4215606a720477178AdFCd5A59775C63138711e8',
              feePercentage: 0.0025
          },
        },
        wyre:{
          destCurrency:'DAI'
        },
        ramp:{
          swapAsset:'DAI'
        },
        defiPrime:{
          token:'dai'
        },
        idle:{
          abi:IdleTokenV3,
          token:'idleDAISafe',
          address:'0x1846bdfDB6A0f5c473dEc610144513bd071999fB'
        },
        migration:{
          enabled:true,
          oldContract:{
            abi:IdleTokenV2,
            token:'idleDAI',
            name:'idleDAIOld',
            address:'0x10eC0D497824e342bCB0EDcE00959142aAa766dD',
          },
          migrationContract:{
            abi:IdleConverterV2,
            token:'idleDAI',
            name:'IdleConverterV3',
            address:'0xC74d886ebaA5674E21A1CB0Be3997BDDcE6ad525',
            oldAddresses:['0x60753b3a588ff8fe8204595dc295a132c1bb50ae'],
            functions:[
              {
                label:'Migrate',
                name:'migrateFromToIdle'
              },
            ]
          }
        },
        protocols:[
          {
            name:'compound',
            enabled:true,
            abi:cToken.abi,
            address:'0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
            token:'cDAI',
            decimals:28,
            functions:{
              exchangeRate:{
                name:'exchangeRateStored',
                params:[]
              }
            },
          },
          {
            name:'fulcrum',
            enabled:true,
            abi:iToken,
            address:'0x493c57c4763932315a328269e1adad09653b9081',
            token:'iDAI',
            decimals:18,
            functions:{
              exchangeRate:{
                name:'tokenPrice',
                params:[]
              }
            },
          },
          {
            name:'aave',
            enabled:true,
            abi:aToken,
            address:'0xfC1E690f61EFd961294b3e1Ce3313fBD8aa4f85d',
            token:'aDAI',
            decimals:18,
            functions:{

            }
          },
          {
            name:'dsr',
            enabled:true,
            abi:CHAI,
            address:'0x06AF07097C9Eeb7fD685c692751D5C66dB49c215',
            token:'CHAI',
            decimals:18,
            functions:{

            }
          },
          {
            name:'dydx',
            enabled:true,
            abi:yToken,
            address:'0xF424B10e1e9691ae5FB530FE4c3e6b9971013D49',
            token:'yxDAI',
            decimals:18,
            functions:{
              exchangeRate:{
                name:'price',
                params:[]
              }
            }
          }
        ]
      },
      USDC:{
        decimals:6,
        token:'USDC',
        enabled:true,
        abi:ERC20.abi,
        color:'hsl(211, 67%, 47%)',
        address:'0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        zeroExInstant:{
          orderSource: 'https://api.0x.org/sra/',
          assetData:'0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          affiliateInfo: {
              feeRecipient: '0x4215606a720477178AdFCd5A59775C63138711e8',
              feePercentage: 0.0025
          },
        },
        wyre:{
          destCurrency:'USDC'
        },
        defiPrime:{
          token:'usdc'
        },
        idle:{
          abi:IdleTokenV3,
          token:'idleUSDCSafe',
          address:'0xcDdB1Bceb7a1979C6caa0229820707429dd3Ec6C'
        },
        migration:{
          enabled:true,
          oldContract:{
            abi:IdleTokenV2,
            token:'idleUSDC',
            name:'idleUSDCOld',
            address:'0xeB66ACc3d011056B00ea521F8203580C2E5d3991',
          },
          migrationContract:{
            abi:IdleConverterV2,
            token:'idleUSDC',
            name:'IdleConverterV3',
            address:'0xC74d886ebaA5674E21A1CB0Be3997BDDcE6ad525',
            oldAddresses:['0x60753b3a588ff8fe8204595dc295a132c1bb50ae'],
            functions:[
              {
                label:'Migrate',
                name:'migrateFromToIdle'
              },
            ]
          }
        },
        protocols:[
          {
            name:'compound',
            enabled:true,
            abi:cToken.abi,
            address:'0x39aa39c021dfbae8fac545936693ac917d5e7563',
            token:'cUSDC',
            decimals:16,
            functions:{
              exchangeRate:{
                name:'exchangeRateStored',
                params:[]
              }
            },
          },
          {
            name:'fulcrum',
            enabled:true,
            abi:iToken,
            address:'0xf013406a0b1d544238083df0b93ad0d2cbe0f65f',
            token:'iUSDC',
            decimals:18,
            functions:{
              exchangeRate:{
                name:'tokenPrice',
                params:[]
              }
            },
          },
          {
            name:'aave',
            enabled:true,
            abi:aToken,
            address:'0x9bA00D6856a4eDF4665BcA2C2309936572473B7E',
            token:'aUSDC',
            decimals:18,
            functions:{
              
            }
          },
          {
            name:'dydx',
            enabled:true,
            abi:yToken,
            address:'0x0d81b042bb9939b4d32cdf7861774c442a2685ce',
            token:'yxUSDC',
            decimals:18,
            functions:{
              exchangeRate:{
                name:'price',
                params:[]
              }
            }
          }
        ]
      },
      USDT:{
        decimals:6,
        token:'USDT',
        enabled:true,
        abi:ERC20.abi,
        color:'hsl(211, 67%, 47%)',
        address:'0xdac17f958d2ee523a2206206994597c13d831ec7',
        wyre:{
          destCurrency:'USDT'
        },
        defiPrime:{
          token:'usdt'
        },
        idle:{
          abi:IdleTokenV3,
          token:'idleUSDTSafe',
          address:'0x42740698959761baf1b06baa51efbd88cb1d862b'
        },
        protocols:[
          {
            name:'compound',
            enabled:true,
            abi:cToken.abi,
            address:'0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9',
            token:'cUSDT',
            decimals:16,
            functions:{
              exchangeRate:{
                name:'exchangeRateStored',
                params:[]
              }
            },
          },
          {
            name:'fulcrum',
            enabled:true,
            abi:iToken,
            address:'0x8326645f3aa6de6420102fdb7da9e3a91855045b',
            token:'iUSDT',
            decimals:18,
            functions:{
              exchangeRate:{
                name:'tokenPrice',
                params:[]
              }
            },
          },
          {
            name:'aave',
            enabled:true,
            abi:aToken,
            address:'0x71fc860F7D3A592A4a98740e39dB31d25db65ae8',
            token:'aUSDT',
            decimals:18,
            functions:{
              
            }
          }
        ]
      }
    }
  }
};

export default availableTokens;