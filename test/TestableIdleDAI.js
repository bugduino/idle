const { expectEvent, singletons, constants, BN, expectRevert } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const IdleDAI = artifacts.require('IdleDAI');
const TestableIdleDAI = artifacts.require('TestableIdleDAI');
const IdleHelp = artifacts.require('IdleHelp');
const cDAIMock = artifacts.require('cDAIMock');
const iDAIMock = artifacts.require('iDAIMock');
const DAIMock = artifacts.require('DAIMock');
const BNify = n => new BN(String(n));

contract('TestableIdleDAI (internal functions exposed as public)', function ([_, registryFunder, creator, nonOwner]) {
  beforeEach(async function () {
    this.DAIMock = await DAIMock.new({from: creator});
    this.cDAIMock = await cDAIMock.new(this.DAIMock.address, {from: creator});
    this.iDAIMock = await iDAIMock.new(this.DAIMock.address, {from: creator});
    this.one = new BN('1000000000000000000');
    this.ETHAddr = '0x0000000000000000000000000000000000000000';
    this.IdleHelp = await IdleHelp.new();
    await TestableIdleDAI.link(IdleHelp, this.IdleHelp.address);

    // this.erc1820 = await singletons.ERC1820Registry(registryFunder);
    this.token = await TestableIdleDAI.new(
      this.cDAIMock.address,
      this.iDAIMock.address,
      this.DAIMock.address,
      { from: creator }
    );
  });
  it('_mintCTokens', async function () {
    const DAIBalance = await this.DAIMock.balanceOf(creator);
    const expectedBalance = BNify('1000').mul(this.one);
    assert.equal(BNify(DAIBalance).toString(), expectedBalance.toString(), 'DAI balance is correct for owner');

    // owner transfers 1 DAI to the contract
    await this.DAIMock.transfer(this.token.address, this.one, {from: creator});

    const res = await this.token._mintCTokens.call(this.one, { from: creator });
    res.should.be.bignumber.equal(new BN('5000000000')); // 50 cToken

    // await this.token._mintCTokens(this.one, { from: creator });
    // const cDAIBalance = await this.cDAIMock.balanceOf(this.token.address);
    // cDAIBalance.should.be.bignumber.equal(new BN('5000000000')); // 50 cToken
    // test that DAI are not present in this.token
  });
});
