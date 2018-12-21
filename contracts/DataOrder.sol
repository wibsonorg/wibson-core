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
  OrderStatus public status;
  uint32 public closedAt;

  enum OrderStatus {
    Created,
    Closed
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
    status = OrderStatus.Created;
    createdAt = uint32(block.timestamp);
    closedAt = 0;
  }

  /**
   * @notice Closes the Data order.
   * @return true if the DataOrder was successfully closed, reverts otherwise.
   */
  function close() public onlyOwner returns (bool) {
    require(status != OrderStatus.Closed, "order already closed");
    status = OrderStatus.Closed;
    closedAt = uint32(block.timestamp);
    return true;
  }
}
