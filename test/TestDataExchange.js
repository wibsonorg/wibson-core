const web3Utils = require('web3-utils');

const DataExchange = artifacts.require('./DataExchange.sol');
const DataOrder = artifacts.require('./DataOrder.sol');
const Wibcoin = artifacts.require('./Wibcoin.sol');

contract('DataExchange', (accounts) => {
  const OWNER = accounts[6];
  const NOTARY_A = accounts[1];
  const NOTARY_B = accounts[2];
  const BUYER = accounts[4];
  const SELLER = accounts[5];

  const NOTARY_A_PK = 'abcd123xyz9-fo00o42bar-1fed019n1';
  const NOTARY_B_PK = 'abcd123xyz9-fo00o42bar-1fed019n2';

  it('should do complete flow', () => {
    const meta = {};

    Wibcoin.deployed().then((wib) => {
      meta.wib = wib;
    });

    return DataExchange.deployed().then((dx) => {
      meta.dx = dx;
      return meta.dx.registerNotary(NOTARY_A, 'Notary A', 'https://notary-a.com/data', NOTARY_A_PK, { from: OWNER });
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
        assert.equal((newOrder.logs[0].event), 'NewOrder');
      })
      .then(() => {
        let newOrderAddress;
        for (let i = 0; i < meta.order.logs.length; i++) {
          const log = meta.order.logs[i];

          if (log.event == 'NewOrder') {
            newOrderAddress = log.args.orderAddr;
            break;
          }
        }

        meta.newOrderAddress = newOrderAddress;
        meta.notarizationFee = 1;

        const responsesPercentage = 30;
        const notarizationTermsOfService = 'Notary Terms and Conditions';
        const hash = web3Utils.soliditySha3(
          newOrderAddress,
          responsesPercentage,
          meta.notarizationFee,
          notarizationTermsOfService,
        );
        const sig = web3.eth.sign(NOTARY_A, hash);

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
        assert.equal((res.logs[0].event), 'NotaryAdded');
        assert.ok(res, 'Notary was not added');
      })
      .then(res => DataOrder.at(meta.newOrderAddress).hasNotaryBeenAdded(NOTARY_A))
      .then((res) => {
        assert.ok(res, 'Notary is not in Data Order');
      })
      .then(res => DataOrder.at(meta.newOrderAddress).getNotaryInfo(NOTARY_A))
      .then((res) => {
        assert.equal(res[2], meta.notarizationFee, 'notarizationFee does not match');
      })
      .then(() => meta.dx.getOpenOrders())
      .then((openOrders) => {
        assert.ok((openOrders.indexOf(meta.newOrderAddress) >= 0), 'Order not in Open Orders');
      })
      .then(() => meta.dx.getOrdersForNotary(NOTARY_A))
      .then((ordersForNotary) => {
        assert.ok((ordersForNotary.length >= 1), 'Order not in orders for Notary');
      })
      .then(() => meta.dx.getOrdersForBuyer(BUYER))
      .then((ordersForBuyer) => {
        assert.ok((ordersForBuyer.length >= 1), 'Order not in orders for Buyer');
      })
      .then(() => meta.wib.approve(meta.dx.address, 100, { from: BUYER }))
      .then(() => {
        const dataHash = web3.sha3('0x40932840983001', { encoding: 'hex' });
        const hash = web3Utils.soliditySha3(
          meta.newOrderAddress,
          SELLER,
          NOTARY_A,
          dataHash,
        );
        const sig = web3.eth.sign(SELLER, hash);

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
        assert.equal((res.logs[0].event), 'DataAdded');
        assert.ok(res, 'Buyer could not add data response to order');
      })
      .then(res => DataOrder.at(meta.newOrderAddress).getSellerInfo(SELLER))
      .then((res) => {
        assert.equal(res[1], NOTARY_A, 'Selected notary does not match');
      })
      .then(() => meta.dx.getOrdersForSeller(SELLER))
      .then((ordersForSeller) => {
        assert.ok((ordersForSeller.length >= 1), 'Order not in orders for Seller');
      })
      .then(() => {
        const hash = web3Utils.soliditySha3(
          meta.newOrderAddress,
          SELLER,
          true,
          true,
        );
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
      .then(res => DataOrder.at(meta.newOrderAddress).getSellerInfo(SELLER))
      .then((res) => {
        assert.equal(web3Utils.hexToUtf8(res[6]), 'TransactionCompleted', 'SellerInfo status does not match');
      })
      .then(() => meta.dx.closeOrder(meta.newOrderAddress, { from: BUYER }))
      .then((res) => {
        assert.equal((res.logs[0].event), 'OrderClosed');
        assert.ok(res, 'Buyer could not close Data Order');
      });
  });

  it('should add and remove a notary', () => {
    const meta = {};

    return DataExchange.deployed().then((dx) => {
      meta.dx = dx;
      return meta.dx.registerNotary(NOTARY_B, 'Notary B', 'https://notary-b.com/data', NOTARY_B_PK, { from: OWNER });
    })
      .then((res) => {
        assert.ok(res, "couldn't register Notary");
      })
      .then(() => meta.dx.getNotaryInfo(NOTARY_B))
      .then((res) => {
        assert.deepEqual(res, [NOTARY_B, 'Notary B', 'https://notary-b.com/data', NOTARY_B_PK], 'failed to get Notary info');
      })
      .then(() => meta.dx.getAllowedNotaries())
      .then((allowedNotaries) => {
        assert.ok((allowedNotaries.length >= 1), 'failed to get allowed notaries');
      })
      .then(() => meta.dx.unregisterNotary(NOTARY_B, { from: OWNER }))
      .then((res) => {
        assert.ok(res, "couldn't unregister Notary");
      });
  });
});
