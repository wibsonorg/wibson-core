pragma solidity ^0.4.15;

contract ModifierUtils {
  modifier validAddress(address addr) {
    require(addr != address(0));
    _;
  }
}
