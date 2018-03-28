pragma solidity ^0.4.15;

import './DataOrder.sol';
import './WibsonPointToken.sol';
import './lib/AddressMap.sol';
import './lib/ArrayUtils.sol';


// ---( DataExchange )----------------------------------------------------------
contract DataExchange {

  event NewOrder(address orderAddr);
  event NotaryAccepted(address orderAddr);
  event DataAdded(address orderAddr, address seller);
  event DataResponseNotarized(address orderAddr);
  event TransactionCompleted(address orderAddr, address seller);

  using AddressMap for AddressMap.MapStorage;

  AddressMap.MapStorage openOrders;

  // Notaries tracking
  struct NotaryInfo {
    address addr;
    string name;
    string publicKey;
  }

  mapping(address => NotaryInfo) internal notaryInfo;
  mapping(address => address[]) public ordersByNotary;
  AddressMap.MapStorage allowedNotaries;

  // Seller Tracking
  mapping(address => address[]) public ordersBySeller;

  // Buyer Tracking
  mapping(address => address[]) public ordersByBuyer;

  // Buyer Balanace tracking
  // TODO(cristian): change to buyer-order -> balance
  mapping(address => uint256) public buyerBalance;

  address public contractOwner;

  WibsonPointToken token;

  function DataExchange(address tokenAddress) public {
    require(tokenAddress != 0x0);

    contractOwner = msg.sender;
    token = WibsonPointToken(tokenAddress);
  }

  function addNotary(
    address notary,
    string name,
    string publicKey
  ) public returns (bool) {
    require(msg.sender == contractOwner);
    allowedNotaries.insert(notary);
    notaryInfo[notary] = NotaryInfo(notary, name, publicKey);
    return true;
  }

  function newOrder(
    address[] notaries,
    string filters,
    string dataRequest,
    bool notarizeDataFlag,
    string terms,
    string buyerURL,
    string publicKey
  ) public returns (address) {
    require(notaries.length > 0);
    require(allowedNotaries.length() > 0);

    address newOrderAddr = new DataOrder(
      msg.sender,
      notaries,
      filters,
      dataRequest,
      notarizeDataFlag,
      terms,
      buyerURL,
      publicKey
    );

    for (uint i = 0; i < notaries.length; i++) {
      ordersByNotary[notaries[i]].push(newOrderAddr);
    }

    ordersByBuyer[msg.sender].push(newOrderAddr);

    NewOrder(newOrderAddr);
    return newOrderAddr;
  }

  function acceptToBeNotary(address orderAddr) public returns (bool) {
    var order = DataOrder(orderAddr);
    if (order.hasNotaryAccepted(msg.sender)) {
      return true;
    }

    var okay = order.acceptToBeNotary(msg.sender);
    if (okay) {
      openOrders.insert(orderAddr);
      NotaryAccepted(order);
    }
    return okay;
  }

  function setOrderPrice(
    address orderAddr,
    uint256 _price
  ) public returns (bool) {
    var order = DataOrder(orderAddr);
    require(msg.sender == order.buyer());
    return order.setPrice(_price);
  }

  function addDataResponseToOrder(
    address orderAddr,
    address seller,
    address notary,
    string hash,
    string signature
  ) public returns (bool) {
    var order = DataOrder(orderAddr);
    address buyer = order.buyer();
    uint256 orderPrice = order.price();

    require(buyer == msg.sender);
    require(order.hasNotaryAccepted(notary) == true);
    require(token.allowance(buyer, this) >= orderPrice);

    var okay = order.addDataResponse(seller, notary, hash, signature);
    if (okay) {
      token.transferFrom(buyer, this, orderPrice);
      buyerBalance[buyer] += orderPrice;
      ordersBySeller[seller].push(orderAddr);
      DataAdded(order, seller);
    }
    return okay;
  }

  function hasDataResponseBeenAccepted(
    address orderAddr
  ) public returns (bool) {
    var order = DataOrder(orderAddr);
    return order.hasSellerBeenAccepted(msg.sender);
  }

  function notarizeDataResponse(
    address orderAddr,
    address seller,
    bool approved
  ) public returns (bool) {

    var order = DataOrder(orderAddr);
    // the Data Order will do all the needed validations for the operation
    var okay = order.notarizeDataResponse(msg.sender, seller, approved);
    if (okay) {
      DataResponseNotarized(order);
    }
    return okay;
  }

  function hasDataResponseBeenApproved(
    address orderAddr
  ) public returns (bool) {
    var order = DataOrder(orderAddr);
    return order.hasSellerBeenApproved(msg.sender);
  }

  function hasDataResponseBeenRejected(
    address orderAddr
  ) public returns (bool) {
    var order = DataOrder(orderAddr);
    return order.hasSellerBeenRejected(msg.sender);
  }

  function hasDataResponseBeenNotarized(
    address orderAddr
  ) public returns (bool) {
    var order = DataOrder(orderAddr);
    return order.hasSellerBeenNotarized(msg.sender);
  }

  // Step 8.
  function closeDataResponse(
    address orderAddr,
    address seller
  ) public returns (bool) {

    var order = DataOrder(orderAddr);
    uint256 orderPrice = order.price();
    var buyer = order.buyer();

    require(buyer == msg.sender);
    require(
      order.hasSellerBeenAccepted(seller) || order.hasSellerBeenApproved(seller)
    );

    var okay = order.closeDataResponse(seller);
    if (okay) {
      require(buyerBalance[buyer] >= orderPrice);
      token.transfer(seller, orderPrice);
      buyerBalance[buyer] = buyerBalance[buyer] - orderPrice;

      var notary = order.getNotaryForSeller(seller);
      TransactionCompleted(order, seller);
    }
    return okay;
  }

  function close(address orderAddr) public returns (bool) {
    var order = DataOrder(orderAddr);
    bool okay = order.close();
    if (okay) {
      openOrders.remove(orderAddr);
    }

    return okay;
  }

  function getOrdersForNotary(
    address notary
  ) public constant returns (address[]) {
    return ArrayUtils.toMemory(ordersByNotary[notary]);
  }

  function getOrdersForSeller(
    address seller
  ) public constant returns (address[]) {
    return ArrayUtils.toMemory(ordersBySeller[seller]);
  }

  function getOrdersForBuyer(
    address buyer
  ) public constant returns (address[]) {
    return ArrayUtils.toMemory(ordersByBuyer[buyer]);
  }

  function getOpenOrders() public constant returns (address[]) {
    return ArrayUtils.fromAddressMap(openOrders);
  }

  function getAllowedNotaries() public constant returns (address[]) {
    return ArrayUtils.fromAddressMap(allowedNotaries);
  }

  function getNotaryInfo(
    address notary
  ) public constant returns (address, string, string) {
    var info = notaryInfo[notary];
    return (info.addr, info.name, info.publicKey);
  }

  function kill() public {
    if (msg.sender == contractOwner) {
      selfdestruct(contractOwner);
    }
  }
}
