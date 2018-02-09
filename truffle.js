const HDWalletProvider = require("truffle-hdwallet-provider");
const mnemonic = '';

module.exports = {
  migrations_directory: "./migrations",
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      host: "66.165.226.146",
      port: 8545,
      // provider: new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/'),
      from: "0xC6cb7cA2470C44FDA47fac925fE59A25c0A9798D",
      network_id: 3, // official id of the ropsten network
      gas: 4600000
    },
    staging: {
      host: "66.165.226.146",
      port: 8546,
      provider: new HDWalletProvider(mnemonic, 'http://66.165.226.146:8546'),
      //from: "0xC6cb7cA2470C44FDA47fac925fE59A25c0A9798D",
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
