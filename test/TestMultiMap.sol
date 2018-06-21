pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import { MultiMap } from "../contracts/lib/MultiMap.sol";


contract TestMultiMap {
  MultiMap.MapStorage store;

  function testExist() public {
    bool f = MultiMap.exist(store, 0xb2930B35844a230f00E51431aCAe96Fe543a0347);
    Assert.isFalse(f, "Key should not exist");

    bool f2 = MultiMap.exist(store, address(0));
    Assert.isFalse(f2, "0x0 address never exists");

    MultiMap.insert(store, 0xC257274276a4E539741Ca11b590B9447B26A8051);

    bool t = MultiMap.exist(store, 0xC257274276a4E539741Ca11b590B9447B26A8051);
    Assert.isTrue(t, "Key should exist");
  }

  function testInsert() public {
    bool b1 = MultiMap.insert(store, 0xe0F5206bcD039e7B1392e8918821224E2A7437B9);
    Assert.isTrue(b1, "Key was not inserted correctly");

    bool b2 = MultiMap.insert(store, 0xe0F5206bcD039e7B1392e8918821224E2A7437B9);
    Assert.isTrue(b2, "Duplicated Key did not return true");
  }

  function testGet() public {
    address addr = 0xe0F5206bcD039e7B1392e8918821224E2A7437B9;
    address storedAddress = MultiMap.get(store, 1);
    Assert.equal(storedAddress, addr, "Inserted key does not match original one");
  }

  function testRemoveAt() public {
    address addr = 0xC257274276a4E539741Ca11b590B9447B26A8051;
    bool b = MultiMap.removeAt(store, 0);
    Assert.isTrue(b, "Key was not removed correctly");
    bool t = MultiMap.exist(store, addr);
    Assert.isFalse(t, "Removed key should not exist");
  }

  function testRemove() public {
    address addr = 0xe0F5206bcD039e7B1392e8918821224E2A7437B9;
    bool rt = MultiMap.remove(store, addr);
    Assert.isTrue(rt, "Key was not removed correctly");

    bool f = MultiMap.exist(store, addr);
    Assert.isFalse(f, "Key should not exist after removing it");

    bool rf = MultiMap.remove(store, 0xb2930B35844a230f00E51431aCAe96Fe543a0347);
    Assert.isFalse(rf, "Should return false if key not exists");
  }

  function testLength() public {
    Assert.isZero(MultiMap.length(store), "Length of empty map should be zero");

    MultiMap.insert(store, 0xC257274276a4E539741Ca11b590B9447B26A8051);
    Assert.equal(MultiMap.length(store), 1, "Length should be one");
  }

}
