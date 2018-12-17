pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";


contract DataOrder is Ownable {
  address public buyer;
  string public audience;
  uint256 public price;
  string public requestedData;
  bytes32 public termsAndConditionsHash;
  string public buyerURLs;
  uint32 public createdAt;
  OrderStatus public orderStatus;
  uint32 public transactionCompletedAt;

  enum OrderStatus {
    OrderCreated,
    TransactionCompleted
  }

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
    orderStatus = OrderStatus.OrderCreated;
    createdAt = uint32(block.timestamp);
    transactionCompletedAt = 0;
  }

  /**
   * @notice Closes the Data order.
   * @dev Once the DataOrder is closed it will no longer accept new DataResponses.
   * @return true if the DataOrder was successfully closed, reverts otherwise.
   */
  function close() public onlyOwner returns (bool) {
    require(orderStatus != OrderStatus.TransactionCompleted);
    require(transactionCompletedAt == 0);
    orderStatus = OrderStatus.TransactionCompleted;
    transactionCompletedAt = uint32(block.timestamp);
    return true;
  }
}
