const fs = require('fs');
const HDWalletProvider = require('truffle-hdwallet-provider');


exports.getConfig = function () {
  return JSON.parse(fs.readFileSync('deploy.json', 'utf8'));
};

exports.getStagingConfig = function (accounts) {
  const config = getConfig();
  return config.network.ropsten;
};

exports.getStagingAccounts = function () {
  const config = getStagingConfig();
  return { owner: config.ownerAddress };
};

exports.getDevelopmentAccounts = function (accounts) {
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

exports.isProduction = function (network) { return network == 'mainnet'; };
exports.isRopsten = function (network) { return network == 'ropsten'; };
exports.isPrivateNet = function (network) { return network == 'staging'; };
exports.isStaging = function (network) { return network == 'ropsten' || network == 'staging'; };
exports.isDevelop = function (network) { return network == 'development'; };

// --- ( Truffle Deployment ) ---
exports.getProvider = function (mnemonic, network) {
  new HDWalletProvider(mnemonic, `https://${network}.infura.io/`);
};

exports.getRopstenOwner = function () {
  const config = DeployUtils.getConfig();
  return config.network.ropsten.ownerAddress;
};

exports.getStagingOwner = function () {
  const config = DeployUtils.getConfig();
  return config.network.staging.ownerAddress;
};
