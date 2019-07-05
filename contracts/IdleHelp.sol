pragma solidity ^0.5.2;

import "./interfaces/CERC20.sol";
import "./interfaces/iERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

library IdleHelp {
  using SafeMath for uint256;

  function convertBytesToUint256(bytes memory buffer)
    public pure
    returns (uint256 retval) {
      assembly {
        retval := mload(add(buffer, 0x20))
      }
  }

  function getPriceInToken(address cToken, address iToken, address bestToken, uint256 totalSupply)
    public view
    returns (uint256 tokenPrice) {
      // 1IDLEDAI = nav_pool / total_liquidity_moonDAI
      uint256 poolSupply;
      uint256 navPool; // net asset value
      uint256 price;

      if (bestToken == cToken) {
        // nav == rate di 1cDAI = n DAI * balanceOf(cDAI)
        uint256 rate = CERC20(cToken).exchangeRateStored(); // 202487304197710837666727644 ->
        uint256 oneToken = 10**18;
        price = oneToken.div(rate.div(oneToken));
        poolSupply = IERC20(cToken).balanceOf(address(this));
        //
      } else {
        poolSupply = IERC20(iToken).balanceOf(address(this));
        // nav == rate di 1iDAI = n DAI * balanceOf(iDAI)
        price = iERC20(iToken).tokenPrice(); // 1001495070730287403 -> 1iDAI in wei = 1001495070730287403 DAI
      }

      navPool = price.mul(poolSupply);
      tokenPrice = navPool.div(totalSupply); // moonToken price in token wei
  }
  function getAPRs(address cToken, address iToken, uint256 blocksInAYear)
    public view
    returns (uint256 cApr, uint256 iApr) {
      uint256 cRate = CERC20(cToken).supplyRatePerBlock(); // interest % per block
      cApr = cRate.mul(blocksInAYear).mul(100);
      iApr = iERC20(iToken).supplyInterestRate(); // APR in wei 18 decimals
  }
  function getBestRateToken(address cToken, address iToken, uint256 blocksInAYear)
    public view
    returns (address bestRateToken, uint256 bestRate, uint256 worstRate) {
      (uint256 cApr, uint256 iApr) = getAPRs(cToken, iToken, blocksInAYear);
      bestRateToken = cToken;
      bestRate = cApr;
      worstRate = iApr;
      if (iApr > cApr) {
        worstRate = cApr;
        bestRate = iApr;
        bestRateToken = iToken;
      }
  }
  function rebalanceCheck(address cToken, address iToken, address bestToken, uint256 blocksInAYear, uint256 minRateDifference)
    public view
    returns (bool shouldRebalance, address bestTokenAddr) {
      shouldRebalance = false;

      uint256 _bestRate;
      uint256 _worstRate;
      (bestTokenAddr, _bestRate, _worstRate) = getBestRateToken(cToken, iToken, blocksInAYear);
      if (
          bestToken == address(0) ||
          (bestTokenAddr != bestToken && (_worstRate.add(minRateDifference) < _bestRate))) {
        shouldRebalance = true;
        return (shouldRebalance, bestTokenAddr);
      }

      return (shouldRebalance, bestTokenAddr);
  }
}
