var DataExchange = artifacts.require("./DataExchange.sol");
var SimpleDataToken = artifacts.require("./SimpleDataToken.sol");
var AddressMap = artifacts.require("./lib/AddressMap.sol");
var ArrayUtils = artifacts.require("./lib/ArrayUtils.sol");


var kSimpleDataTokenRopstenAddress = '0xd037f68A208A4C4a3DF9a1e426595a1e5A2727b6';

module.exports = function(deployer, network, accounts) {

  if (network == "ropsten") {
    deployer.deploy(AddressMap, {from: owner}).then(function() {
      return deployer.link(AddressMap, DataExchange);
    }).then(function() {
      return deployer.deploy(ArrayUtils, {from: owner})
    }).then(function() {
      return deployer.link(ArrayUtils, DataExchange);
    }).then(function() {
      return deployer.deploy(DataExchange, kSimpleDataTokenRopstenAddress, {from: owner});
    });
  } else {
    const owner = accounts[0];
    const notary1 = accounts[1];
    const notary2 = accounts[2];
    const notary3 = accounts[3];
    const buyer = accounts[4];
    const seller = accounts[5];

    deployer.deploy(AddressMap, {from: owner}).then(function() {
      return deployer.link(AddressMap, DataExchange);
    }).then(function() {
      return deployer.deploy(ArrayUtils, {from: owner})
    }).then(function() {
      return deployer.link(ArrayUtils, DataExchange);
    }).then(function() {
      return deployer.deploy(DataExchange, SimpleDataToken.address, {from: owner});
    }).then(function() {
      return DataExchange.deployed();
    }).then(function(instance) {
      instance.addNotary(notary1, "Notary A", "0x6bcdf2c4a649296045db14c4e41aa8a82a4f19", {from: owner});
      instance.addNotary(notary2, "Notary B", "0x6bcdf2c4a649296045db14c4e41aa8a82a4f18", {from: owner});
      instance.addNotary(notary3, "Notary C", "0x6bcdf2c4a649296045db14c4e41aa8a82a4f20", {from: owner});
    });
  }
};