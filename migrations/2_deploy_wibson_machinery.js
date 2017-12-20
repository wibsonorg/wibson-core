var DataExchange = artifacts.require("./DataExchange.sol");
var SimpleDataToken = artifacts.require("./SimpleDataToken.sol");
var AddressMap = artifacts.require("./lib/AddressMap.sol");
var ExchangeUtils = artifacts.require("./lib/ExchangeUtils.sol");

module.exports = function(deployer, network, accounts) {
  if (network == "ropsten") {
    const owner = accounts[0];
    const notary1 = accounts[1];
    const notary2 = accounts[2];
    const notary3 = accounts[3];
    const buyer = accounts[4];
    const seller = accounts[5];


    deployer.deploy(AddressMap).then(function() {
      return deployer.link(AddressMap, DataExchange);
    }).then(function() {
      return deployer.deploy(ExchangeUtils, DataExchange);
    }).then(function() {
      return deployer.deploy(SimpleDataToken)
    }).then(function() {
      return deployer.deploy(DataExchange, SimpleDataToken.address);
    });
  } else {
    const owner = accounts[0];
    const notary1 = accounts[1];
    const notary2 = accounts[2];
    const notary3 = accounts[3];
    const buyer = accounts[4];
    const seller = accounts[5];

    deployer.deploy(AddressMap).then(function() {
      return deployer.link(AddressMap, DataExchange);
    }).then(function() {
      return deployer.deploy(ExchangeUtils, DataExchange);
    }).then(function() {
      return deployer.deploy(SimpleDataToken, {from: owner})
    }).then(function() {
      return deployer.deploy(DataExchange, SimpleDataToken.address, {from: owner});
    }).then(function() {
      return SimpleDataToken.deployed()
    }).then(function(instance) {
      instance.transfer(seller, 1000, {from: owner});
      instance.transfer(buyer, 100000, {from: owner});
      instance.transfer(notary1, 100000, {from: owner});
      instance.transfer(notary2, 100000, {from: owner});
      instance.transfer(notary3, 100000, {from: owner});

      return DataExchange.deployed();
    }).then(function(instance) {
      instance.addNotary(notary1, "Notary A", "0x6bcdf2c4a649296045db14c4e41aa8a82a4f19", {from: owner});
      instance.addNotary(notary2, "Notary B", "0x6bcdf2c4a649296045db14c4e41aa8a82a4f18", {from: owner});
      instance.addNotary(notary3, "Notary C", "0x6bcdf2c4a649296045db14c4e41aa8a82a4f20", {from: owner});
    });
  }
};