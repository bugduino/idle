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
    const iERC20 = artifacts.require('iERC20');
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

task("iDAI:manualNextRateData", "iDAI calculate next supplyRate given a supplyAmount")
  .addParam("amount", "The amount provided, eg '100000' for 100000 DAI ")
  .setAction(async taskArgs => {
    const ERC20 = artifacts.require('ERC20');
    const iERC20 = artifacts.require('iERC20');
    const iDAI = await iERC20.at('0x14094949152eddbfcd073717200da82fed8dc960'); // mainnet

    const newDAIAmount = BNify(taskArgs.amount).times(1e18);

    let promises = [
      iDAI.supplyInterestRate.call(),
      iDAI.borrowInterestRate.call(),
      iDAI.totalAssetSupply.call(),
      iDAI.totalAssetBorrow.call(),
      iDAI.rateMultiplier.call(),
      iDAI.baseRate.call(),
    ];
    const res = await Promise.all(promises);
    const [
      supplyRate, borrowRate, totalAssetSupply,
      totalAssetBorrow, rateMultiplier, baseRate,
    ] = res;

    const currUtilizationRate = BNify(totalAssetBorrow).times(1e20).div(BNify(totalAssetSupply));

    console.log(`CONTRACT DATA:`);
    console.log(`${supplyRate.toString()} supplyRate`);
    console.log(`${BNify(supplyRate).div(1e18).toString()}% supplyRate %`);
    console.log(`${borrowRate.toString()} borrowRate`);
    console.log(`${BNify(borrowRate).div(1e18).toString()}% borrowRate %`);
    console.log(`${totalAssetBorrow.toString()} totalAssetBorrow`);
    console.log(`${totalAssetSupply.toString()} totalAssetSupply`);
    console.log(`${BNify(totalAssetBorrow).div(1e18).toString()} totalAssetBorrow DAI`);
    console.log(`${BNify(totalAssetSupply).div(1e18).toString()} totalAssetSupply DAI`);
    console.log(`${currUtilizationRate.toString()} currUtilizationRate`);
    console.log(`##############`);


    // current_supply_interest_rate = current_borrow_interest_rate * utilizationRate * (1-spread).
    // spread = interest retained by the protocol for lender insurance = 10%

    const newUtilizationRate = BNify(totalAssetBorrow).times(1e20).div(BNify(totalAssetSupply));
    // const newUtilizationRate = BNify(totalAssetBorrow).times(1e20).div(BNify(totalAssetSupply).plus(newDAIAmount));


    const nextBorrowInterestRate = BNify(newUtilizationRate)
        .times(BNify(rateMultiplier))
        .div(BNify(1e20))
        .plus(BNify(baseRate));

    const maxRate = BNify(rateMultiplier).plus(BNify(baseRate));



    // const newSupplyRate = BNify(nextBorrowInterestRate).times(newUtilizationRate).times(oneMinusSpread);
    // const oneMinusSpread = BNify(0.9).times(1e18);

    console.log(`SUPPLYING ${BNify(newDAIAmount).div(1e18).toString()} DAI`);
    // console.log(`${newUtilizationRate.toString()} newUtilizationRate`);
    console.log(`${nextBorrowInterestRate.toString()} nextBorrowInterestRate`);
    console.log(`${BNify(nextBorrowInterestRate).div(1e18).toString()}% nextBorrowInterestRate %`);
    console.log(`${maxRate.toString()} maxRate`);
    console.log(`${BNify(maxRate).div(1e18).toString()}% maxRate %`);
    // console.log(`${newSupplyRate.toString()} newSupplyRate`);
    // console.log(`${BNify(newSupplyRate).div(1e18).toString()}% newSupplyRate %`);
  });

