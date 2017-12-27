var SimpleDataToken = artifacts.require("./SimpleDataToken.sol");

module.exports = function(deployer, network, accounts) {
  if (network == "ropsten") {
    deployer.deploy(SimpleDataToken, {from: owner});
    return;
  }

  const owner = accounts[0];
  const notary1 = accounts[1];
  const notary2 = accounts[2];
  const notary3 = accounts[3];
  const buyer = accounts[4];
  const seller = accounts[5];

  deployer.deploy(SimpleDataToken, {from: owner}).then(function() {
    return SimpleDataToken.deployed();
  }).then(function(instance) {
    instance.transfer(seller, 1000, {from: owner});
    instance.transfer(buyer, 100000, {from: owner});
    instance.transfer(notary1, 100000, {from: owner});
    instance.transfer(notary2, 100000, {from: owner});
    instance.transfer(notary3, 100000, {from: owner});
  });
};