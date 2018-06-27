import { assertRevert, assertEvent } from '../helpers';
import { addNotaryToOrder, newOrder } from './helpers';

const DataExchange = artifacts.require('./DataExchange.sol');
const Wibcoin = artifacts.require('./Wibcoin.sol');

contract('DataExchange', async (accounts) => {
  const notary = accounts[1];
  const owner = accounts[2];
  const other = accounts[3];
  const buyer = accounts[4];
  const tokenAddress = Wibcoin.address;
  const token = Wibcoin.at(tokenAddress);

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
        await dataExchange.unregisterNotary(
          notary,
          { from: other },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }

      const res = await dataExchange.unregisterNotary(
        notary,
        { from: owner },
      );
      assertEvent(res, 'NotaryUnregistered', 'Could not be called by owner');
    });

    it('should be called only when not paused', async () => {
      await dataExchange.pause({ from: owner });

      try {
        await dataExchange.unregisterNotary(
          notary,
          { from: owner },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }

      await dataExchange.unpause({ from: owner });

      const res = await dataExchange.unregisterNotary(
        notary,
        { from: owner },
      );
      assertEvent(res, 'NotaryUnregistered', 'Could not be called when unpaused');
    });

    it('should fail when passed an invalid notary address', async () => {
      try {
        await dataExchange.unregisterNotary(
          '0x0',
          { from: owner },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should fail when passed an inexistent notary address', async () => {
      try {
        await dataExchange.unregisterNotary(
          other,
          { from: owner },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should unregister a notary', async () => {
      const res = await dataExchange.unregisterNotary(
        notary,
        { from: owner },
      );
      assertEvent(res, 'NotaryUnregistered', 'Could not unregister notary');
    });

    it('should unregister a notary', async () => {
      const res = await dataExchange.unregisterNotary(notary, { from: owner });

      assertEvent(res, 'NotaryUnregistered', 'Could not unregister notary');
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
      assertEvent(ret, 'NotaryUpdated', 'Could not update notary');

      const res = await dataExchange.getNotaryInfo(notary);
      assert.equal(res[0], notary, 'notary address differs');
      assert.equal(res[1], 'Notary A', 'notary name differs');
      assert.equal(res[2], 'Notary A URL', 'notary url differs');
      assert.equal(res[3], 'Notary A Public Key', 'notary public key differs');
    });

    it('should fail to add an unregistered notary to an order', async () => {
      await dataExchange.unregisterNotary(notary, { from: owner });
      await token.approve(dataExchange.address, 3000, { from: buyer });
      const tx = await newOrder(dataExchange, { from: buyer });
      const orderAddress = tx.logs[0].args.orderAddr;

      try {
        await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should be able to close an order with an unregistered notary', async () => {
      await token.approve(dataExchange.address, 3000, { from: buyer });
      const tx = await newOrder(dataExchange, { from: buyer });
      const orderAddress = tx.logs[0].args.orderAddr;
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
      await dataExchange.unregisterNotary(notary, { from: owner });

      const res = await dataExchange.closeOrder(orderAddress, { from: buyer });
      assertEvent(res, 'OrderClosed', 'did not close an order with an unregistered notary');
    });

    it('should be able to unregister another notary after adding notary to an order', async () => {
      await dataExchange.registerNotary(
        notary,
        'Notary A',
        'Notary A URL',
        'Notary A Public Key',
        { from: owner },
      );

      const tx = await newOrder(dataExchange, {
        price: 0,
        initialBudgetForAudits: 0,
        from: buyer,
      });
      const orderAddress = tx.logs[0].args.orderAddr;
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });

      await dataExchange.registerNotary(
        other,
        'Notary B',
        'Notary B URL',
        'Notary B Public Key',
        { from: owner },
      );

      const res = await dataExchange.unregisterNotary(other, { from: owner });
      assertEvent(
        res,
        'NotaryUnregistered',
        'failed unregistering another notary after adding notary to an order',
      );
    });

    it('should be able to unregister an existing notary after adding that notary to an order', async () => {
      await dataExchange.registerNotary(
        notary,
        'Notary A',
        'Notary A URL',
        'Notary A Public Key',
        { from: owner },
      );

      const tx = await newOrder(dataExchange, {
        price: 0,
        initialBudgetForAudits: 0,
        from: buyer,
      });
      const orderAddress = tx.logs[0].args.orderAddr;
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });

      const res = await dataExchange.unregisterNotary(notary, { from: owner });
      assertEvent(
        res,
        'NotaryUnregistered',
        'failed unregistering  notary after adding that notary to an order',
      );
    });
  });
});
