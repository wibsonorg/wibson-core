pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title MultiMap
 * @author Wibson Development Team <developers@wibson.org>
 * @notice An address `MultiMap`.
 * @dev `MultiMap` is useful when you need to keep track of a set of addresses.
 */
library MultiMap {

  struct MapStorage {
    mapping(address => uint) addressToIndex;
    address[] addresses;
  }

  /**
   * @notice Retrieves a address from the given `MapStorage` using a index Key.
   * @param self `MapStorage` where the index must be searched.
   * @param index Index to find.
   * @return Address of the given Index.
   */
  function get(
    MapStorage storage self,
    uint index
  ) public view returns (address) {
    require(index < self.addresses.length);
    return self.addresses[index];
  }

  /**
   * @notice Checks if the given address exists in the storage.
   * @param self `MapStorage` where the key must be searched.
   * @param _key Address to find.
   * @return true if `_key` exists in the storage, false otherwise.
   */
  function exist(
    MapStorage storage self,
    address _key
  ) public view returns (bool) {
    if (_key != address(0)) {
      uint targetIndex = self.addressToIndex[_key];
      return targetIndex < self.addresses.length && self.addresses[targetIndex] == _key;
    } else {
      return false;
    }
  }

  /**
   * @notice Inserts a new address within the given storage.
   * @param self `MapStorage` where the key must be inserted.
   * @param _key Address to insert.
   * @return true if `_key` was added, reverts otherwise.
   */
  function insert(
    MapStorage storage self,
    address _key
  ) public returns (bool) {
    require(_key != address(0));
    if (exist(self, _key)) {
      return true;
    }

    self.addressToIndex[_key] = self.addresses.length;
    self.addresses.push(_key);

    return true;
  }

  /**
   * @notice Removes the given index from the storage.
   * @param self MapStorage` where the index lives.
   * @param index Index to remove.
   * @return true if address at `index` was removed, false otherwise.
   */
  function removeAt(MapStorage storage self, uint index) public returns (bool) {
    return remove(self, self.addresses[index]);
  }

  /**
   * @notice Removes the given address from the storage.
   * @param self `MapStorage` where the address lives.
   * @param _key Address to remove.
   * @return true if `_key` was removed, false otherwise.
   */
  function remove(MapStorage storage self, address _key) public returns (bool) {
    require(_key != address(0));
    if (!exist(self, _key)) {
      return false;
    }

    uint currentIndex = self.addressToIndex[_key];

    uint lastIndex = SafeMath.sub(self.addresses.length, 1);
    address lastAddress = self.addresses[lastIndex];
    self.addressToIndex[lastAddress] = currentIndex;
    self.addresses[currentIndex] = lastAddress;

    delete self.addresses[lastIndex];
    delete self.addressToIndex[_key];

    self.addresses.length--;
    return true;
  }

  /**
   * @notice Gets the current length of the Map.
   * @param self `MapStorage` to get the length from.
   * @return The length of the MultiMap.
   */
  function length(MapStorage storage self) public view returns (uint) {
    return self.addresses.length;
  }
}
