const Web3 = require('web3');

const web3 = new Web3('http://localhost:8545');

const DataExchange = artifacts.require('./DataExchange.sol');
const DataOrder = artifacts.require('./DataOrder.sol');
const WIBToken = artifacts.require('./WIBToken.sol');

contract.only('DataExchange', (accounts) => {
  let token;
  let tx;
  // const OWNER = accounts[6];
  const NOTARY_A = accounts[1];
  const BUYER = accounts[4];
  // const SELLER = accounts[5];
  // const SELLER2 = accounts[6];
  // const SELLER3 = accounts[7];
  const MASTERKEY = 'master-key';
  const MASTERKEY_HASH = '0x3a9c1573b2b71e6f983946fa79489682a1114193cd453bdea78717db684545b4';

  let dataExchange;

  beforeEach('setup', async () => {
    WIBToken.deployed().then((wib) => { token = wib; });
    dataExchange = await DataExchange.new(token, `0x+${Web3.utils.toBN(0)}`);
    await token.approve(dataExchange.address, 3000, { from: BUYER });
  });

  it('should do complete flow', async () => {
    // 1. Buyer places the order on the Smart Contract
    const newOrder = await dataExchange.createDataOrder(
      'age:20,gender:male',
      20,
      'data request',
      '0x75cb7367476d39a4e7d2748bb1c75908f7086a0307fac4ea8fcd2231dcd2662e',
      'https://buyer.example.com/data',
      { from: BUYER },
    );
    // 2. Sellers listen for new Data Orders
    assert.equal(newOrder.logs[0].event, 'NewDataOrder');
    const newOrderAddress = newOrder.logs[0].args.dataOrder;

    const hash = Web3.utils.soliditySha3(newOrderAddress, MASTERKEY_HASH, 10);
    const NOTARY_SIGNATURE = await web3.eth.sign(hash, NOTARY_A);

    // 5. Sends sellerId list and notary.
    // Send locked payment that needs the master key to be unlocked
    // TODO: Send sellerId list
    tx = await dataExchange.addDataResponses(
      newOrderAddress,
      NOTARY_A,
      MASTERKEY_HASH,
      10,
      NOTARY_SIGNATURE,
      { from: BUYER },
    );
    const index = Web3.utils.toBN(tx.logs[0].args.batchIndex);

    assert.ok(index.eqn(0), 'Index should be the first one (zero)');

    // 6. Notary reveals the key used to encrypt sellers’ keys
    // TODO:(through a broker?)
    const notarized = await dataExchange.notarizeDataResponses
      .call(
        newOrderAddress, index.toNumber(), MASTERKEY,
        { from: NOTARY_A },
      );
    assert.ok(notarized, 'Data Responses should be notarized');

    tx = await dataExchange.notarizeDataResponses(
      newOrderAddress, index.toNumber(), MASTERKEY,
      { from: NOTARY_A },
    );
    assert.equal(tx.logs[0].event, 'DataResponsesNotarized');
    assert.equal(tx.logs[0].args.key, MASTERKEY);

    const dataOrder = DataOrder.at(newOrderAddress);
    const [resNotaryAddress, resKeyHash] = await dataOrder.getBatch(index.toNumber());
    assert.equal(resNotaryAddress, NOTARY_A);
    assert.equal(resKeyHash, MASTERKEY_HASH);

    /*
      Challenge Period starts
      7a. Seller gets paid
      7b. Notary also gets paid for completed audits
    */
  });
});
