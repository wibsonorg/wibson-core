import {
  assertRevert,
  assertEvent,
  assertGasConsumptionNotExceeds,
  buildDataOrder,
} from '../helpers';

const DataExchange = artifacts.require('./DataExchange.sol');
const WIBToken = artifacts.require('./WIBToken.sol');

contract.only('DataExchange', async (accounts) => {
  const buyer = accounts[4];
  const tokenAddress = WIBToken.address;
  let dataExchange;

  beforeEach(async () => {
    dataExchange = await DataExchange.new(tokenAddress);
  });

  describe('createDataOrder', () => {
    it('creates a DataOrder', async () => {
      const transaction = await dataExchange.createDataOrder(
        ...buildDataOrder(),
        { from: buyer },
      );

      assertEvent(transaction, 'DataOrderCreated', 'Expected event');
      assertGasConsumptionNotExceeds(transaction, 700000);
    });

    it('cannot create a DataOrder if buyerURLs field is empty', async () => {
      try {
        await dataExchange.createDataOrder(
          ...buildDataOrder({ buyerURLs: '' }),
          { from: buyer },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error, 'buyerURLs must not be empty');
      }
    });
  });
});
