import { randomIds, getPayData } from './helpers/utils';

const Web3 = require('web3');

const web3 = new Web3('http://localhost:8545');

const DataExchange = artifacts.require('./DataExchange.sol');
const DataOrder = artifacts.require('./DataOrder.sol');
const WIBToken = artifacts.require('./WIBToken.sol');
const BatPay = artifacts.require('./BatPay.sol');

contract.only('DataExchange', (accounts) => {
  let token;
  let batPay;
  let tx;
  let id;
  const NOTARY_A = accounts[1];
  const BUYER = accounts[4];
  const DATA_ORDER_PRICE = 20;
  const NOTARIZATION_FEE = 10;
  const list = randomIds(1000, 50000);
  const PAYDATA = getPayData(list);
  const MASTERKEY = '0x3a9c1573b2b71e6f983946fa79489682a1114193cd453bdea78717db684545b4';
  const MASTERKEY_HASH = '0x33cfdaac3c1fd1984b81dc1c3522a76b2d2fad7dd70ca8e10ea702764eafe2a8';
  const NEW_ACCOUNT = `0x${Web3.utils.toBN(2).pow(Web3.utils.toBN(256)).subn(1).toJSON()}`;
  const BATPAY_AMOUNT = list.length * DATA_ORDER_PRICE;

  let dataExchange;

  beforeEach('setup', async () => {
    token = await WIBToken.new({ from: BUYER });
    batPay = await BatPay.new(token.address);
    dataExchange = await DataExchange.new(token.address, batPay.address);
    await token.approve(batPay.address, BATPAY_AMOUNT, { from: BUYER });
    await batPay.deposit(BATPAY_AMOUNT, NEW_ACCOUNT, { from: BUYER });
    id = await batPay.accountsLength.call() - 1;
    await batPay.bulkRegister(100, 0, { from: BUYER });
  });

  it('should do complete flow', async () => {
    // 1. Buyer places the order on the Smart Contract
    const newOrder = await dataExchange.createDataOrder(
      'age:20,gender:male',
      DATA_ORDER_PRICE,
      'data request',
      '0x75cb7367476d39a4e7d2748bb1c75908f7086a0307fac4ea8fcd2231dcd2662e',
      'https://buyer.example.com/data',
      { from: BUYER },
    );
    // 2. Sellers listen for new Data Orders
    assert.equal(newOrder.logs[0].event, 'NewDataOrder');
    const newOrderAddress = newOrder.logs[0].args.dataOrder;

    const hash = Web3.utils.soliditySha3(newOrderAddress, MASTERKEY_HASH, NOTARIZATION_FEE);
    const NOTARY_SIGNATURE = await web3.eth.sign(hash, NOTARY_A);

    // 5. Sends sellerId list and notary.
    // Send locked payment that needs the master key to be unlocked
    tx = await dataExchange.addDataResponsesWithBatPay(
      newOrderAddress,
      NOTARY_A,
      MASTERKEY_HASH,
      NOTARIZATION_FEE,
      NOTARY_SIGNATURE,
      PAYDATA,
      [id, 0],
      0x1234,
      { from: BUYER },
    );

    const index = Web3.utils.toBN(tx.logs[0].args.batchIndex);

    assert.ok(index.eqn(0), 'Index should be the first one (zero)');

    // 6. Notary reveals the key used to encrypt sellers’ keys
    // TODO:(through a broker?) Define broker requirements
    const payId = 0;
    const notarized = await dataExchange.notarizeDataResponses
      .call(
        newOrderAddress, index.toNumber(), payId, MASTERKEY,
        { from: NOTARY_A },
      );
    assert.ok(notarized, 'Data Responses should be notarized');

    tx = await dataExchange.notarizeDataResponses(
      newOrderAddress, index.toNumber(), payId, MASTERKEY,
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
