pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/ECRecovery.sol";

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
   *            <sender address without leading 0x> +
   *            <notary's action:
   *              '01' if the seller was audited
   *              '00' if the seller was not audited
   *            > +
   *            <notary's veredict if seller was audited encoded as:
   *              '01' if data is valid
   *              '00' if data is invalid
   *            >
   *
   *         And set the encoding option as `hex`.
   * @param order Order address.
   * @param seller Seller address.
   * @param sender Sender address (usually will be se buyer address)
   * @param wasAudited Indicates whether the data was audited or not.
   * @param isDataValid Indicates the result of the audit, if happened.
   * @return Keccak265 hash of (the order + seller + sender + audit).
   */
  function hashData(
    address order,
    address seller,
    address sender,
    bool wasAudited,
    bool isDataValid
  ) public pure returns (bytes32) {
    require(order != 0x0);
    require(seller != 0x0);
    require(sender != 0x0);
    return keccak256(
      order,
      seller,
      sender,
      wasAudited,
      isDataValid
    );
  }

  /**
   * @dev Checks if the signature was created by the signer.
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
    bytes memory prefix = "\x19Ethereum Signed Message:\n32";
    bytes32 prefixedHash = keccak256(prefix, hash);
    address recovered = ECRecovery.recover(prefixedHash, signature);
    return recovered == signer;
  }
}
