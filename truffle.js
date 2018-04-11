const DeployUtils = require('./utils/deploymentutils');

/*
if (!mnemonic || !owner) {
  throw new Error("Missing MNEMONIC or WIBOWNER envs.");
}
*/

module.exports = {
  migrations_directory: "./migrations",
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*"
    },
    ropsten: {
      host: "66.165.226.146",
      port: 8545,
      // provider: new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/'),
      from: DeployUtils.getRopstenOwner,
      network_id: 3, // official id of the ropsten network
      gas: 4600000
    },
    staging: {
      // Use host 66.165.226.146 with a tunnel
      host: "localhost",
      port: 8546,
      // provider: new HDWalletProvider(mnemonic, 'http://66.165.226.146:8546'),
      from: DeployUtils.getStagingOwner,
      network_id: "*",
      gas: 4600000
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
