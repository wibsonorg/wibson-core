pragma solidity ^0.4.15;

library AddressMap {

  struct MapStorage {
    mapping(address => uint) addressToIndex;
    mapping(uint => address) indexToAddress;
    uint size;
  }

  function get(MapStorage storage self, uint index) constant returns (address) {
    require(index >= 0);
    return self.indexToAddress[index];
  }

  function exist(MapStorage storage self, address _key) constant returns (bool) {
    return self.addressToIndex[_key] >= 0;
  }

  function insert(MapStorage storage self, address _key) returns (bool) {
    // if (exist(self, _key)) {
    //   return true;
    // }

    self.addressToIndex[_key] = self.size;
    self.indexToAddress[self.size] = _key;
    self.size++;

    return true;
  }

  function removeAt(MapStorage storage self, uint index) returns (bool) {
    return remove(self, self.indexToAddress[index]);
  }

  function remove(MapStorage storage self, address _key) returns (bool) {
    var currentIndex = self.addressToIndex[_key];

    var lastIndex = self.size--;
    var lastAddress = self.indexToAddress[lastIndex];
    self.addressToIndex[lastAddress] = currentIndex;
    self.indexToAddress[currentIndex] = lastAddress;

    delete self.indexToAddress[lastIndex];
    delete self.addressToIndex[_key];

    self.size--;
    return true;
  }

  function length(MapStorage storage self) constant returns (uint) {
    return self.size;
  }
}