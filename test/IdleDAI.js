const { expectEvent, singletons, constants, BN, expectRevert } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const IdleDAI = artifacts.require('IdleDAI');
const TestableIdleDAI = artifacts.require('TestableIdleDAI');
const IdleHelp = artifacts.require('IdleHelp');
const cDAIMock = artifacts.require('cDAIMock');
const iDAIMock = artifacts.require('iDAIMock');
const DAIMock = artifacts.require('DAIMock');
const BNify = n => new BN(String(n));

contract('IdleDAI', function ([_, registryFunder, creator, nonOwner, someone]) {
  beforeEach(async function () {
    this.DAIMock = await DAIMock.new({from: creator});
    this.cDAIMock = await cDAIMock.new(this.DAIMock.address, someone, {from: creator});
    this.iDAIMock = await iDAIMock.new(this.DAIMock.address, someone, {from: creator});
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

  it('rebalance method should set bestToken if current best token is address(0)', async function () {
    await this.token.rebalance({ from: creator });
    const bestToken = await this.token.bestToken({ from: creator });
    bestToken.should.be.equal(this.cDAIMock.address);
  });

  it('rebalance method should not rebalance if it\'s not needed', async function () {
    // first rebalance to set from address(0) to cToken
    await this.token.rebalance({ from: creator });
    const bestToken = await this.token.bestToken({ from: creator });
    bestToken.should.be.equal(this.cDAIMock.address);
    // second rebalance should not change bestToken
    await this.token.rebalance({ from: creator });
    const bestToken2 = await this.token.bestToken({ from: creator });
    bestToken2.should.be.equal(this.cDAIMock.address);
  });

  it('rebalance should change bestToken if rates are changed', async function () {
    // Needed for testing, owner transfers 100 DAI to the contract
    await this.DAIMock.transfer(this.cDAIMock.address, BNify('100').mul(this.one), {from: creator});

    // first rebalance to set from address(0) to cToken
    await this.token.rebalance({ from: creator });
    const bestToken = await this.token.bestToken({ from: creator });
    bestToken.should.be.equal(this.cDAIMock.address);

    await this.cDAIMock.setSupplyRatePerBlockForTest({ from: creator });

    // second rebalance should change bestToken
    await this.token.rebalance({ from: creator });
    const bestToken2 = await this.token.bestToken({ from: creator });
    bestToken2.should.be.equal(this.iDAIMock.address);
  });

  it('rebalance should convert the entire pool if rates are changed (from cToken to iToken)', async function () {
    // Needed for testing, owner transfers 100 DAI to the contract
    const oneCToken = new BN('100000000'); // 10**8 -> 1 cDAI
    await this.DAIMock.transfer(this.cDAIMock.address, BNify('100').mul(this.one), {from: creator});
    await this.cDAIMock.transfer(this.token.address, BNify('50').mul(oneCToken), {from: someone});

    // first rebalance to set from address(0) to cToken
    await this.token.rebalance({ from: creator });
    const bestToken = await this.token.bestToken({ from: creator });
    bestToken.should.be.equal(this.cDAIMock.address);

    (await this.iDAIMock.balanceOf(this.token.address)).should.be.bignumber.equal(new BN('0'));
    await this.cDAIMock.setSupplyRatePerBlockForTest({ from: creator });

    // second rebalance changes bestToken to iToken and convert the pool
    await this.token.rebalance({ from: creator });
    const bestToken2 = await this.token.bestToken({ from: creator });
    bestToken2.should.be.equal(this.iDAIMock.address);

    (await this.iDAIMock.balanceOf(this.token.address)).should.be.bignumber.equal(this.one.toString());
    (await this.cDAIMock.balanceOf(this.token.address)).should.be.bignumber.equal(new BN('0'));
  });
  it('rebalance should convert the entire pool if rates are changed (from iToken to cToken)', async function () {
    await this.cDAIMock.setSupplyRatePerBlockForTest({ from: creator });
    // Needed for testing, owner transfers 100 DAI to the contract
    await this.DAIMock.transfer(this.iDAIMock.address, BNify('100').mul(this.one), {from: creator});

    // Needed for testing, someone transfers 1 iDAI to the contract
    await this.iDAIMock.transfer(this.token.address, this.one, {from: someone});

    // first rebalance to set from address(0) to iToken
    await this.token.rebalance({ from: creator });
    const bestToken = await this.token.bestToken({ from: creator });
    bestToken.should.be.equal(this.iDAIMock.address);

    (await this.cDAIMock.balanceOf(this.token.address)).should.be.bignumber.equal(new BN('0'));
    await this.cDAIMock.resetSupplyRatePerBlockForTest({ from: creator });

    // second rebalance changes bestToken to iToken and convert the pool
    await this.token.rebalance({ from: creator });
    const bestToken2 = await this.token.bestToken({ from: creator });
    bestToken2.should.be.equal(this.cDAIMock.address);

    const oneCToken = new BN('100000000'); // 10**8 -> 1 cDAI
    (await this.cDAIMock.balanceOf(this.token.address)).should.be.bignumber.equal(oneCToken.mul(new BN('50')));

    // error on TestableIdleDAI when using _burn in iDAIMock
    // (await this.iDAIMock.balanceOf(this.token.address)).should.be.bignumber.equal(new BN('0'));
  });
  it('claimITokens', async function () {
    const oneCToken = new BN('100000000'); // 10**8 -> 1 cDAI
    // Needed for testing, owner transfers 100 DAI to the contract
    await this.DAIMock.transfer(this.iDAIMock.address, BNify('100').mul(this.one), {from: creator});
    await this.DAIMock.transfer(this.cDAIMock.address, BNify('100').mul(this.one), {from: creator});
    await this.cDAIMock.transfer(this.token.address, BNify('50').mul(oneCToken), {from: someone});

    // first rebalance to set from address(0) to cToken
    await this.token.rebalance({ from: creator });
    const bestToken = await this.token.bestToken({ from: creator });
    bestToken.should.be.equal(this.cDAIMock.address);

    (await this.iDAIMock.balanceOf(this.token.address)).should.be.bignumber.equal(new BN('0'));
    await this.cDAIMock.setSupplyRatePerBlockForTest({ from: creator });

    // second rebalance changes bestToken to iToken and convert the pool
    const claimedTokens = await this.token.claimITokens.call({ from: creator });
    claimedTokens.should.be.bignumber.equal(this.one);

    await this.token.claimITokens({ from: creator });
    // It makes a rebalance so new bestToken is iDAI
    const bestToken2 = await this.token.bestToken({ from: creator });
    bestToken2.should.be.equal(this.iDAIMock.address);

    (await this.cDAIMock.balanceOf(this.token.address)).should.be.bignumber.equal(new BN('0'));
    (await this.iDAIMock.balanceOf(this.token.address)).should.be.bignumber.equal(this.one.mul(new BN('2')));
  });
  // it('mintIdleToken', async function () {
  //   const oneCToken = new BN('100000000'); // 10**8 -> 1 cDAI
  //   // Needed for testing, owner transfers 100 DAI to the contract
  //   await this.DAIMock.transfer(this.iDAIMock.address, BNify('100').mul(this.one), {from: creator});
  //   await this.DAIMock.transfer(this.cDAIMock.address, BNify('100').mul(this.one), {from: creator});
  //   await this.cDAIMock.transfer(this.token.address, BNify('50').mul(oneCToken), {from: someone});
  //
  //   // first rebalance to set from address(0) to cToken
  //   await this.token.rebalance({ from: creator });
  //   const bestToken = await this.token.bestToken({ from: creator });
  //   bestToken.should.be.equal(this.cDAIMock.address);
  //
  //   (await this.iDAIMock.balanceOf(this.token.address)).should.be.bignumber.equal(new BN('0'));
  //   await this.cDAIMock.setSupplyRatePerBlockForTest({ from: creator });
  //
  //   // second rebalance changes bestToken to iToken and convert the pool
  //   const claimedTokens = await this.token.claimITokens.call({ from: creator });
  //   claimedTokens.should.be.bignumber.equal(this.one);
  //
  //   await this.token.claimITokens({ from: creator });
  //   // It makes a rebalance so new bestToken is iDAI
  //   const bestToken2 = await this.token.bestToken({ from: creator });
  //   bestToken2.should.be.equal(this.iDAIMock.address);
  //
  //   (await this.cDAIMock.balanceOf(this.token.address)).should.be.bignumber.equal(new BN('0'));
  //   (await this.iDAIMock.balanceOf(this.token.address)).should.be.bignumber.equal(this.one.mul(new BN('2')));
  // });
});
