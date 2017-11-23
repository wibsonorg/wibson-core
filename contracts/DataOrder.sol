pragma solidity ^0.4.15;

// ---( DataOrder )-------------------------------------------------------------

contract DataOrder {
  address public buyer;

  string public filters;
  string public dataRequest;
  string public terms;
  string public buyerURL;
  string public publicKey;
  uint public minimimBudgetForAudit;
  bool public certificationFlag;
  uint public serviceFee;

  uint256 public price;

  // Timestamps
  uint public createdAt;
  uint public dataAddedAt;
  uint public transactionCompletedAt;

  OrderStatus public orderStatus;

  address public contractOwner;

  enum OrderStatus {
    OrderCreated,
    NotaryAccepted,
    PriceSet,
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
    string hash;
    string signature;
    uint closedAt;
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
    string _publicKey,
    uint _minimimBudgetForAudit
    // bool _certificationFlag
    // uint _serviceFee
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
    publicKey = _publicKey;
    minimimBudgetForAudit = _minimimBudgetForAudit;
    certificationFlag = false; // _certificationFlag;
    serviceFee = 0; //_serviceFee;
    orderStatus = OrderStatus.OrderCreated;
    createdAt = now;
  }

  function acceptToBeNotary(address notary) public returns (bool) {
    require (msg.sender == contractOwner);

    var allowed = false;
    for (uint i = 0; i < notaries.length; i++) {
      if (notaries[i] == notary) {
        allowed = true;
        break;
      }
    }

    if (!allowed) {
      return false;
    }

    if (notaryInfo[notary].accepted != true) {
      notaryInfo[notary] = NotaryInfo(true, now);
      acceptedNotaries.push(notary);
      orderStatus = OrderStatus.NotaryAccepted;
    }
    return true;
  }

  function setPrice(uint256 value) public returns (bool) {
    require (orderStatus == OrderStatus.NotaryAccepted);
    price = value;
    orderStatus = OrderStatus.PriceSet;
    return true;
  }

  function addDataResponse(
    address seller,
    address notary,
    string hash,
    string signature
  ) public returns (bool) {
    require (msg.sender == contractOwner);
    require (notaryInfo[notary].accepted == true);
    require (orderStatus == OrderStatus.PriceSet);

    sellerInfo[seller] = SellerInfo(
      notary,
      hash,
      signature,
      0,
      now,
      DataResponseStatus.DataResponseAdded
    );

    sellers.push(seller);

    return true;
  }

  function dataResponsesAdded() public returns (bool) {
    require (orderStatus == OrderStatus.PriceSet);
    orderStatus = OrderStatus.DataAdded;
    return true;
  }

  function hasSellerBeenAccepted(address seller) public constant returns (bool) {
    require(seller != 0x0);
    return sellerInfo[seller].status == DataResponseStatus.DataResponseAdded;
  }

  function closeDataResponse(address seller) public returns (bool) {
    require (seller != 0x0);
    require (msg.sender == contractOwner);
    require (orderStatus == OrderStatus.DataAdded);
    if (sellerInfo[seller].status == DataResponseStatus.DataResponseAdded) {
      sellerInfo[seller].status = DataResponseStatus.TransactionCompleted;
      sellerInfo[seller].closedAt = now;
      return true;
    }
    return false;
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

  function getSellerInfo(address seller) public constant returns (address, address, uint256, string, string, uint, uint, bytes32) {
    var info = sellerInfo[seller];
    return (
      seller,
      info.notary,
      price,
      info.hash,
      info.signature,
      info.closedAt,
      info.createdAt,
      getDataResponseStatusAsString(info.status)
    );
  }

  function getDataResponseStatusAsString(DataResponseStatus drs) internal constant returns (bytes32) {
    if (drs == DataResponseStatus.DataResponseAdded) {
      return bytes32("DataResponseAdded");
    }

    if (drs == DataResponseStatus.RefundedToBuyer) {
      return bytes32("RefundedToBuyer");
    }

    if (drs == DataResponseStatus.TransactionCompleted) {
      return bytes32("TransactionCompleted");
    }

    if (drs == DataResponseStatus.TransactionCompletedByNotary) {
      return bytes32("TransactionCompletedByNotary");
    }

    return bytes32("unknown");
  }

  function getOrderStatusAsString() public constant returns (bytes32) {
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

  function kill() public constant {
    if (msg.sender == contractOwner) {
      selfdestruct(contractOwner);
    }
  }
}