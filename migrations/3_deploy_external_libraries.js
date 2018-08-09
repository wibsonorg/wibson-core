const DeployUtils = require('../utils/deploymentutils');

const ECRecovery = artifacts.require('zeppelin-solidity/contracts/ECRecovery.sol');
const MathContract = artifacts.require('zeppelin-solidity/contracts/math/Math.sol');
const SafeMath = artifacts.require('zeppelin-solidity/contracts/math/SafeMath.sol');

module.exports = function deploy(deployer, network, accounts) {
  const owner = DeployUtils.isLocal(network) && DeployUtils.getLocalAccounts(accounts).owner;
  const from = owner ? { from: owner } : {};

  // Can't use async-await since truffle uses thenable objects, not ES6 promises
  return deployer.deploy(MathContract, from)
    .then(() => deployer.deploy(SafeMath, from))
    .then(() => deployer.deploy(ECRecovery, from));
};
