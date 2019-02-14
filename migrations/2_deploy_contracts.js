const WIBToken = artifacts.require('./WIBToken.sol');
const DataExchange = artifacts.require('./DataExchange.sol');

const DeployUtils = require('../utils/deploymentutils');

/**
 * Deploy Token to ganache network.
 */
const deployLocal = (deployer, tokenContract, accounts) => {
  const from = { from: accounts.owner };

  return deployer.deploy(tokenContract, from)
    .then(() => tokenContract.deployed())
    .then((instance) => {
      instance.transfer(accounts.buyer, 1800000000000000000, from);
      instance.transfer(accounts.notary1, 1800000000000000000, from);
      instance.transfer(accounts.notary2, 1800000000000000000, from);
      instance.transfer(accounts.notary3, 1800000000000000000, from);
    });
};

module.exports = function deploy(deployer, network, accounts) {
  const wibTokenAddress = DeployUtils.getWIBTokenAddress(network);
  if (!wibTokenAddress) {
    if (DeployUtils.isLocal(network)) {
      const localAccounts = DeployUtils.getLocalAccounts(accounts);
      deployLocal(deployer, WIBToken, localAccounts);
    } else {
      deployer.deploy(WIBToken);
    }
  }

  return deployer.deploy(DataExchange);
};
