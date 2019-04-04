import { assertEvent, assertRevert } from '../helpers';

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
      assertEvent(tx, 'NotaryRegistered', 'notary', 'notaryUrl');
      const url = await dataExchange.getNotaryUrl(notary);
      assert.equal(url, 'Notary URL', 'Stored notary url differs');
      const { notaryUrl } = tx.logs[0].args;
      assert.equal(notaryUrl, url, 'Notary url differs');
    });

    it('should fail when passed an invalid url', async () => {
      try {
        await dataExchange.registerNotary('', { from: notary });
        assert.fail();
      } catch (error) {
        assertRevert(error, 'notaryUrl must not be empty');
      }
    });

    it('should fail to replace a notary', async () => {
      const tx = await dataExchange.registerNotary('Notary URL', { from: notary });
      assertEvent(tx, 'NotaryRegistered', 'notary', 'notaryUrl');
      try {
        await dataExchange.registerNotary('Updated URL', { from: notary });
        assert.fail();
      } catch (error) {
        assertRevert(error, 'Notary already registered (use updateNotaryUrl to update)');
      }
      const updatedUrl = await dataExchange.getNotaryUrl(notary);
      assert.equal(updatedUrl, 'Notary URL', 'registerNotary should not update notary url');
    });
  });
});
