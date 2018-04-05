var Wibcoin = artifacts.require("./Wibcoin.sol");

contract('Wibcoin', function(accounts) {

  it("owner should have the balance equal to the totalSupply", function() {
    var dtInstance
    var owner = accounts[0];

    return Wibcoin.deployed().then(async function(instance) {
      dtInstance = instance;
      return dtInstance.balanceOf.call(owner, { from: owner });
    }).then(async function(balance) {
      const totalSupply = await dtInstance.totalSupply.call();
      const totalSupplyExpected = totalSupply.toNumber() / Math.pow(10, 9) // 9 decimals
      assert.equal(balance.toNumber(), totalSupplyExpected, "Different balance.");
    });
  });

  it("should transfer 20000 WIP to user1", function() {
    var dtInstance
    var owner = accounts[0];
    var user1 = accounts[1];
    var user2 = accounts[3];

    var ownerBalance
    var user1Balance

    return Wibcoin.deployed().then(function(instance) {
      dtInstance = instance
      return dtInstance.transfer(user1, 20000, { from: owner });
    }).then(function() {
      return dtInstance.balanceOf.call(user1, { from: user1 });
    }).then(function(balance) {
      user1Balance = balance.toNumber();
      assert.equal(user1Balance, 20000, "User1 has different balance");
      return dtInstance.balanceOf.call(owner, { from: owner });
    }).then(async function(balance) {
      ownerBalance = balance.toNumber();
      const totalSupply = await dtInstance.totalSupply.call();
      const totalSupplyExpected = totalSupply.toNumber() / Math.pow(10, 9) // 9 decimals
      assert.equal(ownerBalance, totalSupplyExpected - 20000, "Wibcoin owner has different balance");
    }).catch(function(e) {
      assert.ifError(e);
    });
  });

});
