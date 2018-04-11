const DeployUtils = require('../utils/deploymentutils');

var DataExchange = artifacts.require("./DataExchange.sol");
var DataExchangeV1 = artifacts.require("./v1/DataExchangeV1.sol");

var WibsonPointToken = artifacts.require("./WibsonPointToken.sol");
var Wibcoin = artifacts.require("./v1/Wibcoin.sol");

var ArrayUtils = artifacts.require("./lib/ArrayUtils.sol");
var AddressMap = artifacts.require("./lib/AddressMap.sol");

var MultiMap = artifacts.require("./lib/MultiMap.sol");
var CryptoUtils = artifacts.require("./lib/CryptoUtils.sol");
var ECRecovery = artifacts.require('zeppelin-solidity/contracts/ECRecovery.sol');


module.exports = function(deployer, network, accounts) {
  if (DeployUtils.isStaging(network)) {
    const config = DeployUtils.getConfig();

    let tokenAddress;
    if (network == "staging") {
      tokenAddress = config.network.staging.deployedTokenAddress;
    } else {
      tokenAddress = config.network.ropsten.deployedTokenAddress;
    }

    const stagingAccounts = DeployUtils.getStagingAccounts();
    deployStaging(deployer, stagingAccounts);
    return;
  }

  const devAccounts = DeployUtils.getDevelopmentAccounts(accounts);
  deployDevelopment(deployer, devAccounts);
};


/**
 * Deploy Token to Staging network either ropsten or private staging.
 */
const deployStaging = (deployer, accounts) => {
  deployer.deploy(AddressMap, { from: accounts.owner }).then(function() {
    return deployer.link(AddressMap, DataExchange);
  }).then(function() {
    return deployer.deploy(ArrayUtils, { from: accounts.owner })
  }).then(function() {
    return deployer.link(ArrayUtils, DataExchange);
  }).then(function() {
    console.log("Using token @ " + tokenAddress);
    return deployer.deploy(DataExchange, tokenAddress, { from: accounts.owner });
  });
}

/**
 * Deploy Token to ganache network.
 */
const deployDevelopment = (deployer, accounts) => {
  const { useProtocolV1 } = DeployUtils.getConfig();

  let MapContract = AddressMap;
  let DataExchangeContract = DataExchange
  let TokenContract = WibsonPointToken;
  if (useProtocolV1) {
    MapContract = MultiMap;
    DataExchangeContract = DataExchangeV1;
    TokenContract = Wibcoin;
  }

  const from = { from: accounts.owner };

  const deployUtils = deployer.deploy(MapContract, from).then(function() {
    return deployer.link(MapContract, DataExchangeContract);
  }).then(function() {
    return deployer.deploy(ArrayUtils, from);
  }).then(function() {
    return deployer.link(ArrayUtils, DataExchangeContract);
  });

  const deployCrypto = (deployerPromise) =>
    deployerPromise.then(function() {
      return deployer.deploy(ECRecovery, from);
    }).then(function() {
      return deployer.link(ECRecovery, CryptoUtils);
    }).then(function() {
      return deployer.deploy(CryptoUtils, from);
    }).then(function() {
      return deployer.link(CryptoUtils, DataExchangeContract);
    });

  let deployment = deployUtils;
  if (useProtocolV1) {
    deployment = deployCrypto(deployUtils);
  }

  deployment.then(function() {
    return deployer.deploy(DataExchangeContract, TokenContract.address, from);
  }).then(function() {
    return Promise.all([
      DataExchangeContract.deployed(),
      DeployUtils.generateKeyPair(),
      DeployUtils.generateKeyPair(),
      DeployUtils.generateKeyPair()
    ]);
  }).then(function(values) {
    const instance = values[0]
    instance.addNotary(accounts.notary1, "Notary A", values[1].publicKey, from);
    instance.addNotary(accounts.notary2, "Notary B", values[2].publicKey, from);
    instance.addNotary(accounts.notary3, "Notary C", values[3].publicKey, from);
  });
}
