pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import "../contracts/DataOrder.sol";

contract TestDataOrder {
  address private buyerAddr = 0x4bfaffccc303c3572f82dc488373bfc0b106eb70;
  address private notaryA = 0x4753ee2bbd63e60cbf764e8d3ed7c84522ad4ead;

  // A little utility that runs a wrapped method invocation as an internal Solidity call
  // Returns true if the underlying call succeeds and false if it throws.
  function execute(string signature) internal returns (bool){
    bytes4 sig = bytes4(keccak256(signature));
    address self = address(this);
    return self.call(sig);
  }

  function createDataOrderWithInvalidPrice() internal {
    new DataOrder(
      buyerAddr,
      "age:20,gender:male",
      "data request",
      0,
      10,
      false,
      "Order T&C", 
      "https://buyer.example.com/data", 
      "public-key"
    );
  }

  function createDataOrderWithSenderAsBuyer() internal {
    new DataOrder(
      address(this),
      "age:20,gender:male",
      "data request",
      0,
      10,
      false,
      "Order T&C", 
      "https://buyer.example.com/data", 
      "public-key"
    );
  }

  function createDataOrderWithZeroAddressAsBuyer() internal {
    new DataOrder(
      address(0),
      "age:20,gender:male",
      "data request",
      0,
      10,
      false,
      "Order T&C", 
      "https://buyer.example.com/data", 
      "public-key"
    );
  }

  function createDataOrder() internal returns (address) {
    return new DataOrder(
      buyerAddr,
      "age:20,gender:male",
      "data request",
      20,
      10,
      false,
      "Order T&C", 
      "https://buyer.example.com/data", 
      "public-key"
    );
  }

  function testConstructor() public {
    Assert.isFalse(
      execute("createDataOrderWithInvalidPrice()"), 
      "Constructor should receive a valid price"
    );

    Assert.isFalse(
      execute("createDataOrderWithSenderAsBuyer()"), 
      "Buyer should not be the sender"
    );

    Assert.isFalse(
      execute("createDataOrderWithZeroAddressAsBuyer()"), 
      "Buyer should not be 0x0"
    );

    DataOrder order = DataOrder(createDataOrder());
    Assert.isTrue(
      order.owner() == address(this),
      "Test contract is the owner"
    );
  }

  function addNotaryWithSenderAsNotary() public {
    DataOrder order = DataOrder(createDataOrder());
    order.addNotary(address(this), 30, 10, "Notary T&C");
  }

  function addNotaryWithZeroAddressAsNotary() public {
    DataOrder order = DataOrder(createDataOrder());    
    order.addNotary(address(0), 30, 10, "Notary T&C");
  }

  function testAddNotary() public {
    DataOrder order = DataOrder(createDataOrder());

    Assert.isTrue(
      order.orderStatus() == DataOrder.OrderStatus.OrderCreated,
      "Order status should be consistent before adding notaries"
    );

    bool result = order.addNotary(notaryA, 30, 10, "Notary T&C");

    Assert.isTrue(result, "Order should be able to receive notaries");
    Assert.isTrue(
      order.orderStatus() == DataOrder.OrderStatus.NotaryAdded,
      "Order status should be consistent after adding notaries"
    );

    Assert.isFalse(
      execute("addNotaryWithSenderAsNotary()"), 
      "Notary should not be the sender"
    );

    Assert.isFalse(
      execute("addNotaryWithZeroAddressAsNotary()"), 
      "Notary should not be the zero address"
    );
  }
}
