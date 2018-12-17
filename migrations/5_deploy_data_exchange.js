const DeployUtils = require('../utils/deploymentutils');

const SafeMath = artifacts.require('openzeppelin-solidity/contracts/math/SafeMath.sol');

const WIBToken = artifacts.require('./WIBToken.sol');
const DataExchange = artifacts.require('./DataExchange.sol');

const deployExchange = (deployer, tokenAddress, owner) => {
  const from = owner ? { from: owner } : {};

  // Can't use async-await since truffle uses thenable objects, not ES6 promises
  return deployer.link(SafeMath, DataExchange)
    .then(() => deployer.deploy(DataExchange, tokenAddress, from));
};

module.exports = function deploy(deployer, network, accounts) {
  const wibTokenAddress = DeployUtils.getWIBTokenAddress(network);
  const usedWibTokenAddress = wibTokenAddress || WIBToken.address;

  if (DeployUtils.isLocal(network)) {
    const { owner, multisig } = DeployUtils.getLocalAccounts(accounts);
    return deployExchange(deployer, usedWibTokenAddress, multisig, owner);
  }

  const { multisig } = DeployUtils.getEnvironmentAccounts(network);
  return deployExchange(deployer, usedWibTokenAddress, multisig);
};
