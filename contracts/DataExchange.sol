pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "./DataOrder.sol";
import "./BatPay.sol";


contract DataExchange {
  using SafeMath for uint256;

  IERC20 public token;
  BatPay public batPay;

  event NewDataOrder(address indexed dataOrder);
  event DataResponsesAdded(address indexed dataOrder, bytes32 keyHash, uint256 batchIndex);
  event DataResponsesNotarized(address indexed dataOrder, address indexed notary, string key, uint256 batchIndex);

  constructor(address token_, address batPay_) public {
    token = IERC20(token_);
    batPay = BatPay(batPay_);
  }

  function createDataOrder(
    string audience,
    uint256 price,
    string requestedData,
    bytes32 termsAndConditionsHash,
    string buyerURLs
  ) public returns (address) {

    address dataOrder = new DataOrder(
      msg.sender,
      audience,
      price,
      requestedData,
      termsAndConditionsHash,
      buyerURLs
    );

    emit NewDataOrder(dataOrder);
    return dataOrder;
  }

  function addDataResponses(
    address dataOrder_,
    address notary,
    bytes32 keyHash,
    uint256 notarizationFee,
    bytes notarySignature
  ) public returns (uint256) {
    DataOrder dataOrder = DataOrder(dataOrder_);
    require(msg.sender == dataOrder.buyer());

    require(
      validNotarySignature(
        notarySignature,
        notary,
        dataOrder_,
        keyHash,
        notarizationFee
      )
    );

    uint256 batchIndex = dataOrder.addDataResponses(notary, keyHash);

    emit DataResponsesAdded(dataOrder, keyHash, batchIndex);

    return batchIndex;
  }

  function addDataResponsesWithBatPay(
    address dataOrder_,
    address notary,
    bytes32 keyHash,
    uint256 notarizationFee,
    bytes notarySignature,
    bytes payData,
    uint fromId,
    uint amount,
    /* uint newCount, */
    bytes32 roothash,
    uint256 lock
  ) public returns (uint256) {
    DataOrder dataOrder = DataOrder(dataOrder_);
    require(msg.sender == dataOrder.buyer());

    require(
      validNotarySignature(
        notarySignature,
        notary,
        dataOrder_,
        keyHash,
        notarizationFee
      )
    );
    uint256 batchIndex = dataOrder.addDataResponses(notary, keyHash);
    emit DataResponsesAdded(dataOrder, keyHash, batchIndex);
    batPay.transfer(fromId, amount, payData, 0, roothash, lock);
    return batchIndex;
  }

  function notarizeDataResponses(
    address dataOrder_,
    uint256 batchIndex,
    string key
  ) public returns (bool) {
    DataOrder dataOrder = DataOrder(dataOrder_);
    (address notary, bytes32 keyHash) = dataOrder.getBatch(batchIndex);
    require(keyHash == keccak256(abi.encodePacked(key)));

    emit DataResponsesNotarized(
      dataOrder_,
      notary,
      key,
      batchIndex
    );

    return true;
  }

  function validNotarySignature(
    bytes signature,
    address notary,
    address dataOrder,
    bytes32 keyHash,
    uint256 notarizationFee
  ) private pure returns (bool) {
    bytes32 hash = ECDSA.toEthSignedMessageHash(
      keccak256(abi.encodePacked(dataOrder, keyHash, notarizationFee))
    );
    address signer = ECDSA.recover(hash, signature);

    return signer == notary;
  }
}
