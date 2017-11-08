var DataExchange = artifacts.require("./DataExchange.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(DataExchange, [accounts[1], accounts[2], accounts[3]], accounts[0]);
};
