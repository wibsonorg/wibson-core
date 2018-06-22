import { assertRevert } from '../helpers';
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

  beforeEach(async () => {
    dataExchange = await DataExchange.new(tokenAddress, owner);
    await token.approve(dataExchange.address, 3000, { from: buyer });
  });

  describe('getOrdersForNotary', async () => {
    it('should fail if passed an invalid address', async () => {
      try {
        await dataExchange.getOrdersForNotary(
          '0x0',
          { from: owner },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('returns no orders if there are none for the notary', async () => {
      const res = await dataExchange.getOrdersForNotary(notary);

      assert.equal(res.length, 0, 'orders for notary is not empty');
    });

    it('returns orders for notary', async () => {
    });
  });

  describe('getOrdersForSeller', async () => {
    it('should fail if passed an invalid address', async () => {
      try {
        await dataExchange.getOrdersForSeller(
          '0x0',
          { from: owner },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should return no orders if passed an inexistent seller address', async () => {
      const res = await dataExchange.getOrdersForSeller(
        other,
        { from: owner },
      );

      assert.equal(res.length, 0, 'did not return empty list of addresses');
    });

    it('should return orders for seller', async () => {
      await dataExchange.registerNotary(
        notary,
        'Notary A',
        'Notary URL',
        'Notary Public Key',
        { from: owner },
      );
      const tx = await newOrder(dataExchange, { from: buyer });
      const orderAddress = tx.logs[0].args.orderAddr;
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
      await addDataResponseToOrder(dataExchange, {
        orderAddress, seller, notary, from: buyer,
      });

      const res = await dataExchange.getOrdersForSeller(
        seller,
        { from: owner },
      );

      assert.equal(res.length, 1, 'did not return list of addresses');
      assert.equal(res[0], orderAddress, 'did not return order for seller');
    });
  });

  describe('getOrdersForBuyer', async () => {
    it('should fail if passed an invalid address', async () => {
      try {
        await dataExchange.getOrdersForBuyer(
          '0x0',
          { from: owner },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should return no orders if passed an inexistent buyer address', async () => {
      const res = await dataExchange.getOrdersForBuyer(
        other,
        { from: owner },
      );

      assert.equal(res.length, 0, 'did not return empty list of addresses');
    });

    it('should return orders for buyer', async () => {
      const tx1 = await newOrder(dataExchange, { from: buyer });
      const order1 = tx1.logs[0].args.orderAddr;

      const tx2 = await newOrder(dataExchange, { from: buyer });
      const order2 = tx2.logs[0].args.orderAddr;

      const res = await dataExchange.getOrdersForBuyer(
        buyer,
        { from: owner },
      );

      assert.equal(res.length, 2, 'did not return the list of addresses');
      assert.equal(res[0], order1, 'did not return order for buyer');
      assert.equal(res[1], order2, 'did not return order for buyer');
    });
  });

  describe('getOpenOrders', async () => {
    it('returns no orders if there are none open', async () => {
      const res = await dataExchange.getOpenOrders();

      assert.equal(res.length, 0, 'open orders is not empty');
    });

    it('returns open orders', async () => {
      await dataExchange.registerNotary(
        notary,
        'Notary A',
        'Notary URL',
        'Notary Public Key',
        { from: owner },
      );

      const tx1 = await newOrder(dataExchange, { from: buyer });
      const order1 = tx1.logs[0].args.orderAddr;
      let orderAddress = order1;
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });

      const tx2 = await newOrder(dataExchange, { from: buyer });
      const order2 = tx2.logs[0].args.orderAddr;
      orderAddress = order2;
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });

      const res = await dataExchange.getOpenOrders();
      assert.equal(res.length, 2, 'open orders is not correct length');
      assert.equal(res[0], order1, 'did not return open order');
      assert.equal(res[1], order2, 'did not return open order');

      await dataExchange.closeOrder(order1, { from: buyer });

      const res2 = await dataExchange.getOpenOrders();
      assert.equal(res2.length, 1, 'open orders is not correct length');
      assert.equal(res2[0], order2, 'did not return open order');
    });
  });

  describe('getAllowedNotaries', async () => {
    it('returns no notaries if there are none registered', async () => {
      const res = await dataExchange.getAllowedNotaries();

      assert.equal(res.length, 0, 'allowed notaries is not empty');
    });

    it('returns registered allowed notaries', async () => {
      await dataExchange.registerNotary(
        notary,
        'Notary A',
        'Notary URL',
        'Notary Public Key',
        { from: owner },
      );

      await dataExchange.registerNotary(
        other,
        'Notary B',
        'Notary B URL',
        'Notary B Public Key',
        { from: owner },
      );

      const res = await dataExchange.getAllowedNotaries();

      assert.equal(res.length, 2, 'allowed notaries is not correct length');
      assert.equal(res[0], notary, 'did not return registered notary');
      assert.equal(res[1], other, 'did not return registered notary');

      await dataExchange.unregisterNotary(
        notary,
        { from: owner },
      );

      const res2 = await dataExchange.getAllowedNotaries();
      assert.equal(res2.length, 1, 'allowed notaries is not correct length');
      assert.equal(res2[0], other, 'did not return registered notary');
    });
  });

  describe('getNotaryInfo', async () => {
    it('fails when passed an invalid address', async () => {
      try {
        await dataExchange.getNotaryInfo(
          '0x0',
          { from: other },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('fails when passed an inexistent notary', async () => {
      try {
        await dataExchange.getNotaryInfo(
          other,
          { from: owner },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('gets notary info', async () => {
      await dataExchange.registerNotary(
        notary,
        'Notary A',
        'Notary URL',
        'Notary Public Key',
        { from: owner },
      );

      const res = await dataExchange.getNotaryInfo(notary);
      assert.equal(res[0], notary, 'notary address differs');
      assert.equal(res[1], 'Notary A', 'notary name differs');
      assert.equal(res[2], 'Notary URL', 'notary url differs');
      assert.equal(res[3], 'Notary Public Key', 'notary public key differs');
    });
  });
});
