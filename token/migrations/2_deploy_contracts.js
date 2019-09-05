const WIBToken = artifacts.require('./WIBToken.sol');

function isLocal(environment) {
  return environment === 'development' || environment === 'test' || environment === 'coverage';
}

function getLocalAccounts(accounts) {
  return {
    owner: accounts[0],
    notary1: accounts[1],
    notary2: accounts[2],
    notary3: accounts[3],
    buyer: accounts[4],
    seller: accounts[5],
    multisig: accounts[6],
  };
}

module.exports = function deploy(deployer, network, accounts) {
  if (isLocal(network)) {
    // Deploy Token to ganache network.
    const localAccounts = getLocalAccounts(accounts);
    const from = { from: localAccounts.owner };
    return deployer.deploy(WIBToken, from)
      .then(() => WIBToken.deployed())
      .then((instance) => {
        instance.transfer(localAccounts.buyer, 1800000000000000000, from);
        instance.transfer(localAccounts.notary1, 1800000000000000000, from);
        instance.transfer(localAccounts.notary2, 1800000000000000000, from);
        instance.transfer(localAccounts.notary3, 1800000000000000000, from);
      });
  }
  return deployer.deploy(WIBToken);
};
