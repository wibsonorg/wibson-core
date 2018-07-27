const Migrations = artifacts.require('./Migrations.sol');

module.exports = function migrations(deployer) {
  deployer.deploy(Migrations);
};
