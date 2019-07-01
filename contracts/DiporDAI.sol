pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC777/ERC777.sol";

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";

import "./interfaces/CERC20.sol";
import "./interfaces/iERC20.sol";

contract DiporDAI is ERC777 {
  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  /* uint256 public fee; */
  address public cToken;
  address public iToken;

  // initially rates eg for DAI
  // 0.5 DAI == 25 cDAI
  // 0.5 DAI = 0.5 iDAI

  // then
  // 0.5 DAI == 12.5 cDAI
  // 0.5 DAI = 0.25 iDAI

  address public cTokenRefRate;
  address public iTokenRefRate;
  address public token;
  mapping(address => uint256) investedBalances; // eg balances[msg.sender] = 10e18

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  constructor (address _cToken, address _iToken, address _token)
    public
    ERC777("DiporDAI", "DIPORDAI5050", new address[](0)) {
    /* fee = 1; // 1% */
    cToken = _cToken;
    iToken = _iToken;
    token = _token;
  }

  function mintIndexToken(uint256 _amount)
    public {
      require(_amount > 0, "Amount is not > 0");
      // get a handle for the underlying asset contract
      IERC20 underlying = IERC20(token);
      // transfer to this contract
      underlying.safeTransferFrom(msg.sender, address(this), _amount);
      uint256 half = _amount.div(2);
      uint256 otherHalf = half;
      // Check for rounding issue - TODO is correct ?
      if (half.times(2) < _amount && half.times(2).add(1) == _amount) {
        otherHalf = otherHalf.add(1);
      }

      uint256 iTokens = _mintITokens(half);
      uint256 cTokens = _mintCTokens(otherHalf);

      // TODO set rates on constructor ??
      if (cTokenRefRate == 0 || iTokenRefRate == 0) {
        cTokenRefRate = otherHalf.div(cTokens);
        iTokenRefRate = half.div(iTokens);
      }

      // Save number of underlying tokens invested
      investedBalances[token][msg.sender] = investedBalances[token][msg.sender].add(_amount);

      // TODO calculate number of diporDAIs
      uint256 diporDAIs = 10000 * 10 ** 18;

      // Create DiporDAI for the user
      _mint(msg.sender, msg.sender, diporDAIs, "", "");
  }

  // internal
  function _mintCTokens(uint256 _amount)
    internal
    returns (uint256 cTokens) {
      // get a handle for the corresponding cToken contract
      CERC20 _cToken = CERC20(cToken);
      // mint the cTokens and assert there is no error
      require(_cToken.mint(_amount) == 0, "Error minting");
      // cTokens are now in this contract

      // generic solidity formula is exchangeRateMantissa = (underlying / cTokens) * 1e18
      uint256 exchangeRateMantissa = cToken.exchangeRateStored(); // (exchange_rate * 1e18)
      // so cTokens = (underlying * 1e18) / exchangeRateMantissa
      uint256 cTokens = _amount.mul(10**18).div(exchangeRateMantissa);
  }
  function _mintITokens(uint256 _amount)
    internal
    returns (uint256 iTokens) {
      // get a handle for the corresponding iToken contract
      iERC20 _iToken = iERC20(iToken);
      // mint the iTokens
      uint256 iTokens = _iToken.mint(address(this), _amount);
  }

  /* function _redeemCTokens(uint256 _amount)
    internal
    returns (uint256 tokens) {}
  function _redeemITokens(uint256 _amount)
    internal
    returns (uint256 tokens) {} */
}
