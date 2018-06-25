import { assertRevert } from '../helpers';

const DataExchange = artifacts.require('./DataExchange.sol');
const Wibcoin = artifacts.require('./Wibcoin.sol');

contract('DataExchange', async (accounts) => {
  const owner = accounts[0];
  const tokenAddress = Wibcoin.address;
  const zeroAddress = '0x0000000000000000000000000000000000000000';

  describe('Constructor', () => {
    it('can not create a DataExchange supplying invalid addresses', async () => {
      try {
        await DataExchange.new(zeroAddress, owner);
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }

      try {
        await DataExchange.new(tokenAddress, zeroAddress);
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }

      try {
        await DataExchange.new(tokenAddress, tokenAddress);
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('creates a DataExchange instance', async () => {
      const newToken = await Wibcoin.new();
      const dataExchange = await DataExchange.new(newToken.address, owner);
      assert(dataExchange, 'DataExchange was not created correctly');
    });
  });
});
