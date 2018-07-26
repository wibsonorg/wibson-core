const Migrations = artifacts.require('./Migrations.sol');
const DeployUtils = require('../utils/deploymentutils');

module.exports = async function migrations(deployer, network, accounts) {
  const usedAccounts = DeployUtils.isLocal(network)
    ? DeployUtils.getLocalAccounts(accounts)
    : DeployUtils.getEnvironmentAccounts(network);

  await deployer.deploy(Migrations, { from: usedAccounts.owner });
};
