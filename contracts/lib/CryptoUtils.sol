pragma solidity ^0.4.21;

import 'zeppelin-solidity/contracts/ECRecovery.sol';


/**
 * @title CryptoUtils
 * @author Cristian Adamo <cristian@wibson.org>
 * @dev Cryptographic utilities used by the Wibson protocol.
 */
library CryptoUtils {

  /**
   * @dev Hashes the given parameters using the `keccak256` algorithm.
   * @notice In order to get the same hash using `Web3` you must use `web3.sha3`
   *         function with the first parameter as follow:
   *            ('0x' +
   *            <order address without leading 0x> +
   *            <seller address without leading 0x> +
   *            <seller/buyer (sender) address without leading 0x> +
   *            <notary beredict (data is ok or not) encoded as:
   *              '01' as true
   *              '00' as false
   *            >
   *
   *         And set the encoding option as `hex`.
   * @param order Order address.
   * @param seller Seller address.
   * @param sender Sender address (usually will be se buyer address)
   * @param isValid Whether the notary beredict over the data was Ok or not.
   * @return
   */
  function hashData(
    address order,
    address seller,
    address sender,
    bool isValid
  ) public pure returns (bytes32) {
    require(order != 0x0);
    require(seller != 0x0);
    require(sender != 0x0);
    return keccak256(order, seller, sender, isValid);
  }

  /**
   * @dev Checks if the signer and signature for the give nhas came from the
   *      same address.
   * @param hash Hash of the data using the `keccak256` algorithm.
   * @param signer Signer address.
   * @param signature Signature over the hash.
   * @return Whether the signer is the same that signed the hash.
   */
  function isSignedBy(
    bytes32 hash,
    address signer,
    bytes signature
  ) public pure returns (bool) {
    require(signer != 0x0);
    // TODO(cristian): FIXME! This is a hack to satisfy geth.
    bytes memory prefix = "\x19Ethereum Signed Message:\n32";
    bytes32 prefixedHash = keccak256(prefix, hash);
    address recovered = ECRecovery.recover(prefixedHash, signature);
    return recovered == signer;
  }
}
