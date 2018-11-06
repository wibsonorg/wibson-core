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
      sellers = [
        '0xeadb31649e9f4d2ca155444d60144fcbf8b9190f',
        '0x2966d5776d5ceb1bb51040671cc39c585567a535',
        '0x3f0765c0c78a774da4433b654945c40257ca4165',
        '0x2bf78e554bb2ba204dd3983f692c25f6dd053210',
        '0x81b7e08f65bdf5648606c89998a9cc8164397647',
        '0x1a6c2e4bf29ebe267887543182628c28535953eb',
        '0x38a2c12607745e6250d374d23e051586a65b73c4',
        '0x43f69a55df7ef86cda708bf11b71cde8bfc9755a',
        '0x8f5799d8e8ccac1106fcdd03b59ce04716f8018d',
        '0xb7e6356297d31161df969ff67521848ccae312e4',
      ];
      const tx = await dataExchange.addSellersToOrder(orderAddress, sellers, {
        from: buyer,
      });
      assertEvent(tx, 'SellersAdded', 'No event was emitted');
    });
  });
});
