var DataExchange = artifacts.require("./DataExchange.sol");
var SimpleDataToken = artifacts.require("./SimpleDataToken.sol");

module.exports = function(deployer, network, accounts) {
  const owner = accounts[0];
  const notary1 = accounts[1];
  const notary2 = accounts[2];
  const notary3 = accounts[3];
  const buyer = accounts[4];
  const seller = accounts[5];

  deployer.deploy(SimpleDataToken, {from: owner}).then(function() {
    return deployer.deploy(DataExchange, SimpleDataToken.address, {from: owner});
  }).then(function() {
    return SimpleDataToken.deployed()
  }).then(function(instance) {
    instance.transfer(seller, 100000, {from: owner});
    instance.transfer(buyer, 100000, {from: owner});
    instance.transfer(notary1, 100000, {from: owner});
    instance.transfer(notary2, 100000, {from: owner});
    instance.transfer(notary3, 100000, {from: owner});

    return DataExchange.deployed();
  }).then(function(instance) {
    instance.addNotary(notary1, {from: owner});
    instance.addNotary(notary2, {from: owner});
    instance.addNotary(notary3, {from: owner});
  });
};