const DeployUtils = require('../utils/deploymentutils');

const MathContract = artifacts.require('zeppelin-solidity/contracts/math/Math.sol');
const SafeMath = artifacts.require('zeppelin-solidity/contracts/math/SafeMath.sol');

const MultiMap = artifacts.require('./lib/MultiMap.sol');
const CryptoUtils = artifacts.require('./lib/CryptoUtils.sol');

const Wibcoin = artifacts.require('./Wibcoin.sol');
const DataExchange = artifacts.require('./DataExchange.sol');

const deployExchange = (deployer, tokenAddress, multisig, owner) => {
  const from = owner ? { from: owner } : {};

  // Can't use async-await since truffle uses thenable objects, not ES6 promises
  return deployer.link(MathContract, DataExchange)
    .then(() => deployer.link(SafeMath, DataExchange))
    .then(() => deployer.link(CryptoUtils, DataExchange))
    .then(() => deployer.link(MultiMap, DataExchange))
    .then(() => deployer.deploy(DataExchange, tokenAddress, multisig, from));
};

module.exports = function deploy(deployer, network, accounts) {
  const wibcoinAddress = DeployUtils.getWibcoinAddress(network);
  const usedWibcoinAddress = wibcoinAddress || Wibcoin.address;

  if (DeployUtils.isLocal(network)) {
    const { owner, multisig } = DeployUtils.getLocalAccounts(accounts);
    return deployExchange(deployer, usedWibcoinAddress, multisig, owner);
  }

  const { multisig } = DeployUtils.getEnvironmentAccounts(network);
  return deployExchange(deployer, usedWibcoinAddress, multisig);
};
