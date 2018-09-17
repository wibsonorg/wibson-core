const WIBToken = artifacts.require('./WIBToken.sol');

const DeployUtils = require('../utils/deploymentutils');

/**
 * Deploy Token to ganache network.
 */
const deployLocal = (deployer, tokenContract, accounts) => {
  const from = { from: accounts.owner };

  return deployer.deploy(tokenContract, from)
    .then(() => tokenContract.deployed())
    .then((instance) => {
      instance.transfer(accounts.seller, 1000, from);
      instance.transfer(accounts.buyer, 100000, from);
      instance.transfer(accounts.notary1, 100000, from);
      instance.transfer(accounts.notary2, 100000, from);
      instance.transfer(accounts.notary3, 100000, from);
    });
};

module.exports = function deploy(deployer, network, accounts) {
  const wibTokenAddress = DeployUtils.getWIBTokenAddress(network);
  if (wibTokenAddress) {
    return;
  }

  if (DeployUtils.isLocal(network)) {
    const localAccounts = DeployUtils.getLocalAccounts(accounts);
    deployLocal(deployer, WIBToken, localAccounts);
  } else {
    deployer.deploy(WIBToken);
  }
};
