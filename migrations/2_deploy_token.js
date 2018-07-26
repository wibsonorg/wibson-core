const Wibcoin = artifacts.require('./Wibcoin.sol');

const DeployUtils = require('../utils/deploymentutils');

/**
 * Deploy Token to ganache network.
 */
const deployLocal = async (deployer, tokenContract, accounts) => {
  const from = { from: accounts.owner };

  await deployer.deploy(tokenContract, from);
  const instance = await tokenContract.deployed();
  const transfers = await Promise.all([
    instance.transfer(accounts.seller, 1000, from),
    instance.transfer(accounts.buyer, 100000, from),
    instance.transfer(accounts.notary1, 100000, from),
    instance.transfer(accounts.notary2, 100000, from),
    instance.transfer(accounts.notary3, 100000, from),
  ]);
  await transfers;
};

module.exports = async function deploy(deployer, network, accounts) {
  const wibcoinAddress = DeployUtils.getWibcoinAddress(network);
  if (wibcoinAddress) {
    return;
  }

  if (DeployUtils.isLocal(network)) {
    const localAccounts = DeployUtils.getLocalAccounts(accounts);
    await deployLocal(deployer, Wibcoin, localAccounts);
  } else {
    const networkAccounts = DeployUtils.getEnvironmentAccounts(network);
    await deployer.deploy(Wibcoin, { from: networkAccounts.owner });
  }
};
