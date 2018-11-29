const WIBToken = artifacts.require('./WIBToken.sol');
const BatPay = artifacts.require('./BatPay.sol');

const DeployUtils = require('../utils/deploymentutils');

module.exports = function deploy(deployer, network) {
  const batPayAddress = DeployUtils.getBatPayAddress(network);
  if (batPayAddress) {
    return;
  }
  return deployer.deploy(BatPay, WIBToken.address);
};
