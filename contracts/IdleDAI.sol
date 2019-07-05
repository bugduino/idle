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
  address public idleClaim;

  uint256 public blocksInAYear;
  uint256 public minRateDifference;

  /**
   * @dev constructor
   */
  constructor(address _cToken, address _iToken, address _token, address _idleClaim)
    public
    ERC777("IdleDAI", "IDLEDAI", new address[](0)) {
      owner = msg.sender;
      cToken = _cToken;
      iToken = _iToken;
      token = _token;
      idleClaim = _idleClaim;
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
      (bool success, bytes memory data) = address(idleClaim).delegatecall(
        abi.encodeWithSelector(
          this.mintIndexToken.selector,
          bestToken,
          blocksInAYear,
          minRateDifference,
          this.balanceOf(address(this))
      ));
      require(success, 'Reverted in idleClaim');
      _mint(msg.sender, msg.sender, IdleHelp.convertBytesToUint256(data), "", "");
      /* _mint(msg.sender, msg.sender, IdleHelp.bytesToUint(data), "", ""); */
  }

  /**
   * @dev here we calc the pool share of the cTokens | iTokens one can withdraw
   */
  function redeemIndexToken(uint256 _amount)
    external nonReentrant
    returns (uint256 tokensRedeemed) {
      (bool success, bytes memory data) = address(idleClaim).delegatecall(
        abi.encodeWithSelector(
          this.redeemIndexToken.selector,
          bestToken,
          blocksInAYear,
          minRateDifference,
          this.totalSupply()
      ));
      require(success, 'Reverted in idleClaim');
      this.burn(_amount, '');
  }

  /**
   * @dev Convert cToken pool in iToken pool (or the contrary) if needed
   * Everyone should be incentivized in calling this method
   */
  function rebalance()
    public {
      (bool success, bytes memory data) = address(idleClaim).delegatecall(
        abi.encodeWithSelector(
          this.rebalance.selector,
          bestToken,
          blocksInAYear,
          minRateDifference
      ));
      require(success, 'Reverted in idleClaim');
  }
  /**
   * @dev here we are redeeming unclaimed token (from iToken contract) to this contracts
   * then converting the claimedTokens in the bestToken after rebalancing
   * Everyone should be incentivized in calling this method
   */
  function claimITokens()
    external
    returns (uint256) {
      (bool success, bytes memory data) = address(idleClaim).delegatecall(
        abi.encodeWithSelector(
          this.claimITokens.selector,
          bestToken,
          blocksInAYear,
          minRateDifference
      ));
      require(success, 'Reverted in idleClaim');
  }
}
