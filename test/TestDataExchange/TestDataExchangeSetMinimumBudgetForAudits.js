import { newOrder, addNotaryToOrder, addDataResponseToOrder, closeDataResponse } from './helpers';
import { assertEvent, assertRevert, signMessage } from '../helpers';

const DataExchange = artifacts.require('./DataExchange.sol');
const Wibcoin = artifacts.require('./Wibcoin.sol');

const extractAddress = transaction => transaction.logs[0].args.orderAddr;

contract('DataExchange', async (accounts) => {
  const notary = accounts[1];
  const buyer = accounts[4];
  const owner = accounts[6];
  const tokenAddress = Wibcoin.address;
  const token = Wibcoin.at(tokenAddress);

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
  });
});
