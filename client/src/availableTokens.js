import ERC20 from './abis/tokens/DAI.js';
import cDAI from './abis/compound/cDAI';
import iDAI from './abis/fulcrum/iToken.json';
// import idleDAI from './contracts/IdleDAI.json'; // V1
import idleDAI from './contracts/IdleToken.json'; // V2

const availableTokens = {
  // Kovan
  SAI:{
    enabled: true,
    abi:ERC20.abi,
    address:'0xC4375B7De8af5a38a93548eb8453a498222C4fF2',
    zeroExInstant:{
      orderSource: 'https://api.radarrelay.com/0x/v2/',
      assetData:'0xf47261b000000000000000000000000089d24a6b4ccb1b6faa2625fe562bdd9a23260359',
      affiliateInfo: {
          feeRecipient: '0x4215606a720477178AdFCd5A59775C63138711e8',
          feePercentage: 0.0075
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
      abi:idleDAI.abi,
      token:'idleSAI',
      address:'0x17c5efC8dbd9b1b34457eE46c3C8e0F928e80dbE'
    },
    protocols:[
      {
        name:'compound',
        abi:cDAI.abi,
        address:'0x63c344bf8651222346dd870be254d4347c9359f7',
        token:'cSAI',
        functions:{
          exchangeRate:{
            name:'exchangeRateStored',
            decimals:28,
            params:[]
          }
        },
      },
      {
        name:'fulcrum',
        abi:iDAI,
        address:'0xA1e58F3B1927743393b25f261471E1f2D3D9f0F6',
        token:'iSAI',
        functions:{
          exchangeRate:{
            name:'tokenPrice',
            decimals:18,
            params:[]
          }
        },
      }
    ]
  },
  /*
  // Mainnet
  SAI:{
    enabled: true,
    abi:ERC20.abi,
    address:'0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
    zeroExInstant:{
      orderSource: 'https://api.radarrelay.com/0x/v2/',
      assetData:'0xf47261b000000000000000000000000089d24a6b4ccb1b6faa2625fe562bdd9a23260359',
      affiliateInfo: {
          feeRecipient: '0x4215606a720477178AdFCd5A59775C63138711e8',
          feePercentage: 0.0075
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
      abi:idleDAI.abi,
      token:'idleSAI',
      address:'0xAcf651Aad1CBB0fd2c7973E2510d6F63b7e440c9'
    },
    protocols:[
      {
        name:'compound',
        abi:cDAI.abi,
        token:'cSAI',
        address:'0xf5dce57282a584d2746faf1593d3121fcac444dc',
      },
      {
        name:'fulcrum',
        abi:iDAI.abi,
        token:'iSAI',
        address:'0x14094949152eddbfcd073717200da82fed8dc960'
      }
    ]
  },
  */
  DAI:{
    enabled: false,
    abi:ERC20.abi,
    address:'0x6b175474e89094c44da98b954eedeac495271d0f',
    zeroExInstant:{
      assetData:'0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
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
      abi:idleDAI.abi,
      token:'idleDAI',
      address:'0xAcf651Aad1CBB0fd2c7973E2510d6F63b7e440c9'
    },
    protocols:[
      {
        name:'compound',
        abi:cDAI.abi,
        token:'cDAI',
        address:'0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
      },
      {
        name:'fulcrum',
        abi:iDAI.abi,
        token:'iDAI',
        address:'0x493c57c4763932315a328269e1adad09653b9081'
      }
    ]
  },
  USDC:{
    enabled: false,
    abi:ERC20.abi,
    address:'0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    zeroExInstant:{
      assetData:'0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    },
    wyre:{
      destCurrency:'USDC'
    },
    defiPrime:{
      token:'usdc'
    },
    idle:{
      abi:idleDAI.abi,
      token:'idleUSDC',
      address:'0xAcf651Aad1CBB0fd2c7973E2510d6F63b7e440c9'
    },
    protocols:[
      {
        name:'compound',
        abi:cDAI.abi,
        token:'cUSDC',
        address:'0x39aa39c021dfbae8fac545936693ac917d5e7563',
      },
      {
        name:'fulcrum',
        abi:iDAI.abi,
        token:'iUSDC',
        address:'0xf013406a0b1d544238083df0b93ad0d2cbe0f65f'
      }
    ]
  }
};

export default availableTokens;