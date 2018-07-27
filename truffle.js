require('babel-register'); // eslint-disable-line import/no-extraneous-dependencies
require('babel-polyfill'); // eslint-disable-line import/no-extraneous-dependencies
const DeployUtils = require('./utils/deploymentutils');

module.exports = {
  migrations_directory: './migrations',
  networks: {
    development: { // intended to be named as 'local' but 'development' is truffle's default
      host: 'localhost',
      port: 8545,
      network_id: '*',
    },
    test: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
    },
    coverage: {
      host: 'localhost',
      port: 8555,
      network_id: '*',
      gas: 0xfffffffffff,
      gasPrice: 0x01,
    },
    remoteDevelopment: { // intended to be named as 'development' but it collides with truffle's default
      provider: () => DeployUtils.getProvider('ropsten', 'remoteDevelopment'),
      network_id: 3, // official id of the ropsten network
      gas: 8400000,
    },
    staging: {
      provider: () => DeployUtils.getProvider('ropsten', 'staging'),
      network_id: 3, // official id of the ropsten network
      gas: 8400000,
    },
    production: {
      provider: () => DeployUtils.getProvider('mainnet', 'production'),
      network_id: 1,
      gas: 8400000,
    },
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};
