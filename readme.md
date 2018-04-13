# Wibson
[Wibson](https://wibson.org/) is a blockchain-based, decentralized data marketplace that provides individuals a way to securely and anonymously sell validated private information in a trusted environment.

**wibson-core** is the implementation of the underlying protocol of Wibson using the Ethereum platform.

> NOTE: For more details about the protocol please read our white paper [here](https://wibson.org/).

## Deployment with Truffle
### Local
1. Deploy with truffle: `truffle migrate --reset --compile-all`
2. Test withing the console: `truffle console`

### Ropsten

1. Add etherbase account's Mnemonics in truffle.js file.
2. Deploy with truffle: `truffle migrate --reset --compile-all --network ropsten`
3. Test within the truffle console: `truffle console --network ropsten`

## Testing

### Run tests

```bash
ganache-cli & # (Only once)
truffle migrate --reset --compile-all (Only once)
truffle test
```

## Deployment status

#### Release Data:
#### Deployed Addresses:

-   Wibcoin: `0x`
-   DataExchange: `0x`
-   IdentityManager: `0x`
-   Migrations `0x`
-   MultiMap `0x`
-   ArrayUtils `0x`
-   ECRecovery `0x`
-   CryptoUtils `0x`

#### Notes:
