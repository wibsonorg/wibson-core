const Web3 = require('web3');

const DataExchange = artifacts.require('./DataExchange2.sol');
const DataOrder = artifacts.require('./DataOrder2.sol');
const WIBToken = artifacts.require('./WIBToken.sol');

contract('DataExchange2', (accounts) => {
  let dataExchange;
  let token;
  let tx;
  // const OWNER = accounts[6];
  const NOTARY_A = accounts[1];
  const BUYER = accounts[4];
  const SELLER = accounts[5];
  const SELLER2 = accounts[6];
  const SELLER3 = accounts[7];
  const MASTERKEY = 'master-key';
  const MASTERKEY_HASH = '0x3a9c1573b2b71e6f983946fa79489682a1114193cd453bdea78717db684545b4';
  const NOTARY_SIGNATURE = '0x2e58ea30aa3d31d4a997a14228c94f7384fab28d2bb6931b648cd0fe7d533fe3634164c7f84b6013d674a93e3c82bab150886767bf56c91cda028191162cd07500';


  beforeEach('setup', async () => {
    WIBToken.deployed().then((wib) => { token = wib; });
    dataExchange = await DataExchange.new(token);
    await token.approve(dataExchange.address, 3000, { from: BUYER });
  });

  it('should do complete flow', async () => {
    // 1. Buyer places the order on the Smart Contract
    const newOrder = await dataExchange.createDataOrder(
      'age:20,gender:male',
      20,
      'data request',
      'Terms and Conditions',
      'https://buyer.example.com/data',
      { from: BUYER },
    );
    // 2. Sellers listen for new Data Orders
    assert.equal(newOrder.logs[0].event, 'NewDataOrder');
    const newOrderAddress = newOrder.logs[0].args.dataOrder;

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
      .call(index.toNumber(), MASTERKEY, { from: NOTARY_A });
    assert.ok(notarized, 'Data Responses should be notarized');

    tx = await dataExchange.notarizeDataResponses(index.toNumber(), MASTERKEY, { from: NOTARY_A });
    assert.equal(tx.logs[0].event, 'DataResponsesNotarized');
    assert.equal(tx.logs[0].args.key, MASTERKEY);

    /*
      Challenge Period starts
      7a. Seller gets paid
      7b. Notary also gets paid for completed audits
    */
  });
});
