import { assertRevert, assertEvent } from '../helpers';

const DataExchange = artifacts.require('./DataExchange.sol');
const WIBToken = artifacts.require('./WIBToken.sol');

contract('DataExchange', async (accounts) => {
  const notary = accounts[1];
  const other = accounts[3];
  let dataExchange;
  beforeEach(async () => {
    dataExchange = await DataExchange.new(WIBToken.address);
    await dataExchange.registerNotary('Notary URL', { from: notary });
  });

  describe('unregisterNotary', async () => {
    it('should unregister a notary', async () => {
      const res = await dataExchange.unregisterNotary({ from: notary });
      assertEvent(res, 'NotaryUnregistered', 'Could not unregister notary');
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
