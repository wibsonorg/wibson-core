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
var SimpleDataToken = artifacts.require("./SimpleDataToken.sol");
var AddressMap = artifacts.require("./lib/AddressMap.sol");
var ArrayUtils = artifacts.require("./lib/ArrayUtils.sol");


var kSimpleDataTokenRopstenAddress = '0xd037f68A208A4C4a3DF9a1e426595a1e5A2727b6';


module.exports = function(deployer, network, accounts) {
  const owner = accounts[0];
  const notary1 = accounts[1];
  const notary2 = accounts[2];
  const notary3 = accounts[3];
  const buyer = accounts[4];
  const seller = accounts[5];

  if (network == "ropsten") {
    deployer.deploy(AddressMap, {from: owner}).then(function() {
      return deployer.link(AddressMap, DataExchange);
    }).then(function() {
      return deployer.deploy(ArrayUtils, {from: owner})
    }).then(function() {
      return deployer.link(ArrayUtils, DataExchange);
    }).then(function() {
      kSimpleDataTokenRopstenAddress = SimpleDataToken.address;
      return deployer.deploy(DataExchange, kSimpleDataTokenRopstenAddress, {from: owner});
    });
  } else {
    deployer.deploy(AddressMap, {from: owner}).then(function() {
      return deployer.link(AddressMap, DataExchange);
    }).then(function() {
      return deployer.deploy(ArrayUtils, {from: owner})
    }).then(function() {
      return deployer.link(ArrayUtils, DataExchange);
    }).then(function() {
      return deployer.deploy(DataExchange, SimpleDataToken.address, {from: owner});
    }).then(function() {
      return Promise.all([
        DataExchange.deployed(),
        generateKeyPair(),
        generateKeyPair(),
        generateKeyPair()
      ]);
    }).then(function(values) {
      const instance = values[0]
      instance.addNotary(notary1, "Notary A", values[1].publicKey, {from: owner});
      instance.addNotary(notary2, "Notary B", values[2].publicKey, {from: owner});
      instance.addNotary(notary3, "Notary C", values[3].publicKey, {from: owner});
    });
  }
};
