pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC777/ERC777.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";

import "./interfaces/CERC20.sol";
import "./interfaces/iERC20.sol";
import "./IdleHelp.sol";

// TODO
// in rebalanceCheck we should also check how much
// the interest rate changes due to the new liquidity we provide

// TODO we should inform the user of the eventual excess of token that can be redeemed directly in Fulcrum

// TODO Add fee ?

contract IdleDAI is ERC777, ReentrancyGuard {
  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  address public owner;

  address public cToken; // cTokens have 8 decimals
  address public iToken; // iTokens have 18 decimals
  address public token;
  address public bestToken;

  uint256 public blocksInAYear;
  uint256 public minRateDifference;

  /**
   * @dev constructor
   */
  constructor(address _cToken, address _iToken, address _token)
    public
    ERC777("IdleDAI", "IDLEDAI", new address[](0)) {
      owner = msg.sender;
      cToken = _cToken;
      iToken = _iToken;
      token = _token;
      // TODO get it from compound contract directly
      blocksInAYear = 2102400; // ~15 sec per block
      minRateDifference = 500000000000000000; // 0.5% min
  }

  // onlyOwner
  function setMinRateDifference(uint256 _rate)
    external {
      require(msg.sender == owner, 'Only owner');
      minRateDifference = _rate;
  }
  function setBlocksInAYear(uint256 _blocks)
    external {
      require(msg.sender == owner, 'Only owner');
      blocksInAYear = _blocks;
  }

  // public

  /**
   * @dev User should 'approve' _amount tokens before calling mintIndexToken
   */
  function mintIndexToken(uint256 _amount)
    external nonReentrant
    returns (uint256 mintedTokens) {
      /* require(_amount > 0, "Amount is not > 0"); */
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
        _mint(msg.sender, msg.sender, _amount, "", ""); // 1:1
        mintedTokens = _amount;
      } else {
        uint256 currTokenPrice = IdleHelp.getPriceInToken(cToken, iToken, bestToken, this.balanceOf(address(this)));
        mintedTokens = _amount.div(currTokenPrice);
        _mint(msg.sender, msg.sender, mintedTokens, "", "");
      }
  }

  /**
   * @dev here we calc the pool share of the cTokens | iTokens one can withdraw
   */
  function redeemIndexToken(uint256 _amount)
    external nonReentrant
    returns (uint256 tokensRedeemed) {
    /* uint256 senderBalance = this.balanceOf(msg.sender); */
    /* require(senderBalance > 0, "senderBalance should be > 0");
    require(senderBalance >= _amount, "senderBalance should be >= amount requested"); */

    uint256 idleSupply = this.totalSupply();
    require(idleSupply > 0, 'No IDLEDAI have been issued');

    if (bestToken == cToken) {
      uint256 cPoolBalance = IERC20(cToken).balanceOf(address(this));
      uint256 cDAItoRedeem = _amount.mul(cPoolBalance).div(idleSupply);
      tokensRedeemed = _redeemCTokens(cDAItoRedeem, msg.sender); //TODO fee?
    } else {
      uint256 iPoolBalance = IERC20(iToken).balanceOf(address(this));
      uint256 iDAItoRedeem = _amount.mul(iPoolBalance).div(idleSupply);
      // TODO we should inform the user of the eventual excess of token that can be redeemed directly in Fulcrum
      tokensRedeemed = _redeemITokens(iDAItoRedeem, msg.sender);
    }
    this.burn(_amount, '');

    /* investedBalances[msg.sender] = investedBalances[msg.sender].sub(tokensRedeemed); */
  }

  /**
   * @dev Convert cToken pool in iToken pool (or the contrary) if needed
   * Everyone should be incentivized in calling this method
   */
  function rebalance()
    public {
      (bool shouldRebalance, address newBestTokenAddr) = IdleHelp.rebalanceCheck(cToken, iToken, bestToken, blocksInAYear, minRateDifference);
      if (!shouldRebalance) {
        return;
      }

      if (bestToken != address(0)) {
        // bestToken here is the 'old' best token
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
    external
    returns (uint256 claimedTokens) {
      claimedTokens = iERC20(iToken).claimLoanToken();
      if (claimedTokens == 0) {
        return claimedTokens;
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
      if (IERC20(cToken).balanceOf(address(this)) == 0) {
        return cTokens;
      }
      // approve the transfer to cToken contract
      IERC20(token).safeIncreaseAllowance(cToken, _amount);

      // get a handle for the corresponding cToken contract
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
      if (IERC20(iToken).balanceOf(address(this)) <= 0) {
        return iTokens;
      }
      // approve the transfer to cToken contract
      IERC20(token).safeIncreaseAllowance(iToken, _amount);
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
      tokens = iERC20(iToken).burn(_account, _amount);
  }
}
