pragma solidity ^0.4.24;


contract DataOrder2 {
  address public buyer;
  string public audience;
  uint256 public price;
  string public requestedData;
  bytes32 public termsAndConditionsHash;
  string public buyerURLs;

  constructor(
    address buyer_,
    string audience_,
    uint256 price_,
    string requestedData_,
    bytes32 termsAndConditionsHash_,
    string buyerURLs_
  ) public {
    buyer = buyer_;
    audience = audience_;
    price = price_;
    requestedData = requestedData_;
    termsAndConditionsHash = termsAndConditionsHash_;
    buyerURLs = buyerURLs_;
  }
}
