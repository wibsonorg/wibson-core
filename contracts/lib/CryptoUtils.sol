pragma solidity ^0.4.20;

import 'zeppelin-solidity/contracts/ECRecovery.sol';

library CryptoUtils {

  // order -> '0x992fe9dc1feb42d9a1d67bc050aad84c8187608c'
  // seller -> '0xd1545848dd9e5dabffec02ad2af46b5b21911f2f'
  // buyer -> '0xd2f0986605e0c77c3d921b8436829d0760324f0b'
  // valid -> true

  // hashData(
  //   '0x992fe9dc1feb42d9a1d67bc050aad84c8187608c',
  //   '0xd1545848dd9e5dabffec02ad2af46b5b21911f2f',
  //   '0xd2f0986605e0c77c3d921b8436829d0760324f0b',
  //   true
  // );
  // web3.sha3(
  //  '0x' +
  //  '992fe9dc1feb42d9a1d67bc050aad84c8187608c' +
  //  'd1545848dd9e5dabffec02ad2af46b5b21911f2f' +
  //  'd2f0986605e0c77c3d921b8436829d0760324f0b' +
  //  '01',
  //  { encoding: 'hex' }
  // );
  // => 0x566f713c838657b8dfda10ec1f0f8f11249b8b27482380862bb726f58ea22d55

  // Boolean:
  // - True (0x01): '0x5fe7f977e71dba2ea1a68e21057beebb9be2ac30c6410aa38d4f3fbe41dcffd2'
  // - False (0x00): '0xbc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a'

  function hashData(
    address order,
    address seller,
    address sender,
    bool isValid
  ) public pure returns (bytes32) {
    require(order != 0x0);
    require(seller != 0x0);
    require(sender != 0x0);
    return sha3(order, seller, sender, isValid);
  }

  function isSignedBy(
    bytes32 hash,
    address signer,
    bytes signature
  ) public pure returns (bool) {
    require(signer != 0x0);
    // TODO(cristian): FIXME! This is a hack to satisfy geth I guess.
    bytes memory prefix = "\x19Ethereum Signed Message:\n32";
    bytes32 prefixedHash = sha3(prefix, hash);
    address recovered = ECRecovery.recover(prefixedHash, signature);
    return recovered == signer;
  }
}
