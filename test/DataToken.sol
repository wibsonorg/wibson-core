pragma solidity ^0.4.11;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/DataToken.sol";

contract TestDataToken {

  function testItStoresAValue() {
    DeployedAddresses.DataToken()
    DataToken dataToken = DataToken();

    dataToken.set(89);

    uint expected = 89;

    Assert.equal(dataToken.get(), expected, "It should store the value 89.");
  }

}