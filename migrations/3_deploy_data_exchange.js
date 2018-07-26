const DeployUtils = require('../utils/deploymentutils');

const ECRecovery = artifacts.require('zeppelin-solidity/contracts/ECRecovery.sol');
const MathContract = artifacts.require('zeppelin-solidity/contracts/math/Math.sol');
const SafeMath = artifacts.require('zeppelin-solidity/contracts/math/SafeMath.sol');

const MultiMap = artifacts.require('./lib/MultiMap.sol');
const CryptoUtils = artifacts.require('./lib/CryptoUtils.sol');

const Wibcoin = artifacts.require('./Wibcoin.sol');
const DataExchange = artifacts.require('./DataExchange.sol');


const deployExchange = async (deployer, accounts, tokenAddress) => {
  const { owner, multisig } = accounts;
  const from = { from: owner };

  // External libraries
  await deployer.deploy(MathContract, from);
  await deployer.deploy(SafeMath, from);
  await deployer.deploy(ECRecovery, from);

  // Our libraries
  await deployer.link(ECRecovery, CryptoUtils);
  await deployer.deploy(CryptoUtils, from);
  await deployer.link(SafeMath, MultiMap);
  await deployer.deploy(MultiMap, from);

  // Data Exchange
  await deployer.link(MathContract, DataExchange);
  await deployer.link(SafeMath, DataExchange);
  await deployer.link(CryptoUtils, DataExchange);
  await deployer.link(MultiMap, DataExchange);
  await deployer.deploy(DataExchange, tokenAddress, multisig, from);

  // return deployer.deploy(SafeMath, from)
  //   .then(() => deployer.link(SafeMath, MultiMap))
  //   .then(() => deployer.deploy(MultiMap, from))
  //   .then(() => deployer.link(MultiMap, DataExchange))
  //   .then(() => deployer.deploy(ECRecovery, from))
  //   .then(() => deployer.link(ECRecovery, CryptoUtils))
  //   .then(() => deployer.deploy(CryptoUtils, from))
  //   .then(() => deployer.link(CryptoUtils, DataExchange))
  //   .then(() => deployer.deploy(DataExchange, tokenAddress, multisig, from));
};

module.exports = async function deploy(deployer, network, accounts) {
  const wibcoinAddress = DeployUtils.getWibcoinAddress(network);
  const usedWibcoinAddress = wibcoinAddress || Wibcoin.address;

  const usedAccounts = DeployUtils.isLocal(network)
    ? DeployUtils.getLocalAccounts(accounts)
    : DeployUtils.getEnvironmentAccounts(network);

  await deployExchange(deployer, usedAccounts, usedWibcoinAddress);
};
