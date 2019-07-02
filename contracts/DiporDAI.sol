pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC777/ERC777.sol";
/* import "openzeppelin-solidity/contracts/ownership/Ownable.sol"; */
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";

import "./interfaces/CERC20.sol";
import "./interfaces/iERC20.sol";

contract DiporDAI is ERC777, ReentrancyGuard {
  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  /* uint256 public fee; */
  address public cToken; // cTokens have 8 decimals
  address public iToken; // iTokens have 18 decimals
  address public token;

  uint256 public cTokenRefRate;
  uint256 public iTokenRefRate;
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

    // Compound
    // eg 2000000000000000000_000_000_00 -> rate * 1e18 -> 1 DAI = 50cDAI
    // then
    // eg 2200000000000000000_000_000_00 -> rate * 1e18 -> 1 DAI = 45.45 cDAI
    // eg 4000000000000000000_000_000_00 -> rate * 1e18 -> 1 DAI = 25 cDAI
    cTokenRefRate = CERC20(_cToken).exchangeRateStored();
    /* cTokenRefRate = CERC20(_cToken).exchangeRateStored().div(10**18); */
    // 1000000000000000000 / (220000000000000000000000000 / 1e18) = 4545454545.454545 cDAI => / 1e8 => 45.45 cDAI
    // 1daiInWei / (cRate / 1e18) = cDaiInWei

    // Fulcrum
    // eg 1000000000000000000 -> 1 dai = 1 iDAI
    // then
    // eg 2000000000000000000 -> 1 dai = 0.5 iDAI
    // (1000000000000000000 / 2000000000000000000 ) * 10**18 = 500000000000000000 iDAI => / 1e18 => 0.5 iDAI
    // (1daiInWei / iPrice) * 1e18) = iDaiInWei

    // rate 1iDAI = 50 cDAI
    // (2000000000000000000_000_000_00 / 1e18) /

    iTokenRefRate = iERC20(_iToken).tokenPrice();
  }

  /**
   * @dev User should 'approve' _amount tokens before calling mintIndexToken
   */
  function mintIndexToken(uint256 _amount)
    public nonReentrant {
      require(_amount > 0, "Amount is not > 0");
      // get a handle for the underlying asset contract
      IERC20 underlying = IERC20(token);
      // transfer to this contract
      underlying.safeTransferFrom(msg.sender, address(this), _amount);
      // split amont
      uint256 half = _amount.div(2);
      uint256 otherHalf = half;
      // Check for rounding issue - TODO is correct, needed and worth it (gas) ?
      if (half.mul(2) < _amount && half.mul(2).add(1) == _amount) {
        otherHalf = otherHalf.add(1);
      }

      uint256 iTokens = _mintITokens(half);
      uint256 cTokens = _mintCTokens(otherHalf);

      uint256 cTokenCurrRate = otherHalf.div(cTokens);
      uint256 iTokenCurrRate = half.div(iTokens);

      // cTokenRefRate : 0.5inWei = cTokenCurrRate : x
      //  => x = (cTokenCurrRate maybe * 10**18 * 500000000000000000) / cTokenRefRate

      // iTokenRefRate : 0.5inWei = iTokenCurrRate : x
      // => x = (iTokenCurrRate * 500000000000000000) / iTokenRefRate

      // TODO set rates on constructor ??
      /* if (cTokenRefRate == 0 || iTokenRefRate == 0) {
        cTokenRefRate = otherHalf.div(cTokens);
        iTokenRefRate = half.div(iTokens);
      } */

      // Save number of underlying tokens invested
      investedBalances[msg.sender] = investedBalances[msg.sender].add(_amount);

      // TODO calculate number of diporDAIs
      uint256 diporDAIs = 10000 * 10 ** 18;

      // Create DiporDAI for the user
      _mint(msg.sender, msg.sender, diporDAIs, "", "");
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

    uint256 diporSupply = this.totalSupply();
    require(diporSupply > 0, 'No DIPORDAI5050 have been issued');

    uint256 iBalance = IERC20(iToken).balanceOf(address(this));
    uint256 cBalance = IERC20(cToken).balanceOf(address(this));
    uint256 iDAItoRedeem = _amount.mul(iBalance).div(diporSupply);
    uint256 cDAItoRedeem = _amount.mul(cBalance).div(diporSupply);

    this.burn(_amount, '');

    uint256 tokensFromITokens = _redeemITokens(iDAItoRedeem);
    uint256 tokensFromCTokens = _redeemCTokens(cDAItoRedeem);

    tokensRedeemed = tokensFromITokens.add(tokensFromCTokens);
    investedBalances[msg.sender] = investedBalances[msg.sender].sub(tokensRedeemed);
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
      uint256 exchangeRateMantissa = _cToken.exchangeRateStored(); // (exchange_rate * 1e18)
      // so cTokens = (underlying * 1e18) / exchangeRateMantissa
      cTokens = _amount.mul(10**18).div(exchangeRateMantissa);
  }
  function _mintITokens(uint256 _amount)
    internal
    returns (uint256 iTokens) {
      // get a handle for the corresponding iToken contract
      iERC20 _iToken = iERC20(iToken);
      // mint the iTokens
      iTokens = _iToken.mint(address(this), _amount);
  }

  function _redeemCTokens(uint256 _amount)
    internal
    returns (uint256 tokens) {
      CERC20 _cToken = CERC20(cToken);
      // redeem all user's underlying
      require(_cToken.redeem(_amount) == 0, "Something went wrong when redeeming in cTokens");
      // generic solidity formula is exchangeRateMantissa = (underlying / cTokens) * 1e18
      uint256 exchangeRateMantissa = _cToken.exchangeRateStored(); // exchange_rate * 1e18
      // so underlying = (exchangeRateMantissa * cTokens) / 1e18
      tokens = _amount.mul(exchangeRateMantissa).div(10**18);
      // TODO fee here ?
      IERC20(token).safeTransfer(msg.sender, tokens);
  }
  function _redeemITokens(uint256 _amount)
    internal
    returns (uint256 tokens) {
      iERC20 _iToken = iERC20(iToken);
      /* tokens = _iToken.burn(address(this), _amount); */
      // redeem all user's underlying and send them directly to the user
      tokens = _iToken.burn(msg.sender, _amount);
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
