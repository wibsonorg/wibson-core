pragma solidity ^0.4.21;


/**
 * @title MultiMap
 * @author Cristian Adamo <cristian@wibson.org>
 * @dev
 */
library MultiMap {

  struct MapStorage {
    mapping(address => uint) addressToIndex;
    mapping(uint => address) indexToAddress;
    uint size;
  }

  /**
   * @dev
   * @param self
   * @param index
   * @return
   */
  function get(
    MapStorage storage self,
    uint index
  ) public view returns (address) {
    require(index >= 0 && index < self.size);
    return self.indexToAddress[index];
  }

  /**
   * @dev
   * @param self
   * @param _key
   * @return
   */
  function exist(
    MapStorage storage self,
    address _key
  ) public view returns (bool) {
    return self.addressToIndex[_key] > 0;
  }

  /**
   * @dev
   * @param self
   * @param _key
   * @return
   */
  function insert(
    MapStorage storage self,
    address _key
  ) public returns (bool) {
    if (exist(self, _key)) {
       return true;
    }

    self.addressToIndex[_key] = self.size;
    self.indexToAddress[self.size] = _key;
    self.size++;

    return true;
  }

  /**
   * @dev
   * @param self
   * @param index
   * @return
   */
  function removeAt(MapStorage storage self, uint index) public returns (bool) {
    return remove(self, self.indexToAddress[index]);
  }

  /**
   * @dev
   * @param self
   * @param _key
   * @return
   */
  function remove(MapStorage storage self, address _key) public returns (bool) {
    uint currentIndex = self.addressToIndex[_key];

    uint lastIndex = self.size - 1;
    address lastAddress = self.indexToAddress[lastIndex];
    self.addressToIndex[lastAddress] = currentIndex;
    self.indexToAddress[currentIndex] = lastAddress;

    delete self.indexToAddress[lastIndex];
    delete self.addressToIndex[_key];

    self.size--;
    return true;
  }

  /**
   * @dev
   * @param self
   * @return
   */
  function length(MapStorage storage self) public view returns (uint) {
    return self.size;
  }
}
