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
    * `privateKeys`: Private keys for the accounts to be used during deploy in remote environments.

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
-   DataExchange: `TBD`

## Protocol's Gas Consumption

| Transaction                     | Gas          |
| ------------------------------- | ------------ |
| registerNotary                  |        46714 |
| updateNotaryUrl                 |        34593 |
| unregisterNotary                |        16335 |
| createDataOrder                 |       239162 |
| closeDataOrder                  |        29710 |

## Reporting Security Vulnerabilities
If you think that you have found a security issue in Wibson, please **DO NOT** post it as a Github issue and don't publish it publicly. Instead, all security issues must be sent to developers@wibson.org.
Although we are working on setting up a bug bounty program to improve this, we appreciate your discretion and will give the corresponding credit to the reporter(s).

## Contribute
Thank you for thinking about contributing to Wibson Core. There are many ways you can participate and help build high quality software. Check out the [contribution guide]!

## License
Wibson Core is released under the [LGPL-3.0](LICENSE).

[contribution guide]: CONTRIBUTING.md
