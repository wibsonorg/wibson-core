import { assertEvent, assertRevert } from '../helpers';
import { newOrder } from './helpers';

const DataExchange = artifacts.require('./DataExchange.sol');
const WIBToken = artifacts.require('./WIBToken.sol');

contract.only('DataExchange', async (accounts) => {
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

    await dataExchange.addSellersToOrder(orderAddress, sellers, { from: buyer });
  });

  describe.only('initWithdraw', async () => {
    it('starts withdrawal with challenge process', async () => {
      const seller = sellers[0];

      const tx = await dataExchange.initWithdraw(seller, { from: buyer });
      assertEvent(tx, 'InitWithdraw', 'Could not init withdraw');
    });

  });
});
