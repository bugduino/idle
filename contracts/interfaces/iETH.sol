pragma solidity ^0.5.2;

interface iETH {
  function mintWithEther(
    address receiver)
    external
    payable
    returns (uint256 mintAmount);

  function burnToEther(
    address receiver,
    uint256 burnAmount)
    external
    returns (uint256 loanAmountPaid);

  function tokenPrice()
    external
    view
    returns (uint256 price);

  function supplyInterestRate()
    external
    view
    returns (uint256);

  function assetBalanceOf(
    address _owner)
    external
    view
    returns (uint256);

  function claimLoanToken()
    external
    returns (uint256 claimedAmount);
}
