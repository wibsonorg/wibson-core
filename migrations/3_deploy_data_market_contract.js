var DataMarket = artifacts.require("./DataMarket.sol");
var DataToken = artifacts.require("./DataToken.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(DataMarket, accounts[0], DataToken.deployed());
};
