pragma solidity ^0.5.2;

interface WhitePaperInterestModel {
  function getBorrowRate(uint256 cash, uint256 borrows, uint256 _reserves) external view returns (uint256, uint256);
}
