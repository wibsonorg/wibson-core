pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import "../../contracts/DataOrder.sol";
import "../utils/TestUtils.sol";


contract TestDataOrderConstructor {
  address private buyerAddr = 0x4bfaffCcc303c3572F82dc488373BFC0b106eB70;
  address private notaryA = 0x4753ee2bbD63e60CBF764E8d3Ed7C84522aD4EAd;

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
    /* Assert.isFalse(
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
    ); */
  }
}
