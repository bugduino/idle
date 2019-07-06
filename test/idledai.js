const { expectEvent, singletons, constants, BN, expectRevert } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const IdleDAI = artifacts.require('IdleDAI');
const IdleHelp = artifacts.require('IdleHelp');
const cDAIMock = artifacts.require('cDAIMock');
const iDAIMock = artifacts.require('iDAIMock');
const DAIMock = artifacts.require('DAIMock');

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

contract('IdleHelp', function ([_, registryFunder, creator, nonOwner]) {
  beforeEach(async function () {
    this.DAIMock = await DAIMock.new();
    this.cDAIMock = await cDAIMock.new(this.DAIMock.address, {from: creator});
    this.iDAIMock = await iDAIMock.new(this.DAIMock.address, {from: creator});
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
    const totalSupply = new BN('1000');
    const poolSupply = new BN('1000');
    const res = await this.IdleHelp.getPriceInToken(
      this.cDAIMock.address,
      this.iDAIMock.address,
      this.cDAIMock.address,
      totalSupply,
      poolSupply
    );
    const exchangeRate = await this.cDAIMock.exchangeRateStored();
    const price = this.one.div(exchangeRate.div(this.one));
    const navPool = price.mul(poolSupply);
    const tokenPrice = navPool.div(totalSupply);

    res.should.be.bignumber.equal(price);
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