task("iDAI:manualAmountToRate", "iDAI calculate max amount lendable with a min target supply rate")
  .addParam("rate", "The target rate, eg '8' for 8% ")
  .setAction(async taskArgs => {
    const ERC20 = artifacts.require('ERC20');
    const iERC20 = artifacts.require('iERC20');
    const iDAI = await iERC20.at('0x14094949152eddbfcd073717200da82fed8dc960'); // mainnet

    let promises = [
      iDAI.supplyInterestRate.call(),
      iDAI.borrowInterestRate.call(),
      iDAI.totalAssetSupply.call(),
      iDAI.totalAssetBorrow.call(),
    ];
    const res = await Promise.all(promises);
    const [supplyRate, borrowRate, totalAssetSupply, totalAssetBorrow] = res;

    // totalAssetSupply will change once pool is rebalanced
    const utilizationRate = BNify(totalAssetBorrow).div(BNify(totalAssetSupply));


    console.log(`CONTRACT DATA:`);
    console.log(`${supplyRate.toString()} supplyRate`);
    console.log(`${BNify(supplyRate).div(1e18).toString()}% supplyRate %`);
    console.log(`${borrowRate.toString()} borrowRate`);
    console.log(`${BNify(borrowRate).div(1e18).toString()}% borrowRate %`);

    console.log(`${totalAssetBorrow.toString()} totalAssetBorrow`);
    console.log(`${totalAssetSupply.toString()} totalAssetSupply`);
    console.log(`${BNify(totalAssetBorrow).div(1e18).toString()} totalAssetBorrow DAI`);
    console.log(`${BNify(totalAssetSupply).div(1e18).toString()} totalAssetSupply DAI`);

    console.log(`${utilizationRate.toString()} utilizationRate`);
    console.log(`##############`);

    // current_supply_interest_rate = current_borrow_interest_rate * utilizationRate * (1-spread).
    // spread = interest retained by the protocol for lender insurance = 10%

    // so max DAI amount below target rate inspect
    // newDAI = ((borrowRate * totalAssetBorrow * 0.9) / targetSupplyRate) - totalAssetSupply

    const oneMinusSpread = BNify(0.9);
    const targetSupplyRate = BNify(taskArgs.rate).times(1e18);
    const newDAIAmount = (BNify(borrowRate).times(BNify(totalAssetBorrow)).times(oneMinusSpread)
                    .div(targetSupplyRate)).minus(BNify(totalAssetSupply));

    console.log(`${targetSupplyRate.toString()} targetSupplyRate`);
    console.log(`SUPPLYING ${BNify(newDAIAmount).div(1e18).toString()} DAI`);
    const newUtilizationRate = BNify(totalAssetBorrow).div(BNify(totalAssetSupply).plus(newDAIAmount));
    console.log(`${newUtilizationRate.toString()} newUtilizationRate`);
    const newSupplyRate = BNify(borrowRate).times(newUtilizationRate).times(oneMinusSpread);
    console.log(`${newSupplyRate.toString()} newSupplyRate`);
    console.log(`${BNify(newSupplyRate).div(1e18).toString()}% newSupplyRate %`);
  });

task("iDAI:autoNextSupplyRateData", "iDAI get next supplyRate given a supplyAmount from fulcrum")
  .addParam("amount", "The amount provided, eg '100000' for 100000 DAI ")
  .setAction(async taskArgs => {
    const ERC20 = artifacts.require('ERC20');
    const iERC20 = artifacts.require('iERC20');
    const iDAI = await iERC20.at('0x14094949152eddbfcd073717200da82fed8dc960'); // mainnet
    const newDAIAmount = BNify(taskArgs.amount).times(1e18);

    let promises = [
      iDAI.nextSupplyInterestRate.call(web3.utils.toBN(newDAIAmount)),
    ];
    const res = await Promise.all(promises);
    const [supplyRate] = res;

    console.log(`${supplyRate.toString()} supplyRate`);
    console.log(`${BNify(supplyRate).div(1e18).toString()}% supplyRate %`);
    // 6.608818741649654856% supplyRate % with 100000 DAI
  });
task("iDAI:autoNextBorrowRateData", "iDAI get next supplyRate given a supplyAmount from fulcrum")
  .addParam("amount", "The amount provided, eg '100000' for 100000 DAI ")
  .setAction(async taskArgs => {
    const ERC20 = artifacts.require('ERC20');
    const iERC20 = artifacts.require('iERC20');
    const iDAI = await iERC20.at('0x14094949152eddbfcd073717200da82fed8dc960'); // mainnet
    const newDAIAmount = BNify(taskArgs.amount).times(1e18);

    let promises = [
      iDAI.nextBorrowInterestRate.call(web3.utils.toBN(newDAIAmount)),
      iDAI.borrowInterestRate.call(),
      iDAI.nextLoanInterestRate.call(web3.utils.toBN(newDAIAmount)),
    ];
    const res = await Promise.all(promises);
    const [newBorrowRate, currBorrowRate, nextLoanInterestRate] = res;

    console.log(`${BNify(newBorrowRate).div(1e18).toString()}% newBorrowRate %`);
    console.log(`${BNify(currBorrowRate).div(1e18).toString()}% currBorrowRate %`);
    console.log(`${BNify(nextLoanInterestRate).div(1e18).toString()}% nextLoanInterestRate %`);
  });

