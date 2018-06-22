import { assertEvent, assertRevert } from '../helpers';
import { newOrder, addNotaryToOrder, addDataResponseToOrder } from './helpers';

const DataExchange = artifacts.require('./DataExchange.sol');
const Wibcoin = artifacts.require('./Wibcoin.sol');

contract('DataExchange', async (accounts) => {
  const notary = accounts[1];
  const owner = accounts[2];
  const other = accounts[3];
  const buyer = accounts[4];
  const seller = accounts[5];
  const tokenAddress = Wibcoin.address;
  const token = Wibcoin.at(tokenAddress);

  let dataExchange;
  let order;

  beforeEach(async () => {
    dataExchange = await DataExchange.new(tokenAddress, owner);
    await token.approve(dataExchange.address, 3000, { from: buyer });
    await dataExchange.registerNotary(
      notary,
      'Notary',
      'Notary URL',
      'Notary Public Key',
      { from: owner },
    );

    const tx = await newOrder(dataExchange, { from: buyer });
    const orderAddress = tx.logs[0].args.orderAddr;
    order = orderAddress;
    await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
  });

  describe('closeOrder', async () => {
    it('should fail if is paused', async () => {
      await dataExchange.pause({ from: owner });

      try {
        await dataExchange.closeOrder(order, { from: owner });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should fail when passed an invalid order address', async () => {
      try {
        await dataExchange.closeOrder('0x0', { from: owner });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should fail when passed an inexistent order address', async () => {
      try {
        await dataExchange.closeOrder(other, { from: owner });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should fail when passed an order that is not open', async () => {
    });

    it('should fail when called by other than the order buyer or the contract owner', async () => {
      try {
        await dataExchange.closeOrder(other, { from: other });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should be called by the contract owner', async () => {
      const res = await dataExchange.closeOrder(order, { from: owner });
      assert(res, 'failed when called by owner');
    });

    it('should be called by the buyer', async () => {
      const res = await dataExchange.closeOrder(order, { from: buyer });
      assert(res, 'failed when called by buyer');
    });

    it('should fail if buyer did not approve the transfer', async () => {
    });

    it('should emit an `OrderClosed` event', async () => {
      const res = await dataExchange.closeOrder(order, { from: buyer });
      assertEvent(res, 'OrderClosed', 'did not emit `OrderClosed` event');
    });

    it('should close an open order that has a data response', async () => {
      const orderAddress = order;
      await addDataResponseToOrder(dataExchange, {
        orderAddress, seller, notary, from: buyer,
      });

      const res = await dataExchange.closeOrder(order, { from: owner });
      assert(res, 'failed when closing an order with a response');
    });

    it('should close an open order', async () => {
      const res = await dataExchange.closeOrder(order, { from: owner });
      assert(res, 'failed when closing an order');
    });
  });
});
