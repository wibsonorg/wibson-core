pragma solidity ^0.4.15;

import 'zeppelin-solidity/contracts/lifecycle/Destructible.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

import './DataOrderV1.sol';
import './Wibcoin.sol';
import './IdentityManager.sol';
import '../lib/MultiMap.sol';
import '../lib/ArrayUtils.sol';
import '../lib/ModifierUtils.sol';


// ---( DataExchange )----------------------------------------------------------
contract DataExchangeV1 is Ownable, Destructible, ModifierUtils {
  using SafeMath for uint256;
  using MultiMap for MultiMap.MapStorage;

  event NewOrder(address indexed orderAddr);
  event NotaryAccepted(address indexed orderAddr);
  event DataAdded(address indexed orderAddr, address indexed seller);
  event DataResponseNotarized(address indexed orderAddr);
  event TransactionCompleted(address indexed orderAddr, address indexed seller);
  event OrderClosed(address indexed orderAddr);

  struct NotaryInfo {
    address addr;
    string name;
    string publicKey;
  }

  MultiMap.MapStorage openOrders;
  MultiMap.MapStorage allowedNotaries;

  mapping(address => address[]) public ordersBySeller;
  mapping(address => address[]) public ordersByNotary;
  mapping(address => address[]) public ordersByBuyer;
  mapping(address => NotaryInfo) internal notaryInfo;
  mapping(address => mapping(address => uint256)) public buyerBalance;

  IdentityManager idManager;
  Wibcoin token;

  function DataExchangeV1(address tokenAddress) public validAddress(tokenAddress) {
    owner = msg.sender;
    token = Wibcoin(tokenAddress);
  }

  function addNotary(
    address notary,
    string name,
    string publicKey
  ) public onlyOwner returns (bool) {
    allowedNotaries.insert(notary);
    notaryInfo[notary] = NotaryInfo(notary, name, publicKey);
    return true;
  }

  function setIdentityManager(address identityManagerAddr) public onlyOwner returns (bool) {
    idManager = IdentityManager(identityManagerAddr);
    return true;
  }

  function newOrder(
    address[] notaries,
    string filters,
    string dataRequest,
    bool requireNotarizedData,
    string terms,
    string buyerURL,
    string publicKey
  ) public returns (address) {
    require(notaries.length > 0);
    require(idManager != address(0));
    require(allowedNotaries.length() > 0);

    address newOrderAddr = new DataOrderV1(
      msg.sender,
      notaries,
      filters,
      dataRequest,
      requireNotarizedData,
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

  function acceptToBeNotary(address orderAddr) public validAddress(orderAddr) returns (bool) {
    DataOrderV1 order = DataOrderV1(orderAddr);
    if (order.hasNotaryAccepted(msg.sender)) {
      return true;
    }

    bool okay = order.acceptToBeNotary(msg.sender);
    if (okay) {
      openOrders.insert(orderAddr);
      NotaryAccepted(order);
    }
    return okay;
  }

  function setOrderPrice(
    address orderAddr,
    uint256 price
  ) public validAddress(orderAddr) returns (bool) {
    DataOrderV1 order = DataOrderV1(orderAddr);
    require(msg.sender == order.buyer());
    return order.setPrice(price);
  }

  function addDataResponseToOrder(
    address orderAddr,
    address seller,
    address notary,
    string hash,
    string signature
  ) public validAddress(orderAddr) returns (bool) {
    DataOrderV1 order = DataOrderV1(orderAddr);
    address buyer = order.buyer();
    uint256 orderPrice = order.price();

    require(buyer == msg.sender);
    require(order.hasNotaryAccepted(notary) == true);
    require(token.allowance(buyer, this) >= orderPrice);

    bool okay = order.addDataResponse(seller, notary, hash, signature);
    if (okay) {
      buyerBalance[buyer][orderAddr].add(orderPrice);
      ordersBySeller[seller].push(orderAddr);
      token.transferFrom(buyer, this, orderPrice);
      DataAdded(order, seller);
    }
    return okay;
  }

  function hasDataResponseBeenAccepted(
    address orderAddr
  ) public validAddress(orderAddr) returns (bool) {
    DataOrderV1 order = DataOrderV1(orderAddr);
    return order.hasSellerBeenAccepted(msg.sender);
  }

  function notarizeDataResponse(
    address orderAddr,
    address seller,
    bool approved
  ) public validAddress(orderAddr) returns (bool) {

    DataOrderV1 order = DataOrderV1(orderAddr);
    // the Data Order will do all the needed validations for the operation
    bool okay = order.notarizeDataResponse(msg.sender, seller, approved);
    if (okay) {
      DataResponseNotarized(order);
    }
    return okay;
  }

  function hasDataResponseBeenApproved(
    address orderAddr
  ) public validAddress(orderAddr) returns (bool) {
    DataOrderV1 order = DataOrderV1(orderAddr);
    return order.hasSellerBeenApproved(msg.sender);
  }

  function hasDataResponseBeenRejected(
    address orderAddr
  ) public validAddress(orderAddr) returns (bool) {
    DataOrderV1 order = DataOrderV1(orderAddr);
    return order.hasSellerBeenRejected(msg.sender);
  }

  function hasDataResponseBeenNotarized(
    address orderAddr
  ) public validAddress(orderAddr) returns (bool) {
    DataOrderV1 order = DataOrderV1(orderAddr);
    return order.hasSellerBeenNotarized(msg.sender);
  }

  // Step 8.
  function closeDataResponse(
    address orderAddr,
    address seller
  ) public validAddress(orderAddr) returns (bool) {
    DataOrderV1 order = DataOrderV1(orderAddr);
    uint256 orderPrice = order.price();
    address buyer = order.buyer();

    require(buyer == msg.sender);
    require(
      order.hasSellerBeenAccepted(seller) ||
      order.hasSellerBeenApproved(seller)
    );

    bool okay = order.closeDataResponse(seller);
    if (okay) {
      require(buyerBalance[buyer][orderAddr] >= orderPrice);
      buyerBalance[buyer][orderAddr] = buyerBalance[buyer][orderAddr].sub(orderPrice);

      if (idManager.isCertified(seller)) {
        token.transfer(seller, orderPrice);
      } else {
        token.approve(idManager, orderPrice);
        idManager.addFunds(seller, orderPrice);
      }

      TransactionCompleted(order, seller);
    }
    return okay;
  }

  function close(address orderAddr) public validAddress(orderAddr) returns (bool) {
    DataOrderV1 order = DataOrderV1(orderAddr);
    bool okay = order.close();
    if (okay) {
      openOrders.remove(orderAddr);
      OrderClosed(orderAddr);
    }

    return okay;
  }

  function getOrdersForNotary(
    address notary
  ) public view returns (address[]) {
    return ArrayUtils.toMemory(ordersByNotary[notary]);
  }

  function getOrdersForSeller(
    address seller
  ) public view returns (address[]) {
    return ArrayUtils.toMemory(ordersBySeller[seller]);
  }

  function getOrdersForBuyer(
    address buyer
  ) public view returns (address[]) {
    return ArrayUtils.toMemory(ordersByBuyer[buyer]);
  }

  function getOpenOrders() public view returns (address[]) {
    return ArrayUtils.fromMultiMap(openOrders);
  }

  function getAllowedNotaries() public view returns (address[]) {
    return ArrayUtils.fromMultiMap(allowedNotaries);
  }

  function getNotaryInfo(
    address notary
  ) public view returns (address, string, string) {
    NotaryInfo info = notaryInfo[notary];
    return (info.addr, info.name, info.publicKey);
  }

  function () payable {
    throw;
  }

}
