const DeployUtils = require('../utils/deploymentutils');

const ECRecovery = artifacts.require('zeppelin-solidity/contracts/ECRecovery.sol');
const SafeMath = artifacts.require('zeppelin-solidity/contracts/math/SafeMath.sol');

const MultiMap = artifacts.require('./lib/MultiMap.sol');
const CryptoUtils = artifacts.require('./lib/CryptoUtils.sol');

module.exports = function deploy(deployer, network, accounts) {
  const owner = DeployUtils.isLocal(network) && DeployUtils.getLocalAccounts(accounts).owner;
  const from = owner ? { from: owner } : {};

  // Can't use async-await since truffle uses thenable objects, not ES6 promises
  return deployer.link(ECRecovery, CryptoUtils)
    .then(() => deployer.deploy(CryptoUtils, from))
    .then(() => deployer.link(SafeMath, MultiMap))
    .then(() => deployer.deploy(MultiMap, from));
};
