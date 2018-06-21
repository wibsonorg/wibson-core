const fs = require('fs');
const HDWalletProvider = require('truffle-hdwallet-provider');


const getConfig = function getConfig() {
  return JSON.parse(fs.readFileSync('deploy.json', 'utf8'));
};
exports.getConfig = getConfig;

const getStagingConfig = function getStagingConfig() {
  const config = getConfig();
  return config.network.ropsten;
};
exports.getStagingConfig = getStagingConfig;

exports.getStagingAccounts = function getStagingAccounts() {
  const config = getStagingConfig();
  return { owner: config.ownerAddress };
};

exports.getDevelopmentAccounts = function getDevelopmentAccounts(accounts) {
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

exports.isProduction = function isProduction(network) { return network === 'mainnet'; };
exports.isRopsten = function isRopsten(network) { return network === 'ropsten'; };
exports.isPrivateNet = function isPrivateNet(network) { return network === 'staging'; };
exports.isStaging = function isStaging(network) { return network === 'ropsten' || network === 'staging'; };
exports.isDevelop = function isDevelop(network) { return network === 'development'; };

// --- ( Truffle Deployment ) ---
exports.getProvider = function getProvider(mnemonic, network) {
  return new HDWalletProvider(mnemonic, `https://${network}.infura.io/`);
};

exports.getRopstenOwner = function getRopstenOwner() {
  const config = getConfig();
  return config.network.ropsten.ownerAddress;
};

exports.getStagingOwner = function getStagingOwner() {
  const config = getConfig();
  return config.network.staging.ownerAddress;
};
