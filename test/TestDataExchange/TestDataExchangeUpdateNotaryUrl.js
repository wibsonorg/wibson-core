import { assertEvent, assertRevert } from '../helpers';

const DataExchange = artifacts.require('./DataExchange.sol');

contract('DataExchange', async (accounts) => {
  const notary = accounts[1];
  let dataExchange;
  beforeEach(async () => {
    dataExchange = await DataExchange.new();
    await dataExchange.registerNotary('Notary URL', { from: notary });
  });

  describe('updateNotaryUrl', async () => {
    it('should update a registered notary', async () => {
      const tx = await dataExchange.updateNotaryUrl('New Notary URL', { from: notary });
      assertEvent(tx, 'NotaryUpdated', 'notary', 'oldNotaryUrl', 'newNotaryUrl');
      const notaryUrl = await dataExchange.getNotaryUrl(notary);
      assert.equal(notaryUrl, 'New Notary URL', 'Stored notary url differs');
      const { oldNotaryUrl, newNotaryUrl } = tx.logs[0].args;
      assert.equal(oldNotaryUrl, 'Notary URL', 'Old notary url differs');
      assert.equal(newNotaryUrl, 'New Notary URL', 'New notary url differs');
    });

    it('should fail when passed an invalid url', async () => {
      try {
        await dataExchange.updateNotaryUrl('', { from: notary });
        assert.fail();
      } catch (error) {
        assertRevert(error, 'notaryUrl must not be empty');
      }
    });

    it('should fail when passed an invalid notary', async () => {
      try {
        await dataExchange.updateNotaryUrl('Some Real Url', { from: accounts[2] });
        assert.fail();
      } catch (error) {
        assertRevert(error, 'Notary not registered');
      }
    });
  });
});
