import sinon from 'sinon';
import axios from 'axios';
import { assertEvent, assertRevert } from '../helpers';
import { buildSignedNotaryInfo, getSignerFromMessage } from '../helpers/notaryHelpers';

const DataExchange = artifacts.require('./DataExchange.sol');

contract('DataExchange', async (accounts) => {
  const notary = accounts[1];
  const notaryPrivateKey = '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501201';
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

    /* The following test is for documentation purposes ONLY.
     * It shows how a public URL can be validated to avoid phishing attacks.
     */
    it('should validate registered public URL.', async () => {
      // 1. Setup: We mock any GET request
      const data = buildSignedNotaryInfo(notaryPrivateKey);
      const sandbox = sinon.createSandbox();
      sandbox.stub(axios, 'get').resolves({ data });

      // 2. Setup: We register the notary with a Public URL.
      await dataExchange.registerNotary('https://example.com', { from: notary });

      // 3. Any user reads the Public URL.
      const url = await dataExchange.getNotaryUrl(notary);

      // 4. The user requests the additional information from the Public URL
      const response = await axios.get(url);
      const { message, signature } = response.data;

      // 5. The user gets the signer address and ensures it is the same as the registered notary.
      const signer = getSignerFromMessage(message, signature);
      assert.equal(notary.toLowerCase(), signer.toLowerCase(), 'Notary URL is not signed by sender');

      // 6. Cooldown: We restore the mock.
      sandbox.restore();
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
