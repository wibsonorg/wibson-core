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
  });

  describe('registerNotary', async () => {
    it('should be called only by the owner', async () => {
      try {
        await dataExchange.registerNotary(
          notary,
          'Notary A',
          'Notary URL',
          'Notary Public Key',
          { from: other },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }

      const res = await dataExchange.registerNotary(
        notary,
        'Notary A',
        'Notary URL',
        'Notary Public Key',
        { from: owner },
      );
      assert(res, 'Could not be called by owner');
    });

    it('should be called only when not paused', async () => {
      await dataExchange.pause({ from: owner });

      try {
        await dataExchange.registerNotary(
          notary,
          'Notary A',
          'Notary URL',
          'Notary Public Key',
          { from: owner },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }

      await dataExchange.unpause({ from: owner });

      const res = await dataExchange.registerNotary(
        notary,
        'Notary A',
        'Notary URL',
        'Notary Public Key',
        { from: owner },
      );
      assert(res, 'Could not be called when unpaused');
    });

    it('should fail when passed an invalid notary address', async () => {
      try {
        await dataExchange.registerNotary(
          '0x0',
          'Notary A',
          'Notary URL',
          'Notary Public Key',
          { from: owner },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should register a new notary', async () => {
      const res = await dataExchange.registerNotary(
        notary,
        'Notary A',
        'Notary URL',
        'Notary Public Key',
        { from: owner },
      );

      assert(res, 'Could not add a new notary');
    });

    it('should replace a notary', async () => {
      await dataExchange.registerNotary(
        notary,
        'Notary A',
        'Notary URL',
        'Notary Public Key',
        { from: owner },
      );

      const res = await dataExchange.registerNotary(
        notary,
        'Notary B',
        'Notary URL 2',
        'Notary Public Key 2',
        { from: owner },
      );
      assert(res, 'Could not replace a notary');
    });
  });
});
