pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";


contract DataExchange {
  using SafeMath for uint256;

  event DataOrderCreated(uint256 indexed orderId, address indexed owner);
  event DataOrderClosed(uint256 indexed orderId, address indexed owner);

  IERC20 public token;

  struct DataOrder {
    address buyer;
    string audience;
    uint256 price;
    string requestedData;
    bytes32 termsAndConditionsHash;
    string buyerURLs;
    uint32 createdAt;
    uint32 closedAt;
  }

  DataOrder[] public dataOrders;

  constructor(address token_) public {
    token = IERC20(token_);
  }

  /**
   * @notice Creates a DataOrder.
   * @dev The `msg.sender` will become the buyer of the order.
   * @param audience Target audience of the order.
   * @param price Price that sellers will receive in exchange of their data.
   * @param requestedData Requested data type (Geolocation, Facebook, etc).
   * @param termsAndConditionsHash Hash of the Buyer's terms and conditions for the order.
   * @param buyerURLs Public URLs of the buyer, containing:
   *                  `dataOrderUrl`: DataOrder information (title, terms, etc.)
   *                  `dataResponsesUrl`: Url where to send DataResponses
   * @return The index of the newly created DataOrder. If the DataOrder could
   *         not be created, reverts.
   */
  function createDataOrder(
    string audience,
    uint256 price,
    string requestedData,
    bytes32 termsAndConditionsHash,
    string buyerURLs
  ) public returns (uint256 orderId) {
    require(bytes(buyerURLs).length > 0, "buyerURLs must not be empty");

    orderId = dataOrders.length;
    dataOrders.length += 1;
    dataOrders[orderId] = DataOrder(
      msg.sender,
      audience,
      price,
      requestedData,
      termsAndConditionsHash,
      buyerURLs,
      uint32(now),
      uint32(0)
    );

    emit DataOrderCreated(orderId, msg.sender);
    return orderId;
  }

  /**
   * @notice Closes the DataOrder.
   * @dev The `msg.sender` must be the buyer of the order.
   * @param orderId Index of the order to close.
   * @return true if the DataOrder was successfully closed, reverts otherwise.
   */
  function closeDataOrder(
    uint256 orderId
  ) public returns (bool) {
    require(orderId < dataOrders.length, "invalid order index");
    DataOrder memory dataOrder = dataOrders[orderId];
    require(dataOrder.buyer == msg.sender, "sender can't close the order");
    require(dataOrder.closedAt == 0, "order already closed");
    dataOrders[orderId].closedAt = uint32(now);

    emit DataOrderClosed(orderId, msg.sender);
    return true;
  }
}
