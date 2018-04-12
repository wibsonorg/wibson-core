pragma solidity ^0.4.21;


/**
 * @title ModifierUtils
 * @author Cristian Adamo <cristian@wibson.org>
 * @dev
 */
contract ModifierUtils {
  modifier validAddress(address addr) {
    require(addr != address(0));
    _;
  }
}
