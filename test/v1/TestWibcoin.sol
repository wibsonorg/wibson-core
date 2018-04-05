pragma solidity ^0.4.15;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../../contracts/v1/Wibcoin.sol";

contract TestWibcoin {

  Wibcoin deployedWibcoin;
  Wibcoin newWibcoin;

  function beforeEach() {
    deployedWibcoin = Wibcoin(DeployedAddresses.Wibcoin());
    newWibcoin = new Wibcoin();
  }

  function testDecimals() public {
    uint expected = 9;

    Assert.equal(deployedWibcoin.decimals(), expected, "Deployed Wibcoin should have 9 decimals.");
    Assert.equal(newWibcoin.decimals(), expected, "New Wibcoin should have 9 decimals.");
  }

  function testInitialBalance() public {
    uint256 expected = 9000000000;

    Assert.equal(deployedWibcoin.getBalance(tx.origin), expected, "Deployed Wibcoin owner should have 9 billion WIB initially");
    Assert.equal(newWibcoin.getBalance(tx.origin), expected, "New Wibcoin owner should have 9 billion WIB initially");
  }

  function testName() public {
    string expected = "Wibcoin";

    Assert.equal(deployedWibcoin.name(), expected, "Deployed Wibcoin should be named 'Wibcoin'");
    Assert.equal(newWibcoin.name(), expected, "New Wibcoin owner should be named 'Wibcoin'");
  }

  function testSymbol() public {
    string expected = "WIB";

    Assert.equal(deployedWibcoin.symbol(), expected, "Deployed Wibcoin symbol should be 'WIB'");
    Assert.equal(newWibcoin.symbol(), expected, "New Wibcoin symbol should be 'WIB'");
  }


}
