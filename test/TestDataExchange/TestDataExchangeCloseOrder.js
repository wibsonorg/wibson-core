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
    it('should fail if it is paused', async () => {
      await dataExchange.pause({ from: owner });

      try {
        await dataExchange.closeOrder(order, { from: owner });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }

      await dataExchange.unpause({ from: owner });
      const res = await dataExchange.closeOrder(order, { from: owner });
      assertEvent(res, 'OrderClosed', 'did not emit `OrderClosed` event');
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
      await dataExchange.closeOrder(order, { from: owner });

      try {
        await dataExchange.closeOrder(order, { from: owner });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
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
      assertEvent(res, 'OrderClosed', 'did not emit `OrderClosed` event');
    });

    it('should be called by the buyer', async () => {
      const res = await dataExchange.closeOrder(order, { from: buyer });
      assertEvent(res, 'OrderClosed', 'did not emit `OrderClosed` event');
    });

    it('should transfer remaining budget to audit', async () => {
      const originalBuyerBalance = await token.balanceOf.call(buyer);
      await dataExchange.closeOrder(order, { from: buyer });

      const newBuyerBalance = await token.balanceOf.call(buyer);
      assert.equal(newBuyerBalance.toNumber(), originalBuyerBalance.toNumber() + 10, 'did not transfer remaining budget');
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
      assertEvent(res, 'OrderClosed', 'did not emit `OrderClosed` event');
    });

    it('should close an open order', async () => {
      const res = await dataExchange.closeOrder(order, { from: owner });
      assertEvent(res, 'OrderClosed', 'did not emit `OrderClosed` event');
    });

    it('should close an open order even if a notary is registered', async () => {
      await dataExchange.registerNotary(
        other,
        'Another Notary',
        'Another Notary URL',
        'Another Notary Public Key',
        { from: owner },
      );

      const res = await dataExchange.closeOrder(order, { from: owner });
      assertEvent(res, 'OrderClosed', 'did not emit `OrderClosed` event');
    });

    it('should close an open order even if a notary is unregistered', async () => {
      await dataExchange.unregisterNotary(notary, { from: owner });

      const res = await dataExchange.closeOrder(order, { from: owner });
      assertEvent(res, 'OrderClosed', 'did not emit `OrderClosed` event');
    });

    it('should close an open order even if another order is created', async () => {
      await newOrder(dataExchange, { from: buyer });

      const res = await dataExchange.closeOrder(order, { from: owner });
      assertEvent(res, 'OrderClosed', 'did not emit `OrderClosed` event');
    });

    it('should close an open order even if another notary is added to the same order', async () => {
      await dataExchange.registerNotary(
        other,
        'Another Notary',
        'Another Notary URL',
        'Another Notary Public Key',
        { from: owner },
      );
      await addNotaryToOrder(dataExchange, { orderAddress: order, notary: other, from: buyer });

      const res = await dataExchange.closeOrder(order, { from: owner });
      assertEvent(res, 'OrderClosed', 'did not emit `OrderClosed` event');
    });
  });
});
