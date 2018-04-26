pragma solidity ^0.4.21;

import "./MultiMap.sol";


/**
 * @title ArrayUtils
 * @author Cristian Adamo <cristian@wibson.org>
 * @dev Helper functions to manipulate Arrays.
 */
library ArrayUtils {

  /**
   * @dev Converts a `MultiMap` of addresses into a memory array of addresses.
   * @param store `MultiMap` storage to convert.
   * @return A memory array of addresses.
   */
  function fromMultiMap(
    MultiMap.MapStorage storage store
  ) internal view returns (address[]) {
    address[] memory rs = new address[](MultiMap.length(store));
    for (uint i = 0; i < MultiMap.length(store); i++) {
      rs[i] = MultiMap.get(store, i);
    }
    return rs;
  }

}
