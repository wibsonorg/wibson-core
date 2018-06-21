const DeployUtils = require('../utils/deploymentutils');

const DataExchange = artifacts.require('./DataExchange.sol');
const Wibcoin = artifacts.require('./Wibcoin.sol');

const MultiMap = artifacts.require('./lib/MultiMap.sol');
const CryptoUtils = artifacts.require('./lib/CryptoUtils.sol');
const ECRecovery = artifacts.require('zeppelin-solidity/contracts/ECRecovery.sol');

const deployExchange = (deployer, from, owner) =>
  deployer.deploy(MultiMap, from)
    .then(() => deployer.link(MultiMap, DataExchange))
    .then(() => deployer.deploy(ECRecovery, from))
    .then(() => deployer.link(ECRecovery, CryptoUtils))
    .then(() => deployer.deploy(CryptoUtils, from))
    .then(() => deployer.link(CryptoUtils, DataExchange))
    .then(() => deployer.deploy(DataExchange, Wibcoin.address, owner, from));

/**
 * Deploy Token to Staging network either ropsten or private staging.
 */
const deployStaging = (deployer, accounts) => {
  deployExchange(deployer, { from: accounts.owner });
};

/**
 * Deploy Token to ganache network.
 */
const deployDevelopment = (deployer, accounts) => {
  const from = { from: accounts.owner };
  deployExchange(deployer, from, accounts.multisig).then(() => Promise.all([
    DataExchange.deployed(),
  ]));
};

module.exports = function deploy(deployer, network, accounts) {
  if (DeployUtils.isStaging(network)) {
    const stagingAccounts = DeployUtils.getStagingAccounts();

    deployStaging(deployer, stagingAccounts);
    return;
  }

  const devAccounts = DeployUtils.getDevelopmentAccounts(accounts);
  deployDevelopment(deployer, devAccounts);
};
