const DeployUtils = require('../utils/deploymentutils');

const ECDSA = artifacts.require('openzeppelin-solidity/contracts/cryptography/ECDSA.sol');
const SafeMath = artifacts.require('openzeppelin-solidity/contracts/math/SafeMath.sol');

const WIBToken = artifacts.require('./WIBToken.sol');
const BatPay = artifacts.require('./BatPay.sol');
const DataExchange = artifacts.require('./DataExchange.sol');

const deployExchange = (deployer, tokenAddress, batPayAddress, multisig, owner) => {
  const from = owner ? { from: owner } : {};

  // Can't use async-await since truffle uses thenable objects, not ES6 promises
  return deployer.link(SafeMath, DataExchange)
    .then(() => deployer.link(ECDSA, DataExchange))
    .then(() => deployer.deploy(DataExchange, tokenAddress, batPayAddress, from));
};

module.exports = function deploy(deployer, network, accounts) {
  const wibTokenAddress = DeployUtils.getWIBTokenAddress(network);
  const usedWibTokenAddress = wibTokenAddress || WIBToken.address;
  const batPayAddress = BatPay.address;

  if (DeployUtils.isLocal(network)) {
    const { owner, multisig } = DeployUtils.getLocalAccounts(accounts);
    return deployExchange(deployer, usedWibTokenAddress, batPayAddress, multisig, owner);
  }

  const { multisig } = DeployUtils.getEnvironmentAccounts(network);
  return deployExchange(deployer, usedWibTokenAddress, batPayAddress, multisig);
};
