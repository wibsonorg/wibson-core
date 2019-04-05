import {
  assertEvent,
  assertRevert,
  buildDataOrder,
  getDataOrder,
  extractEventArgs,
} from '../helpers';

const DataExchange = artifacts.require('./DataExchange.sol');
contract('DataExchange', async (accounts) => {
  const other = accounts[3];
  const buyer = accounts[4];

  let dataExchange;
  let orderId;
  async function createOtherDataOrder() {
    const tx = await dataExchange.createDataOrder(
      ...buildDataOrder({
        audience: [
          { name: 'age', value: '25' },
          { name: 'gender', value: 'female' },
        ],
        price: 30000000000,
        requestedData: ['device-info'],
        terms: 'OtherDataOrder T&C',
        buyerUrl: '/data-orders/67890',
      }),
      { from: buyer },
    );
    return extractEventArgs(tx).orderId;
  }
  function assertDataOrderClosedEvent(tx) {
    assertEvent(tx, 'DataOrderClosed', 'orderId', 'buyer');
  }

  beforeEach(async () => {
    dataExchange = await DataExchange.new();
    const tx = await dataExchange.createDataOrder(
      ...buildDataOrder(),
      { from: buyer },
    );
    ({ orderId } = extractEventArgs(tx));
  });

  describe('closeDataOrder', async () => {
    it('emits an event when a DataOrder is closed', async () => {
      const tx = await dataExchange.closeDataOrder(orderId, { from: buyer });
      assertDataOrderClosedEvent(tx);
    });

    it('updates the DataOrder\'s closedAt field', async () => {
      await dataExchange.closeDataOrder(orderId, { from: buyer });
      const { closedAt } = await getDataOrder(dataExchange, orderId);
      const { timestamp: now } = await web3.eth.getBlock('latest');
      assert.equal(closedAt, now);
    });

    it('closes an open order even if another order is created', async () => {
      await createOtherDataOrder();
      const tx = await dataExchange.closeDataOrder(orderId, { from: buyer });
      assertDataOrderClosedEvent(tx);
    });

    it('closes an open order even if another order is closed', async () => {
      const anotherOrderId = await createOtherDataOrder();
      await dataExchange.closeDataOrder(anotherOrderId, { from: buyer });
      const tx = await dataExchange.closeDataOrder(orderId, { from: buyer });
      assertDataOrderClosedEvent(tx);
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
