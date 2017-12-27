pragma solidity ^0.4.15;

import './AddressMap.sol';

library ArrayUtils {

  function fromAddressMap(AddressMap.MapStorage storage store) internal constant returns (address[]) {
    address[] memory rs = new address[](AddressMap.length(store));
    for(uint i = 0; i < AddressMap.length(store); i++) {
        rs[i] = AddressMap.get(store, i);
    }
    return rs;
  }

  function toMemory(address[] xs) internal constant returns (address[]) {
    address[] memory rs = new address[](xs.length);
    for(uint i = 0; i < xs.length; i++) {
        rs[i] = xs[i];
    }
    return rs;
  }

}