pragma solidity ^0.4.15;

library AddressMap {

  struct MapStorage {
    mapping(address => uint) addressToIndex;
    mapping(uint => address) indexToAddress;
    uint size;
  }

  function get(MapStorage storage self, uint index) constant public returns (address) {
    require(index >= 0 && index < self.size);
    return self.indexToAddress[index];
  }

  function exist(MapStorage storage self, address _key) constant public returns (bool) {
    if (self.addressToIndex[_key] >= 0) {
      return true;
    }
    return false;
  }

  function insert(MapStorage storage self, address _key) public returns (bool) {
    self.addressToIndex[_key] = self.size;
    self.indexToAddress[self.size] = _key;
    self.size++;
    return true;
  }

  function removeAt(MapStorage storage self, uint index) public returns (bool) {
    return remove(self, self.indexToAddress[index]);
  }

  function remove(MapStorage storage self, address _key) public returns (bool) {
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

  function length(MapStorage storage self) constant public returns (uint) {
    return self.size;
  }
}