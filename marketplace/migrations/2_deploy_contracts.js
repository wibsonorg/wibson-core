const DataExchange = artifacts.require('./DataExchange.sol');

module.exports = function deploy(deployer) {
  return deployer.deploy(DataExchange);
};
