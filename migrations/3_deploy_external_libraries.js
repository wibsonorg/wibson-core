const DeployUtils = require('../utils/deploymentutils');

const ECDSA = artifacts.require('openzeppelin-solidity/contracts/cryptography/ECDSA.sol');
const SafeMath = artifacts.require('openzeppelin-solidity/contracts/math/SafeMath.sol');

module.exports = function deploy(deployer, network, accounts) {
  const owner = DeployUtils.isLocal(network) && DeployUtils.getLocalAccounts(accounts).owner;
  const from = owner ? { from: owner } : {};

  // Can't use async-await since truffle uses thenable objects, not ES6 promises
  return deployer.deploy(SafeMath, from)
    .then(() => deployer.deploy(ECDSA, from));
};
