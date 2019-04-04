import { assertRevert, assertEvent } from '../helpers';

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
      assertEvent(tx, 'NotaryUnregistered', 'notary', 'oldNotaryUrl');
      const { oldNotaryUrl } = tx.logs[0].args;
      assert.equal(oldNotaryUrl, 'Notary URL', 'Old notary url differs');
    });

    it('should fail when passed an inexistent notary address', async () => {
      try {
        await dataExchange.unregisterNotary({ from: other });
        assert.fail();
      } catch (error) {
        assertRevert(error, 'sender must be registered');
      }
    });

    it('should register notary after unregistering it', async () => {
      await dataExchange.unregisterNotary({ from: notary });
      const tx = await dataExchange.registerNotary('New Notary URL', { from: notary });
      assertEvent(tx, 'NotaryRegistered', 'notary', 'notaryUrl');
    });
  });
});
