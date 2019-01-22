const DeployUtils = require('../utils/deploymentutils');

const WIBToken = artifacts.require('./WIBToken.sol');
const DataExchange = artifacts.require('./DataExchange.sol');

const deployExchange = (deployer, tokenAddress, owner) => {
  const from = owner ? { from: owner } : {};

  return deployer.deploy(DataExchange, tokenAddress, from);
};

module.exports = function deploy(deployer, network, accounts) {
  const wibTokenAddress = DeployUtils.getWIBTokenAddress(network);
  const usedWibTokenAddress = wibTokenAddress || WIBToken.address;

  if (DeployUtils.isLocal(network)) {
    const { multisig } = DeployUtils.getLocalAccounts(accounts);
    return deployExchange(deployer, usedWibTokenAddress, multisig);
  }

  const { multisig } = DeployUtils.getEnvironmentAccounts(network);
  return deployExchange(deployer, usedWibTokenAddress, multisig);
};
