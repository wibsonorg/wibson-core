const HDWalletProvider = require('truffle-hdwallet-provider')
const mnemonic = 'rebuild crumble peasant afford brown scissors rough circle caught dilemma elevator dumb'

module.exports = {
  migrations_directory: "./migrations",
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      host: "localhost",
      port: 8545,
      provider: new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/'),
      network_id: 3, // official id of the ropsten network
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
