var WibsonPointToken = artifacts.require("./WibsonPointToken.sol");

module.exports = function(deployer, network, accounts) {
  if (network == "ropsten" || network == "staging") {
    const owner = '0xC6cb7cA2470C44FDA47fac925fE59A25c0A9798D';
    deployer.deploy(WibsonPointToken, { from: owner });
    return;
  }

  const owner = accounts[0];
  const notary1 = accounts[1];
  const notary2 = accounts[2];
  const notary3 = accounts[3];
  const buyer = accounts[4];
  const seller = accounts[5];

  deployer.deploy(WibsonPointToken, { from: owner }).then(function() {
    return WibsonPointToken.deployed();
  }).then(function(instance) {
    instance.transfer(seller, 1000, { from: owner});
    instance.transfer(buyer, 100000, { from: owner });
    instance.transfer(notary1, 100000, { from: owner });
    instance.transfer(notary2, 100000, { from: owner });
    instance.transfer(notary3, 100000, { from: owner });
  });
};
