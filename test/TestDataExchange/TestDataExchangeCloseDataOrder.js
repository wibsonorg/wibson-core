import {
  assertEvent,
  assertRevert,
  assertGasConsumptionNotExceeds,
  buildDataOrder,
  extractEventArgs,
} from '../helpers';

const Web3 = require('web3');

const sha3 = Web3.utils.soliditySha3;

const DataExchange = artifacts.require('./DataExchange.sol');
const WIBToken = artifacts.require('./WIBToken.sol');

contract('DataExchange', async (accounts) => {
  const other = accounts[3];
  const buyer = accounts[4];
  const tokenAddress = WIBToken.address;

  let dataExchange;
  let orderId;

  beforeEach(async () => {
    dataExchange = await DataExchange.new(tokenAddress);
    const tx = await dataExchange.createDataOrder(
      ...buildDataOrder(),
      { from: buyer },
    );
    ({ orderId } = extractEventArgs(tx));
  });

  describe('closeDataOrder', async () => {
    it('emits an event when a DataOrder is closed', async () => {
      const transaction = await dataExchange.closeDataOrder(orderId, { from: buyer });
      assertEvent(transaction, 'DataOrderClosed', 'did not emit `DataOrderClosed` event');
    });

    it('consumes an adequate amount of gas', async () => {
      const transaction = await dataExchange.closeDataOrder(orderId, { from: buyer });
      assertGasConsumptionNotExceeds(transaction, 35000);
    });

    it('updates the DataOrder\'s closedAt field', async () => {
      await dataExchange.closeDataOrder(orderId, { from: buyer });
      const dataOrder = await dataExchange.dataOrders(orderId);
      const [closedAt] = dataOrder.slice(-1);
      assert.equal(closedAt, web3.eth.getBlock('latest').timestamp);
    });

    it('closes an open order even if another order is created', async () => {
      await dataExchange.createDataOrder(
        JSON.stringify([
          { name: 'age', value: '25' },
          { name: 'gender', value: 'female' },
        ]),
        '20000000000',
        JSON.stringify(['device_info']),
        sha3('DataOrder 2 T&C'),
        '/data-orders/67890',
        { from: buyer },
      );

      const transaction = await dataExchange.closeDataOrder(orderId, { from: buyer });
      assertEvent(transaction, 'DataOrderClosed', 'did not emit `DataOrderClosed` event');
    });

    it('closes an open order even if another order is closed', async () => {
      const anotherTx = await dataExchange.createDataOrder(
        JSON.stringify([
          { name: 'age', value: '25' },
          { name: 'gender', value: 'female' },
        ]),
        '20000000000',
        JSON.stringify(['device_info']),
        sha3('DataOrder 2 T&C'),
        '/data-orders/67890',
        { from: buyer },
      );
      const anotherOrderId = anotherTx.logs[0].args.orderId;
      await dataExchange.closeDataOrder(anotherOrderId, { from: buyer });

      const transaction = await dataExchange.closeDataOrder(orderId, { from: buyer });
      assertEvent(transaction, 'DataOrderClosed', 'did not emit `DataOrderClosed` event');
    });

    it('fails when called by other than the buyer', async () => {
      try {
        await dataExchange.closeDataOrder(orderId, { from: other });
        assert.fail();
      } catch (error) {
        assertRevert(error, 'sender can\'t close the order');
      }
    });

    it('fails when order is already closed', async () => {
      await dataExchange.closeDataOrder(orderId, { from: buyer });

      try {
        await dataExchange.closeDataOrder(orderId, { from: buyer });
        assert.fail();
      } catch (error) {
        assertRevert(error, 'order already closed');
      }
    });

    it('fails when order does not exist', async () => {
      try {
        await dataExchange.closeDataOrder(100000, { from: buyer });
        assert.fail();
      } catch (error) {
        assertRevert(error, 'invalid order index');
      }
    });

    it('fails when order is invalid', async () => {
      try {
        await dataExchange.closeDataOrder(-1, { from: buyer });
        assert.fail();
      } catch (error) {
        assertRevert(error, 'invalid order index');
      }
    });
  });
});
