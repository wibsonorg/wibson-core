pragma solidity ^0.4.15;

import "truffle/Assert.sol";
import { MultiMap } from "../contracts/lib/MultiMap.sol";


contract TestMultiMap {
  MultiMap.MapStorage private _store;

  function testGet() public {
    MultiMap.exist(_store, 0); // TODO
  }

  function testExist() public {
    MultiMap.insert(_store, 0xC257274276a4E539741Ca11b590B9447B26A8051);

    bool t = MultiMap.exist(_store, 0xC257274276a4E539741Ca11b590B9447B26A8051);
    Assert.isTrue(t, "Key exists");

    bool f = MultiMap.exist(_store, 0x0);
    Assert.isFalse(f, "Key not exists");
  }

  function testInsert() public {
    bool b = MultiMap.insert(_store, 0xe0F5206bcD039e7B1392e8918821224E2A7437B9);
    Assert.isTrue(b, "Key inserted correctly");
  }

  function testRemoveAt() public {
    MultiMap.removeAt(_store, 0); // TODO
  }

  function testRemove() public {
    MultiMap.insert(_store, 0xC257274276a4E539741Ca11b590B9447B26A8051);

    bool t = MultiMap.exist(_store, 0xC257274276a4E539741Ca11b590B9447B26A8051);
    Assert.isTrue(t, "Key exists before removing");

    bool rt = MultiMap.remove(_store, 0xC257274276a4E539741Ca11b590B9447B26A8051);
    Assert.isTrue(rt, "Key removed correctly");

    bool rf = MultiMap.remove(_store, 0x0);
    Assert.isFalse(rf, "Return false if key not exists");

    bool f = MultiMap.exist(_store, 0xC257274276a4E539741Ca11b590B9447B26A8051);
    Assert.isFalse(f, "Key not exists after removing");
  }

  function testLength() public {
    MultiMap.insert(_store, 0xe0F5206bcD039e7B1392e8918821224E2A7437B9);
    MultiMap.insert(_store, 0xC257274276a4E539741Ca11b590B9447B26A8051);
    Assert.equal(MultiMap.length(_store), 2, "Correct length");

    MultiMap.remove(_store, 0xe0F5206bcD039e7B1392e8918821224E2A7437B9);
    MultiMap.remove(_store, 0xC257274276a4E539741Ca11b590B9447B26A8051);
    Assert.isZero(MultiMap.length(_store), "Length of empty map is zero");
  }

  function testToArray() public {
    MultiMap.toArray(_store); // TODO
  }

}
