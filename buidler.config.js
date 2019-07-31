const BigNumber = require('bignumber.js');
require('dotenv').config();
const path = require("path");

usePlugin("@nomiclabs/buidler-truffle5")
usePlugin("@nomiclabs/buidler-web3");

const INFURA_KEY = process.env["INFURA_KEY"];
const BNify = s => new BigNumber(String(s));

task("accounts", "Prints a list of the available accounts", async () => {
  const accounts = await ethereum.send("eth_accounts");
  const balances = await Promise.all(accounts.map(a => web3.eth.getBalance(a)));
  console.log("Accounts:", balances.map((b, i) => ({address: accounts[i], balance: web3.utils.fromWei(b, "ether")})));
});

task("iDAI", "Call method on iDAI contract. eg `npx buidler iDAI --method tokenPrice`")
  .addParam("method", "The method of the contract")
  .setAction(async taskArgs => {
    const iERC20 = artifacts.require('iToken');
    const iDAI = await iERC20.at('0x14094949152eddbfcd073717200da82fed8dc960'); // mainnet
    const res = await iDAI[taskArgs.method].call();

    console.log(`RES: ${res.toString()}`)
  });

task("cDAI", "Call method on cDAI contract. eg `npx buidler cDAI --method exchangeRateStored`")
  .addParam("method", "The method of the contract")
  .setAction(async taskArgs => {
    const cERC20 = artifacts.require('CERC20');
    const cDAI = await cERC20.at('0xf5dce57282a584d2746faf1593d3121fcac444dc'); // mainnet
    const res = await cDAI[taskArgs.method].call();

    console.log(`RES: ${res.toString()}`)
  });
task("cDAI:rate", "cDAI to DAI rate")
  .setAction(async taskArgs => {
    const cERC20 = artifacts.require('CERC20');
    const cDAI = await cERC20.at('0x6d7f0754ffeb405d23c51ce938289d4835be3b14'); // rinkeby
    let res = await cDAI.exchangeRateStored.call();
    res = BNify(1e18).div(BNify(res).div(1e18)).div(1e8);
    console.log(`RES: ${res.toString()}`)
  });

