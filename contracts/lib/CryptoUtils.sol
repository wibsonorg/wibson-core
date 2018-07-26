pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/ECRecovery.sol";


/**
 * @title CryptoUtils
 * @author Wibson Development Team <developers@wibson.org>
 * @notice Cryptographic utilities used by the Wibson protocol.
 * @dev In order to get the same hashes using `Web3` upon which the signatures
 *      are checked, you must use `web3.utils.soliditySha3` in v1.0 (or the
 *      homonymous function in the `web3-utils` package)
 *      http://web3js.readthedocs.io/en/1.0/web3-utils.html#utils-soliditysha3
 */
library CryptoUtils {

  /**
   * @notice Checks if the signature was created by the signer.
   * @param hash Hash of the data using the `keccak256` algorithm.
   * @param signer Signer address.
   * @param signature Signature over the hash.
   * @return true if `signer` is the one who signed the `hash`, false otherwise.
   */
  function isSignedBy(
    bytes32 hash,
    address signer,
    bytes signature
  ) private pure returns (bool) {
    require(signer != address(0));
    bytes32 prefixedHash = ECRecovery.toEthSignedMessageHash(hash);
    address recovered = ECRecovery.recover(prefixedHash, signature);
    return recovered == signer;
  }

  /**
   * @notice Checks if the notary's signature to be added to the DataOrder is valid.
   * @param order Order address.
   * @param notary Notary address.
   * @param responsesPercentage Percentage of DataResponses to audit per DataOrder.
   * @param notarizationFee Fee to be charged per validation done.
   * @param notarizationTermsOfService Notary terms and conditions for the order.
   * @param notarySignature Off-chain Notary signature.
   * @return true if `notarySignature` is valid, false otherwise.
   */
  function isNotaryAdditionValid(
    address order,
    address notary,
    uint256 responsesPercentage,
    uint256 notarizationFee,
    string notarizationTermsOfService,
    bytes notarySignature
  ) public pure returns (bool) {
    require(order != address(0));
    require(notary != address(0));
    bytes32 hash = keccak256(
      abi.encodePacked(
        order,
        responsesPercentage,
        notarizationFee,
        notarizationTermsOfService
      )
    );

    return isSignedBy(hash, notary, notarySignature);
  }

  /**
   * @notice Checks if the parameters passed correspond to the seller's signature used.
   * @param order Order address.
   * @param seller Seller address.
   * @param notary Notary address.
   * @param dataHash Hash of the data that must be sent, this is a SHA256.
   * @param signature Signature of DataResponse.
   * @return true if arguments are signed by the `seller`, false otherwise.
   */
  function isDataResponseValid(
    address order,
    address seller,
    address notary,
    string dataHash,
    bytes signature
  ) public pure returns (bool) {
    require(order != address(0));
    require(seller != address(0));
    require(notary != address(0));

    bytes memory packed = bytes(dataHash).length > 0
      ? abi.encodePacked(order, notary, dataHash)
      : abi.encodePacked(order, notary);

    bytes32 hash = keccak256(packed);
    return isSignedBy(hash, seller, signature);
  }

  /**
   * @notice Checks if the notary's signature to close the `DataResponse` is valid.
   * @param order Order address.
   * @param seller Seller address.
   * @param notary Notary address.
   * @param wasAudited Indicates whether the data was audited or not.
   * @param isDataValid Indicates the result of the audit, if happened.
   * @param notarySignature Off-chain Notary signature.
   * @return true if `notarySignature` is valid, false otherwise.
   */
  function isNotaryVeredictValid(
    address order,
    address seller,
    address notary,
    bool wasAudited,
    bool isDataValid,
    bytes notarySignature
  ) public pure returns (bool) {
    require(order != address(0));
    require(seller != address(0));
    require(notary != address(0));
    bytes32 hash = keccak256(
      abi.encodePacked(
        order,
        seller,
        wasAudited,
        isDataValid
      )
    );

    return isSignedBy(hash, notary, notarySignature);
  }
}
