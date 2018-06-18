pragma solidity ^0.4.24;


/**
 * @title TestUtils
 * @author Wibson Development Team <developers@wibson.org>
 * @dev Internal testing utilities.
 */
library TestUtils {

  // A little utility that runs a wrapped method invocation as an internal Solidity call
  // Returns true if the underlying call succeeds and false if it throws.

  /**
   * @dev Runs a wrapped method invocation as an internal Solidity call.
   * @param signature Signature of the function to be executed.
   * @return True if the underlying call succeeds, false if not.
   */
  function execute(address self, string signature) internal returns (bool){
    bytes4 sig = bytes4(
      keccak256(abi.encodePacked(signature))
      );
    return self.call(sig);
  }
}
