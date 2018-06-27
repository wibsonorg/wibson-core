import { assertEvent, assertRevert } from '../helpers';
import { newOrder, addNotaryToOrder, addDataResponseToOrder, closeDataResponse } from './helpers';

const DataExchange = artifacts.require('./DataExchange.sol');
const Wibcoin = artifacts.require('./Wibcoin.sol');

contract('DataExchange', async (accounts) => {
  const owner = accounts[0];
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
  });

  describe('registerNotary', async () => {
    it('should be called only by the owner', async () => {
      try {
        await dataExchange.registerNotary(notary, 'Notary A', 'Notary URL', 'Notary Public Key', {
          from: other,
        });
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
      assertEvent(res, 'NotaryRegistered', 'Could not be called by owner');
    });

    it('should be called only when not paused', async () => {
      await dataExchange.pause({ from: owner });

      try {
        await dataExchange.registerNotary(notary, 'Notary A', 'Notary URL', 'Notary Public Key', {
          from: owner,
        });
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
      assertEvent(res, 'NotaryRegistered', 'Could not be called when unpaused');
    });

    it('should fail when passed an invalid notary address', async () => {
      try {
        await dataExchange.registerNotary('0x0', 'Notary A', 'Notary URL', 'Notary Public Key', {
          from: owner,
        });
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

      assertEvent(res, 'NotaryRegistered', 'Could not add a new notary');
    });

    it('should register a new notary even after a data response was added', async () => {
      const resA = await dataExchange.registerNotary(
        notary,
        'Notary A',
        'Notary URL',
        'Notary Public Key',
        { from: owner },
      );
      assertEvent(resA, 'NotaryRegistered', 'Could not add a new notary');

      await token.approve(dataExchange.address, 3000, { from: buyer });
      const tx = await newOrder(dataExchange, { from: buyer });
      const orderAddress = tx.logs[0].args.orderAddr;
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
      await addDataResponseToOrder(dataExchange, {
        orderAddress,
        seller,
        notary,
        from: buyer,
      });

      const resB = await dataExchange.registerNotary(
        other,
        'Notary B',
        'Notary B URL',
        'Notary B Public Key',
        { from: owner },
      );
      assertEvent(resB, 'NotaryRegistered', 'Could not add a new notary');
    });

    it('should register a new notary even after a data response was closed', async () => {
      const resA = await dataExchange.registerNotary(
        notary,
        'Notary A',
        'Notary URL',
        'Notary Public Key',
        { from: owner },
      );
      assertEvent(resA, 'NotaryRegistered', 'Could not add a new notary');

      await token.approve(dataExchange.address, 3000, { from: buyer });
      const tx = await newOrder(dataExchange, { from: buyer });
      const orderAddress = tx.logs[0].args.orderAddr;
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
      await addDataResponseToOrder(dataExchange, {
        orderAddress,
        seller,
        notary,
        from: buyer,
      });
      await closeDataResponse(dataExchange, {
        orderAddress,
        seller,
        notary,
        from: buyer,
      });

      const resB = await dataExchange.registerNotary(
        other,
        'Notary B',
        'Notary B URL',
        'Notary B Public Key',
        { from: owner },
      );
      assertEvent(resB, 'NotaryRegistered', 'Could not add a new notary');
    });

    it('should replace a notary', async () => {
      const creation = await dataExchange.registerNotary(
        notary,
        'Notary A',
        'Notary URL',
        'Notary Public Key',
        { from: owner },
      );
      assertEvent(creation, 'NotaryRegistered', 'Could not replace a notary');

      const res = await dataExchange.registerNotary(
        notary,
        'Notary B',
        'Notary URL 2',
        'Notary Public Key 2',
        { from: owner },
      );
      assertEvent(res, 'NotaryUpdated', 'Could not replace a notary');
    });
  });

  it('should be able to register another notary after adding notary to an order', async () => {
    await dataExchange.registerNotary(
      notary,
      'Notary A',
      'Notary URL',
      'Notary Public Key',
      { from: owner },
    );

    const tx = await newOrder(dataExchange, {
      price: 0,
      initialBudgetForAudits: 0,
      from: buyer,
    });

    const orderAddress = tx.logs[0].args.orderAddr;
    await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });

    const res = await dataExchange.registerNotary(
      other,
      'Notary B',
      'Notary B URL',
      'Notary B Public Key',
      { from: owner },
    );
    assert(res, 'failed registering another notary after adding notary to an order');
  });

  it('should be able to update an existing notary after adding notary to an order', async () => {
    await dataExchange.registerNotary(
      notary,
      'Notary A',
      'Notary URL',
      'Notary Public Key',
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
      notary,
      'Changed Notary name',
      'Changed Notary URL',
      'Changed Notary PK',
      { from: owner },
    );

    const res = await dataExchange.getNotaryInfo(notary);
    assert.equal(res[0], notary, 'notary address differs');
    assert.equal(res[1], 'Changed Notary name', 'notary name differs');
    assert.equal(res[2], 'Changed Notary URL', 'notary url differs');
    assert.equal(res[3], 'Changed Notary PK', 'notary public key differs');
  });
});
