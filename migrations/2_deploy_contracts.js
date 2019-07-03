// var DiporDAI = artifacts.require("./DiporDAI.sol");
var IdleDAI = artifacts.require("./IdleDAI.sol");
var IdleHelp = artifacts.require("./IdleHelp.sol");
require('openzeppelin-test-helpers/configure')({ web3 });

const { singletons } = require('openzeppelin-test-helpers');

const cDAI = {
  'live': '0xf5dce57282a584d2746faf1593d3121fcac444dc',
  'live-fork': '0xf5dce57282a584d2746faf1593d3121fcac444dc', // needed for truffle
  'test': '0xf5dce57282a584d2746faf1593d3121fcac444dc',
  'rinkeby': '0x6d7f0754ffeb405d23c51ce938289d4835be3b14',
  'rinkeby-fork': '0x6d7f0754ffeb405d23c51ce938289d4835be3b14', // needed for truffle
  // TODO update addresses
  'ropsten': '0xb6b09fbffba6a5c4631e5f7b2e3ee183ac259c0d',
  'ropsten-fork': '0xb6b09fbffba6a5c4631e5f7b2e3ee183ac259c0d', // needed for truffle
  'kovan': '0xb6b09fbffba6a5c4631e5f7b2e3ee183ac259c0d',
  'kovan-fork': '0xb6b09fbffba6a5c4631e5f7b2e3ee183ac259c0d' // needed for truffle
};

// TODO
const iDAI = {
  'live': '0x14094949152eddbfcd073717200da82fed8dc960',
  'live-fork': '0x14094949152eddbfcd073717200da82fed8dc960', // needed for truffle
  'test': '0x14094949152eddbfcd073717200da82fed8dc960',

  // Update other addresses
  'rinkeby': '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e',
  'rinkeby-fork': '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e', // needed for truffle
  'ropsten': '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e',
  'ropsten-fork': '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e', // needed for truffle
  'kovan': '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e',
  'kovan-fork': '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e' // needed for truffle
};

// TODO
const DAI = {
  'live': '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5',
  'live-fork': '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5', // needed for truffle
  'test': '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e',
  'rinkeby': '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e',
  'rinkeby-fork': '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e', // needed for truffle
  'ropsten': '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e',
  'ropsten-fork': '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e', // needed for truffle
  'kovan': '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e',
  'kovan-fork': '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e' // needed for truffle
};

module.exports = async function(deployer, network, accounts) {
  if (network === 'development' || network === 'test') {
    // In a test environment an ERC777 token requires deploying an ERC1820 registry
    await singletons.ERC1820Registry(accounts[0]);
  }

  console.log('cDAI address: ', cDAI[network]);
  console.log('iDAI address: ', iDAI[network]);
  await deployer.deploy(IdleHelp);
  await deployer.link(IdleHelp, IdleDAI);
  await deployer.deploy(IdleDAI, cDAI[network], iDAI[network], DAI[network]);
};
