pragma solidity ^0.4.15;

import './AddressMap.sol';
import './MultiMap.sol';

library ArrayUtils {

  function fromAddressMap(AddressMap.MapStorage storage store) internal view returns (address[]) {
    address[] memory rs = new address[](AddressMap.length(store));
    for(uint i = 0; i < AddressMap.length(store); i++) {
        rs[i] = AddressMap.get(store, i);
    }
    return rs;
  }

  function fromMultiMap(MultiMap.MapStorage storage store) internal view returns (address[]) {
    address[] memory rs = new address[](MultiMap.length(store));
    for(uint i = 0; i < MultiMap.length(store); i++) {
        rs[i] = MultiMap.get(store, i);
    }
    return rs;
  }

  function toMemory(address[] xs) internal pure returns (address[]) {
    address[] memory rs = new address[](xs.length);
    for(uint i = 0; i < xs.length; i++) {
        rs[i] = xs[i];
    }
    return rs;
  }

}
