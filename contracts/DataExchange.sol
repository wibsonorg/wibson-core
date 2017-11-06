pragma solidity ^0.4.11;


// ---( Libraries )-------------------------------------------------------------




/*

// 1. Buyer call.
function placeOrder(address[] _notaries, uint256 mba, string filters, string terms, string buyerURL) return (orderAddr)

// 2. Notary Call.
function acceptToBeNotary(address orderAddr) return (bool)

// 3. Buyer call.
function addDataResponseToOrder(address orderAddr, address seller, address notary, uint256 price, string hash, string signature) return (bool)

// 4. Seller call.
function hasDataResponseBeenAccepted(address orderAddr) return (bool)

// 5. Seller, Buyer or approved Notary call.
function closeOrder(address orderAddr, address seller) return (bool)

*/

// ---( DataExchange )----------------------------------------------------------
contract DataExchange {

  // Events
  event NewOrder(
    address orderAddr,
    address buyer,
    address[] notaries,
    string filters,
    string dataRequest,
    string terms,
    string buyerURL,
    uint minimimBudgetForAudit,
    bool certificationFlag,
    uint serviceFee
    //uint timestamps
  );

  event NotaryAccepted(
    address orderAddr,
    address buyer,
    address notary
  );

  event DataAdded(
    address orderAddr,
    address buyer,
    address seller,
    address notary,
    uint256 price,
    string hash,
    string signature,
    uint timestamps
  );

  event TransactionCompleted(
    address orderAddr,
    address buyer,
    address seller,
    address notary,
    bytes32 status,
    uint timestamps
  );


  // NOTE: in both mappings first key is the buyer, second one is the seller.
  // Mapping of contracts shares of the buyer-seller contract.
  mapping(address => mapping(address => address)) public orderResponses;

  // Order tracking.

  struct OrderValue {
    uint index;
    address orderAddr;
    uint createadAt;
  }

  struct OrderKey {
    address buyer;
    address orderAddr;
  }

  mapping(address => OrderValue[]) internal orderValues;
  mapping(uint => OrderKey) internal orderKeys;
  address[] public openOrders;
  uint public orderSize;

  address public contractOwner;

  function DataExchange() public {
    contractOwner = msg.sender;
    orderSize = 0;
  }

  // Step 1.
  function newOrder(
    address[] notaries,
    string filters,
    string dataRequest,
    string terms,
    string buyerURL,
    uint minimimBudgetForAudit,
    bool certificationFlag,
    uint serviceFee
  ) public returns (address) {
    require(notaries.length > 0);
    require(minimimBudgetForAudit > uint256(0));
    // require(serviceFee > uint256(0));

    address newOrderAddr = new DataOrder(
      msg.sender,
      notaries,
      filters,
      dataRequest,
      terms,
      buyerURL,
      minimimBudgetForAudit,
      certificationFlag,
      serviceFee
    );

    openOrders.push(newOrderAddr);
    orderValues[msg.sender].push(OrderValue(orderSize, newOrderAddr, now));
    orderKeys[orderSize] = OrderKey(msg.sender, newOrderAddr);
    orderSize++;

    NewOrder(
      newOrderAddr,
      msg.sender,
      notaries,
      filters,
      dataRequest,
      terms,
      buyerURL,
      minimimBudgetForAudit,
      certificationFlag,
      serviceFee
    );

    return newOrderAddr;
  }

  // Step 2.
  function acceptToBeNotary(address orderAddr) public constant returns (bool) {
    require(orderAddr != 0x0);
    var order = DataOrder(orderAddr);

    var okay = order.acceptToBeNotary(msg.sender);
    if (okay) {
      NotaryAccepted(order, order.buyer(), msg.sender);
    }
    return okay;
  }

  // Step 3.
  function addDataResponseToOrder(
    address orderAddr,
    address seller,
    address notary,
    uint256 price,
    string hash,
    string signature
  ) public returns (bool) {
    require(orderResponses[msg.sender][seller] == 0x0);

    orderResponses[msg.sender][seller] = orderAddr;
    var order = DataOrder(orderAddr);

    require(order.hasNotaryAccepted(notary) == true);

    var okay = order.addDataResponse(seller, notary, price, hash, signature);
    if (okay) {
      DataAdded(order, order.buyer(), msg.sender, notary, price, hash, signature, now);
    }
    return okay;
  }

  // Step 4.
  /*
  function hasDataResponseBeenAccepted(address orderAddr) public constant returns (bool) {

    return true;
  }
  */

  // Step 5.
  function closeOrder(address buyer, address seller) public returns (bool) {
    require(orderResponses[buyer][seller] != 0x0);
    var order = DataOrder(orderResponses[buyer][seller]);
    require (order.hasNotaryAccepted(msg.sender) || order.buyer() == msg.sender);

    var okay = order.close();
    if (okay) {
      // removeAndSwapAt(buyer, seller);
      TransactionCompleted(order, buyer, seller, msg.sender, order.getStatusAsString(), now);
    }
    return okay;
  }

  function getOrderAddressFor(address buyer, address seller) public constant returns (address) {
    return orderResponses[buyer][seller];
  }

  function getOpenOrders() public constant returns (address[]) {
    return openOrders;
  }

  /*
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
  */

  function kill() public {
    if (msg.sender == contractOwner) {
      selfdestruct(contractOwner);
    }
  }
}



