import { assertEvent, assertRevert } from '../helpers';
import { newOrder } from './helpers';

const DataExchange = artifacts.require('./DataExchange.sol');
const WIBToken = artifacts.require('./WIBToken.sol');

contract('DataExchange', async (accounts) => {
  const owner = accounts[0];
  const buyer = accounts[1];
  let sellers = accounts.slice(2, 5);
  const notary = accounts[5];
  const tokenAddress = WIBToken.address;
  const token = WIBToken.at(tokenAddress);

  let dataExchange;
  let orderAddress;

  beforeEach(async () => {
    dataExchange = await DataExchange.new(tokenAddress, owner);
    await token.approve(dataExchange.address, '300e9', { from: buyer });

    const tx = await newOrder(dataExchange, { from: buyer });
    orderAddress = tx.logs[0].args.orderAddr;
  });

  describe('addSellersToOrder', async () => {
    it('fails to add sellers to order when sender is not the buyer', async () => {
      try {
        await dataExchange.addSellersToOrder(orderAddress, sellers, {
          from: owner,
        });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('adds sellers to order', async () => {
      sellers = [...Array(10)].map(() => web3.personal.newAccount());
      const tx = await dataExchange.addSellersToOrder(orderAddress, sellers, {
        from: buyer,
      });
      assertEvent(tx, 'SellersAdded', 'No event was emitted');
    });
  });
});
