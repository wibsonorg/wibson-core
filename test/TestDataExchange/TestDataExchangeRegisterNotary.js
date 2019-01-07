import { assertEvent, assertRevert, assertGasConsumptionNotExceeds } from '../helpers';

const DataExchange = artifacts.require('./DataExchange.sol');

contract('DataExchange', async (accounts) => {
  const notary = accounts[1];
  let dataExchange;
  beforeEach(async () => {
    dataExchange = await DataExchange.new();
  });

  describe('registerNotary', async () => {
    it('should register a new notary', async () => {
      const tx = await dataExchange.registerNotary('Notary URL', { from: notary });
      assertEvent(tx, 'NotaryRegistered', 'Could not add a new notary');

      const notaryUrl = await dataExchange.notaryUrls.call(notary);
      assert.equal(notaryUrl, 'Notary URL', 'Notary url differs');
    });

    it('consumes an adequate amount of gas', async () => {
      const tx = await dataExchange.registerNotary('Notary URL'.repeat(20), { from: notary });
      assertGasConsumptionNotExceeds(tx, 200000);
    });

    it('should fail when passed an invalid url', async () => {
      try {
        await dataExchange.registerNotary('', { from: notary });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should replace a notary', async () => {
      const registration = await dataExchange.registerNotary('Notary URL', { from: notary });
      assertEvent(registration, 'NotaryRegistered', 'Could not register a notary');

      const update = await dataExchange.registerNotary('Updated URL', { from: notary });
      assertEvent(update, 'NotaryUpdated', 'Could not replace a notary');

      const updatedUrl = await dataExchange.notaryUrls.call(notary);
      assert.equal(updatedUrl, 'Updated URL', 'Could not update notary url');
    });
  });
});
