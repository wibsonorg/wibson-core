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
  const LIST_OF_SELLERS = randomIds(1000, 50000);
  const PAYDATA = getPayData(LIST_OF_SELLERS);
  const MASTERKEY = '0x3a9c1573b2b71e6f983946fa79489682a1114193cd453bdea78717db684545b4';
  const MASTERKEY_HASH = '0x33cfdaac3c1fd1984b81dc1c3522a76b2d2fad7dd70ca8e10ea702764eafe2a8';
  const NEW_ACCOUNT = `0x${Web3.utils.toBN(2).pow(Web3.utils.toBN(256)).subn(1).toJSON()}`;
  const BATPAY_AMOUNT = LIST_OF_SELLERS.length * DATA_ORDER_PRICE;

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

    // const hash = Web3.utils.soliditySha3(newOrderAddress, MASTERKEY_HASH, NOTARIZATION_FEE);
    // const NOTARY_SIGNATURE = await web3.eth.sign(hash, NOTARY_A);

    // 5. Sends sellerId list and notary.
    // Send locked payment that needs the master key to be unlocked
    const payDataHash = Web3.utils.soliditySha3(PAYDATA.toString());
    const lock = Web3.utils.soliditySha3(payDataHash, MASTERKEY);

    const PAYDATA_PADDED = PAYDATA.toArray().map(e => `0x${(`0${e.toString('16')}`).slice(-2)}`);

    // tx = await batPay.transfer(id, 1, PAYDATA.toArray(), 0, payDataHash, lock, { from: BUYER });
    tx = await batPay.transfer(id, 1, PAYDATA_PADDED, 0, payDataHash, lock, { from: BUYER });

    // 6. Broker unlocks the payment (on notary’s behalf)
    // by revealing the master key used to encrypt sellers’ keys.
    // TODO:(through a broker?) Define broker requirements
    tx = await batPay.unlock(0, MASTERKEY, { from: BUYER });

    tx = await dataExchange.closeOrder(newOrderAddress, { from: BUYER });
    assert.equal(tx.logs[0].event, 'OrderClosed');

    // 7a. Seller can withdraw payment
    // 7b. Notary also gets paid for completed audits
  });
});
