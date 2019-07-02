pragma solidity ^0.5.2;

// interfaces
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../interfaces/CERC20.sol";

contract cDAIMock is ERC20Detailed, ERC20, CERC20 {
  address public dai;
  uint256 public exchangeRate;
  uint256 public toTransfer;

  constructor(address _dai)
    ERC20()
    ERC20Detailed('cDAI', 'cDAI', 8) public {
    dai = _dai;
    exchangeRate = 200000000000000000000000000;
    toTransfer = 10**18;
    _mint(address(this), 10**14); // 1.000.000 cETH
  }
  function() payable external {}

  function mint(uint256 amount) external returns (uint256) {
    require(IERC20(dai).transferFrom(msg.sender, address(this), amount), "Error during transferFrom"); // 1 DAI
    require(this.transfer(msg.sender, 5000000000), "Error during transfer"); // 50 cETH
    return 0;
  }
  function redeem(uint256) external returns (uint256) {
    // here I should transfer 1 DAI back

    // the real cETH contract does not need to transferFrom
    // it just changes the balance but I'm unable to reproduce it
    /* _balances[msg.sender] = _balances[msg.sender].sub(amount); */
    /* _burnFrom(msg.sender, amount); */

    require(IERC20(dai).transfer(msg.sender, toTransfer), "Error during transfer"); // 1 DAI
    return 0;
  }

  function exchangeRateStored() external view returns (uint256) {
    return exchangeRate;
  }

  function setExchangeRateStoredForTest() external {
    exchangeRate = 220000000000000000000000000;
    toTransfer = 1.1 * 10**18;
  }
  function setExchangeRateStoredForTestNoFee() external {
    exchangeRate = 220000000000000000000000000;
    toTransfer = 1.078 * 10**18;
  }
}
