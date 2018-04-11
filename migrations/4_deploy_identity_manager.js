var IdentityManager = artifacts.require("./v1/IdentityManager.sol");
var DataExchangeV1 = artifacts.require("./v1/DataExchangeV1.sol");
var Wibcoin = artifacts.require("./v1/Wibcoin.sol");


const DeployUtils = require('../utils/deploymentutils');

module.exports = function(deployer, network, accounts) {
  const { useProtocolV1 } = DeployUtils.getConfig();
  // TODO(cristian): remove once protocol V1 is deployed.
  if (!useProtocolV1) {
    return;
  }

  let addresses = DeployUtils.getDevelopmentAccounts(accounts);
  if (DeployUtils.isStaging(network)) {
    addresses = DeployUtils.getStagingAccounts(accounts);
  }

  deployer
    .deploy(IdentityManager, Wibcoin.address, { from: addresses.owner })
    .then(function() {
      return DataExchangeV1.deployed();
    })
    .then(function(instance) {
      instance.setIdentityManager(instance.address, { from: addresses.owner });
    });
};
