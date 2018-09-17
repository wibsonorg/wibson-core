import { newOrder, addNotaryToOrder, addDataResponseToOrder, closeDataResponse } from './helpers';
import { assertRevert, extractEventArgs } from '../helpers';

const DataExchange = artifacts.require('./DataExchange.sol');
const WIBToken = artifacts.require('./WIBToken.sol');

contract('DataExchange', async (accounts) => {
  const notary = accounts[1];
  const buyer = accounts[4];
  const seller = accounts[5];
  const owner = accounts[6];
  const tokenAddress = WIBToken.address;
  const token = WIBToken.at(tokenAddress);

  const balanceOf = async (address) => {
    const balance = await token.balanceOf(address);
    return balance.toNumber();
  };

  let dataExchange;

  beforeEach(async () => {
    dataExchange = await DataExchange.new(tokenAddress, owner);
    await dataExchange.registerNotary(notary, 'Notary A', 'https://nota.ry', 'notary public key', {
      from: owner,
    });
    await token.approve(dataExchange.address, 3000, { from: buyer });
  });

  describe('setMinimumInitialBudgetForAudits', () => {
    it('can not set initial budget if sender is not the owner', async () => {
      try {
        await dataExchange.setMinimumInitialBudgetForAudits(10, { from: buyer });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not create DataOrders with outdated minimum budget', async () => {
      const budgetForAudits = 5;

      await dataExchange.setMinimumInitialBudgetForAudits(budgetForAudits, { from: owner });
      await newOrder(dataExchange, { initialBudgetForAudits: budgetForAudits, from: buyer });

      await dataExchange.setMinimumInitialBudgetForAudits(budgetForAudits * 2, { from: owner });
      try {
        await newOrder(dataExchange, { initialBudgetForAudits: budgetForAudits, from: buyer });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('does not affect notary registration and unregistration', async () => {
      const budgetForAudits = 5;

      await dataExchange.setMinimumInitialBudgetForAudits(budgetForAudits, { from: owner });
      await dataExchange.registerNotary(
        notary,
        'Notary A',
        'https://notary-a.com/data',
        'public-key-a',
        { from: owner },
      );

      await dataExchange.setMinimumInitialBudgetForAudits(budgetForAudits * 2, { from: owner });
      await dataExchange.unregisterNotary(notary, { from: owner });

      await dataExchange.setMinimumInitialBudgetForAudits(budgetForAudits * 3, { from: owner });

      const allowedNotaries = await dataExchange.getAllowedNotaries();
      assert.equal(allowedNotaries.length, 0, 'There should not be any registered notaries');

      assert.equal(
        (await dataExchange.minimumInitialBudgetForAudits()).toNumber(),
        budgetForAudits * 3,
        'minimumInitialBudgetForAudits was not updated correctly',
      );
    });

    it('does not affect an active DataOrder', async () => {
      const budgetForAudits = 5;
      const orderPrice = 20;
      const notarizationFee = 5;

      const notaryBalanceBefore = await balanceOf(notary);
      const sellerBalanceBefore = await balanceOf(seller);
      const buyerBalanceBefore = await balanceOf(buyer);

      await dataExchange.setMinimumInitialBudgetForAudits(budgetForAudits, { from: owner });
      const { orderAddr: orderAddress } = extractEventArgs(await newOrder(dataExchange, {
        price: orderPrice,
        initialBudgetForAudits: budgetForAudits,
        from: buyer,
      }));

      await dataExchange.setMinimumInitialBudgetForAudits(budgetForAudits * 2, { from: owner });
      await addNotaryToOrder(dataExchange, {
        orderAddress,
        notary,
        notarizationFee,
        from: buyer,
      });

      await dataExchange.setMinimumInitialBudgetForAudits(budgetForAudits * 3, { from: owner });
      await addDataResponseToOrder(dataExchange, {
        orderAddress,
        seller,
        notary,
        from: buyer,
      });

      await dataExchange.setMinimumInitialBudgetForAudits(budgetForAudits * 4, { from: owner });
      await closeDataResponse(dataExchange, {
        orderAddress,
        seller,
        notary,
        from: buyer,
      });

      await dataExchange.setMinimumInitialBudgetForAudits(budgetForAudits * 5, { from: owner });
      await dataExchange.closeOrder(orderAddress, { from: buyer });

      await dataExchange.setMinimumInitialBudgetForAudits(budgetForAudits * 6, { from: owner });

      const notaryBalanceAfter = await balanceOf(notary);
      const sellerBalanceAfter = await balanceOf(seller);
      const buyerBalanceAfter = await balanceOf(buyer);
      const dxBalanceAfter = await balanceOf(dataExchange.address);

      assert.equal(
        (await dataExchange.minimumInitialBudgetForAudits()).toNumber(),
        budgetForAudits * 6,
        'minimumInitialBudgetForAudits was not updated correctly',
      );
      assert.equal(
        notaryBalanceAfter,
        notaryBalanceBefore + notarizationFee,
        'Notary balance was not updated correctly',
      );
      assert.equal(
        sellerBalanceAfter,
        sellerBalanceBefore + orderPrice,
        'Seller balance was not updated correctly',
      );
      assert.equal(
        buyerBalanceAfter,
        buyerBalanceBefore - (budgetForAudits + orderPrice),
        'Buyer balance was not updated correctly',
      );
      assert.equal(
        dxBalanceAfter,
        budgetForAudits - notarizationFee,
        'DataExchange balance was not updated correctly',
      );
    });
  });
});
