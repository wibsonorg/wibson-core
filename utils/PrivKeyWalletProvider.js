/* eslint-disable */
const ProviderEngine = require('web3-provider-engine');
const FiltersSubprovider = require('web3-provider-engine/subproviders/filters.js');
const NonceSubProvider = require('web3-provider-engine/subproviders/nonce-tracker.js');
const HookedSubprovider = require('web3-provider-engine/subproviders/hooked-wallet.js');
const ProviderSubprovider = require('web3-provider-engine/subproviders/provider.js');
const Web3 = require('web3');
const Transaction = require('ethereumjs-tx');
const ethereumjsWallet = require('ethereumjs-wallet');

// This line shares nonce state across multiple provider instances. Necessary
// because within truffle the wallet is repeatedly newed if it's declared in the config within a
// function, resetting nonce from tx to tx. An instance can opt out
// of this behavior by passing `shareNonce=false` to the constructor.
// See issue #65 for more
const singletonNonceSubProvider = new NonceSubProvider();

function PrivKeyWalletProvider(privateKeys, providerUrl, shareNonce = true) {
  this.wallets = {};
  this.addresses = [];

  // from https://github.com/trufflesuite/truffle-hdwallet-provider/pull/25/commits
  for (const key of privateKeys) {
    const wallet = ethereumjsWallet.fromPrivateKey(new Buffer(key, 'hex'));
    const addr = `0x${wallet.getAddress().toString('hex')}`;
    this.addresses.push(addr);
    this.wallets[addr] = wallet;
  }

  const tmp_accounts = this.addresses;
  const tmp_wallets = this.wallets;

  this.engine = new ProviderEngine();
  this.engine.addProvider(new HookedSubprovider({
    getAccounts(cb) {
      cb(null, tmp_accounts);
    },
    getPrivateKey(address, cb) {
      if (!tmp_wallets[address]) {
        return cb('Account not found');
      }
      cb(null, tmp_wallets[address].getPrivateKey().toString('hex'));
    },
    signTransaction(txParams, cb) {
      let pkey;
      if (tmp_wallets[txParams.from]) {
        pkey = tmp_wallets[txParams.from].getPrivateKey();
      } else {
        cb('Account not found');
      }
      const tx = new Transaction(txParams);
      tx.sign(pkey);
      const rawTx = `0x${tx.serialize().toString('hex')}`;
      cb(null, rawTx);
    },
  }));

  (!shareNonce)
    ? this.engine.addProvider(new NonceSubProvider())
    : this.engine.addProvider(singletonNonceSubProvider);

  this.engine.addProvider(new FiltersSubprovider());
  this.engine.addProvider(new ProviderSubprovider(new Web3.providers.HttpProvider(providerUrl)));
  this.engine.start(); // Required by the provider engine.
}

PrivKeyWalletProvider.prototype.sendAsync = function () {
  this.engine.sendAsync.apply(this.engine, arguments);
};

PrivKeyWalletProvider.prototype.send = function () {
  return this.engine.send.apply(this.engine, arguments);
};

// returns the address of the given address_index, first checking the cache
PrivKeyWalletProvider.prototype.getAddress = function (idx) {
  console.log('getting addresses', this.addresses[0], idx);
  if (!idx) {
    return this.addresses[0];
  }
  return this.addresses[idx];
};

// returns the addresses cache
PrivKeyWalletProvider.prototype.getAddresses = function () {
  return this.addresses;
};

module.exports = PrivKeyWalletProvider;
