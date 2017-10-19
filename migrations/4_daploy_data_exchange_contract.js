var DataExchange = artifacts.require("./DataExchange.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(DataExchange, accounts[0]);
};