// ---( DataOrder )-------------------------------------------------------------

contract DataOrder {
  // Persons involved
  address public buyer;

  string filters;
  string dataRequest;
  string terms;
  string buyerURL;
  uint minimimBudgetForAudit;
  bool certificationFlag;
  uint serviceFee;

  // Timestamps
  uint public createdAt;
  uint public dataAddedAt;
  uint public transactionCompletedAt;

  OrderStatus public orderStatus;

  address public contractOwner;

  enum OrderStatus {
    OrderCreated,
    NotaryAccepted,
    DataAdded,
    TransactionCompleted
  }

  enum DataResponseStatus {
    DataResponseAdded,
    RefundedToBuyer,
    TransactionCompleted,
    TransactionCompletedByNotary
  }

  // --- Notary Information ---
  struct NotaryInfo {
    bool accepted;
    uint acceptedAt;
  }

  mapping(address => NotaryInfo) internal notaryInfo;
  address[] public acceptedNotaries;
  address[] public notaries;

  // --- Seller Information ---
  struct SellerInfo {
    address notary;
    uint256 price;
    string hash;
    string signature;
    uint createdAt;
    DataResponseStatus status;
  }

  mapping(address => SellerInfo) public sellerInfo;
  address[] public sellers;


  function DataOrder(
    address _buyer,
    address[] _notaries,
    string _filters,
    string _dataRequest,
    string _terms,
    string _buyerURL,
    uint _minimimBudgetForAudit,
    bool _certificationFlag,
    uint _serviceFee
  ) public {
    require(_buyer != 0x0);
    require(msg.sender != _buyer);
    // @todo(cristian): add notary unique validation.
    require(_minimimBudgetForAudit > uint256(0));
    // require(_serviceFee > uint256(0));

    contractOwner = msg.sender;

    buyer = _buyer;
    notaries = _notaries;
    filters = _filters;
    dataRequest = _dataRequest;
    terms = _terms;
    buyerURL = _buyerURL;
    minimimBudgetForAudit = _minimimBudgetForAudit;
    certificationFlag = _certificationFlag;
    serviceFee = _serviceFee;
    orderStatus = OrderStatus.OrderCreated;

    for (uint i = 0; i < _notaries.length; i++) {
      notaryInfo[_notaries[i]] = NotaryInfo(false, 0);
    }

    createdAt = now;
  }

  function acceptToBeNotary(address notary) public returns (bool) {
    require (msg.sender == contractOwner);
    require (notaryInfo[notary].accepted == false);
    notaryInfo[notary] = NotaryInfo(true, now);
    acceptedNotaries.push(notary);
    orderStatus = OrderStatus.NotaryAccepted;
    return true;
  }

  function addDataResponse(
    address seller,
    address notary,
    uint256 price,
    string hash,
    string signature
  ) public returns (bool) {
    require (msg.sender == contractOwner);
    require (notaryInfo[notary].accepted == true);
    require (orderStatus == OrderStatus.NotaryAccepted);

    sellerInfo[seller] = SellerInfo(
      notary,
      price,
      hash,
      signature,
      now,
      DataResponseStatus.DataResponseAdded
    );

    sellers.push(seller);

    return true;
  }

  function close() public returns (bool) {
    require (msg.sender == contractOwner);
    require (orderStatus == OrderStatus.DataAdded);

    orderStatus = OrderStatus.TransactionCompleted;
    transactionCompletedAt = now;
    return true;
  }

  function hasNotaryAccepted(address notary) public constant returns (bool) {
    return notaryInfo[notary].accepted == true;
  }

  function getStatusAsString() public constant returns (bytes32) {
    if (orderStatus == OrderStatus.OrderCreated) {
      return bytes32("OrderCreated");
    }

    if (orderStatus == OrderStatus.NotaryAccepted) {
      return bytes32("NotaryAccepted");
    }

    if (orderStatus == OrderStatus.DataAdded) {
      return bytes32("DataAdded");
    }

    if (orderStatus == OrderStatus.TransactionCompleted) {
      return bytes32("TransactionCompleted");
    }

    return bytes32("unknown");
  }

  function kill() public {
    if (msg.sender == contractOwner) {
      selfdestruct(contractOwner);
    }
  }
}