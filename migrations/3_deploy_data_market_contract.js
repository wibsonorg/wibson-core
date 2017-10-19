var DataMarket = artifacts.require("./DataMarket.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(DataMarket, accounts[0]);
};