task("cDAI:nextRateData", "cDAI to DAI next rate data")
  .setAction(async taskArgs => {
    const cERC20 = artifacts.require('CERC20');
    const ERC20 = artifacts.require('ERC20');
    const WhitePaperInterestModel = artifacts.require('WhitePaperInterestModel');

    const cDAI = await cERC20.at('0xf5dce57282a584d2746faf1593d3121fcac444dc'); // mainnet
    const cDAIWithSupply = await ERC20.at('0xf5dce57282a584d2746faf1593d3121fcac444dc'); // mainnet
    const whitePaperInterestModel = await WhitePaperInterestModel.at('0xd928c8ead620bb316d2cefe3caf81dc2dec6ff63'); // mainnet


    let promises = [
      whitePaperInterestModel.getBorrowRate.call(
        await cDAI.getCash.call(),
        await cDAI.totalBorrows.call(),
        BNify(0)
        // await cDAI.totalReserves.call()
      ),
      cDAI.supplyRatePerBlock.call(),
      cDAI.borrowRatePerBlock.call(),

      cDAI.totalBorrows.call(),
      cDAI.getCash.call(),
      cDAI.totalReserves.call(),
      cDAIWithSupply.totalSupply.call(),
      cDAI.reserveFactorMantissa.call(),
    ];

    const res = await Promise.all(promises);
    const [whiteBorrow, contractSupply, contractBorrow, totalBorrows, getCash, totalReserves, totalSupply, reserveFactorMantissa] = res;

    borrowRatePerYear = BNify(whiteBorrow[1]).times('2102400').times('100').integerValue(BigNumber.ROUND_FLOOR)
    supplyRatePerYear = BNify(contractSupply).times('2102400').times('100').integerValue(BigNumber.ROUND_FLOOR)
    borrowRatePerYearContract = BNify(contractBorrow).times('2102400').times('100').integerValue(BigNumber.ROUND_FLOOR)

    console.log(`${whiteBorrow[1].toString()} borrow whitepaper`);
    console.log(`${contractSupply.toString()} contract supply`);
    console.log(`${contractBorrow.toString()} contract borrow`);
    console.log(`################`);
    console.log(`${BNify(borrowRatePerYear).div(1e18).toString()}% borrowRatePerYear white`);
    console.log(`${BNify(borrowRatePerYearContract).div(1e18).toString()}% borrowRatePerYear contract`);
    console.log(`${BNify(supplyRatePerYear).div(1e18).toString()}% supplyRatePerYear`);
    console.log(`################`);
    console.log(`${BNify(totalBorrows).div(1e18).toString()} totalBorrows`)
    console.log(`${BNify(getCash).div(1e18).toString()} getCash`)
    console.log(`${BNify(totalReserves).div(1e18).toString()} totalReserves`)
    console.log(`${BNify(totalSupply).div(1e8).toString()} totalSupply`)
    console.log(`${BNify(reserveFactorMantissa).toString()} reserveFactorMantissa`)
    console.log(`################`);


    // const newDAIAmount = BNify(1000).times(1e18);
    // TODO here we should add the new DAI amount we are adding;
    // const newCash = BNify(getCash).plus(newDAIAmount);
    // const newSupply =

    const rate = BNify(getCash).plus(BNify(totalBorrows)).minus(BNify(totalReserves)).div(BNify(totalSupply)).times(1e18);
    // const rate = BNify(newCash).plus(BNify(totalBorrows)).minus(BNify(totalReserves)).div(BNify(newSupply)).times(1e18);
    console.log(`${BNify(rate).toString()} rate`);


    const underlying = BNify(totalSupply).times(rate.div(1e18));
    console.log(`${BNify(underlying).toString()} underlying`);
    const borrowsPer = BNify(totalBorrows).div(underlying);
    console.log(`${BNify(borrowsPer).toString()} borrowsPer`);
    const borrowRate = whiteBorrow[1];
    console.log(`${BNify(borrowRate).toString()} borrowRate`);
    // const borrowRate = await whitePaperInterestModel.getBorrowRate.call(newCash, totalBorrows, BNify(0)),

    // TODO 1-reserveFactorMantissa have different udm
    const oneMinusReserveFactor = BNify(1e18).minus(reserveFactorMantissa);
    console.log(`${BNify(oneMinusReserveFactor).toString()} oneMinusReserveFactor`);

    const supplyRate = BNify(borrowRate).times(oneMinusReserveFactor).times(borrowsPer).div(1e18);
    console.log(`${BNify(supplyRate).toString()} supplyRate`);

    const newSupplyRatePerYear = BNify(supplyRate).times('2102400').times('100').integerValue(BigNumber.ROUND_FLOOR)
    console.log(`${BNify(newSupplyRatePerYear).div(1e18).toString()}% newSupplyRatePerYear`);



    // function supplyRatePerBlock() external view returns (uint) {
    //     /* We calculate the supply rate:
    //      *  underlying = totalSupply × exchangeRate
    //      *  borrowsPer = totalBorrows ÷ underlying
    //      *  supplyRate = borrowRate × (1-reserveFactor) × borrowsPer
    //      */
  });

  task("cDAI:nextRateDataWithAmount", "cDAI to DAI next rate data")
    .setAction(async taskArgs => {
      const cERC20 = artifacts.require('CERC20');
      const ERC20 = artifacts.require('ERC20');
      const WhitePaperInterestModel = artifacts.require('WhitePaperInterestModel');

      const cDAI = await cERC20.at('0xf5dce57282a584d2746faf1593d3121fcac444dc'); // mainnet
      const cDAIWithSupply = await ERC20.at('0xf5dce57282a584d2746faf1593d3121fcac444dc'); // mainnet
      const whitePaperInterestModel = await WhitePaperInterestModel.at('0xd928c8ead620bb316d2cefe3caf81dc2dec6ff63'); // mainnet

      const newDAIAmount = BNify(100000000).times(1e18);
      const getCashPre = await cDAI.getCash.call();
      const amount = BNify(getCashPre.toString()).plus(newDAIAmount);
      const totalBorrowsPre = await cDAI.totalBorrows.call();

      const whiteBorrow = await whitePaperInterestModel.getBorrowRate.call(
        web3.utils.toBN(amount),
        totalBorrowsPre,
        BNify(0)
        // await cDAI.totalReserves.call()
      );

      let promises = [
        Promise.resolve({ok: 'ok'}),
        cDAI.supplyRatePerBlock.call(),
        cDAI.borrowRatePerBlock.call(),

        cDAI.totalBorrows.call(),
        cDAI.getCash.call(),
        cDAI.totalReserves.call(),
        cDAIWithSupply.totalSupply.call(),
        cDAI.reserveFactorMantissa.call(),
        cDAI.exchangeRateStored.call(),
      ];

      const res = await Promise.all(promises);
      const [foo, contractSupply, contractBorrow, totalBorrows, getCash, totalReserves, totalSupply, reserveFactorMantissa, exchangeRateStored] = res;

      borrowRatePerYear = BNify(whiteBorrow[1]).times('2102400').times('100').integerValue(BigNumber.ROUND_FLOOR)
      supplyRatePerYear = BNify(contractSupply).times('2102400').times('100').integerValue(BigNumber.ROUND_FLOOR)
      borrowRatePerYearContract = BNify(contractBorrow).times('2102400').times('100').integerValue(BigNumber.ROUND_FLOOR)

      console.log(`${whiteBorrow[1].toString()} borrow whitepaper`);
      console.log(`${contractSupply.toString()} contract supply`);
      console.log(`${contractBorrow.toString()} contract borrow`);
      console.log(`################`);
      console.log(`${BNify(borrowRatePerYear).div(1e18).toString()}% borrowRatePerYear white`);
      console.log(`${BNify(borrowRatePerYearContract).div(1e18).toString()}% borrowRatePerYear contract`);
      console.log(`${BNify(supplyRatePerYear).div(1e18).toString()}% supplyRatePerYear`);
      console.log(`################`);
      console.log(`${BNify(totalBorrows).div(1e18).toString()} totalBorrows`)
      console.log(`${BNify(getCash).div(1e18).toString()} getCash`)
      console.log(`${BNify(totalReserves).div(1e18).toString()} totalReserves`)
      console.log(`${BNify(totalSupply).div(1e8).toString()} totalSupply`)
      console.log(`${BNify(reserveFactorMantissa).toString()} reserveFactorMantissa`)
      console.log(`${BNify(exchangeRateStored).toString()} exchangeRateStored`)
      console.log(`################`);


      // TODO here we should add the new DAI amount we are adding;
      const newCash = BNify(getCash).plus(newDAIAmount);
      const newCDAI = newDAIAmount.times(1e18).div(exchangeRateStored).div(1e8);
      console.log(`${BNify(newCDAI).toString()} newCDAI`);
      const newSupply = BNify(totalSupply).plus(newCDAI);

      // const rate = BNify(getCash).plus(BNify(totalBorrows)).minus(BNify(totalReserves)).div(BNify(totalSupply)).times(1e18);
      const rate = BNify(newCash).plus(BNify(totalBorrows)).minus(BNify(totalReserves)).div(BNify(newSupply)).times(1e18);
      console.log(`${BNify(rate).toString()} rate`);

      // ################

      const underlying = BNify(newSupply).times(rate.div(1e18));
      // const underlying = BNify(totalSupply).times(rate.div(1e18));
      console.log(`${BNify(underlying).toString()} underlying`);
      const borrowsPer = BNify(totalBorrows).div(underlying);
      console.log(`${BNify(borrowsPer).toString()} borrowsPer`);
      const borrowRate = whiteBorrow[1];
      console.log(`${BNify(borrowRate).toString()} borrowRate`);
      // const borrowRate = await whitePaperInterestModel.getBorrowRate.call(newCash, totalBorrows, BNify(0)),

      // TODO 1-reserveFactorMantissa have different udm
      const oneMinusReserveFactor = BNify(1e18).minus(reserveFactorMantissa);
      console.log(`${BNify(oneMinusReserveFactor).toString()} oneMinusReserveFactor`);

      const supplyRate = BNify(borrowRate).times(oneMinusReserveFactor).times(borrowsPer).div(1e18);
      console.log(`${BNify(supplyRate).toString()} supplyRate`);

      const newSupplyRatePerYear = BNify(supplyRate).times('2102400').times('100').integerValue(BigNumber.ROUND_FLOOR)
      console.log(`${BNify(newSupplyRatePerYear).div(1e18).toString()}% newSupplyRatePerYear`);
    });

task("cDAI:apr", "Get apr")
  .setAction(async taskArgs => {
    const cERC20 = artifacts.require('CERC20');
    const cDAI = await cERC20.at('0xf5dce57282a584d2746faf1593d3121fcac444dc'); // mainnet
    let res = await cDAI.supplyRatePerBlock.call();

    res = BNify(res).times('2102400').times('100').integerValue(BigNumber.ROUND_FLOOR)
    console.log(`RES: ${res.toString()}`)
  });

task("TokenizedRegistry", "Call TokenizedRegistry")
  .setAction(async taskArgs => {
    const tokenizedRegistry = artifacts.require('TokenizedRegistry');
    const reg = await tokenizedRegistry.at('0xd03eea21041a19672e451bcbb413ce8be72d0381'); // ropsten
    let res = await reg.getTokens.call(BNify(0), BNify(20), BNify(0));

    console.log(`RES: ${res.toString()}`)
  });


module.exports = {
  version: '0.5.2',
  paths: {
    artifacts: "./client/src/contracts"
  },
  networks: {
    develop: {
      url: `https://mainnet.infura.io/v3/${INFURA_KEY}`
    }
  }
};
