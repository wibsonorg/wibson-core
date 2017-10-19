pragma solidity ^0.4.11;

contract DataExchange {

  struct OrderValue {
    uint index;
    address orderAddr;
    uint createadAt;
  }

  struct OrderKey {
    address seller;
    address buyer;
  }

  // Events
  event NewOrder(
    address seller,
    address buyer,
    address notary,
    uint256 price,
    string filters,
    string terms,
    string encryptedData,
    string signature
  );

  event DataAdded(
    address seller,
    address buyer,
    string decryptionKey,
    string signature
  );

  event TransactionCompleted(
    address seller,
    address buyer,
    address notary,
    bytes32 status
  );


  // NOTE: in both mappings first key is the buyer, second one is the seller.
  // Mapping of contracts shares of the buyer-seller contract.
  mapping(address => mapping(address => address)) public orders;

  mapping(address => mapping(address => OrderValue)) internal orderValues;
  mapping(uint => OrderKey) internal orderKeys;
  address[] openOrders;
  uint orderSize;

  address public contractOwner;

  function DataExchange() public {
    contractOwner = msg.sender;
    orderSize = 0;
  }

  function newOrder(
    address seller,
    address notary,
    uint256 price,
    string filters,
    string terms,
    string data,
    string signature
  ) public returns (address) {
    address newOrder = new DataOrder(
      seller,
      msg.sender,
      notary,
      price,
      filters,
      terms,
      data,
      signature
    );

    orders[msg.sender][seller] = newOrder;
    openOrders[orderSize] = newOrder;
    orderValues[msg.sender][seller] = OrderValue(orderSize, newOrder, now);
    orderKeys[orderSize] = OrderKey(seller, msg.sender);
    orderSize += 1;

    NewOrder(seller, msg.sender, notary, price, filters, terms, data, signature);
    returns newTx;
  }

  function addDataResponseToOrder(address seller, address buyer, string data, string signature) public return (bool) {
    require(orders[buyer][seller] != 0x0);
    var order = DataOrder(orders[buyer][seller]);
    var okay = order.addDataResponse(data);
    if (okay) {
      DataAdded(seller, buyer, data, signature);
    }
    return okay;
  }

  function closeOrder(address seller, address buyer) public return (bool) {
    require(orders[buyer][seller] != 0x0);
    var order = DataOrder(orders[buyer][seller]);

    var okay = order.close();
    if (okay) {
      removeAndSwapAt(buyer, seller);
      TransactionCompleted(seller, buyer, order.notary, order.getStatusAsString());
    }
    return okay;
  }

  function getOrderAddressFor(address seller, address buyer) public return (address) {
    return orders[buyer][seller];
  }

  function removeAndSwapAt(address seller, address buyer) internal return (bool) {
    var deleteValue = orderValues[buyer][seller];
    uint deleteIndex = deleteValue.index;
    delete orderValues[buyer][seller];
    delete openOrders[openOrders.length-1];

    var orderKey = orderKeys(openOrders.length-1);
    var orderValue = orderValues[orderKey.buyer][orderKey.seller];

    orderKeys[deleteIndex] = orderKeys[openOrders.length-1];
    delete orderKeys[openOrders.length-1];
    openOrders[deleteIndex] = openValues.orderAddr;
    orderValues[orderKey.buyer][orderKey.seller].index = deleteIndex;
    orderSize -= 1;
    return true;
  }

  function kill() public {
    if (msg.sender == contractOwner) {
      selfdestruct(contractOwner);
    }
  }
}


contract DataOrder {
  // Persons involved
  address public seller;
  address public buyer;
  address public notary;

  // Information exchanges
  string public data;
  string public decryptionKey;

  // Marketplace conditions
  string public filters;
  string public terms;
  uint256 public price; // In GDT token.

  string public signatures;
  string public dataSignature;
  Status public status;

  // Timestamps
  uint public createadAt;
  uint public dataAddedAt;
  uint public notaryAcceptedAt;
  uint public transactionCompletedAt;

  address public contractOwner;

  enum Status {
    OrderCreated,
    NotaryAccepted,
    DataAdded,
    RefundedToBuyer,
    TransactionCompleted,
    TransactionCompletedByNotary
  }

  function DataOrder(
    address seller,
    address buyer,
    address notary,
    uint256 price,
    string filters,
    string terms,
    string data,
    string signature
  ) public {
    // Seller, Buyer and Notary must be set.
    require(seller != 0x0);
    require(buyer != 0x0);
    require(notary != 0x0);
    // Price must be non-zero.
    require(price > uint256(0));
    // Invariant: the seller could not be the notary nor the buyer could be
    //            the notary nor the seller should be the buyer.
    require(seller != notary);
    require(buyer != notary);
    require(buyer != seller);
    require(msg.sender != notary);
    require(msg.sender != seller);
    require(msg.sender != buyer);

    self.seller = seller;
    self.buyer = buyer;
    self.notary = notary;
    self.price = price;
    self.filters = filters;
    self.terms = terms;
    self.data = data;
    self.signature = signature;
    status = Status.OrderCreated;

    createadAt = now;
    contractOwner = msg.sender;
  }

  function acceptToBeNotary() public return (bool) {
    require (msg.sender == contractOwner || msg.sender == notary);
    status = Status.OrderCreated;
    notaryAcceptedAt = now;
    return true;
  }

  function addDataResponse(string data, string signature) public return (bool) {
    require (msg.sender == contractOwner || msg.sender == seller);
    require (status == Status.OrderCreated);

    this.data = data;
    status = Status.DataAdded;
    dataSignature = signature;
    dataAddedAt = now;
    return true;
  }

  function close() public return (bool) {
    require (msg.sender == contractOwner || msg.sender == buyer);
    require (status == Status.DataAdded);

    transactionCompletedAt = now;
    return true;
  }

  function getStatusAsString() public returns (bytes32) {
    if (status == status.OrderCreated) {
      return bytes32("OrderCreated");
    }

    if (status == status.NotaryAccepted) {
      return bytes32("NotaryAccepted");
    }

    if (status == status.DataAdded) {
      return bytes32("DataAdded");
    }

    if (status == status.RefundedToBuyer) {
      return bytes32("RefundedToBuyer");
    }

    if (status == status.TransactionCompleted) {
      return bytes32("TransactionCompleted");
    }

    if (status == status.TransactionCompletedByNotary) {
      return bytes32("TransactionCompletedByNotary");
    }
  }

  function kill() public {
    if (msg.sender == contractOwner) {
      selfdestruct(contractOwner);
    }
  }
}