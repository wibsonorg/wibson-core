pragma solidity ^0.4.21;

import "truffle/Assert.sol";
import "../contracts/lib/CryptoUtils.sol";


contract TestCryptoUtils {

  function testHashData() public {
    bytes32 h1 = CryptoUtils.hashData(
      0xe0F5206bcD039e7B1392e8918821224E2A7437B9,
      0xC257274276a4E539741Ca11b590B9447B26A8051,
      0x5521a68D4F8253fC44BFb1490249369b3E299A4A,
      false
    );

    bytes32 h2 = CryptoUtils.hashData(
      0xe0F5206bcD039e7B1392e8918821224E2A7437B9,
      0xC257274276a4E539741Ca11b590B9447B26A8051,
      0x5521a68D4F8253fC44BFb1490249369b3E299A4A,
      true
    );

    Assert.isNotZero(h1, "Should hash data correctly");
    Assert.isNotZero(h2, "Should hash data correctly");
  }

  function testIsSignedBy() public {
    bool t = CryptoUtils.isSignedBy(
      "TODO",
      0xe0F5206bcD039e7B1392e8918821224E2A7437B9,
      "TODO"
    );

    Assert.isFalse(t, "TODO");
  }

}
