# Wibson
[Wibson](https://wibson.org/) is a blockchain-based, decentralized data marketplace that provides individuals a way to securely and anonymously sell validated private information in a trusted environment.

**wibson-core** is the implementation of the underlying protocol of Wibson using the Ethereum platform.

> NOTE: For more details about the protocol please read our white paper [here](https://wibson.org/).

## Getting Started
In order to run tests or deploy to local or any remote environment, the `deploy.json` file must be set up.
You can start by copying the `deploy.example.json` file, renaming it and editing it as suitable.

```bash
$ cp deploy.example.json deploy.json
$ vi deploy.json
```

## Testing
```bash
$ npm run test
$ # Or run with coverage
$ npm run test:coverage
```

## Deployment with Truffle
### Local
1. Deploy with truffle: `truffle migrate --reset --compile-all`
2. Test within the console: `truffle console`

### Any other environment
Available environments: `remoteDevelopment`, `staging`, `production`
1. Add etherbase account's Mnemonics in truffle.js file.
2. Deploy with truffle: `truffle migrate --reset --compile-all --network staging`
3. Test within the truffle console: `truffle console --network staging`

## Deployment status

#### Release Data:
#### Deployed Addresses:

-   Wibcoin: `0x`
-   DataExchange: `0x`
-   Migrations `0x`
-   MultiMap `0x`
-   ECRecovery `0x`
-   CryptoUtils `0x`

#### Notes:
