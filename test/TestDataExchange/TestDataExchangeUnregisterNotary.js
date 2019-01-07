import { assertRevert, assertEvent, assertGasConsumptionNotExceeds } from '../helpers';

const DataExchange = artifacts.require('./DataExchange.sol');

contract('DataExchange', async (accounts) => {
  const notary = accounts[1];
  const other = accounts[3];
  let dataExchange;
  beforeEach(async () => {
    dataExchange = await DataExchange.new();
    await dataExchange.registerNotary('Notary URL', { from: notary });
  });

  describe('unregisterNotary', async () => {
    it('should unregister a notary', async () => {
      const tx = await dataExchange.unregisterNotary({ from: notary });
      assertEvent(tx, 'NotaryUnregistered', 'Could not unregister notary');
    });

    it('consumes an adequate amount of gas', async () => {
      const tx = await dataExchange.unregisterNotary({ from: notary });
      assertGasConsumptionNotExceeds(tx, 35000);
    });

    it('should fail when passed an inexistent notary address', async () => {
      try {
        await dataExchange.unregisterNotary({ from: other });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should register notary after unregistering it', async () => {
      await dataExchange.unregisterNotary({ from: notary });
      const res = await dataExchange.registerNotary('New Notary URL', { from: notary });
      assertEvent(res, 'NotaryRegistered', 'Could not update notary');
    });
  });
});
