var SimpleDataToken = artifacts.require("./SimpleDataToken.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(SimpleDataToken, accounts[0]);
};
