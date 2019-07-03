pragma solidity ^0.5.2;

// interfaces
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../interfaces/iERC20.sol";

contract iDAIMock is ERC20Detailed, ERC20, iERC20 {
  address public dai;
  uint256 public exchangeRate;
  uint256 public toTransfer;
  uint256 public supplyRate;
  uint256 public price;

  constructor(address _dai)
    ERC20()
    ERC20Detailed('iDAI', 'iDAI', 8) public {
    dai = _dai;
    toTransfer = 10**18;
    supplyRate = 10**18;
    price = 10**18;
    _mint(address(this), 10**14); // 1.000.000 cETH
  }
  function() payable external {}

  function mint(address receiver, uint256 amount) external returns (uint256) {
    require(IERC20(dai).transferFrom(msg.sender, address(this), amount), "Error during transferFrom"); // 1 DAI
    require(this.transfer(receiver, amount), "Error during transfer"); // 50 cETH
    return 0;
  }
  function burn(address, uint256) external returns (uint256) {
    // here I should transfer 1 DAI back

    // the real cETH contract does not need to transferFrom
    // it just changes the balance but I'm unable to reproduce it
    /* _balances[msg.sender] = _balances[msg.sender].sub(amount); */
    /* _burnFrom(msg.sender, amount); */

    /* require(IERC20(dai).transfer(receiver, toTransfer), "Error during transfer"); // 1 DAI */
    return 0;
  }

  function claimLoanToken() external returns (uint256)  {
    return 0;
  }
  function tokenPrice() external view returns (uint256)  {
    return price;
  }
  function supplyInterestRate() external view returns (uint256)  {
    return supplyRate;
  }
  function setExchangeRateStoredForTest() external {
    toTransfer = 1.1 * 10**18;
  }
  function setExchangeRateStoredForTestNoFee() external {
    toTransfer = 1.078 * 10**18;
  }
}
