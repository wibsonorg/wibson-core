pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract DataOrder is Ownable{
  using SafeMath for uint256;

  address public buyer;
  string public audience;
  uint256 public price;
  string public requestedData;
  bytes32 public termsAndConditionsHash;
  string public buyerURLs;

  struct Batch {
    address notary;
    bytes32 keyHash;
  }

  Batch[] public batches;

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

  function addDataResponses(
    address notary,
    bytes32 keyHash
  ) public onlyOwner returns (uint256) {

    batches.push(Batch(notary, keyHash));

    return batches.length.sub(1);
  }

  function getBatch(
    uint256 index
  ) public view returns (address, bytes32) {
    Batch memory batch = batches[index];
    return (batch.notary, batch.keyHash);
  }
}
