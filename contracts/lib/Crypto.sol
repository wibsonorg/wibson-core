pragma solidity ^0.4.15;

import 'zeppelin-solidity/contracts/ECRecovery.sol';

library Crypto {

  function hashData(
    address order,
    address seller,
    address sender,
    bool isValid
  ) public view returns (bytes32) {
    require(order != 0x0);
    require(seller != 0x0);
    require(sender != 0x0);
    return sha256(bytes(order), bytes(seller), bytes(sender), bytes(isValid));
  }

  function isSignedBy(
    bytes32 hash,
    address signer,
    bytes signature
  ) public view returns (bool) {
    require(signer != 0x0);
    address recovered = ECRecovery.recover(hash, signature);
    return recovered == notary;
  }

  function verify(
    bytes32 hash,
    address signer,
    bytes signature
  ) public view returns (bool) {
    address recoveredAddr = isSignedBy(hash, signer, signature);
    return recovered == recoveredAddr;
  }
}
