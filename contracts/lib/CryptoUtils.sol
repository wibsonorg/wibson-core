pragma solidity ^0.4.21;

import "zeppelin-solidity/contracts/ECRecovery.sol";


/**
 * @title CryptoUtils
 * @author Cristian Adamo <cristian@wibson.org>
 * @dev Cryptographic utilities used by the Wibson protocol.
 * @notice In order to get the same hashes using `Web3` upon which the signatures
 *         are checked, you must use `web3.utils.soliditySha3` in v1.0 (or the
 *         homonymous function in the `web3-utils` package)
 *         http://web3js.readthedocs.io/en/1.0/web3-utils.html#utils-soliditysha3
 */
library CryptoUtils {

  /**
   * @dev Checks if the signature was created by the signer.
   * @param hash Hash of the data using the `keccak256` algorithm.
   * @param signer Signer address.
   * @param signature Signature over the hash.
   * @return Whether the signer is the one who signed the hash.
   */
  function isSignedBy(
    bytes32 hash,
    address signer,
    bytes signature
  ) private pure returns (bool) {
    require(signer != 0x0);
    bytes memory prefix = "\x19Ethereum Signed Message:\n32";
    bytes32 prefixedHash = keccak256(
      prefix, hash // TODO: use abi.encodePacked
    );
    address recovered = ECRecovery.recover(prefixedHash, signature);
    return recovered == signer;
  }

  /**
   * @dev Checks if the notary's signature to be added to the `DataOrder` is valid.
   * @param order Order address.
   * @param notary Notary's address.
   * @param responsesPercentage Percentage of `DataResponses` to audit per
   * `DataOrder`.
   * @param notarizationFee Fee to be charged per validation done.
   * @param notarySignature Off-chain Notary signature.
   */
  function isNotaryAdditionValid(
    address order,
    address notary,
    uint256 responsesPercentage,
    uint256 notarizationFee,
    bytes notarySignature
  ) public pure returns (bool) {
    require(order != 0x0);
    require(notary != 0x0);
    bytes32 hash = keccak256(
      /* abi.encodePacked( */ // TODO: fails on compile, abi not declared
        order,
        responsesPercentage,
        notarizationFee
      /* ) */
    );

    return isSignedBy(hash, notary, notarySignature);
  }

  /**
   * @dev Checks if the notary's signature to close the `DataResponse` is valid.
   * @param order Order address.
   * @param seller Seller address.
   * @param notary Notary address.
   * @param sender Sender address (usually will be the buyer address)
   * @param wasAudited Indicates whether the data was audited or not.
   * @param isDataValid Indicates the result of the audit, if happened.
   * @param notarySignature Off-chain Notary signature.
   */
  function isNotaryVeredictValid(
    address order,
    address seller,
    address notary,
    address sender,
    bool wasAudited,
    bool isDataValid,
    bytes notarySignature
  ) public pure returns (bool) {
    require(order != 0x0);
    require(seller != 0x0);
    require(notary != 0x0);
    require(sender != 0x0);
    bytes32 hash = keccak256(
      /* abi.encodePacked( */ // TODO: fails on compile, abi not declared
        order,
        seller,
        sender,
        wasAudited,
        isDataValid
      /* ) */
    );

    return isSignedBy(hash, notary, notarySignature);
  }
}
