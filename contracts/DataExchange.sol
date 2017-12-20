pragma solidity ^0.4.15;

import './DataOrder.sol';
import './SimpleDataToken.sol';
import './lib/AddressMap.sol';
import './lib/ExchangeUtils.sol';


// ---( DataExchange )----------------------------------------------------------
contract DataExchange {

  event NewOrder(
    address orderAddr,
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

    return newOrderAddr;
  }

  // Step 2.
  function acceptToBeNotary(address orderAddr) public returns (bool) {
    require(orderAddr != 0x0);
    var order = DataOrder(orderAddr);

    var okay = order.acceptToBeNotary(msg.sender);
    if (okay) {
      openOrders.insert(orderAddr);
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
    // require(orderResponses[msg.sender][seller] == 0x0);
    // orderResponses[msg.sender][seller] = orderAddr;

    var order = DataOrder(orderAddr);
    address buyer = order.buyer();
    uint256 orderPrice = order.price();

    require(order.hasNotaryAccepted(notary) == true);
    require(hasBalanceToBuy(buyer, orderPrice));

    var okay = order.addDataResponse(seller, notary, hash, signature);
    if (okay) {
      moveFundsTo(buyer, this, orderPrice);
      buyerBalance[buyer] += orderPrice;
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
  function closeDataResponse(address orderAddr, address seller) public returns (bool) {
    require(orderAddr != 0x0);

    var order = DataOrder(orderAddr);
    uint256 orderPrice = order.price();
    var buyer = order.buyer();

    require(order.hasSellerBeenAccepted(seller) && buyer == msg.sender);

    var okay = order.closeDataResponse(seller);
    if (okay) {
      require(buyerBalance[buyer] >= orderPrice);
      allowWithdraw(seller, orderPrice);

      buyerBalance[buyer] = buyerBalance[buyer] - orderPrice;
      TransactionCompleted(order, buyer, seller, msg.sender, order.getOrderStatusAsString(), now);
    }
    return okay;
  }

  // Step 8.
  function close(address orderAddr) public returns (bool) {
    require(orderAddr != 0x0);

    var order = DataOrder(orderAddr);
    bool okay = order.close();
    if (okay) {
      openOrders.remove(orderAddr);
    }

    return okay;
  }

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

  function getOrdersForNotary(address notary) public constant returns (address[]) {
    return ExchangeUtils.copyArrayToMemory(ordersByNotary[notary]);
  }

  function getOrdersForSeller(address seller) public constant returns (address[]) {
    return ExchangeUtils.copyArrayToMemory(ordersBySeller[seller]);
  }

  function getOrdersForBuyer(address buyer) public constant returns (address[]) {
    return ExchangeUtils.copyArrayToMemory(ordersByBuyer[buyer]);
  }

  function getOpenOrders() public returns (address[]) {
    return ExchangeUtils.addressMapToList(openOrders);
  }

  function getAllowedNotaries() public returns (address[]) {
    return ExchangeUtils.addressMapToList(allowedNotaries);
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
}
