const fs = require('fs');
const path = require('path');
const HDWalletProvider = require('truffle-hdwallet-provider'); // eslint-disable-line import/no-extraneous-dependencies

const getConfig = function getConfig() {
  const configFile = path.resolve(__dirname, '../deploy.json');
  return JSON.parse(fs.readFileSync(configFile, 'utf8'));
};

const getEnvironmentConfig = function getEnvironmentConfig(environment) {
  const config = getConfig();
  return config.environments[environment] || {};
};
exports.getEnvironmentConfig = getEnvironmentConfig;

// --- ( Truffle Deployment ) ---
exports.getProvider = function getProvider(network, environment) {
  const config = getConfig();
  const envConfig = getEnvironmentConfig(environment);
  const infura = `https://${network}.infura.io/v3/${config.infuraToken}`;
  return new HDWalletProvider(envConfig.mnemonic, infura);
};

exports.isLocal = function isLocal(environment) { return environment === 'development'; };

exports.getEnvironmentAccounts = function getEnvironmentAccounts(environment) {
  const config = getEnvironmentConfig(environment);
  return config.accounts;
};

exports.getLocalAccounts = function getLocalAccounts(accounts) {
  return {
    owner: accounts[0],
    notary1: accounts[1],
    notary2: accounts[2],
    notary3: accounts[3],
    buyer: accounts[4],
    seller: accounts[5],
    multisig: accounts[6],
  };
};

exports.getWibcoinAddress = function getWibcoinAddress(environment) {
  const config = getEnvironmentConfig(environment);
  return config.wibcoinAddress;
};
