pragma solidity ^0.4.15;

import './AddressMap.sol';
import './MultiMap.sol';


/**
 * @title ArrayUtils
 * @author Cristian Adamo <cristian@wibson.org>
 * @dev
 */
library ArrayUtils {

  /**
   * @dev
   * @param store
   * @return
   */
  function fromAddressMap(
    AddressMap.MapStorage storage store
  ) internal view returns (address[]) {
    address[] memory rs = new address[](AddressMap.length(store));
    for(uint i = 0; i < AddressMap.length(store); i++) {
        rs[i] = AddressMap.get(store, i);
    }
    return rs;
  }

  /**
   * @dev
   * @param store
   * @return
   */
  function fromMultiMap(
    MultiMap.MapStorage storage store
  ) internal view returns (address[]) {
    address[] memory rs = new address[](MultiMap.length(store));
    for(uint i = 0; i < MultiMap.length(store); i++) {
        rs[i] = MultiMap.get(store, i);
    }
    return rs;
  }

  /**
   * @dev
   * @param xs
   * @return
   */
  function toMemory(address[] xs) internal pure returns (address[]) {
    address[] memory rs = new address[](xs.length);
    for(uint i = 0; i < xs.length; i++) {
        rs[i] = xs[i];
    }
    return rs;
  }

}
