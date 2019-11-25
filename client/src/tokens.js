import ERC20 from './abis/tokens/DAI.js';
import cDAI from './abis/compound/cDAI';
import iDAI from './abis/fulcrum/iToken.json';
import idleDAI from './contracts/IdleDAI.json';

const availableTokens = {
  SAI:{
    abi:ERC20.abi,
    address:'0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
    zeroExInstant:{
      assetData:'0xf47261b000000000000000000000000089d24a6b4ccb1b6faa2625fe562bdd9a23260359',
    },
    defiPrime:{
      token:'sai'
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
  },/*
  USDC:{
    abi:ERC20.abi,
    address:'0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    zeroExInstant:{
      assetData:'0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
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
  }*/
};

export default availableTokens;