task("cDAI:nextRateData", "cDAI calculate next supplyRate")
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

    const rate = BNify(getCash).plus(BNify(totalBorrows)).minus(BNify(totalReserves)).div(BNify(totalSupply)).times(1e18);
    console.log(`${BNify(rate).toString()} rate`);

    const underlying = BNify(totalSupply).times(rate.div(1e18));
    console.log(`${BNify(underlying).toString()} underlying`);
    const borrowsPer = BNify(totalBorrows).div(underlying);
    console.log(`${BNify(borrowsPer).toString()} borrowsPer`);
    const borrowRate = whiteBorrow[1];
    console.log(`${BNify(borrowRate).toString()} borrowRate`);

    const oneMinusReserveFactor = BNify(1e18).minus(reserveFactorMantissa);
    console.log(`${BNify(oneMinusReserveFactor).toString()} oneMinusReserveFactor`);

    const supplyRate = BNify(borrowRate).times(oneMinusReserveFactor).times(borrowsPer).div(1e18);
    console.log(`${BNify(supplyRate).toString()} supplyRate`);

    const newSupplyRatePerYear = BNify(supplyRate).times('2102400').times('100').integerValue(BigNumber.ROUND_FLOOR)
    console.log(`${BNify(newSupplyRatePerYear).div(1e18).toString()}% newSupplyRatePerYear`);
  });

