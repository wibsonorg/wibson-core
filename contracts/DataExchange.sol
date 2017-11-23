pragma solidity ^0.4.15;

import './DataOrder.sol';
import './SimpleDataToken.sol';

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
    string publicKey,
    uint minimimBudgetForAudit
    // bool certificationFlag
    // uint serviceFee
    // uint timestamps
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
    //uint256 price,
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
    uint createadAt;
  }

  struct OrderKey {
    address buyer;
    address seller;
    address orderAddr;
  }

  // order -> index
  mapping(address => OrderValue) internal orderValues;
  // index -> order
  mapping(uint => OrderKey) internal orderKeys;
  // Open orders with notaries
  address[] public openOrders;
  uint public orderSize;

  // Notaries tracking
  mapping(address => address[]) public openOrdersByNotary;
  address[] public allowedNotaries;
  address public contractOwner;

  // Seller Tracking
  mapping(address => address[]) public ordersBySeller;

  // Buyer Tracking
  mapping(address => address[]) public ordersByBuyer;

  SimpleDataToken sdt;

  function DataExchange(address[] _allowedNotaries, address _tokenAddr) public {
    allowedNotaries = _allowedNotaries;
    contractOwner = msg.sender;
    orderSize = 0;
    sdt = SimpleDataToken(_tokenAddr);
  }

  // Step 1.
  function newOrder(
    address[] notaries,
    string filters,
    string dataRequest,
    string terms,
    string buyerURL,
    string publicKey,
    uint minimimBudgetForAudit
    // bool certificationFlag
    //uint serviceFee
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
      publicKey,
      minimimBudgetForAudit
      // certificationFlag
      // serviceFee
    );

    orderValues[newOrderAddr] = OrderValue(orderSize, now);
    // orderKeys[] = OrderKey(msg.sender, seller, orderAddr;
    orderSize++;

    for (uint i = 0; i < notaries.length; i++) {
      openOrdersByNotary[notaries[i]].push(newOrderAddr);
    }

    ordersByBuyer[msg.sender].push(newOrderAddr);

    NewOrder(
      newOrderAddr,
      msg.sender,
      notaries,
      filters,
      dataRequest,
      terms,
      buyerURL,
      publicKey,
      minimimBudgetForAudit
      // certificationFlag
      // serviceFee
    );

    return newOrderAddr;
  }

  // Step 2.
  function acceptToBeNotary(address orderAddr) public returns (bool) {
    require(orderAddr != 0x0);
    var order = DataOrder(orderAddr);

    var okay = order.acceptToBeNotary(msg.sender);
    if (okay) {
      openOrders.push(orderAddr);
      NotaryAccepted(order, order.buyer(), msg.sender);
    }
    return okay;
  }

  // Step 3.
  function setOrderPrice(address orderAddr, uint256 _price) public returns (bool) {
    require(orderAddr != 0x0);
    var order = DataOrder(orderAddr);
    return order.setPrice(_price);
  }

  // Step 4.
  function addDataResponseToOrder(
    address orderAddr,
    address seller,
    address notary,
    string hash,
    string signature
  ) public returns (bool) {
    require(orderAddr != 0x0);
    require(orderResponses[msg.sender][seller] == 0x0);
    orderResponses[msg.sender][seller] = orderAddr;

    var order = DataOrder(orderAddr);
    require(order.hasNotaryAccepted(notary) == true);

    var okay = order.addDataResponse(seller, notary, hash, signature);
    if (okay) {
      ordersBySeller[seller].push(orderAddr);
      DataAdded(order, order.buyer(), msg.sender, notary, hash, signature, now);
    }
    return okay;
  }

  // Step 5.
  function dataResponsesAdded(address orderAddr) public returns (bool) {
    require(orderAddr != 0x0);
    var order = DataOrder(orderAddr);
    return order.dataResponsesAdded();
  }

  // Step 6.
  function hasDataResponseBeenAccepted(address orderAddr) public returns (bool) {
    require(orderAddr != 0x0);
    var order = DataOrder(orderAddr);
    return order.hasSellerBeenAccepted(msg.sender) == true;
  }

  // Step 7.
  function closeDataResponse(address buyer, address seller) public returns (bool) {
    require(orderResponses[buyer][seller] != 0x0);
    var order = DataOrder(orderResponses[buyer][seller]);
    require (order.hasSellerBeenAccepted(seller) && order.buyer() == msg.sender);
    uint256 orderPrice = order.price();

    require (hasBalanceToBuy(buyer, orderPrice));

    var okay = order.closeDataResponse(seller);
    if (okay) {
      moveFundsToSeller(buyer, seller, orderPrice);

      //removeAndSwapAt(buyer, seller);
      TransactionCompleted(order, buyer, seller, msg.sender, order.getOrderStatusAsString(), now);
    }
    return okay;
  }

  /*/ Step 8.
  function close() {

  }
  */

  function hasBalanceToBuy(address buyer, uint256 _price) internal returns (bool) {
    return sdt.allowance(buyer, this) >= _price;
  }

  function moveFundsToSeller(address buyer, address seller, uint256 _price) internal returns (bool) {
    return sdt.transferFrom(buyer, seller, _price);
  }

  function getOrderFor(address buyer, address seller) public constant returns (address) {
    return orderResponses[buyer][seller];
  }

  function getOpenOrdersForNotary(address notary) public constant returns (address[]) {
    return copyArrayToMemory(openOrdersByNotary[notary]);
  }

  function getOrdersForSeller(address seller) public constant returns (address[]) {
    return copyArrayToMemory(ordersBySeller[seller]);
  }

  function getOrdersForBuyer(address buyer) public constant returns (address[]) {
    return copyArrayToMemory(ordersByBuyer[buyer]);
  }

  function getOpenOrders() public constant returns (address[]) {
    return openOrders;
  }

  function copyArrayToMemory(address[] xs) internal constant returns (address[]) {
    address[] memory rs = new address[](xs.length);
    for(uint i = 0; i < xs.length; i++) {
        rs[i] = xs[i];
    }
    return rs;
  }

  function removeAndSwapAt(address buyer, address seller) internal returns (bool) {
    var deleteOrder = orderResponses[buyer][seller];
    var deleteOrderInfo = orderValues[deleteOrder];
    uint deleteIndex = deleteOrderInfo.index;

    delete orderResponses[buyer][seller];
    delete openOrders[openOrders.length-1];

    var keyOrder = orderKeys[openOrders.length-1];
    // var keyOrderValue = orderValues[keyOrder.orderAddr];

    orderKeys[deleteIndex] = keyOrder;
    delete orderKeys[openOrders.length-1];

    openOrders[deleteIndex] = keyOrder.orderAddr;
    orderSize--;
    return true;
  }

  function kill() public constant {
    if (msg.sender == contractOwner) {
      selfdestruct(contractOwner);
    }
  }
}