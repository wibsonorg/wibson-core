const Wibcoin = artifacts.require('./Wibcoin.sol');

const DeployUtils = require('../utils/deploymentutils');

/**
 * Deploy Token to Staging network either ropsten or private staging.
 */
const deployStaging = (deployer, tokenContract, accounts) => {
  deployer.deploy(tokenContract, { from: accounts.owner });
};

/**
 * Deploy Token to ganache network.
 */
const deployDevelopment = (deployer, tokenContract, accounts) => {
  const from = { from: accounts.owner };

  deployer.deploy(tokenContract, from).then(() => tokenContract.deployed()).then((instance) => {
    instance.transfer(accounts.seller, 1000, from);
    instance.transfer(accounts.buyer, 100000, from);
    instance.transfer(accounts.notary1, 100000, from);
    instance.transfer(accounts.notary2, 100000, from);
    instance.transfer(accounts.notary3, 100000, from);
  });
};

module.exports = function deploy(deployer, network, accounts) {
  const { shouldRedeployToken } = DeployUtils.getConfig();
  if (!shouldRedeployToken) {
    return;
  }

  const TokenContract = Wibcoin;
  if (DeployUtils.isStaging(network)) {
    const stagingAccounts = DeployUtils.getStagingAccounts();
    deployStaging(deployer, TokenContract, stagingAccounts);
    return;
  }

  const devAccounts = DeployUtils.getDevelopmentAccounts(accounts);
  deployDevelopment(deployer, TokenContract, devAccounts);
};
