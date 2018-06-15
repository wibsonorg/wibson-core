pragma solidity ^0.4.24;


/**
 * @title ModifierUtils
 * @author Cristian Adamo <cristian@wibson.org>
 * @dev  <add-info>
 */
contract ModifierUtils {
  modifier validAddress(address addr) {
    require(addr != address(0));
    _;
  }
}
