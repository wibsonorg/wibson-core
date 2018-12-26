import {
  assertRevert,
  assertEvent,
  assertGasConsumptionNotExceeds,
  buildDataOrder,
  extractEventArgs,
} from '../helpers';

const DataExchange = artifacts.require('./DataExchange.sol');
const WIBToken = artifacts.require('./WIBToken.sol');

contract('DataExchange', async (accounts) => {
  const buyer = accounts[4];
  const tokenAddress = WIBToken.address;
  let dataExchange;

  beforeEach(async () => {
    dataExchange = await DataExchange.new(tokenAddress);
  });

  describe('createDataOrder', () => {
    it('emits an event when a DataOrder is created', async () => {
      const transaction = await dataExchange.createDataOrder(
        ...buildDataOrder(),
        { from: buyer },
      );

      assertEvent(transaction, 'DataOrderCreated', 'Expected event');
    });

    it('consumes an adequate amount of gas', async () => {
      const transaction = await dataExchange.createDataOrder(
        ...buildDataOrder(),
        { from: buyer },
      );

      assertGasConsumptionNotExceeds(transaction, 312000);
    });

    it('assigns the sender as the buyer of the DataOrder', async () => {
      const transaction = await dataExchange.createDataOrder(
        ...buildDataOrder(),
        { from: buyer },
      );

      const { orderId } = extractEventArgs(transaction);
      const [owner] = await dataExchange.dataOrders(orderId);
      assert.equal(owner, buyer);
    });

    it('preserves params order when a DataOrder is created', async () => {
      const payload = buildDataOrder();
      const transaction = await dataExchange.createDataOrder(
        ...payload,
        { from: buyer },
      );

      const { orderId } = extractEventArgs(transaction);
      const [, audience, price, requestedData, terms, url] = await dataExchange.dataOrders(orderId);
      assert.deepEqual([audience, price.toString(), requestedData, terms, url], payload);
    });

    it('adds the createdAt field to the DataOrder', async () => {
      const payload = buildDataOrder();
      const transaction = await dataExchange.createDataOrder(
        ...payload,
        { from: buyer },
      );

      const { orderId } = extractEventArgs(transaction);
      const dataOrder = await dataExchange.dataOrders(orderId);
      const [createdAt] = dataOrder.slice(-2);
      assert.equal(createdAt, web3.eth.getBlock('latest').timestamp);
    });

    it('adds the closedAt field to the DataOrder', async () => {
      const payload = buildDataOrder();
      const transaction = await dataExchange.createDataOrder(
        ...payload,
        { from: buyer },
      );

      const { orderId } = extractEventArgs(transaction);
      const dataOrder = await dataExchange.dataOrders(orderId);
      const [closedAt] = dataOrder.slice(-1);
      assert.equal(Number(closedAt), 0);
    });

    it('cannot create a DataOrder if buyerUrl field is empty', async () => {
      try {
        await dataExchange.createDataOrder(
          ...buildDataOrder({ buyerUrl: '' }),
          { from: buyer },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error, 'buyerUrl must not be empty');
      }
    });
  });
});
