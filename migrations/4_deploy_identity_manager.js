var IdentityManager = artifacts.require("./IdentityManager.sol");
var DataExchange = artifacts.require("./DataExchange.sol");
var Wibcoin = artifacts.require("./v1/Wibcoin.sol");

const DeployUtils = require('../utils/deploymentutils');

module.exports = function(deployer, network, accounts) {
  let addresses = DeployUtils.getDevelopmentAccounts(accounts);
  if (DeployUtils.isStaging(network)) {
    addresses = DeployUtils.getStagingAccounts(accounts);
  }

  deployer
    .deploy(IdentityManager, Wibcoin.address, { from: addresses.owner })
    .then(function() {
      return DataExchange.deployed();
    }).then(function(instance) {
      instance.setIdentityManager(IdentityManager.address, { from: addresses.owner });
    });
};
