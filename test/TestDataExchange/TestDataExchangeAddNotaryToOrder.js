import { assertEvent, assertRevert, signMessage } from '../helpers';
import { newOrder, addNotaryToOrder } from './helpers';

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
  let orderAddress;

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
    orderAddress = tx.logs[0].args.orderAddr;
  });


  describe('addNotaryToOrder', async () => {
    it('should fail if is paused', async () => {
      await dataExchange.pause({ from: owner });

      try {
        await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should fail when passed an invalid order address', async () => {
      orderAddress = '0x0000000000000000000000000000000000000000';

      try {
        await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should fail when passed an inexistent order address', async () => {
      orderAddress = other;

      try {
        await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should fail if responses percentage is not between 0 and 100', async () => {
      try {
        await addNotaryToOrder(dataExchange, {
          orderAddress, notary, responsesPercentage: 101, from: buyer,
        });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }

      try {
        await addNotaryToOrder(dataExchange, {
          orderAddress, notary, responsesPercentage: -1, from: buyer,
        });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }

      const res = await addNotaryToOrder(dataExchange, {
        orderAddress, notary, responsesPercentage: 0, from: buyer,
      });
      assert(res, 'failed with a responses percentage of 0');
    });

    it('should fail if caller is not the buyer', async () => {
      try {
        await addNotaryToOrder(dataExchange, { orderAddress, notary, from: other });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }

      try {
        await addNotaryToOrder(dataExchange, { orderAddress, notary, from: owner });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }

      try {
        await addNotaryToOrder(dataExchange, { orderAddress, notary, from: notary });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should fail if notary has already been added', async () => {
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });

      try {
        await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should fail if notary is not registered', async () => {
      try {
        await addNotaryToOrder(dataExchange, { orderAddress, notary: other, from: buyer });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should fail if signature is not ok', async () => {
      try {
        await dataExchange.addNotaryToOrder(
          orderAddress,
          notary,
          50,
          10,
          'TOS',
          signMessage(
            [orderAddress, 50, 10, 'Another TOS'],
            notary,
          ),
          { from: buyer },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('should emit a `NotaryAdded` event', async () => {
      const res = await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
      assertEvent(res, 'NotaryAdded', 'did not emit `NotaryAdded` event');
    });

    it('should add notary to an order', async () => {
      const res = await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
      assert(res, 'failed adding a notary to an order');
    });
  });
});
