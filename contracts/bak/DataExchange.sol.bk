pragma solidity ^0.4.15;

import './DataOrder.sol';
import './SimpleDataToken.sol';
import './lib/AddressMap.sol';
import './lib/ArrayUtils.sol';


// ---( DataExchange )----------------------------------------------------------
contract DataExchange {

  event NewOrder(
    address orderAddr
    /*
    address buyer,
    address[] notaries,
    string filters,
    string dataRequest,
    bool notarizeDataFlag,
    string terms,
    string buyerURL,
    string publicKey
    // uint minimimBudgetForAudit
    // bool certificationFlag
    // uint serviceFee
    // uint timestamps
    */
  );

  event NotaryAccepted(
    address orderAddr
    /*
    address buyer,
    address notary
    */
  );

  event DataAdded(
    address orderAddr,
    address seller
    /*
    address buyer,
    address notary,
    //uint256 price,
    string hash,
    string signature,
    uint timestamps
    */
  );

  event DataResponseNotarized(
    address orderAddr
    /*
    address buyer,
    address seller,
    address notary,
    bool approved,
    uint timestamps
    */
  );

  event TransactionCompleted(
    address orderAddr,
    address seller
    /*
    address buyer,
    address notary,
    bytes32 status,
    uint timestamps
    */
  );

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
  mapping(address => uint256) public buyerBalance;

  address public contractOwner;

  SimpleDataToken sdt;

  function DataExchange(address _tokenAddr) public {
    require(_tokenAddr != 0x0);

    contractOwner = msg.sender;
    sdt = SimpleDataToken(_tokenAddr);
  }

  function addNotary(address notary, string name, string publicKey) public returns (bool) {
    require(msg.sender == contractOwner);
    allowedNotaries.insert(notary);
    notaryInfo[notary] = NotaryInfo(notary, name, publicKey);
    return true;
  }

  // Step 1.
  function newOrder(
    address[] notaries,
    string filters,
    string dataRequest,
    bool notarizeDataFlag,
    string terms,
    string buyerURL,
    string publicKey,
    uint minimimBudgetForAudit
    // bool certificationFlag
    //uint serviceFee
  ) public returns (address) {
    require(notaries.length > 0);
    require(allowedNotaries.length() > 0);
    require(minimimBudgetForAudit > uint256(0));
    // require(serviceFee > uint256(0));

    address newOrderAddr = new DataOrder(
      msg.sender,
      notaries,
      filters,
      dataRequest,
      notarizeDataFlag,
      terms,
      buyerURL,
      publicKey,
      minimimBudgetForAudit
      // certificationFlag
      // serviceFee
    );

    for (uint i = 0; i < notaries.length; i++) {
      ordersByNotary[notaries[i]].push(newOrderAddr);
    }

    ordersByBuyer[msg.sender].push(newOrderAddr);

    NewOrder(newOrderAddr);

    /*
    NewOrder(
      newOrderAddr,
      msg.sender,
      notaries,
      filters,
      dataRequest,
      notarizeDataFlag,
      terms,
      buyerURL,
      publicKey
      // minimimBudgetForAudit
      // certificationFlag
      // serviceFee
    );
    */
    return newOrderAddr;
  }

  // Step 2.
  function acceptToBeNotary(address orderAddr) public returns (bool) {
    // require(orderAddr != 0x0);
    var order = DataOrder(orderAddr);

    if (order.hasNotaryAccepted(msg.sender)) {
      return true;
    }

    var okay = order.acceptToBeNotary(msg.sender);
    if (okay) {
      openOrders.insert(orderAddr);
      NotaryAccepted(order);
      // NotaryAccepted(order, order.buyer(), msg.sender);
    }
    return okay;
  }

  // Step 3.
  function setOrderPrice(address orderAddr, uint256 _price) public returns (bool) {
    // require(orderAddr != 0x0);
    var order = DataOrder(orderAddr);
    require(msg.sender == order.buyer());
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
    // require(orderAddr != 0x0);
    // require(orderResponses[msg.sender][seller] == 0x0);
    // orderResponses[msg.sender][seller] = orderAddr;

    var order = DataOrder(orderAddr);
    address buyer = order.buyer();
    uint256 orderPrice = order.price();

    require(buyer == msg.sender);
    require(order.hasNotaryAccepted(notary) == true);
    // require(hasBalanceToBuy(buyer, orderPrice));
    require(sdt.allowance(buyer, this) >= orderPrice);

    var okay = order.addDataResponse(seller, notary, hash, signature);
    if (okay) {
      // moveFundsTo(buyer, this, orderPrice);
      sdt.transferFrom(buyer, this, orderPrice);
      buyerBalance[buyer] += orderPrice;
      ordersBySeller[seller].push(orderAddr);
      DataAdded(order, seller);
      // DataAdded(order, buyer, seller, notary, hash, signature, now);
    }
    return okay;
  }

  // Step 5.
  function dataResponsesAdded(address orderAddr) public returns (bool) {
    // require(orderAddr != 0x0);
    var order = DataOrder(orderAddr);
    return order.dataResponsesAdded();
  }

  // Step 6.
  function hasDataResponseBeenAccepted(address orderAddr) public returns (bool) {
    // require(orderAddr != 0x0);
    var order = DataOrder(orderAddr);
    return order.hasSellerBeenAccepted(msg.sender);
  }

  // Step 7 (optional).
  function notarizeDataResponse(address orderAddr, address seller, bool approved) public returns (bool) {
    // require(orderAddr != 0x0);

    var order = DataOrder(orderAddr);
    var okay = order.notarizeDataResponse(msg.sender, seller, approved); // the Data Order will do all the needed validations for the operation
    if (okay) {
      DataResponseNotarized(order);
      // DataResponseNotarized(order, order.buyer(), seller, msg.sender, approved, now);
    }
    return okay;
  }

  // Step 8 (optional).
  function hasDataResponseBeenApproved(address orderAddr) public returns (bool) {
    // require(orderAddr != 0x0);
    var order = DataOrder(orderAddr);
    return order.hasSellerBeenApproved(msg.sender);
  }

  function hasDataResponseBeenRejected(address orderAddr) public returns (bool) {
    // require(orderAddr != 0x0);
    var order = DataOrder(orderAddr);
    return order.hasSellerBeenRejected(msg.sender);
  }

  function hasDataResponseBeenNotarized(address orderAddr) public returns (bool) {
    // require(orderAddr != 0x0);
    var order = DataOrder(orderAddr);
    return order.hasSellerBeenNotarized(msg.sender);
  }

  // Step 9.
  function closeDataResponse(address orderAddr, address seller) public returns (bool) {
    // require(orderAddr != 0x0);

    var order = DataOrder(orderAddr);
    uint256 orderPrice = order.price();
    var buyer = order.buyer();

    require(buyer == msg.sender);
    require(order.hasSellerBeenAccepted(seller) || order.hasSellerBeenApproved(seller));

    var okay = order.closeDataResponse(seller);
    if (okay) {
      require(buyerBalance[buyer] >= orderPrice);
      // allowWithdraw(seller, orderPrice);
      sdt.transfer(seller, orderPrice);
      buyerBalance[buyer] = buyerBalance[buyer] - orderPrice;

      var notary = order.getNotaryForSeller(seller);
      TransactionCompleted(order, seller);
      // TransactionCompleted(order, buyer, seller, notary, order.getOrderStatusAsString(), now);
    }
    return okay;
  }

  // Step 8.
  function close(address orderAddr) public returns (bool) {
    // require(orderAddr != 0x0);

    var order = DataOrder(orderAddr);
    bool okay = order.close();
    if (okay) {
      openOrders.remove(orderAddr);
    }

    return okay;
  }

  function getOrdersForNotary(address notary) public constant returns (address[]) {
    return ArrayUtils.toMemory(ordersByNotary[notary]);
  }

  function getOrdersForSeller(address seller) public constant returns (address[]) {
    return ArrayUtils.toMemory(ordersBySeller[seller]);
  }

  function getOrdersForBuyer(address buyer) public constant returns (address[]) {
    return ArrayUtils.toMemory(ordersByBuyer[buyer]);
  }

  function getOpenOrders() public constant returns (address[]) {
    return ArrayUtils.fromAddressMap(openOrders);
  }

  function getAllowedNotaries() public constant returns (address[]) {
    return ArrayUtils.fromAddressMap(allowedNotaries);
  }

  function getNotaryInfo(address notary) public constant returns (address, string, string) {
    var info = notaryInfo[notary];
    return (info.addr, info.name, info.publicKey);
  }

  function kill() public {
    if (msg.sender == contractOwner) {
      selfdestruct(contractOwner);
    }
  }

  /*
  function hasBalanceToBuy(address buyer, uint256 _price) internal returns (bool) {
    return sdt.allowance(buyer, this) >= _price;
  }

  function moveFundsTo(address from, address to, uint256 _price) internal returns (bool) {
    return sdt.transferFrom(from, to, _price);
  }

  function allowWithdraw(address to, uint256 amount) internal returns (bool) {
    if (sdt.allowance(this, to) > 0) {
      return sdt.increaseApproval(to, amount);
    } else {
      return sdt.approve(to, amount);
    }
  }
  */
}
