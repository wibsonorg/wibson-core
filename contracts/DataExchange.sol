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
  event DataResponsesNotarized(address indexed dataOrder, address indexed notary, bytes32 key, uint256 batchIndex);
  event OrderClosed(address indexed orderAddr);

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

  function closeOrder(
    address orderAddr
  ) public returns (bool) {
    DataOrder order = DataOrder(orderAddr);
    address buyer = order.buyer();
    require(msg.sender == buyer);

    bool okay = order.close();
    if (okay) {
      emit OrderClosed(orderAddr);
    }

    return okay;
  }


}
