# <img src="logo.png" alt="Wibson" width="400px">

[Wibson](https://wibson.org/) is a blockchain-based, decentralized data marketplace that provides individuals a way to securely and anonymously sell validated private information in a trusted environment.

**wibson-core** is the implementation of the underlying protocol of Wibson using the Ethereum platform.

> NOTE: For more details about the protocol, please read our white paper [here](https://wibson.org/).

## Getting Started
In order to run tests or deploy to local or any remote environment, the `deploy.json` file must be set up.
You can start by copying the `deploy.example.json` file, renaming it and editing it as suitable.

```bash
$ cp deploy.example.json deploy.json
$ vi deploy.json
```

If a remote network is used, a private key is needed to sign the deployment transactions. Keep in mind that
the address for that private key will be the deployer, and therefore, the owner of each contract.
Nevertheless, the ownership of the `DataExchange` contract will be transferred to the `multisig` account
configured in the `deploy.json` file.

### Configuration
* `infuraToken`: The API key supplied by [Infura](https://infura.io/) to be used on remote environments.
* `environments`: Allowed keys are `development`, `test`, `coverage`, `remoteDevelopment`, `staging`, `production`.
* Environment options:
    * `wibTokenAddress`: Optional. An Ethereum address of an existing `WIBToken` contract. `DataExchange` will use this
one instead of deploying a new `WIBToken` instance.
    * `deployPrivateKey`: Private key for the deployer account only used in remote environments.
    * `accounts.multisig`: Final owner of the `DataExchange` contract.

## Testing
```bash
$ npm run test
$ # Or run with coverage
$ npm run test:coverage
```

## Deployment with Truffle
### Local
```bash
$ npm run ganache &
$ npm run truffle -- migrate --reset --compile-all
$ npm run truffle console # to test within the console
```

### Any other environment
For example, `staging`:
```bash
$ npm run truffle -- migrate --reset --compile-all --network staging
$ npm run truffle console --network staging # to test within the console
```

## Deployment status

#### Release Data:
#### Deployed Addresses:

-   WIBToken: `0x3f17dd476faf0a4855572f0b6ed5115d9bba22ad`
-   DataExchange: `0xd077c09a7e65c4cca490a776d5e395fb4fe7179a`
-   MultiMap `0x72ae13d70f65c56e59eb63993605abef1ecb9c41`
-   CryptoUtils `0x48819464877341cb7e0bbd91e0c268016ae5e6ad`
-   Math `0x9c2693a1e04eb127b0d628e276a98fef235ee9e2`
-   SafeMath `0x6919a6710bfa555e70cc8cd35bf2e613c355c443`
-   ECRecovery `0x59740db1350bcac14fd3a3451d47205a1d499499`
-   Migrations `0xde2e43f4831cd95a41b3bdc8947209f86670e446`

## Protocol's Gas Consumption

| Transaction                     | DataExchange | DataOrder |
| ------------------------------- | ------------ | --------- |
| newOrder (\*)                   | 1769000      | -         |
| registerNotary                  | 170000       | -         |
| unregisterNotary                | 33000        | -         |
| addNotaryToOrder (\*\*)         | 318000       | 197000    |
| addDataResponseToOrder (\*\*\*) | 332000       | 180000    |
| closeDataResponse               | 85000        | 37000     |
| closeOrder                      | 68000        | 28000     |

\* With Terms and Conditions being about half of the size of the document we are currently using on the Buyer APP, the gas consumption of the `newOrder` transaction scales up to ~7millon (640 units per byte aprox). For the purpose of this document, the gas consumption for this transaction was calculated using a 64 bytes hash instead of the original terms contents (hashing method: `web3Utils.sha3(terms)`).

\*\* Calculated by hashing the Notarization Terms of Service with the same method: `web3Utils.sha3(notarizationTermsOfService)`.

\*\*\* Calculated with a dataHash of 58 bytes.

## Reporting Security Vulnerabilities
If you think that you have found a security issue in Wibson, please **DO NOT** post it as a Github issue and don't publish it publicly. Instead, all security issues must be sent to developers@wibson.org.
Although we are working on setting up a bug bounty program to improve this, we appreciate your discretion and will give the corresponding credit to the reporter(s).

## Contribute
Thank you for thinking about contributing to Wibson Core. There are many ways you can participate and help build high quality software. Check out the [contribution guide]!

## License
Wibson Core is released under the [LGPL-3.0](LICENSE).

[contribution guide]: CONTRIBUTING.md
