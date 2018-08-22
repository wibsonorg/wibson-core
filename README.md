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

If a remote network is used, a twelve word mnemonic is needed to sign the deployment transactions. Keep in mind that
the first account created with this mnemonic will be the deployer, and therefore, the owner of each contract.
Nevertheless, the ownership of the `DataExchange` contract will be transferred to the `multisig` account
configured in the `deploy.json` file.

### Configuration

- `infuraToken`: The API key supplied by [Infura](https://infura.io/) to be used on remote environments.
- `environments`: Allowed keys are `development`, `test`, `coverage`, `remoteDevelopment`, `staging`, `production`.
- Environment options:
  _ `wibcoinAddress`: Optional. An Ethereum address of an existing `Wibcoin` contract. `DataExchange` will use this
  one instead of deploying a new `Wibcoin` instance.
  _ `mnemonic`: Twelve word mnemonic to create the deployer account only for remote environments. \* `accounts.multisig`: Final owner of the `DataExchange` contract.

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

- Wibcoin: `0x`
- DataExchange: `0x`
- Migrations `0x`
- MultiMap `0x`
- ECRecovery `0x`
- CryptoUtils `0x`

#### Notes:

## Protocol's Gas Consumption

| Transaction                  | DataExchange | DataOrder |
| ---------------------------- | ------------ | --------- |
| newOrder (1\*)               | 1769000      | -         |
| registerNotary               | 170000       | -         |
| unregisterNotary             | 33000        | -         |
| addNotaryToOrder (2\*)       | 318000       | 197000    |
| addDataResponseToOrder (3\*) | 332000       | 180000    |
| closeDataResponse            | 85000        | 37000     |
| closeOrder                   | 68000        | 28000     |

1\*- With Terms and Conditions being about half of the size of the document we are currently using on the Buyer APP, the gas consumption of the `newOrder` transaction scales up to ~7millon (640 units per byte aprox). For the purpose of this document, the gas consumption for this transaction was calculated using a 64 bytes hash instead of the original terms contents (hashing method: `web3Utils.sha3(terms)`).
2\*- Calculated by hashing the Notarization Terms of Service with the same method: `web3Utils.sha3(notarizationTermsOfService)`.
3\*- Calculated with a dataHash of 58 bytes.

