pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title MultiMap
 * @author Cristian Adamo <cristian@wibson.org>
 * @dev An address `MultiMap`, that allows to get elements using an address or
 *      the assigned index.
 *      `MultiMap` is useful when you need to keep track of a set of addresses.
 */
library MultiMap {

  struct MapStorage {
    mapping(address => uint) addressToIndex;
    mapping(uint => address) indexToAddress;
    uint size;
  }

  /**
   * @dev Retrieves a address from the given `MapStorage` using a index Key.
   * @param self `MapStorage` where the index must be searched.
   * @param index Index to find.
   * @return Address of the given Index.
   */
  function get(
    MapStorage storage self,
    uint index
  ) public view returns (address) {
    require(index < self.size);
    return self.indexToAddress[index];
  }

  /**
   * @dev Checks if the given address exists in the storage.
   * @param self `MapStorage` where the key must be searched.
   * @param _key Address to find.
   * @return Index of the given Address.
   */
  function exist(
    MapStorage storage self,
    address _key
  ) public view returns (bool) {
    if (_key != address(0)) {
      uint targetIndex = self.addressToIndex[_key];
      return self.indexToAddress[targetIndex] == _key;
    } else {
      return false;
    }
  }

  /**
   * @dev Inserts a new address within the given storage.
   * @param self `MapStorage` where the key must be inserted.
   * @param _key Address to insert.
   * @return Whether the address was added or not.
   */
  function insert(
    MapStorage storage self,
    address _key
  ) public returns (bool) {
    require(_key != address(0));
    if (exist(self, _key)) {
      return true;
    }

    self.addressToIndex[_key] = self.size;
    self.indexToAddress[self.size] = _key;
    self.size++;

    return true;
  }

  /**
   * @dev Removes the given index from the storage.
   * @param self MapStorage` where the index lives.
   * @param index Index to remove.
   * @return Whether the index was removed or not.
   */
  function removeAt(MapStorage storage self, uint index) public returns (bool) {
    return remove(self, self.indexToAddress[index]);
  }

  /**
   * @dev Removes the given address from the storage.
   * @param self `MapStorage` where the address lives.
   * @param _key Address to remove.
   * @return Whether the address was removed or not.
   */
  function remove(MapStorage storage self, address _key) public returns (bool) {
    require(_key != address(0));
    if (!exist(self, _key)) {
      return false;
    }

    uint currentIndex = self.addressToIndex[_key];

    uint lastIndex = SafeMath.sub(self.size, 1);
    address lastAddress = self.indexToAddress[lastIndex];
    self.addressToIndex[lastAddress] = currentIndex;
    self.indexToAddress[currentIndex] = lastAddress;

    delete self.indexToAddress[lastIndex];
    delete self.addressToIndex[_key];

    self.size--;
    return true;
  }

  /**
   * @dev Gets the current length of the Map.
   * @param self `MapStorage` to get the length from.
   * @return Length.
   */
  function length(MapStorage storage self) public view returns (uint) {
    return self.size;
  }

  /**
   * @dev Converts a `MultiMap` of addresses into a memory array of addresses.
   * @param self `MultiMap` storage to convert.
   * @return A memory array of addresses.
   */
  function toArray(
    MapStorage storage self
  ) internal view returns (address[]) {
    address[] memory rs = new address[](length(self));
    for (uint i = 0; i < length(self); i++) {
      rs[i] = get(self, i);
    }
    return rs;
  }
}
