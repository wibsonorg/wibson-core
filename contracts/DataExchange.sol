pragma solidity ^0.4.11;

contract DataExchange {

  struct OrderValue {
    uint index;
    address orderAddr;
    uint createadAt;
  }

  struct OrderKey {
    address buyer;
    address seller;
  }

  // Events
  event NewOrder(
    address orderAddr,
    address buyer,
    address seller,
    address notary,
    uint256 price,
    string filters,
    string terms,
    string encryptedData,
    string signature
  );

  event DataAdded(
    address orderAddr,
    address buyer,
    address seller,
    string decryptionKey,
    string signature
  );

  event NotaryAccepted(
    address orderAddr,
    address buyer,
    address seller,
    address notary
  );

  event TransactionCompleted(
    address orderAddr,
    address buyer,
    address seller,
    address notary,
    bytes32 status
  );


  // NOTE: in both mappings first key is the buyer, second one is the seller.
  // Mapping of contracts shares of the buyer-seller contract.
  mapping(address => mapping(address => address)) public orders;

  mapping(address => mapping(address => OrderValue)) internal orderValues;
  mapping(uint => OrderKey) internal orderKeys;
  address[] public openOrders;
  uint public orderSize;

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
    address newOrderAddr = new DataOrder(
      msg.sender,
      seller,
      notary,
      price,
      filters,
      terms,
      data,
      signature
    );

    orders[msg.sender][seller] = newOrderAddr;
    openOrders.push(newOrderAddr);
    orderValues[msg.sender][seller] = OrderValue(orderSize, newOrderAddr, now);
    orderKeys[orderSize] = OrderKey(msg.sender, seller);
    orderSize++;

    NewOrder(newOrderAddr, msg.sender, seller, notary, price, filters, terms, data, signature);
    return newOrderAddr;
  }

  function addDataResponseToOrder(
    address buyer,
    string data,
    string signature
  ) public returns (bool) {
    require(orders[buyer][msg.sender] != 0x0);
    var order = DataOrder(orders[buyer][msg.sender]);
    require (order.seller() == msg.sender);

    var okay = order.addDataResponse(data, signature);
    if (okay) {
      DataAdded(order, buyer, msg.sender, data, signature);
    }
    return okay;
  }

  function closeOrder(address buyer, address seller) public returns (bool) {
    require(orders[buyer][seller] != 0x0);
    var order = DataOrder(orders[buyer][seller]);
    require (order.notary() == msg.sender || order.buyer() == msg.sender);

    var okay = order.close();
    if (okay) {
      removeAndSwapAt(buyer, seller);
      TransactionCompleted(order, buyer, seller, order.notary(), order.getStatusAsString());
    }
    return okay;
  }

  function acceptToBeNotary(address buyer, address seller) public returns (bool) {
    require(orders[buyer][seller] != 0x0);
    var order = DataOrder(orders[buyer][seller]);
    require (order.notary() == msg.sender);

    var okay = order.acceptToBeNotary();
    if (okay) {
      removeAndSwapAt(buyer, seller);
      NotaryAccepted(order, buyer, seller, msg.sender);
    }
    return okay;
  }

  function getOrderAddressFor(address buyer, address seller) public returns (address) {
    return orders[buyer][seller];
  }

  function getOpenOrders() public returns (address[]) {
    return openOrders;
  }

  function removeAndSwapAt(address buyer, address seller) internal returns (bool) {
    var deleteValue = orderValues[buyer][seller];
    uint deleteIndex = deleteValue.index;
    delete orderValues[buyer][seller];
    delete openOrders[openOrders.length-1];

    var orderKey = orderKeys[openOrders.length-1];
    var orderValue = orderValues[orderKey.buyer][orderKey.seller];

    orderKeys[deleteIndex] = orderKeys[openOrders.length-1];
    delete orderKeys[openOrders.length-1];
    openOrders[deleteIndex] = orderValue.orderAddr;
    orderValues[orderKey.buyer][orderKey.seller].index = deleteIndex;
    orderSize--;
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

  string public signature;
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
    address _buyer,
    address _seller,
    address _notary,
    uint256 _price,
    string _filters,
    string _terms,
    string _data,
    string _signature
  ) public {
    // Seller, Buyer and Notary must be set.
    require(_seller != 0x0);
    require(_buyer != 0x0);
    require(_notary != 0x0);
    // Price must be non-zero.
    require(_price > uint256(0));
    // Invariant: the seller could not be the notary nor the buyer could be
    //            the notary nor the seller should be the buyer.
    require(_seller != _notary);
    require(_buyer != _notary);
    require(_buyer != _seller);
    require(msg.sender != _notary);
    require(msg.sender != _seller);
    require(msg.sender != _buyer);

    seller = _seller;
    buyer = _buyer;
    notary = _notary;
    price = _price;
    filters = _filters;
    terms = _terms;
    data = _data;
    signature = _signature;
    status = Status.OrderCreated;

    createadAt = now;
    contractOwner = msg.sender;
  }

  function acceptToBeNotary() public returns (bool) {
    require (msg.sender == contractOwner);
    status = Status.OrderCreated;
    notaryAcceptedAt = now;
    return true;
  }

  function addDataResponse(string _data, string _signature) public returns (bool) {
    require (msg.sender == contractOwner);
    require (status == Status.OrderCreated);

    data = _data;
    status = Status.DataAdded;
    dataSignature = _signature;
    dataAddedAt = now;
    return true;
  }

  function close() public returns (bool) {
    require (msg.sender == contractOwner);
    require (status == Status.DataAdded);

    transactionCompletedAt = now;
    return true;
  }

  function getStatusAsString() public returns (bytes32) {
    if (status == Status.OrderCreated) {
      return bytes32("OrderCreated");
    }

    if (status == Status.NotaryAccepted) {
      return bytes32("NotaryAccepted");
    }

    if (status == Status.DataAdded) {
      return bytes32("DataAdded");
    }

    if (status == Status.RefundedToBuyer) {
      return bytes32("RefundedToBuyer");
    }

    if (status == Status.TransactionCompleted) {
      return bytes32("TransactionCompleted");
    }

    if (status == Status.TransactionCompletedByNotary) {
      return bytes32("TransactionCompletedByNotary");
    }
  }

  function kill() public {
    if (msg.sender == contractOwner) {
      selfdestruct(contractOwner);
    }
  }
}