var DataToken = artifacts.require("./DataToken.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(DataToken, accounts[0]);
};
