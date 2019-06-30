const { expectEvent, singletons, constants, BN } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const DiporDAI = artifacts.require('DiporDAI');
const cDAIMock = artifacts.require('cDAIMock');
const iDAIMock = artifacts.require('iDAIMock');
const DAIMock = artifacts.require('DAIMock');

contract('DiporDAI', function ([_, registryFunder, creator]) {
  beforeEach(async function () {
    this.DAIMock = await DAIMock.new();
    this.cDAIMock = await cDAIMock.new(this.DAIMock.address, {from: creator});
    this.iDAIMock = await iDAIMock.new(this.DAIMock.address, {from: creator});
    this.one = new BN('1e18');
    this.ETHAddr = '0x0000000000000000000000000000000000000000';

    this.erc1820 = await singletons.ERC1820Registry(registryFunder);
    this.token = await DiporDAI.new(this.cDAIMock.address, this.iDAIMock.address, { from: creator });
  });

  it('has a name', async function () {
    (await this.token.name()).should.equal('DiporDAI');
  });

  it('has a symbol', async function () {
    (await this.token.symbol()).should.equal('DIPORDAI5050');
  });

  it('has a cDAI addr', async function () {
    (await this.token.cToken()).should.equal(this.cDAIMock.address);
  });

  it('has a iDAI addr', async function () {
    (await this.token.iToken()).should.equal(this.iDAIMock.address);
  });

  // it('assigns the initial total supply to the creator', async function () {
  //   const totalSupply = await this.token.totalSupply();
  //   const creatorBalance = await this.token.balanceOf(creator);
  //
  //   creatorBalance.should.be.bignumber.equal(totalSupply);
  //
  //   await expectEvent.inConstruction(this.token, 'Transfer', {
  //     from: ZERO_ADDRESS,
  //     to: creator,
  //     value: totalSupply,
  //   });
  // });
});
