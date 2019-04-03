pragma solidity ^0.4.24;


contract DataExchange {
  event NotaryRegistered(address indexed notary);
  event NotaryUpdated(address indexed notary, string oldNotaryUrl, string newNotaryUrl);
  event NotaryUnregistered(address indexed notary);
  event DataOrderCreated(uint256 indexed orderId, address indexed buyer);
  event DataOrderClosed(uint256 indexed orderId, address indexed buyer);

  struct DataOrder {
    address buyer;
    string audience;
    uint256 price;
    string requestedData;
    bytes32 termsAndConditionsHash;
    string buyerUrl;
    uint32 createdAt;
    uint32 closedAt;
  }

  DataOrder[] public dataOrders;
  mapping(address => string) public notaryUrls;

  /**
   * @notice Registers sender as a notary or updates an already existing one.
   * @param newNotaryUrl Public URL of the notary where the notary info can be obtained.
   * @return true if the notary was successfully registered or updated, reverts otherwise.
   */
  function registerNotary(
    string newNotaryUrl
  ) public returns (bool) {
    require(isNotEmpty(newNotaryUrl), "newNotaryUrl must not be empty");
    bool isUpdate = isSenderNotary();

    string memory oldNotaryUrl = notaryUrls[msg.sender];
    notaryUrls[msg.sender] = newNotaryUrl;

    if (isUpdate) {
      emit NotaryUpdated(msg.sender, oldNotaryUrl, newNotaryUrl);
    } else {
      emit NotaryRegistered(msg.sender);
    }
    return true;
  }

  /**
   * @notice Unregisters sender as notary.
   * @return true if the notary was successfully unregistered, reverts otherwise.
   */
  function unregisterNotary(
  ) public returns (bool) {
    require(isSenderNotary(), "sender must be registered");
    notaryUrls[msg.sender] = "";
    emit NotaryUnregistered(msg.sender);
    return true;
  }

  /**
   * @notice Creates a DataOrder.
   * @dev The `msg.sender` will become the buyer of the order.
   * @param audience Target audience of the order.
   * @param price Price that sellers will receive in exchange of their data.
   * @param requestedData Requested data type (Geolocation, Facebook, etc).
   * @param termsAndConditionsHash Hash of the Buyer's terms and conditions for the order.
   * @param buyerUrl Public URL of the buyer where more information about the DataOrder
   *                 can be obtained.
   * @return The index of the newly created DataOrder. If the DataOrder could
   *         not be created, reverts.
   */
  function createDataOrder(
    string audience,
    uint256 price,
    string requestedData,
    bytes32 termsAndConditionsHash,
    string buyerUrl
  ) public returns (uint256 orderId) {
    require(isNotEmpty(buyerUrl), "buyerUrl must not be empty");

    orderId = dataOrders.length;
    dataOrders.length += 1;
    dataOrders[orderId] = DataOrder(
      msg.sender,
      audience,
      price,
      requestedData,
      termsAndConditionsHash,
      buyerUrl,
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

  function isSenderNotary() private view returns (bool) {
    return isNotEmpty(notaryUrls[msg.sender]);
  }

  function isNotEmpty(string s) private pure returns (bool) {
    return bytes(s).length > 0;
  }

}
