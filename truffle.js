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
      port: 8545,
      from: DeployUtils.getRopstenOwner,
      network_id: 3, // official id of the ropsten network
      gas: 4600000
    },
    staging: {
      host: "localhost",
      port: 8545,
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
