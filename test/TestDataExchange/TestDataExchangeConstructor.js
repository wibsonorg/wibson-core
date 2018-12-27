import { assertRevert } from '../helpers';

const DataExchange = artifacts.require('./DataExchange.sol');
const WIBToken = artifacts.require('./WIBToken.sol');

contract('DataExchange', async () => {
  describe('Constructor', () => {
    it('can not create a DataExchange supplying invalid addresses', async () => {
      try {
        await DataExchange.new('0x0000000000000000000000000000000000000000');
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('creates a DataExchange instance', async () => {
      const newToken = await WIBToken.new();
      const dataExchange = await DataExchange.new(newToken.address);
      assert(dataExchange, 'DataExchange was not created correctly');
    });
  });
});
