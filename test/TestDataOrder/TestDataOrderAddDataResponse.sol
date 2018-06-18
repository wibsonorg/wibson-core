pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import "../../contracts/DataOrder.sol";
import "../utils/TestUtils.sol";


contract TestDataOrderAddDataResponse {
  address private buyer = 0x4bfaffCcc303c3572F82dc488373BFC0b106eB70;
  address private notary = 0x4753ee2bbD63e60CBF764E8d3Ed7C84522aD4EAd;
  address private inexistentNotary = 0x4753Ee2BBD63e60CBf764e8D3ED7c84522AD4123;
  address private seller = 0x4753eE2BBd63e60CbF764E8D3ED7C84522ad4Ea2;
  string private dataHash = "0x4753ee2badcef214321566198398159e60cbf764e8d3ed7c84522ad4ea2";
  bytes private signature = hex"4931ac3b001414eeff2c"; // TODO
  bytes private invalidSignature = hex"4931ac3b001414eeff2c";
  bytes private emptyDataHashSignature = hex"4931ac3b001414eeff2c"; // TODO

  DataOrder orderWithoutNotary;
  DataOrder order;

  function createDataOrder() private returns (DataOrder) {
    address orderAddress = new DataOrder(
      buyer,
      "age:20,gender:male",
      "data request",
      20,
      10,
      "Order T&C",
      "https://buyer.example.com/data",
      "public-key"
    );
    return DataOrder(orderAddress);
  }

  function beforeEach() public {
    orderWithoutNotary = createDataOrder();
    order = createDataOrder();
    order.addNotary(
      notary,
      10,
      1,
      "terms"
    );
  }

  function onClosedDataOrder() public {
    order.close();
    order.addDataResponse(
      seller,
      notary,
      dataHash,
      signature
    );
  }

  function testOnClosedDataOrder() public {
    Assert.isFalse(
      TestUtils.execute(this, "onClosedDataOrder()"),
      "Data Response should not be added on closed order"
    );
  }

  function addressZeroSeller() public {
    order.addDataResponse(
      0x0,
      notary,
      dataHash,
      signature
    );
  }

  function testAddressZeroSeller() public {
    Assert.isFalse(
      TestUtils.execute(this, "addressZeroSeller()"),
      "Data Response should not be added with 0x0 as seller"
    );
  }

  function addressDataOrderAsSeller() public {
    order.addDataResponse(
      address(order),
      notary,
      dataHash,
      signature
    );
  }

  function testAddressDataOrderAsSeller() public {
    Assert.isFalse(
      TestUtils.execute(this, "addressDataOrderAsSeller()"),
      "Data Response should not be added with data order address as seller"
    );
  }

  function addressZeroNotary() public {
    order.addDataResponse(
      seller,
      0x0,
      dataHash,
      signature
    );
  }

  function testAddressZeroNotary() public {
    Assert.isFalse(
      TestUtils.execute(this, "addressZeroNotary()"),
      "Data Response should not be added with 0x0 as notary"
    );
  }

  function addressDataOrderAsNotary() public {
    order.addDataResponse(
      seller,
      address(order),
      dataHash,
      signature
    );
  }

  function testAddressDataOrderAsNotary() public {
    Assert.isFalse(
      TestUtils.execute(this, "addressDataOrderAsNotary()"),
      "Data Response should not be added with data order address as notary"
    );
  }

  function addInexistentNotary() public {
    order.addDataResponse(
      seller,
      inexistentNotary,
      dataHash,
      signature
    );
  }

  function testAddInexistentNotary() public {
    Assert.isFalse(
      TestUtils.execute(this, "addInexistentNotary()"),
      "Data Response should not be added with an inexistent notary"
    );
  }

  function addASellerTwice() public {
    order.addDataResponse(
      seller,
      notary,
      dataHash,
      signature
    );
    order.addDataResponse(
      seller,
      notary,
      dataHash,
      signature
    );
  }

  function testAddASellerTwice() public {
    Assert.isFalse(
      TestUtils.execute(this, "addASellerTwice()"),
      "Data Response should not be added twice"
    );
  }

  function useInvalidSignature() public {
    order.addDataResponse(
      seller,
      notary,
      dataHash,
      invalidSignature
    );
  }

  function testUseInvalidSignature() public {
    Assert.isFalse(
      TestUtils.execute(this, "useInvalidSignature()"),
      "Data Response should not be added with an invalid signature"
    );
  }

  function callNotByOwner() public { // TODO
    order.addDataResponse(
      seller,
      notary,
      dataHash,
      signature
    );
  }

  function testCallNotByOwner() public {
    Assert.isFalse(
      TestUtils.execute(this, "callNotByOwner()"),
      "Data Response should not be added by someone who is not the owner"
    );
  }

  function addWithExistingNotary() public {
    order.addDataResponse(
      seller,
      notary,
      dataHash,
      signature
    );
  }

  function testAddWithExistingNotary() public {
    Assert.isTrue(
      TestUtils.execute(this, "addWithExistingNotary()"),
      "Data Response should be added with the existing notary"
    );
  }

  function addWithEmptyDataHash() public {
    order.addDataResponse(
      seller,
      notary,
      "",
      emptyDataHashSignature
    );
  }

  function testAddWithEmptyDataHash() public {
    Assert.isTrue(
      TestUtils.execute(this, "addWithEmptyDataHash()"),
      "Data Response should be added with an empty data hash"
    );
  }


}
