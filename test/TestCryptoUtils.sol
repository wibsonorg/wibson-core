pragma solidity ^0.4.21;

import "truffle/Assert.sol";
import "../contracts/lib/CryptoUtils.sol";


contract TestCryptoUtils {

  function testNotaryAdditionValidSignature() public {
    bytes memory sig = hex"8e9d6bf12454045bfe97697d0c3523b14d2d6b520c9957601dbcb635391c41941c2d65bde9f9d738e16027c99529ba0e4f9de6bf14d7d4856d3c33c81f19051500";

    bool result = CryptoUtils.isNotaryAdditionValid(
      0x29716E075f5E40f276b7102348f24F6bd69B16E3,
      0xDCE4f4062f834578f32dD31D4FAc039428cCF64F,
      30,
      1,
      sig
    );
    Assert.isTrue(result, "Notary addition signature should be valid");
  }

  function testNotaryAdditionInValidSignature() public {
    bool result = CryptoUtils.isNotaryAdditionValid(
      0X28955C3CF5FF9CD9DC557D5A4B90730031775743,
      0xe0F5206bcD039e7B1392e8918821224E2A7437B9,
      30,
      1,
      "notASignature"
    );
    Assert.isFalse(result, "Notary addition signature should be invalid");
  }

  function testNotaryVeredictValidSignature() public {
    bytes memory sig = hex"b03017c2e70a768de8944ba5e07b6cffd191cc73a63e11c6a3d3c37184b8c8b677a4311b0babfc6c5736b9b0ca6fc6ccddabc1c9a43c8090f1d68fd12181b5c200";

    bool result = CryptoUtils.isNotaryVeredictValid(
      0x29716E075f5E40f276b7102348f24F6bd69B16E3,
      0x8c7c8D0A884a6dE1D807d750eC0d6F4Bb1682131,
      0x624cd72975D9683b52222245254835CD82D22f2a,
      false,
      false,
      sig
    );
    Assert.isTrue(result, "Notary veredict signature should be valid");
  }

  function testNotaryVeredictInValidSignature() public {
    bool result = CryptoUtils.isNotaryVeredictValid(
      0X28955C3CF5FF9CD9DC557D5A4B90730031775743,
      0xe0F5206bcD039e7B1392e8918821224E2A7437B9,
      0xe0F5206bcD039e7B1392e8918821224E2A7437B9,
      true,
      true,
      "notASignature"
    );
    Assert.isFalse(result, "Notary veredict signature should be invalid");
  }

}
