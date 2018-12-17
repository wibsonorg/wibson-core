pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "./DataOrder.sol";


contract DataExchange {
  using SafeMath for uint256;

  IERC20 public token;

  event DataOrderCreated(address indexed orderAddr);
  event DataOrderClosed(address indexed orderAddr);

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

    address dataOrder = new DataOrder(
      msg.sender,
      audience,
      price,
      requestedData,
      termsAndConditionsHash,
      buyerURLs
    );

    emit DataOrderCreated(dataOrder);
    return dataOrder;
  }

  function closeDataOrder(
    address orderAddr
  ) public returns (bool) {
    DataOrder order = DataOrder(orderAddr);
    address buyer = order.buyer();
    require(msg.sender == buyer);

    bool okay = order.close();
    if (okay) {
      emit DataOrderClosed(orderAddr);
    }

    return okay;
  }
}
