import { randomIds, getPayData } from './helpers/utils';

const Web3 = require('web3');

const web3 = new Web3('http://localhost:8545');

const DataExchange = artifacts.require('./DataExchange.sol');
const WIBToken = artifacts.require('./WIBToken.sol');
const BatPay = artifacts.require('./BatPay.sol');

contract('DataExchange', (accounts) => {
  let dataExchange;
  let batPay;
  let token;
  let tx;
  let id;
  const NOTARY_A = accounts[1];
  const BUYER = accounts[4];
  const MASTERKEY_HASH = '0x3a9c1573b2b71e6f983946fa79489682a1114193cd453bdea78717db684545b4';
  const list = randomIds(1000, 50000);
  const data = getPayData(list);
  const newAccountBN = Web3.utils.toBN(2).pow(Web3.utils.toBN(256)).subn(1);
  const newAccount = `0x${newAccountBN.toJSON()}`;

  const amount = list.length;

  beforeEach('setup', async () => {
    token = await WIBToken.new({ from: BUYER });
    batPay = await BatPay.new(token.address);
    dataExchange = await DataExchange.new(token.address, batPay.address);
    await token.approve(batPay.address, amount, { from: BUYER });
    await batPay.deposit(amount, newAccount, { from: BUYER });
    id = await batPay.accountsLength.call() - 1;
    await batPay.bulkRegister(100, 0, { from: BUYER });
  });

  it('cost of batpay batch payment', async () => {
    tx = await batPay.transfer(id, 1, data, 0, 0x1234, 0x1234, { from: BUYER });
    console.log({ batchPaymentCost: tx.receipt.gasUsed });
  });

  it('cost of addDataResponse without payment', async () => {
    const newOrder = await dataExchange.createDataOrder(
      'age:20,gender:male',
      20,
      'data request',
      '0x75cb7367476d39a4e7d2748bb1c75908f7086a0307fac4ea8fcd2231dcd2662e',
      'https://buyer.example.com/data',
      { from: BUYER },
    );
    const newOrderAddress = newOrder.logs[0].args.dataOrder;
    const hash = Web3.utils.soliditySha3(newOrderAddress, MASTERKEY_HASH, 10);
    const NOTARY_SIGNATURE = await web3.eth.sign(hash, NOTARY_A);

    tx = await dataExchange.addDataResponses(
      newOrderAddress, NOTARY_A, MASTERKEY_HASH, 10, NOTARY_SIGNATURE,
      { from: BUYER },
    );
    console.log({ addDataResponseWithoutPayment: tx.receipt.gasUsed });
  });

  it('cost of batpay through dataExchange', async () => {
    const newOrder = await dataExchange.createDataOrder(
      'age:20,gender:male',
      20,
      'data request',
      '0x75cb7367476d39a4e7d2748bb1c75908f7086a0307fac4ea8fcd2231dcd2662e',
      'https://buyer.example.com/data',
      { from: BUYER },
    );
    const newOrderAddress = newOrder.logs[0].args.dataOrder;
    const hash = Web3.utils.soliditySha3(newOrderAddress, MASTERKEY_HASH, 10);
    const NOTARY_SIGNATURE = await web3.eth.sign(hash, NOTARY_A);

    tx = await dataExchange.addDataResponsesWithBatPay(
      newOrderAddress, NOTARY_A, MASTERKEY_HASH, 10, NOTARY_SIGNATURE, data,
      [id, 1, 0], 0x1234,
      { from: BUYER },
    );
    console.log({ addDataResponseWithPayment: tx.receipt.gasUsed });
  });
});
