const { expectEvent, singletons, constants, BN, expectRevert } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const IdleDAI = artifacts.require('IdleDAI');
const TestableIdleDAI = artifacts.require('TestableIdleDAI');
const IdleHelp = artifacts.require('IdleHelp');
const cDAIMock = artifacts.require('cDAIMock');
const iDAIMock = artifacts.require('iDAIMock');
const DAIMock = artifacts.require('DAIMock');
const BNify = n => new BN(String(n));

contract('IdleDAI', function ([_, registryFunder, creator, nonOwner]) {
  beforeEach(async function () {
    this.DAIMock = await DAIMock.new();
    this.cDAIMock = await cDAIMock.new(this.DAIMock.address, {from: creator});
    this.iDAIMock = await iDAIMock.new(this.DAIMock.address, {from: creator});
    this.one = new BN('1000000000000000000');
    this.ETHAddr = '0x0000000000000000000000000000000000000000';
    this.IdleHelp = await IdleHelp.new();
    await IdleDAI.link(IdleHelp, this.IdleHelp.address);

    // this.erc1820 = await singletons.ERC1820Registry(registryFunder);
    this.token = await IdleDAI.new(
      this.cDAIMock.address,
      this.iDAIMock.address,
      this.DAIMock.address,
      { from: creator }
    );
  });

  it('has a name', async function () {
    (await this.token.name()).should.equal('IdleDAI');
  });

  it('has a symbol', async function () {
    (await this.token.symbol()).should.equal('IDLEDAI');
  });

  it('has a cDAI addr', async function () {
    (await this.token.cToken()).should.equal(this.cDAIMock.address);
  });

  it('has a iDAI addr', async function () {
    (await this.token.iToken()).should.equal(this.iDAIMock.address);
  });

  it('has a DAI addr', async function () {
    (await this.token.token()).should.equal(this.DAIMock.address);
  });

  it('has blocksInAYear', async function () {
    (await this.token.blocksInAYear()).toString().should.equal((new BN('2102400')).toString());
  });

  it('has minRateDifference', async function () {
    (await this.token.minRateDifference()).toString().should.equal((new BN('500000000000000000')).toString());
  });

  it('allows onlyOwner to setMinRateDifference ', async function () {
    const val = new BN('1e18');
    await this.token.setMinRateDifference(val, { from: creator });
    (await this.token.minRateDifference()).toString().should.equal(val.toString());

    await expectRevert.unspecified(this.token.setMinRateDifference(val, { from: nonOwner }));
  });

  it('allows onlyOwner to setBlocksInAYear ', async function () {
    const val = new BN('1e18');
    await this.token.setBlocksInAYear(val, { from: creator });
    (await this.token.blocksInAYear()).toString().should.equal(val.toString());

    await expectRevert.unspecified(this.token.setBlocksInAYear(val, { from: nonOwner }));
  });

  it('allows onlyOwner to setToken ', async function () {
    const val = '0x0000000000000000000000000000000000000001';
    await this.token.setToken(val, { from: creator });
    (await this.token.token()).should.equal(val);

    await expectRevert.unspecified(this.token.setToken(val, { from: nonOwner }));
  });

  it('allows onlyOwner to setIToken ', async function () {
    const val = '0x0000000000000000000000000000000000000001';
    await this.token.setIToken(val, { from: creator });
    (await this.token.iToken()).should.equal(val);

    await expectRevert.unspecified(this.token.setIToken(val, { from: nonOwner }));
  });

  it('allows onlyOwner to setCToken ', async function () {
    const val = '0x0000000000000000000000000000000000000001';
    await this.token.setCToken(val, { from: creator });
    (await this.token.cToken()).should.equal(val);

    await expectRevert.unspecified(this.token.setCToken(val, { from: nonOwner }));
  });
});
