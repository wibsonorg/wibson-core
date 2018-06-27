import { assertRevert } from '../helpers';

const DataExchange = artifacts.require('./DataExchange.sol');
const Wibcoin = artifacts.require('./Wibcoin.sol');

contract('DataExchange', async (accounts) => {
  const notary = accounts[1];
  const owner = accounts[2];
  const other = accounts[3];
  const tokenAddress = Wibcoin.address;

  let dataExchange;

  beforeEach(async () => {
    dataExchange = await DataExchange.new(tokenAddress, owner);

    await dataExchange.registerNotary(
      notary,
      'Notary A',
      'Notary URL',
      'Notary Public Key',
      { from: owner },
    );
  });

  describe('unregisterNotary', async () => {
    it('should be called only by the owner', async () => {
      try {
        await dataExchange.unregisterNotary(notary, { from: other });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }

      const res = await dataExchange.unregisterNotary(notary, { from: owner });
      assert(res, 'Could not be called by owner');
    });

    it('should be called only when not paused', async () => {
      await dataExchange.pause({ from: owner });

      try {
        await dataExchange.unregisterNotary(notary, { from: owner });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }

      await dataExchange.unpause({ from: owner });

      const res = await dataExchange.unregisterNotary(notary, { from: owner });
      assert(res, 'Could not be called when unpaused');
    });

    it('should fail when passed an invalid notary address', async () => {
      try {
        await dataExchange.unregisterNotary('0x0', { from: owner });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should return false when passed an inexistent notary address', async () => {
      const res = await dataExchange.unregisterNotary.call(other, { from: owner });

      assert.isNotOk(res, 'Unregistered an inexistent notary');
    });

    it('should unregister a notary', async () => {
      const res = await dataExchange.unregisterNotary(notary, { from: owner });

      assert(res, 'Could not unregister notary');
    });

    it('should register notary after unregistering it', async () => {
      await dataExchange.unregisterNotary(notary, { from: owner });

      const ret = await dataExchange.registerNotary(
        notary,
        'Notary A',
        'Notary A URL',
        'Notary A Public Key',
        { from: owner },
      );
      assert(ret, 'Could not register notary after unregistering it');

      const res = await dataExchange.getNotaryInfo(notary);
      assert.equal(res[0], notary, 'notary address differs');
      assert.equal(res[1], 'Notary A', 'notary name differs');
      assert.equal(res[2], 'Notary A URL', 'notary url differs');
      assert.equal(res[3], 'Notary A Public Key', 'notary public key differs');
    });
  });
});
