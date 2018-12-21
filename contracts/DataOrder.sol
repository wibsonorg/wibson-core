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

  /**
   * @notice Contract's constructor.
   * @param buyer_ Buyer address
   * @param audience_ Target audience of the order.
   * @param price_ Price that sellers will receive in exchange of their data.
   * @param requestedData_ Requested data type (Geolocation, Facebook, etc).
   * @param termsAndConditionsHash_ Hash of the Buyer's terms and conditions for the order.
   * @param buyerURLs_ Public URLs of the buyer, containing:
   *                  `dataOrderUrl`: DataOrder information (title, terms, etc.)
   *                  `dataResponsesUrl`: Url where to send DataResponses
   */
  constructor(
    address buyer_,
    string audience_,
    uint256 price_,
    string requestedData_,
    bytes32 termsAndConditionsHash_,
    string buyerURLs_
  ) public {
    require(bytes(buyerURLs_).length > 0, "buyerURLs must not be empty");

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
