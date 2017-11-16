var DataExchange = artifacts.require("./DataExchange.sol");

module.exports = function(deployer, network, accounts) {
  var notaries = [accounts[1], accounts[2], accounts[3]]
  deployer.deploy(DataExchange, notaries, accounts[0]);
};
