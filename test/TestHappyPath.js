import web3Utils from 'web3-utils';
import { signMessage } from './helpers';

const DataExchange = artifacts.require('./DataExchange.sol');
const DataOrder = artifacts.require('./DataOrder.sol');
const Wibcoin = artifacts.require('./Wibcoin.sol');

contract('DataExchange', (accounts) => {
  const OWNER = accounts[6];
  const NOTARY_A = accounts[1];
  const BUYER = accounts[4];
  const SELLER = accounts[5];

  const NOTARY_A_PK = 'abcd123xyz9-fo00o42bar-1fed019n1';

  it('should do complete flow', () => {
    const meta = {};

    Wibcoin.deployed().then((wib) => {
      meta.wib = wib;
    });

    return DataExchange.deployed()
      .then((dx) => {
        meta.dx = dx;
        return meta.dx.registerNotary(
          NOTARY_A,
          'Notary A',
          'https://notary-a.com/data',
          NOTARY_A_PK,
          { from: OWNER },
        );
      })
      .then((res) => {
        assert.ok(res, "couldn't register Notary");
      })
      .then(() => meta.dx.setMinimumInitialBudgetForAudits(2000, { from: OWNER }))
      .then((res) => {
        assert.ok(res, "couldn't set minimum initial budget for audit");
      })
      .then(() => meta.wib.approve(meta.dx.address, 3000, { from: BUYER }))
      .then(() => {
        meta.price = 20;
        return meta.dx.newOrder(
          'age:20,gender:male',
          'data request',
          meta.price,
          3000,
          'Terms and Conditions',
          'https://buyer.example.com/data',
          'public-key',
          { from: BUYER },
        );
      })
      .then((newOrder) => {
        meta.order = newOrder;
        assert.equal(newOrder.logs[0].event, 'NewOrder');
      })
      .then(() => {
        let newOrderAddress;
        for (let i = 0; i < meta.order.logs.length; i += 1) {
          const log = meta.order.logs[i];

          if (log.event === 'NewOrder') {
            newOrderAddress = log.args.orderAddr;
            break;
          }
        }

        meta.newOrderAddress = newOrderAddress;
        meta.notarizationFee = 1;

        const responsesPercentage = 30;
        const notarizationTermsOfService = 'Notary Terms and Conditions';
        const sig = signMessage(
          [newOrderAddress, responsesPercentage, meta.notarizationFee, notarizationTermsOfService],
          NOTARY_A,
        );

        return meta.dx.addNotaryToOrder(
          newOrderAddress,
          NOTARY_A,
          responsesPercentage,
          meta.notarizationFee,
          notarizationTermsOfService,
          sig,
          { from: BUYER },
        );
      })
      .then((res) => {
        assert.equal(res.logs[0].event, 'NotaryAddedToOrder');
        assert.ok(res, 'Notary was not added to order');
      })
      .then(() => DataOrder.at(meta.newOrderAddress).hasNotaryBeenAdded(NOTARY_A))
      .then((res) => {
        assert.ok(res, 'Notary is not in Data Order');
      })
      .then(() => DataOrder.at(meta.newOrderAddress).getNotaryInfo(NOTARY_A))
      .then((res) => {
        assert.equal(res[2], meta.notarizationFee, 'notarizationFee does not match');
      })
      .then(() => meta.dx.getOpenOrders())
      .then((openOrders) => {
        assert.ok(openOrders.indexOf(meta.newOrderAddress) >= 0, 'Order not in Open Orders');
      })
      .then(() => meta.dx.getOrdersForNotary(NOTARY_A))
      .then((ordersForNotary) => {
        assert.ok(ordersForNotary.length >= 1, 'Order not in orders for Notary');
      })
      .then(() => meta.dx.getOrdersForBuyer(BUYER))
      .then((ordersForBuyer) => {
        assert.ok(ordersForBuyer.length >= 1, 'Order not in orders for Buyer');
      })
      .then(() => meta.wib.approve(meta.dx.address, 100, { from: BUYER }))
      .then(() => {
        const dataHash = '9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d';
        const sig = signMessage([meta.newOrderAddress, NOTARY_A, dataHash], SELLER);

        return meta.dx.addDataResponseToOrder(
          meta.newOrderAddress,
          SELLER,
          NOTARY_A,
          dataHash,
          sig,
          { from: BUYER },
        );
      })
      .then((res) => {
        assert.equal(res.logs[0].event, 'DataAdded');
        assert.ok(res, 'Buyer could not add data response to order');
      })
      .then(() => DataOrder.at(meta.newOrderAddress).getSellerInfo(SELLER))
      .then((res) => {
        assert.equal(res[1], NOTARY_A, 'Selected notary does not match');
      })
      .then(() => meta.dx.getOrdersForSeller(SELLER))
      .then((ordersForSeller) => {
        assert.ok(ordersForSeller.length >= 1, 'Order not in orders for Seller');
      })
      .then(() => {
        const hash = web3Utils.soliditySha3(meta.newOrderAddress, SELLER, true, true);
        const sig = web3.eth.sign(NOTARY_A, hash);

        return meta.dx.closeDataResponse(
          meta.newOrderAddress,
          SELLER,
          true, // wasAudited
          true, // isDataValid
          sig,
          { from: BUYER },
        );
      })
      .then((res) => {
        assert.ok(res, 'Buyer could not close Data Response');
      })
      .then(() => DataOrder.at(meta.newOrderAddress).getSellerInfo(SELLER))
      .then((res) => {
        assert.equal(
          web3Utils.hexToUtf8(res[5]),
          'TransactionCompleted',
          'SellerInfo status does not match',
        );
      })
      .then(() => meta.dx.closeOrder(meta.newOrderAddress, { from: BUYER }))
      .then((res) => {
        assert.equal(res.logs[0].event, 'OrderClosed');
        assert.ok(res, 'Buyer could not close Data Order');
      });
  });
});
