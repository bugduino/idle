import ERC20 from '../abis/tokens/DAI.js';
import cDAI from '../abis/compound/cDAI';
import iDAI from '../abis/fulcrum/iToken.json';
import aToken from '../abis/aave/AToken.json';
import idleDAIv1 from '../contracts/IdleDAI.json';
import idleTokenV2 from '../contracts/IdleTokenV2.json';
import IdleTokenV3 from '../contracts/IdleTokenV3.json';
import IdleMcdBridgeV1 from '../contracts/IdleMcdBridgeV1.json';

const availableTokens = {
  42:{ // Kovan
    SAI:{
      decimals:18,
      enabled:true,
      abi:ERC20.abi,
      address:'0xC4375B7De8af5a38a93548eb8453a498222C4fF2',
      zeroExInstant:{
        orderSource: 'https://api.radarrelay.com/0x/v2/',
        assetData:'0xf47261b000000000000000000000000089d24a6b4ccb1b6faa2625fe562bdd9a23260359',
        affiliateInfo: {
            feeRecipient: '0x4215606a720477178AdFCd5A59775C63138711e8',
            feePercentage: 0.0025
        },
      },
      wyre:{
        destCurrency:'DAI'
      },
      ramp:{
        swapAsset:'SAI'
      },
      defiPrime:{
        token:'sai',
      },
      idle:{
        abi:idleTokenV2,
        token:'idleSAI',
        address:'0x5266C66FC100d2FBE5dbCfE8a8789568D2d2F720'
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
          oldAddresses:['0x556659f45381dEE8BA429C295363E39645abE834'/*,'0xabeCf002a48969C2be92150ae27B1F75cBf6EA6e'*/],
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
          abi:cDAI.abi,
          address:'0x63c344bf8651222346dd870be254d4347c9359f7',
          token:'cSAI',
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
          abi:iDAI,
          address:'0xA1e58F3B1927743393b25f261471E1f2D3D9f0F6',
          token:'iSAI',
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
        abi:idleTokenV2,
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
          oldAddresses:['0x556659f45381dEE8BA429C295363E39645abE834'/*,'0xabeCf002a48969C2be92150ae27B1F75cBf6EA6e'*/],
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
          abi:cDAI.abi,
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
          abi:iDAI,
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
        abi:idleTokenV2,
        token:'idleUSDC',
        address:'0x17c5efC8dbd9b1b34457eE46c3C8e0F928e80dbE'
      },
      protocols:[
        {
          name:'compound',
          enabled:true,
          abi:cDAI.abi,
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
          abi:iDAI,
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
  1:{ // Mainnet
    risk:{
      DAI:{
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
          abi:idleTokenV2,
          token:'idleDAIRisk',
          // address:'0x627ca78b2b693364223fb2c24c19cee03a45da60'
          address:'0x10eC0D497824e342bCB0EDcE00959142aAa766dD'
        },
        /*
        migration:{
          enabled:true,
          oldContract:{
            abi:idleDAIv1.abi,
            token:'idleDAI',
            name:'oldContract',
            address:'0x10eC0D497824e342bCB0EDcE00959142aAa766dD',
          },
          migrationContract:{
            abi:IdleMcdBridgeV1,
            token:'idleDAI',
            name:'migrationContract',
            address:'0x7aB2a7ed1a0C58DEa84DE880b4F1710229137211',
            functions:[
              {
                name:'bridgeIdleV1ToIdleV2',
                label:'MIGRATE TO idleDAI v2',
                params:['0x10eC0D497824e342bCB0EDcE00959142aAa766dD','0x627ca78b2b693364223fb2c24c19cee03a45da60']
              },
            ]
          }
        },
        */
        migration:{
          enabled:true,
          oldContract:{
            abi:idleDAIv1.abi,
            token:'idleSAI',
            name:'oldContract',
            address:'0xAcf651Aad1CBB0fd2c7973E2510d6F63b7e440c9',
          },
          migrationContract:{
            abi:IdleMcdBridgeV1,
            token:'idleSAI',
            name:'migrationContract',
            address:'0x7aB2a7ed1a0C58DEa84DE880b4F1710229137211',
            functions:[
              {
                name:'bridgeIdleV1ToIdleV2',
                label:'MIGRATE TO idleSAI v2',
                params:['0xAcf651Aad1CBB0fd2c7973E2510d6F63b7e440c9','0xC79764398a159Ea8E61AF98d7dA6f2C8CaE4c3A9']
              },
              {
                name:'bridgeIdleV1ToIdleV2',
                label:'MIGRATE TO idleDAI v2',
                params:['0xAcf651Aad1CBB0fd2c7973E2510d6F63b7e440c9','0x10eC0D497824e342bCB0EDcE00959142aAa766dD']
              },
            ]
          }
        },
        protocols:[
          {
            name:'compound',
            enabled:true,
            abi:cDAI.abi,
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
            enabled:false,
            abi:iDAI,
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
          }
        ]
      },
      USDC:{
        decimals:6,
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
          abi:idleTokenV2,
          token:'idleUSDCRisk',
          address:'0xeB66ACc3d011056B00ea521F8203580C2E5d3991'
        },
        protocols:[
          {
            name:'compound',
            enabled:true,
            abi:cDAI.abi,
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
            enabled:false,
            abi:iDAI,
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
            decimals:6,
            functions:{
              
            }
          }
        ]
      }
    },
    best:{
      DAI:{
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
          abi:idleTokenV2,
          token:'idleDAIBest',
          address:'0x10eC0D497824e342bCB0EDcE00959142aAa766dD'
        },
        migration:{
          enabled:true,
          oldContract:{
            abi:idleDAIv1.abi,
            token:'idleSAI',
            name:'oldContract',
            address:'0xAcf651Aad1CBB0fd2c7973E2510d6F63b7e440c9',
          },
          migrationContract:{
            abi:IdleMcdBridgeV1,
            token:'idleSAI',
            name:'migrationContract',
            address:'0x7aB2a7ed1a0C58DEa84DE880b4F1710229137211',
            functions:[
              {
                name:'bridgeIdleV1ToIdleV2',
                label:'MIGRATE TO idleSAI v2',
                params:['0xAcf651Aad1CBB0fd2c7973E2510d6F63b7e440c9','0xC79764398a159Ea8E61AF98d7dA6f2C8CaE4c3A9']
              },
              {
                name:'bridgeIdleV1ToIdleV2',
                label:'MIGRATE TO idleDAI v2',
                params:['0xAcf651Aad1CBB0fd2c7973E2510d6F63b7e440c9','0x10eC0D497824e342bCB0EDcE00959142aAa766dD']
              },
            ]
          }
        },
        protocols:[
          {
            name:'compound',
            enabled:true,
            abi:cDAI.abi,
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
            enabled:false,
            abi:iDAI,
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
          }
        ]
      },
      USDC:{
        decimals:6,
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
          abi:idleTokenV2,
          token:'idleUSDCBest',
          address:'0xeB66ACc3d011056B00ea521F8203580C2E5d3991'
        },
        protocols:[
          {
            name:'compound',
            enabled:true,
            abi:cDAI.abi,
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
            enabled:false,
            abi:iDAI,
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
            decimals:6,
            functions:{
              
            }
          }
        ]
      }
    }
  }
};

export default availableTokens;