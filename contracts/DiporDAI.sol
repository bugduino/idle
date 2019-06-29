pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/token/ERC777/ERC777.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract DiporDAI is ERC777 {
  using SafeMath for uint256;

  /* uint256 public fee; */
  address public cToken;
  address public iToken;
  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  constructor (address _cToken, address _iToken) public ERC777("DiporDAI", "DIPORDAI5050", new address[](0)) {
    /* _mint(msg.sender, msg.sender, 10000 * 10 ** 18, "", ""); */
    /* fee = 1; // 1% */
    cToken = _cToken;
    iToken = _iToken;
  }

}
