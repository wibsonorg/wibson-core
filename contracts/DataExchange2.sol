pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./DataOrder2.sol";

contract DataExchange2 {
  using SafeMath for uint256;

  IERC20 public token;
  bytes32[] public keyHashes;

  event NewDataOrder(address indexed dataOrder);
  event DataResponsesAdded(address indexed dataOrder, bytes32 keyHash, uint256 keyHashIndex);

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
    bytes32 keyHash
  ) public returns (uint256) {
    DataOrder2 dataOrder = DataOrder2(dataOrder_);
    require(msg.sender == dataOrder.buyer());

    keyHashes.push(keyHash);

    uint256 keyHashIndex = keyHashes.length.sub(1);

    emit DataResponsesAdded(dataOrder, keyHash, keyHashIndex);

    return keyHashIndex;
  }

  function notarizeDataResponses(
    uint256 keyHashIndex,
    bytes32[] keys
  ) public returns (bool) {
    bytes32 currentKeyHash = keyHashes[keyHashIndex];

    bytes32[] keyHashes;
    for (uint256 i = 0; i < keys.length; i++) {
      keyHashes.push(keccak256(abi.encodePacked(keys[i])));
    }

    bytes32 newKeyHash = keccak256(abi.encodePacked(keyHashes));

    require(newKeyHash == currentKeyHash);

    return true;
  }
}
