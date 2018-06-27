pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import "../contracts/lib/CryptoUtils.sol";


contract TestCryptoUtils {

  function testNotaryAdditionValidSignature() public {
    bytes memory sig = hex"4931ac3b001414eeff2cdc53594760d79effd30daf7da79a5bcb2a2ee2c9dbd559721d836efe404bc38e07149928e582e15c24cc99cd99f93ec8adebda4e431601";

    bool result = CryptoUtils.isNotaryAdditionValid(
      0xb254a7f02AAc0bfFa319f968BDA5566D3117E277,
      0xD1c0Bdbc093136D671468b908bDbdA54c674712E,
      30,
      1,
      "Notary Terms and Conditions",
      sig
    );
    Assert.isTrue(result, "Notary addition signature should be valid");
  }

  function testNotaryAdditionInvalidSignature() public {
    bool result = CryptoUtils.isNotaryAdditionValid(
      0X28955C3CF5FF9CD9DC557D5A4B90730031775743,
      0xe0F5206bcD039e7B1392e8918821224E2A7437B9,
      30,
      1,
      "Notary Terms and Conditions",
      "notASignature"
    );
    Assert.isFalse(result, "Notary addition signature should be invalid");
  }

  function testDataResponseValidSignature() public {
    bytes memory sig = hex"d9eb02dd4ed39dcc14f052c7bf5203626ae608250f4e0af4efbc979c4e008d532e35704cce86ae395bfede776daae7f408fdbd1b942ee75cf9a8f2203683695d01";

    bool result = CryptoUtils.isDataResponseValid(
      0x23b282e363D766831c3E94217bB16Ec7ce31a93D,
      0xc58d64b0f59F0b81591b6A81F61e6A52b2013338,
      0xdD7140a3657eF6B497E9612dACAd594338B7Fa15,
      "9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d",
      sig
    );
    Assert.isTrue(result, "Data Response signature should be valid");
  }

  function testDataResponseInvalidSignature() public {
    bool result = CryptoUtils.isDataResponseValid(
      0x23b282e363D766831c3E94217bB16Ec7ce31a93D,
      0xc58d64b0f59F0b81591b6A81F61e6A52b2013338,
      0xdD7140a3657eF6B497E9612dACAd594338B7Fa15,
      "9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d",
      "notASignature"
    );
    Assert.isFalse(result, "Data Response signature should be invalid");
  }

  function testNotaryVeredictValidSignature() public {
    bytes memory sig = hex"045588125d9551ea16f0387d33d6146acdaa5102b531a0e6260cb97b52201ce33391112b8966798ac91897774c4a856b518cdcbd2a79ac88df1bd1e9db5e5e6000";

    bool result = CryptoUtils.isNotaryVeredictValid(
      0xb254a7f02AAc0bfFa319f968BDA5566D3117E277,
      0x63Dc6dd340Ee392bA126b0578F15fE2C404E66E4,
      0xD1c0Bdbc093136D671468b908bDbdA54c674712E,
      true,
      true,
      sig
    );
    Assert.isTrue(result, "Notary veredict signature should be valid");
  }

  function testNotaryVeredictInvalidSignature() public {
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
