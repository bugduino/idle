pragma solidity ^0.5.2;

interface CETH {
  function mint() payable external;
  function exchangeRateStored() external returns (uint256);
}
