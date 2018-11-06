pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/math/Math.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

import "./DataOrder.sol";
import "./WIBToken.sol";


contract DataExchange {
  using SafeMath for uint256;

  event NewOrder(address indexed orderAddr);
  event SellersAdded(address indexed orderAddr, bytes32 newProof);
  event InitWithdraw(address indexed seller, uint256 challengeTimeout);
  event Cashout(address indexed seller, uint256 cashoutBalance);

  struct SellerBalance {
    uint256 pointer;
    uint256 balance;
    uint256 withdrawBalance;
    uint256 withdrawPointer;
    uint256 withdrawTimestamp;
  }

  mapping(address => SellerBalance) public sellersBalance;

  uint256 marketPointer = 0;
  uint256 timeout = 604800; // 1 week

  WIBToken token;

  constructor(address tokenAddress, address ownerAddress) public {
    require(tokenAddress != ownerAddress);
    token = WIBToken(tokenAddress);
  }

  function newOrder(
    string filters,
    string dataRequest,
    uint256 price,
    uint256 initialBudgetForAudits,
    string termsAndConditions,
    string buyerURL,
    string publicKey
  ) public returns (address) {

    address newOrderAddr = new DataOrder(
      msg.sender,
      filters,
      dataRequest,
      price,
      termsAndConditions,
      buyerURL,
      publicKey
    );

    marketPointer = marketPointer.add(1);

    emit NewOrder(newOrderAddr);
    return newOrderAddr;
  }

  function addSellersToOrder(address orderAddr, address[] sellers) public returns (bool) {
    DataOrder order = DataOrder(orderAddr);
    require(msg.sender == order.buyer());

    uint256 price = order.price();
    bytes32 updatedSellersProof = 0;

    for (uint i = 0; i < sellers.length; i++) {
      sellersBalance[sellers[i]].balance += price;
      if (updatedSellersProof == 0) {
        updatedSellersProof = bytes32(sellers[i]);
      } else {
        updatedSellersProof = keccak256(abi.encodePacked(updatedSellersProof, bytes32(sellers[i])));
      }
    }

    order.updateSellersProof(keccak256(abi.encodePacked(order.sellersProof(), updatedSellersProof)));

    token.transferFrom(msg.sender, this, price.mul(sellers.length));

    emit SellersAdded(orderAddr,updatedSellersProof);

    return true;
  }

  function initWithdraw(address seller) public returns (bool) {
    SellerBalance storage balance = sellersBalance[seller];
    require(balance.withdrawPointer == 0);
    require(marketPointer > balance.pointer);

    balance.withdrawPointer = marketPointer;
    balance.withdrawTimestamp = block.timestamp;

    uint256 challengeTimeout = balance.withdrawTimestamp.add(timeout);
    emit InitWithdraw(seller, challengeTimeout);

    return true;
  }

  function cashout(address seller) public returns (bool) {
    SellerBalance storage balance = sellersBalance[seller];
    require(balance.withdrawPointer > 0);
    require(balance.withdrawPointer <= marketPointer);
    require(block.timestamp >= balance.withdrawTimestamp.add(timeout));

    uint256 cashoutBalance = balance.balance;
    balance.pointer = balance.withdrawPointer;
    balance.balance = balance.balance.sub(balance.withdrawBalance);
    balance.withdrawPointer = 0;
    balance.withdrawTimestamp = 0;
    balance.withdrawBalance = 0;

    token.transfer(seller, cashoutBalance);
    emit Cashout(seller, cashoutBalance);

    return true;
  }

}
