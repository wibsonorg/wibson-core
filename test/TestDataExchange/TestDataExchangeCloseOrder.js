import { assertEvent, assertRevert } from '../helpers';
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

  describe('closeOrder', async () => {
    it('should fail if is paused', async () => {
    });

    it('should fail when passed an invalid order address', async () => {
    });

    it('should fail when passed an inexistent order address', async () => {
    });

    it('should fail when passed an order that is not open', async () => {
    });

    it('should be called only by the order buyer or the contract owner', async () => {
    });

    it('should fail if buyer did not approve the transfer', async () => {
    });

    it('should emit an `OrderClosed` event', async () => {
    });

    it('should close an open order', async () => {
    });
  });
});
