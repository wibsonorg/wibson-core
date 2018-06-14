const DeployUtils = require('../utils/deploymentutils');

var DataExchange = artifacts.require("./DataExchange.sol");
var Wibcoin = artifacts.require("./Wibcoin.sol");

var MultiMap = artifacts.require("./lib/MultiMap.sol");
var CryptoUtils = artifacts.require("./lib/CryptoUtils.sol");
var ECRecovery = artifacts.require('zeppelin-solidity/contracts/ECRecovery.sol');


module.exports = function(deployer, network, accounts) {
  if (DeployUtils.isStaging(network)) {
    const config = DeployUtils.getConfig();

    let tokenAddress;
    if (network == "staging") {
      tokenAddress = config.network.staging.deployedTokenAddress;
    } else {
      tokenAddress = config.network.ropsten.deployedTokenAddress;
    }

    const stagingAccounts = DeployUtils.getStagingAccounts();
    deployStaging(deployer, stagingAccounts);
    return;
  }

  const devAccounts = DeployUtils.getDevelopmentAccounts(accounts);
  deployDevelopment(deployer, devAccounts);
};


/**
 * Deploy Token to Staging network either ropsten or private staging.
 */
const deployStaging = (deployer, accounts) => {
  deployExchange(deployer, { from: accounts.owner });
}

/**
 * Deploy Token to ganache network.
 */
const deployDevelopment = (deployer, accounts) => {
  const from = { from: accounts.owner };
  deployExchange(deployer, from).then(function() {
    return Promise.all([
      DataExchange.deployed(),
      DeployUtils.generateKeyPair(),
      DeployUtils.generateKeyPair(),
      DeployUtils.generateKeyPair()
    ]);
  }).then(function(values) {
    const instance = values[0];
    instance.registerNotary(accounts.notary1, "Notary A", "www.notarya.com/storage", values[1].publicKey, from);
    instance.registerNotary(accounts.notary2, "Notary B", "www.notaryb.com/storage", values[2].publicKey, from);
    instance.registerNotary(accounts.notary3, "Notary C", "www.notaryc.com/storage", values[3].publicKey, from);
  });
}

const deployExchange = (deployer, from) => {
  return deployer.deploy(MultiMap, from).then(function() {
    return deployer.link(MultiMap, DataExchange);
  }).then(function() {
    return deployer.deploy(ECRecovery, from);
  }).then(function() {
    return deployer.link(ECRecovery, CryptoUtils);
  }).then(function() {
    return deployer.deploy(CryptoUtils, from);
  }).then(function() {
    return deployer.link(CryptoUtils, DataExchange);
  }).then(function() {
    return deployer.deploy(DataExchange, Wibcoin.address, from);
  });
};