task("cDAI:nextRateDataWithAmount", "cDAI calculate next supplyRate given a supplyAmount")
  .addParam("amount", "The amount provided, eg '100000' for 100000 DAI ")
  .setAction(async taskArgs => {
    const cERC20 = artifacts.require('CERC20');
    const ERC20 = artifacts.require('ERC20');
    const WhitePaperInterestModel = artifacts.require('WhitePaperInterestModel');

    const cDAI = await cERC20.at('0xf5dce57282a584d2746faf1593d3121fcac444dc'); // mainnet
    const cDAIWithSupply = await ERC20.at('0xf5dce57282a584d2746faf1593d3121fcac444dc'); // mainnet
    const whitePaperInterestModel = await WhitePaperInterestModel.at('0xd928c8ead620bb316d2cefe3caf81dc2dec6ff63'); // mainnet


    // First calculate what the new borrowRate would be
    const newDAIAmount = BNify(taskArgs.amount).times(1e18);
    const getCashPre = await cDAI.getCash.call();
    const amount = BNify(getCashPre.toString()).plus(newDAIAmount);
    const totalBorrowsPre = await cDAI.totalBorrows.call();

    const whiteBorrow = await whitePaperInterestModel.getBorrowRate.call(
      web3.utils.toBN(amount),
      totalBorrowsPre,
      BNify(0)
    );

    let promises = [
      // whitePaperInterestModel.getBorrowRate.call(
      //   await cDAI.getCash.call(),
      //   await cDAI.totalBorrows.call(),
      //   BNify(0)
      // ),
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

    // TODO remove
    // const [whiteBorrow, contractSupply, contractBorrow, totalBorrows, getCash, totalReserves, totalSupply, reserveFactorMantissa, exchangeRateStored] = res;
    const [contractSupply, contractBorrow, totalBorrows, getCash, totalReserves, totalSupply, reserveFactorMantissa, exchangeRateStored] = res;

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

    // Calc updated getCash (DAI) and totalSupply (cDAI)
    const newCash = BNify(getCash).plus(newDAIAmount);
    const newCDAI = newDAIAmount.times(1e18).div(exchangeRateStored).div(1e8);
    console.log(`${BNify(newCDAI).toString()} newCDAI`);
    const newSupply = BNify(totalSupply).plus(newCDAI);

    // Calc new exchangeRate
    const rate = BNify(newCash).plus(BNify(totalBorrows)).minus(BNify(totalReserves)).div(BNify(newSupply)).times(1e18);
    console.log(`${BNify(rate).toString()} rate`);

    const underlying = BNify(newSupply).times(rate.div(1e18));
    console.log(`${BNify(underlying).toString()} underlying`);
    const borrowsPer = BNify(totalBorrows).div(underlying);
    console.log(`${BNify(borrowsPer).toString()} borrowsPer`);
    const borrowRate = whiteBorrow[1];
    console.log(`${BNify(borrowRate).toString()} borrowRate`);

    const oneMinusReserveFactor = BNify(1e18).minus(reserveFactorMantissa);
    console.log(`${BNify(oneMinusReserveFactor).toString()} oneMinusReserveFactor`);

    const supplyRate = BNify(borrowRate).times(oneMinusReserveFactor).times(borrowsPer).div(1e18);
    console.log(`${BNify(supplyRate).toString()} supplyRate`);

    const newSupplyRatePerYear = BNify(supplyRate).times('2102400').times('100').integerValue(BigNumber.ROUND_FLOOR)
    console.log(`${BNify(newSupplyRatePerYear).div(1e18).toString()}% newSupplyRatePerYear`);
  });

// TODO fix this
task("cDAI:amountToRate", "cDAI calculate max amount lendable with a min target supply rate")
  .addParam("rate", "The target rate, eg '8' for 8% ")
  .setAction(async taskArgs => {
    const cERC20 = artifacts.require('CERC20');
    const ERC20 = artifacts.require('ERC20');
    const WhitePaperInterestModel = artifacts.require('WhitePaperInterestModel');

    const cDAI = await cERC20.at('0xf5dce57282a584d2746faf1593d3121fcac444dc'); // mainnet
    const cDAIWithSupply = await ERC20.at('0xf5dce57282a584d2746faf1593d3121fcac444dc'); // mainnet
    const whitePaperInterestModel = await WhitePaperInterestModel.at('0xd928c8ead620bb316d2cefe3caf81dc2dec6ff63'); // mainnet

    let promises = [
      cDAI.supplyRatePerBlock.call(),
      cDAI.borrowRatePerBlock.call(),

      cDAI.totalBorrows.call(),
      cDAI.getCash.call(),
      cDAI.totalReserves.call(),
      cDAIWithSupply.totalSupply.call(),
      cDAI.reserveFactorMantissa.call(),
      cDAI.exchangeRateStored.call(),

      // from WhitePaperInterestModel
      whitePaperInterestModel.baseRate.call(),
      whitePaperInterestModel.multiplier.call(),
    ];

    const res = await Promise.all(promises);
    const [
      contractSupply, contractBorrow,
      totalBorrows, getCash, totalReserves, totalSupply,
      reserveFactorMantissa, exchangeRateStored,
      baseRate, multiplier
    ] = res;

    supplyRatePerYear = BNify(contractSupply).times('2102400').times('100').integerValue(BigNumber.ROUND_FLOOR)
    borrowRatePerYearContract = BNify(contractBorrow).times('2102400').times('100').integerValue(BigNumber.ROUND_FLOOR)

    console.log(`${contractSupply.toString()} contract supply`);
    console.log(`${contractBorrow.toString()} contract borrow`);
    console.log(`################`);
    console.log(`${BNify(borrowRatePerYearContract).div(1e18).toString()}% borrowRatePerYear contract`);
    console.log(`${BNify(supplyRatePerYear).div(1e18).toString()}% supplyRatePerYear`);
    console.log(`################`);
    console.log(`${BNify(totalBorrows).div(1e18).toString()} totalBorrows`)
    console.log(`${BNify(getCash).div(1e18).toString()} getCash`)
    console.log(`${BNify(totalReserves).div(1e18).toString()} totalReserves`)
    console.log(`${BNify(totalSupply).div(1e8).toString()} totalSupply`)
    console.log(`${BNify(exchangeRateStored).toString()} exchangeRateStored`)
    console.log(`${BNify(reserveFactorMantissa).toString()} reserveFactorMantissa`)
    console.log(`################`);
    console.log(`${BNify(baseRate).toString()} baseRate`)
    console.log(`${BNify(multiplier).toString()} multiplier`)

    // a = baseRate
    // b = totalBorrows
    // c = multiplier
    // d = totalReserves
    // e = 1 - reserveFactor
    // s = getCash
    // x = maxDAIAmount
    // q = targetSupplyRate
    // x = (sqrt(a^2 b^2 e^2 + 2 a b d e q + 4 b^2 c e q + d^2 q^2) + a b e - 2 b q + d q - 2 q s)/(2 q)

    const targetSupplyRatePerYear = BNify(taskArgs.rate);
    const targetSupplyRate = targetSupplyRatePerYear.div(BNify('2102400').times(BNify('100'))).times(1e18);

    const a = BNify(baseRate);
    const b = BNify(totalBorrows);
    const c = BNify(multiplier);
    const d = BNify(totalReserves);
    const e = BNify(1e18).minus(BNify(reserveFactorMantissa));
    const s = BNify(getCash);
    const q = BNify(targetSupplyRate);

    // x = (sqrt(a^2 b^2 e^2 + 2 a b d e q + 4 b^2 c e q + d^2 q^2) + a b e - 2 b q + d q - 2 q s)/(2 q)
    const newDAIAmount =
      a.pow(2).times(b.pow(2)).times(e.pow(2)).plus(
        BNify(2).times(a).times(b).times(d).times(e).times(q).plus(
          BNify(4).times(b.pow(2)).times(c).times(e).times(q).plus(
            d.pow(2).times(q.pow(2))
          )
        )
      ).sqrt().plus(
        a.times(b).times(e).minus(
          BNify(2).times(b).times(q)
        ).plus(
          d.times(q)
        ).minus(
          BNify(2).times(q).times(s)
        )
      ).div(BNify(2).times(q));

    // x = (sqrt(4 q (a b e s + b^2 c e - b q s + d q s - q s^2) + (a b e - b q + d q - 2 q s)^2) + a b e - b q + d q - 2 q s)/(2 q)
    // const newDAIAmount =
    //   BNify('4').times(q).times(
    //     a.times(b).times(e).times(s).plus(
    //       b.pow(2).times(c).times(e).minus(
    //         b.times(q).times(s).plus(
    //           d.times(q).times(s).minus(
    //             q.times(s.pow(2))
    //           )
    //         )
    //       )
    //     )
    //   ).plus(
    //     a.times(b).times(e).minus(b.times(q)).plus(d.times(q)).minus(BNify('2').times(q).times(s))
    //   ).pow(2).sqrt().plus(
    //     a.times(b).times(e).minus(
    //       b.times(q).plus(
    //         d.times(q)
    //       ).minus(BNify('2').times(q).times(s))
    //     )
    //   ).div(
    //     BNify('2').times(q)
    //   );




    // const newDAIAmount = BNify(contractBorrow).times(BNify('0.9')).times(BNify(totalBorrows)).div(BNify(targetSupplyRate))
    //                 .plus(totalReserves).minus(totalBorrows).minus(getCash)
    //
    // const newCash = BNify(getCash).plus(newDAIAmount);
    // const newCDAI = newDAIAmount.times(1e18).div(exchangeRateStored).div(1e8);
    // const newSupply = BNify(totalSupply).plus(newCDAI);
    // const rate = BNify(newCash).plus(BNify(totalBorrows)).minus(BNify(totalReserves)).div(BNify(newSupply)).times(1e18);
    // const underlying = BNify(newSupply).times(rate.div(1e18));
    // const borrowsPer = BNify(totalBorrows).div(underlying);
    // const borrowRate = contractBorrow;
    // const oneMinusReserveFactor = BNify(1e18).minus(reserveFactorMantissa);
    // const supplyRate = BNify(borrowRate).times(oneMinusReserveFactor).times(borrowsPer).div(1e18);
    // const newSupplyRatePerYear = BNify(supplyRate).times('2102400').times('100').integerValue(BigNumber.ROUND_FLOOR)

    console.log(`${BNify(targetSupplyRatePerYear).toString()} targetSupplyRatePerYear`)
    console.log(`${BNify(targetSupplyRate).toString()} targetSupplyRate`)
    console.log(`@@@@@ ${BNify(newDAIAmount).toString()} newDAIAmount`)
    console.log(`@@@@@ ${BNify(newDAIAmount).div(1e18).div(1e8).div(1e18).toString()} newDAIAmount`)
    // console.log(`${BNify(newCDAI).toString()} newCDAI`);
    // console.log(`${BNify(rate).toString()} rate`);
    // console.log(`${BNify(underlying).toString()} underlying`);
    // console.log(`${BNify(borrowsPer).toString()} borrowsPer`);
    // console.log(`${BNify(borrowRate).toString()} borrowRate`);
    // console.log(`${BNify(oneMinusReserveFactor).toString()} oneMinusReserveFactor`);
    // console.log(`${BNify(supplyRate).toString()} supplyRate`);
    // console.log(`${BNify(newSupplyRatePerYear).div(1e18).toString()}% newSupplyRatePerYear`);
  });

task("cDAI:apr", "Get cDAI APR")
  .setAction(async taskArgs => {
    const cERC20 = artifacts.require('CERC20');
    const cDAI = await cERC20.at('0xf5dce57282a584d2746faf1593d3121fcac444dc'); // mainnet
    let res = await cDAI.supplyRatePerBlock.call();

    res = BNify(res).times('2102400').times('100').integerValue(BigNumber.ROUND_FLOOR)
    console.log(`RES: ${res.toString()}`)
  });

task("TokenizedRegistry", "Call Fulcrum TokenizedRegistry")
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
