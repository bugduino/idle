const { expectEvent, singletons, constants, BN, expectRevert } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const IdleDAI = artifacts.require('IdleDAI');
const TestableIdleDAI = artifacts.require('TestableIdleDAI');
const IdleHelp = artifacts.require('IdleHelp');
const cDAIMock = artifacts.require('cDAIMock');
const iDAIMock = artifacts.require('iDAIMock');
const DAIMock = artifacts.require('DAIMock');
const BNify = n => new BN(String(n));

contract('IdleHelp', function ([_, registryFunder, creator, nonOwner, someone]) {
  beforeEach(async function () {
    this.DAIMock = await DAIMock.new({from: creator});
    this.cDAIMock = await cDAIMock.new(this.DAIMock.address, someone, {from: creator});
    this.iDAIMock = await iDAIMock.new(this.DAIMock.address, someone, {from: creator});
    this.one = new BN('1000000000000000000');
    this.ETHAddr = '0x0000000000000000000000000000000000000000';
    this.blocksInAYear = new BN('2102400');
    this.minRateDifference = new BN('500000000000000000');
    this.IdleHelp = await IdleHelp.new();
    await IdleDAI.link(IdleHelp, this.IdleHelp.address);
  });

  it('can getAPRs', async function () {
    const res = await this.IdleHelp.getAPRs(
      this.cDAIMock.address,
      this.iDAIMock.address,
      this.blocksInAYear
    );
    const rate = new BN('32847953230');
    res[0].should.be.bignumber.equal(rate.mul(this.blocksInAYear).mul(new BN('100')));
    res[1].should.be.bignumber.equal(new BN('2927621524103328230'));
  });
  it('getBestRateToken returns cToken apr if has the highest apr', async function () {
    const res = await this.IdleHelp.getBestRateToken(
      this.cDAIMock.address,
      this.iDAIMock.address,
      this.blocksInAYear
    );
    const rate = new BN('32847953230');
    res[0].should.be.equal(this.cDAIMock.address);
    res[1].should.be.bignumber.equal(rate.mul(this.blocksInAYear).mul(new BN('100')));
    res[2].should.be.bignumber.equal(new BN('2927621524103328230'));
  });
  it('getBestRateToken returns iToken if has the highest apr', async function () {
    await this.iDAIMock.setSupplyInterestRateForTest();

    const res = await this.IdleHelp.getBestRateToken(
      this.cDAIMock.address,
      this.iDAIMock.address,
      this.blocksInAYear
    );
    const rate = new BN('32847953230');
    res[0].should.be.equal(this.iDAIMock.address);
    res[1].should.be.bignumber.equal((new BN('2927621524103328230')).mul(new BN('4')));
    res[2].should.be.bignumber.equal(rate.mul(this.blocksInAYear).mul(new BN('100')));
  });
  it('rebalanceCheck should not rebalance if current bestToken is still the best token', async function () {
    const res = await this.IdleHelp.rebalanceCheck(
      this.cDAIMock.address,
      this.iDAIMock.address,
      this.cDAIMock.address,
      this.blocksInAYear,
      this.minRateDifference
    );
    res[0].should.be.equal(false);
    res[1].should.be.equal(this.cDAIMock.address);
  });
  it('rebalanceCheck should rebalance if current bestToken is not set', async function () {
    const res = await this.IdleHelp.rebalanceCheck(
      this.cDAIMock.address,
      this.iDAIMock.address,
      this.ETHAddr, // address(0)
      this.blocksInAYear,
      this.minRateDifference
    );
    res[0].should.be.equal(true);
    res[1].should.be.equal(this.cDAIMock.address);
  });
  it('rebalanceCheck should rebalance if current bestToken is not the best token and rate difference is > minRateDifference', async function () {
    await this.iDAIMock.setSupplyInterestRateForTest();

    const res = await this.IdleHelp.rebalanceCheck(
      this.cDAIMock.address,
      this.iDAIMock.address,
      this.cDAIMock.address,
      this.blocksInAYear,
      this.minRateDifference
    );
    res[0].should.be.equal(true);
    res[1].should.be.equal(this.iDAIMock.address);
  });
  it('rebalanceCheck should not rebalance if rate difference is < minRateDifference', async function () {
    await this.iDAIMock.setSupplyInterestRateForTest();

    const res = await this.IdleHelp.rebalanceCheck(
      this.cDAIMock.address,
      this.iDAIMock.address,
      this.cDAIMock.address,
      this.blocksInAYear,
      this.minRateDifference.mul(new BN('30'))
    );
    res[0].should.be.equal(false);
    res[1].should.be.equal(this.iDAIMock.address);
  });
  it('getPriceInToken returns token price when bestToken is cToken', async function () {
    const oneCToken = new BN('100000000');
    const totalSupply = (new BN('20')).mul(this.one);
    const poolSupply = new BN('1000').mul(oneCToken);
    const res = await this.IdleHelp.getPriceInToken(
      this.cDAIMock.address,
      this.iDAIMock.address,
      this.cDAIMock.address,
      totalSupply,
      poolSupply
    );
    const exchangeRate = await this.cDAIMock.exchangeRateStored();
    const navPool = exchangeRate.mul(poolSupply).div(this.one);
    const tokenPrice = navPool.div(totalSupply.div(this.one));

    res.should.be.bignumber.equal(tokenPrice); // => == this.one
  });
  it('getPriceInToken returns token price when bestToken is cToken and rates changed', async function () {
    const oneCToken = new BN('100000000');
    const totalSupply = (new BN('20')).mul(this.one);
    const poolSupply = new BN('1000').mul(oneCToken);
    await this.cDAIMock.setExchangeRateStoredForTest();
    const res = await this.IdleHelp.getPriceInToken(
      this.cDAIMock.address,
      this.iDAIMock.address,
      this.cDAIMock.address,
      totalSupply,
      poolSupply
    );

    const exchangeRate = await this.cDAIMock.exchangeRateStored();
    const navPool = exchangeRate.mul(poolSupply).div(this.one);
    const tokenPrice = navPool.div(totalSupply.div(this.one));

    res.should.be.bignumber.equal(tokenPrice); // => == this.one
  });
  it('getPriceInToken returns token price when bestToken is iToken', async function () {
    const totalSupply = new BN('1000');
    const poolSupply = new BN('1000');
    const res = await this.IdleHelp.getPriceInToken(
      this.cDAIMock.address,
      this.iDAIMock.address,
      this.iDAIMock.address,
      totalSupply,
      poolSupply
    );
    const price = await this.iDAIMock.tokenPrice();
    const navPool = price.mul(poolSupply);
    const tokenPrice = navPool.div(totalSupply);

    res.should.be.bignumber.equal(tokenPrice);
  });
});
