const forge = require('node-forge');

const RSA_KEY_SIZE = 2048;

const generateKeyPair = () =>
  new Promise((resolve, reject) => {
    forge.pki.rsa.generateKeyPair({
      bits: RSA_KEY_SIZE,
      workers: -1
    }, (error, keypair) => {
      if (error) {
        reject(error);
      } else {
        resolve({
          publicKey: forge.pki.publicKeyToPem(keypair.publicKey),
          privateKey: forge.pki.privateKeyToPem(keypair.privateKey),
        });
      }
    });
  });

var DataExchange = artifacts.require("./DataExchange.sol");
var WibsonPointToken = artifacts.require("./WibsonPointToken.sol");
var AddressMap = artifacts.require("./lib/AddressMap.sol");
var ArrayUtils = artifacts.require("./lib/ArrayUtils.sol");


var kTokenRopstenAddress = '0xd037f68A208A4C4a3DF9a1e426595a1e5A2727b6';
var kTokenStagingAddress = '0xda3a84548b254282697afee1368fbec3aca85bf9'; //'0x4f5ccd773c4336d004229d2e677112777873b4f1';

module.exports = function(deployer, network, accounts) {
  if (network == "ropsten" || network == "staging") {
    const owner = '0xC6cb7cA2470C44FDA47fac925fE59A25c0A9798D';

    deployer.deploy(AddressMap, { from: owner }).then(function() {
      return deployer.link(AddressMap, DataExchange);
    }).then(function() {
      return deployer.deploy(ArrayUtils, { from: owner })
    }).then(function() {
      return deployer.link(ArrayUtils, DataExchange);
    }).then(function() {
      let tokenAddress;
      if (network == "staging") {
        tokenAddress = kTokenStagingAddress;
      } else {
        tokenAddress = kTokenRopstenAddress;
      }
      console.log("Using token @ " + tokenAddress);
      return deployer.deploy(DataExchange, tokenAddress, { from: owner });
    });
  } else {
    const owner = accounts[0];
    const notary1 = accounts[1];
    const notary2 = accounts[2];
    const notary3 = accounts[3];
    const buyer = accounts[4];
    const seller = accounts[5];

    deployer.deploy(AddressMap, { from: owner }).then(function() {
      return deployer.link(AddressMap, DataExchange);
    }).then(function() {
      return deployer.deploy(ArrayUtils, { from: owner })
    }).then(function() {
      return deployer.link(ArrayUtils, DataExchange);
    }).then(function() {
      return deployer.deploy(DataExchange, WibsonPointToken.address, { from: owner });
    }).then(function() {
      return Promise.all([
        DataExchange.deployed(),
        generateKeyPair(),
        generateKeyPair(),
        generateKeyPair()
      ]);
    }).then(function(values) {
      const instance = values[0]
      instance.addNotary(notary1, "Notary A", values[1].publicKey, { from: owner });
      instance.addNotary(notary2, "Notary B", values[2].publicKey, { from: owner });
      instance.addNotary(notary3, "Notary C", values[3].publicKey, { from: owner });
    });
  }
};
