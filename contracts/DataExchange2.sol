pragma solidity ^0.4.25;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract DataExchange2 {
  using SafeMath for uint256;

  struct Batch {
    address dataOrder;
    address notary;
    bytes32 keyHash;
  }

  IERC20 public token;
  Batch[] public batches;

  event NewDataOrder(address indexed dataOrder);
  event DataResponsesAdded(address indexed dataOrder, bytes32 keyHash, uint256 batchIndex);
  event DataResponsesNotarized(address indexed dataOrder, address indexed notary, string key, uint256 batchIndex);

  constructor(address token_) public {
    token = IERC20(token_);
  }

  function createDataOrder(
    string audience,
    uint256 price,
    string requestedData,
    bytes32 termsAndConditionsHash,
    string buyerURLs
  ) public returns (address) {

    address dataOrder = new DataOrder2(
      msg.sender,
      audience,
      requestedData,
      price,
      termsAndConditionsHash,
      buyerURLs
    );

    emit NewDataOrder(dataOrder);
    return dataOrder;
  }
//Sends sellerId list and notary. Send locked payment that needs the master key to be unlocked

  function addDataResponses(
    address dataOrder_,
    address notary,
    bytes32 keyHash,
    bytes notarySignature
  ) public returns (uint256) {
    DataOrder2 dataOrder = DataOrder2(dataOrder_);
    require(msg.sender == dataOrder.buyer());

    // TODO: Verify notarySignature

    batches.push(
      Batch(dataOrder_, notary, keyHash)
    );

    uint256 batchIndex = batches.length.sub(1);

    emit DataResponsesAdded(dataOrder, keyHash, batchIndex);

    return batchIndex;
  }

  function notarizeDataResponses(
    uint256 batchIndex,
    string key
  ) public returns (bool) {
    Batch currentBatch = batches[batchIndex];
    require(msg.sender == currentBatch.notary);
    require(currentBatch.keyHash = keccak256(abi.encodePacked(key)));

    emit DataResponsesNotarized(
      currentBatch.dataOrder,
      currentBatch.notary,
      key,
      batchIndex
    );

    return true;
  }
}
