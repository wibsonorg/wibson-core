var DataToken = artifacts.require("./DataToken.sol");

contract('DataToken', function(accounts) {

  it("owner should have the a balance equal to the totalSupply", function() {
    var dtInstance
    var owner = accounts[0];

    return DataToken.deployed().then(function(instance) {
      dtInstance = instance
      return dtInstance.balanceOf.call(owner, { from: owner });
    }).then(function(balance) {
      assert.equal(balance.toNumber(), dtInstance.totalSupply, "Different balance.");
    });
  });

  it("should transfer 20000 gdt to user1", function() {
    var dtInstance
    var owner = accounts[0];
    var user1 = accounts[1];
    var user2 = accounts[3];

    var ownerBalance
    var user1Balance

    return DataToken.deployed().then(function(instance) {
      dtInstance = instance
      return dtInstance.transfer(user1, 20000, { from: owner });
    }).then(function() {
      return dtInstance.balanceOf.call(user1, { from: user1 });
    }).then(function(balance) {
      user1Balance = balance.toNumber();
      return dtInstance.balanceOf.call(owner, { from: owner });
    }).then(function(balance) {
      ownerBalance = balance.toNumber();
      assert.equal(ownerBalance, dtInstance.totalSupply - 20000, "DataToken owner has different balance");
      assert.equal(user1Balance, 20000, "User1 has different balance");
    }).catch(function(e) {
      console.log(e);
    });
  });

});
