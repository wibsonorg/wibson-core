pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import "../../contracts/DataOrder.sol";
import "../utils/TestUtils.sol";


contract TestDataOrderConstructor {
  address private buyerAddr = 0x4bfaffccc303c3572f82dc488373bfc0b106eb70;
  address private notaryA = 0x4753ee2bbd63e60cbf764e8d3ed7c84522ad4ead;

  function createDataOrderWithInvalidPrice() internal {
    new DataOrder(
      buyerAddr,
      "age:20,gender:male",
      "data request",
      0,
      10,
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
      "Order T&C",
      "https://buyer.example.com/data",
      "public-key"
    );
  }

  function testConstructor() public {
    Assert.isFalse(
      TestUtils.execute("createDataOrderWithInvalidPrice()"),
      "Constructor should receive a valid price"
    );

    Assert.isFalse(
      TestUtils.execute("createDataOrderWithSenderAsBuyer()"),
      "Buyer should not be the sender"
    );

    Assert.isFalse(
      TestUtils.execute("createDataOrderWithZeroAddressAsBuyer()"),
      "Buyer should not be 0x0"
    );

    DataOrder order = DataOrder(createDataOrder());
    Assert.isTrue(
      order.owner() == address(this),
      "Test contract is the owner"
    );
  }
}
