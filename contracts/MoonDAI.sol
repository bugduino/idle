pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC777/ERC777.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";

import "./interfaces/CERC20.sol";
import "./interfaces/iERC20.sol";

// TODO
// in rebalanceCheck we should also check how much
// the interest rate changes due to the new liquidity we provide

// TODO we should inform the user of the eventual excess of token that can be redeemed directly in Fulcrum

// TODO Add fee ?

contract MoonDAI is ERC777, ReentrancyGuard, Ownable {
  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  address public cToken; // cTokens have 8 decimals
  address public iToken; // iTokens have 18 decimals
  address public token;
  address public bestToken;

  /* uint256 public fee; */
  uint256 public blocksInAYear;
  uint256 public minRateDifference;

  mapping(address => uint256) investedBalances; // eg balances[msg.sender] = 10e18

  /**
   * @dev constructor
   */
  constructor(address _cToken, address _iToken, address _token)
    public
    ERC777("MoonDAI", "MOONDAI", new address[](0)) {
    /* fee = 1; // 1% */
    cToken = _cToken;
    iToken = _iToken;
    token = _token;
    // TODO get it from compound contract directly
    blocksInAYear = 2102400; // ~15 sec per block
    minRateDifference = 10**18 / 2; // 0.5% min
  }

  // onlyOwner

  function setMinRateDifference(uint256 _rate)
    public onlyOwner {
      require(_rate > 0, 'minRateDifference should be > 0');
      minRateDifference = _rate;
  }
  function setBlocksInAYear(uint256 _blocks)
    public onlyOwner {
      require(_blocks > 0, 'blocksInAYear should be > 0');
      blocksInAYear = _blocks;
  }

  // public

  /**
   * @dev User should 'approve' _amount tokens before calling mintIndexToken
   */
  function mintIndexToken(uint256 _amount)
    public nonReentrant
    returns (uint256 mintedTokens) {
      require(_amount > 0, "Amount is not > 0");
      // get a handle for the underlying asset contract
      IERC20 underlying = IERC20(token);
      // transfer to this contract
      underlying.safeTransferFrom(msg.sender, address(this), _amount);

      rebalance();
      uint256 mintedUnderlyingTokens;
      if (bestToken == cToken) {
        mintedUnderlyingTokens = _mintCTokens(_amount);
      } else {
        mintedUnderlyingTokens = _mintITokens(_amount);
      }

      if (bestToken == address(0)) {
        _mint(msg.sender, msg.sender, _amount, "", "");
        mintedTokens = _amount;
      } else {
        uint256 currTokenPrice = getPriceInToken();
        mintedTokens = _amount.div(currTokenPrice);
      }
      // Save number of underlying tokens invested
      /* investedBalances[msg.sender] = investedBalances[msg.sender].add(_amount); */
  }

  /**
   * @dev here we calc the pool share of the cTokens | iTokens one can withdraw
   */
  function redeemIndexToken(uint256 _amount)
    public nonReentrant
    returns (uint256 tokensRedeemed) {
    uint256 senderBalance = this.balanceOf(msg.sender);
    require(senderBalance > 0, "senderBalance should be > 0");
    require(senderBalance >= _amount, "senderBalance should be >= amount requested");

    uint256 moonSupply = this.totalSupply();
    require(moonSupply > 0, 'No MOONDAI have been issued');

    if (bestToken == cToken) {
      uint256 cPoolBalance = IERC20(cToken).balanceOf(address(this));
      uint256 cDAItoRedeem = _amount.mul(cPoolBalance).div(moonSupply);
      tokensRedeemed = _redeemCTokens(cDAItoRedeem, msg.sender); //TODO fee?
    } else {
      uint256 iPoolBalance = IERC20(iToken).balanceOf(address(this));
      uint256 iDAItoRedeem = _amount.mul(iPoolBalance).div(moonSupply);
      // TODO we should inform the user of the eventual excess of token that can be redeemed directly in Fulcrum
      tokensRedeemed = _redeemITokens(iDAItoRedeem, msg.sender);
    }
    this.burn(_amount, '');

    /* investedBalances[msg.sender] = investedBalances[msg.sender].sub(tokensRedeemed); */
  }

  function getPriceInToken()
    public view
    returns (uint256 tokenPrice) {
      // 1MOONDAI = nav_pool / total_liquidity_moonDAI
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
      uint256 totalSupplyMoonToken = this.balanceOf(address(this));
      tokenPrice = navPool.div(totalSupplyMoonToken); // moonToken price in token wei
  }
  function getAPRs()
    public view
    returns (uint256 cApr, uint256 iApr) {
      uint256 cRate = CERC20(cToken).supplyRatePerBlock(); // interest % per block
      cApr = cRate.mul(blocksInAYear).mul(100);
      iApr = iERC20(iToken).supplyInterestRate(); // APR in wei 18 decimals
  }
  function getBestRateToken()
    public view
    returns (address bestRateToken, uint256 bestRate, uint256 worstRate) {
      (uint256 cApr, uint256 iApr) = getAPRs();
      bestRateToken = cToken;
      bestRate = cApr;
      worstRate = iApr;
      if (iApr > cApr) {
        worstRate = cApr;
        bestRate = iApr;
        bestRateToken = iToken;
      }
  }
  /**
   * @dev Convert cToken pool in iToken pool (or the contrary) if needed
   * Everyone should be incentivized in calling this method
   */
  function rebalanceCheck()
    public view
    returns (bool shouldRebalance, address bestTokenAddr) {
      shouldRebalance = false;

      if (bestToken == address(0)) {
        shouldRebalance = true;
        return (shouldRebalance, address(0));
      }

      uint256 _bestRate;
      uint256 _worstRate;
      (bestTokenAddr, _bestRate, _worstRate) = getBestRateToken();
      if (bestTokenAddr != bestToken && (_worstRate.add(minRateDifference) < _bestRate)) {
        shouldRebalance = true;
        return (shouldRebalance, bestTokenAddr);
      }
  }
  /**
   * @dev Convert cToken pool in iToken pool (or the contrary) if needed
   * Everyone should be incentivized in calling this method
   */
  function rebalance()
    public {
      (bool shouldRebalance, address newBestTokenAddr) = rebalanceCheck();
      if (!shouldRebalance) {
        return;
      }

      if (bestToken != address(0)) {
        // bestToken is the 'old' best token
        if (bestToken == cToken) {
          _redeemCTokens(IERC20(cToken).balanceOf(address(this)), address(this)); // token are now in this contract
          _mintITokens(IERC20(token).balanceOf(address(this)));
        } else {
          _redeemITokens(IERC20(iToken).balanceOf(address(this)), address(this));
          _mintCTokens(IERC20(token).balanceOf(address(this)));
        }
      }

      // Update best token address
      bestToken = newBestTokenAddr;
  }
  /**
   * @dev here we are redeeming unclaimed token (from iToken contract) to this contracts
   * then converting the claimedTokens in the bestToken after rebalancing
   * Everyone should be incentivized in calling this method
   */
  function claimITokens()
    public
    returns (uint256 claimedTokens) {
      claimedTokens = iERC20(iToken).claimLoanToken();
      if (claimedTokens <= 0) {
        return 0;
      }

      rebalance();
      if (bestToken == cToken) {
        _mintCTokens(claimedTokens);
      } else {
        _mintITokens(claimedTokens);
      }

      return claimedTokens;
  }

  // internal
  function _mintCTokens(uint256 _amount)
    internal
    returns (uint256 cTokens) {
      // get a handle for the corresponding cToken contract
      cTokens = 0;
      if (IERC20(cToken).balanceOf(address(this)) <= 0) {
        return cTokens;
      }

      CERC20 _cToken = CERC20(cToken);
      // mint the cTokens and assert there is no error
      require(_cToken.mint(_amount) == 0, "Error minting");
      // cTokens are now in this contract

      // generic solidity formula is exchangeRateMantissa = (underlying / cTokens) * 1e18
      uint256 exchangeRateMantissa = _cToken.exchangeRateStored(); // (exchange_rate * 1e18)
      // so cTokens = (underlying * 1e18) / exchangeRateMantissa
      cTokens = _amount.mul(10**18).div(exchangeRateMantissa);
  }
  function _mintITokens(uint256 _amount)
    internal
    returns (uint256 iTokens) {
      iTokens = 0;
      if (IERC20(iToken).balanceOf(address(this)) <= 0) {
        return iTokens;
      }
      // get a handle for the corresponding iToken contract
      iERC20 _iToken = iERC20(iToken);
      // mint the iTokens
      iTokens = _iToken.mint(address(this), _amount);
  }

  function _redeemCTokens(uint256 _amount, address _account)
    internal
    returns (uint256 tokens) {
      CERC20 _cToken = CERC20(cToken);
      // redeem all user's underlying
      require(_cToken.redeem(_amount) == 0, "Something went wrong when redeeming in cTokens");

      // generic solidity formula is exchangeRateMantissa = (underlying / cTokens) * 1e18
      uint256 exchangeRateMantissa = _cToken.exchangeRateStored(); // exchange_rate * 1e18
      // so underlying = (exchangeRateMantissa * cTokens) / 1e18
      tokens = _amount.mul(exchangeRateMantissa).div(10**18);

      if (_account != address(this)) {
        IERC20(token).safeTransfer(_account, tokens);
      }
  }
  function _redeemITokens(uint256 _amount, address _account)
    internal
    returns (uint256 tokens) {
      iERC20 _iToken = iERC20(iToken);
      /* tokens = _iToken.burn(address(this), _amount); */
      // redeem all user's underlying and send them directly to the user
      tokens = _iToken.burn(_account, _amount);
      // TODO fee here ?
      // The problem here is that if I use address(this) instead of msg.sender
      // and not all funds are withrawable, then the right to claim these remaining tokens
      // would be for this contract which should keep track of all the rights of the user.
      // need to think about it

      /* uint256 index;
      bool hasOtherTokensNotWithrawable;
      (index, hasOtherTokensNotWithrawable) = _iToken.burntTokenReserveListIndex(address(this));
      require(!hasOtherTokensNotWithrawable, "Not all iTokens are withrawable at the moment try later"); */
  }
}
