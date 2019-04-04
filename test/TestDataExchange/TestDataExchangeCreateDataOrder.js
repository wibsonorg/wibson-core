import {
  assertRevert,
  assertEvent,
  buildDataOrder,
  getDataOrder,
  extractEventArgs,
} from '../helpers';

const DataExchange = artifacts.require('./DataExchange.sol');

contract('DataExchange', async (accounts) => {
  const buyer = accounts[4];
  let dataExchange;
  async function createDataOrder(order) {
    const payload = buildDataOrder(order);
    const tx = await dataExchange.createDataOrder(...payload, { from: buyer });
    return { tx, payload };
  }

  beforeEach(async () => {
    dataExchange = await DataExchange.new();
  });

  describe('createDataOrder', () => {
    it('emits an event when a DataOrder is created', async () => {
      const { tx } = await createDataOrder();
      assertEvent(tx, 'DataOrderCreated', 'orderId', 'buyer');
    });

    it('preserves params order when a DataOrder is created', async () => {
      const { tx, payload } = await createDataOrder();
      const { orderId } = extractEventArgs(tx);
      const {
        audience, price, requestedData, termsAndConditionsHash, buyerUrl,
      } = await getDataOrder(dataExchange, orderId);
      const order = [audience, price.toString(), requestedData, termsAndConditionsHash, buyerUrl];
      assert.deepEqual(order, payload);
    });

    it('assigns the sender as the buyer of the DataOrder', async () => {
      const { tx } = await createDataOrder();
      const { orderId } = extractEventArgs(tx);
      const { buyer: owner } = await getDataOrder(dataExchange, orderId);
      assert.equal(owner, buyer);
    });

    it('adds the createdAt field to the DataOrder', async () => {
      const { tx } = await createDataOrder();
      const { orderId } = extractEventArgs(tx);
      const { createdAt } = await getDataOrder(dataExchange, orderId);
      const { timestamp: now } = await web3.eth.getBlock('latest');
      assert.equal(createdAt, now);
    });

    it('adds the closedAt field to the DataOrder', async () => {
      const { tx } = await createDataOrder();
      const { orderId } = extractEventArgs(tx);
      const { closedAt } = await getDataOrder(dataExchange, orderId);
      assert.equal(Number(closedAt), 0);
    });

    it('cannot create a DataOrder if audience field is empty', async () => {
      try {
        await createDataOrder({ audience: '' });
        assert.fail();
      } catch (error) {
        assertRevert(error, 'audience must not be empty');
      }
    });

    it('cannot create a DataOrder if price == 0', async () => {
      try {
        await createDataOrder({ price: 0 });
        assert.fail();
      } catch (error) {
        assertRevert(error, 'price must be greater than zero');
      }
    });

    it('cannot create a DataOrder if requestedData field is empty', async () => {
      try {
        await createDataOrder({ requestedData: '' });
        assert.fail();
      } catch (error) {
        assertRevert(error, 'requestedData must not be empty');
      }
    });

    it('cannot create a DataOrder if termsAndConditionsHash field is empty', async () => {
      try {
        await createDataOrder({ termsAndConditions: '' });
        assert.fail();
      } catch (error) {
        assertRevert(error, 'termsAndConditionsHash must not be empty');
      }
    });

    it('cannot create a DataOrder if buyerUrl field is empty', async () => {
      try {
        await createDataOrder({ buyerUrl: '' });
        assert.fail();
      } catch (error) {
        assertRevert(error, 'buyerUrl must not be empty');
      }
    });
  });
});
