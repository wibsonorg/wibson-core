import { assertRevert, assertEvent } from '../helpers';
import { newOrder, addNotaryToOrder } from './helpers';

const DataExchange = artifacts.require('./DataExchange.sol');
const Wibcoin = artifacts.require('./Wibcoin.sol');

contract('DataExchange', async (accounts) => {
  const owner = accounts[0];
  const notary = accounts[1];
  const buyer = accounts[4];
  const anotherBuyer = accounts[5];
  const tokenAddress = Wibcoin.address;
  const token = Wibcoin.at(tokenAddress);
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  let dataExchange;

  beforeEach(async () => {
    dataExchange = await DataExchange.new(tokenAddress, owner);
    await token.approve(dataExchange.address, 3000, { from: buyer });
  });

  describe('newOrder', () => {
    it('creates a new DataOrder', async () => {
      const newOrderTransaction = await newOrder(dataExchange, {
        price: 0,
        initialBudgetForAudits: 0,
        from: buyer,
      });
      assertEvent(newOrderTransaction, 'NewOrder', 'DataOrder was not created properly');
    });

    it('creates a new DataOrder even if a notary was registered', async () => {
      await dataExchange.registerNotary(
        notary,
        'Notary A',
        'https://notary-a.com/data',
        'public-key-a',
        { from: owner },
      );

      const newOrderTransaction = await newOrder(dataExchange, {
        price: 0,
        initialBudgetForAudits: 0,
        from: buyer,
      });
      assertEvent(newOrderTransaction, 'NewOrder', 'DataOrder was not created properly');
    });

    it('creates a new DataOrder even if a notary was unregistered', async () => {
      await dataExchange.registerNotary(
        notary,
        'Notary A',
        'https://notary-a.com/data',
        'public-key-a',
        { from: owner },
      );
      await dataExchange.unregisterNotary(notary, { from: owner });

      const newOrderTransaction = await newOrder(dataExchange, {
        price: 0,
        initialBudgetForAudits: 0,
        from: buyer,
      });
      assertEvent(newOrderTransaction, 'NewOrder', 'DataOrder was not created properly');
    });

    it('can not create a DataOrder if DataExchange is paused', async () => {
      try {
        await dataExchange.pause({ from: owner });
        await newOrder(dataExchange, { price: 0, initialBudgetForAudits: 0, from: buyer });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not create a DataOrder with an initial budget for audits lower than the minimum', async () => {
      try {
        await dataExchange.setMinimumInitialBudgetForAudits(10, { from: owner });
        await newOrder(dataExchange, { price: 0, initialBudgetForAudits: 0, from: buyer });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not create a DataOrder when the sender did not aprove enough funds to be spent by the contract', async () => {
      try {
        await token.approve(dataExchange.address, 5, { from: anotherBuyer });
        await dataExchange.setMinimumInitialBudgetForAudits(10, { from: owner });
        await newOrder(dataExchange, { initialBudgetForAudits: 20, from: anotherBuyer });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not create a DataOrder with Zero Address as Buyer', async () => {
      try {
        await newOrder(dataExchange, { from: zeroAddress });
        assert.fail();
      } catch (error) {
        // Client-side generated error: Transaction never reaches the contract.
        assert.equal(error.message, 'sender account not recognized');
      }
    });

    it('can not create a DataOrder with an empty Buyer URL', async () => {
      try {
        await newOrder(dataExchange, { buyerUrl: '', from: buyer });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not create a DataOrder with an empty Buyer Public Key', async () => {
      try {
        await newOrder(dataExchange, { buyerPublicKey: '', from: buyer });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });
  });

  it('can create a new order after adding a notary to another order', async () => {
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

    const newOrderTx = await newOrder(dataExchange, {
      price: 0,
      initialBudgetForAudits: 0,
      from: buyer,
    });
    assertEvent(newOrderTx, 'NewOrder', 'could not create a new order after adding a notary');
  });
});
