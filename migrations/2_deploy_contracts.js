var DiporDAI = artifacts.require("./DiporDAI.sol");
require('openzeppelin-test-helpers/configure')({ web3 });

const { singletons } = require('openzeppelin-test-helpers');

const cDAI = {
  'live': '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5',
  'live-fork': '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5', // needed for truffle
  'test': '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e',
  'rinkeby': '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e',
  'rinkeby-fork': '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e', // needed for truffle
  // TODO ropsten and kovan
  'ropsten': '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e',
  'ropsten-fork': '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e', // needed for truffle
  'kovan': '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e',
  'kovan-fork': '0xd6801a1DfFCd0a410336Ef88DeF4320D6DF1883e' // needed for truffle
};

// TODO
const iDAI = {
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
  await deployer.deploy(DiporDAI, cDAI[network], iDAI[network], DAI[network]);
};
