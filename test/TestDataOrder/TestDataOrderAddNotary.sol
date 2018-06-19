pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import "../../contracts/DataOrder.sol";
import "../utils/TestUtils.sol";


contract TestDataOrderAddNotary {
  address private buyerAddr = 0x4bfaffCcc303c3572F82dc488373BFC0b106eB70;
  address private notaryA = 0x4753ee2bbD63e60CBF764E8d3Ed7C84522aD4EAd;

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

    /* Assert.isTrue(
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
      TestUtils.execute("addNotaryWithSenderAsNotary()"),
      "Notary should not be the sender"
    );

    Assert.isFalse(
      TestUtils.execute("addNotaryWithZeroAddressAsNotary()"),
      "Notary should not be the zero address"
    ); */
  }
}
