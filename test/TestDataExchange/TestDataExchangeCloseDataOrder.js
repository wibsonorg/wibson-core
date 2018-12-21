import {
  assertEvent,
  assertRevert,
  assertGasConsumptionNotExceeds,
  buildDataOrder,
} from '../helpers';

const Web3 = require('web3');

const sha3 = Web3.utils.soliditySha3;

const DataExchange = artifacts.require('./DataExchange.sol');
const WIBToken = artifacts.require('./WIBToken.sol');

contract.only('DataExchange', async (accounts) => {
  const other = accounts[3];
  const buyer = accounts[4];
  const tokenAddress = WIBToken.address;

  let dataExchange;
  let orderAddress;

  beforeEach(async () => {
    dataExchange = await DataExchange.new(tokenAddress);
    const tx = await dataExchange.createDataOrder(
      ...buildDataOrder(),
      { from: buyer },
    );
    orderAddress = tx.logs[0].args.orderAddr;
  });

  describe('closeDataOrder', async () => {
    it('closes an open order', async () => {
      const transaction = await dataExchange.closeDataOrder(orderAddress, { from: buyer });
      assertEvent(transaction, 'DataOrderClosed', 'did not emit `DataOrderClosed` event');
      assertGasConsumptionNotExceeds(transaction, 35000);
    });

    it('closes an open order even if another order is created', async () => {
      await dataExchange.createDataOrder(
        JSON.stringify([
          { name: 'age', value: '25' },
          { name: 'gender', value: 'female' },
        ]),
        '20000000000',
        JSON.stringify(['device_info']),
        sha3('DataOrder 2 T&C'),
        JSON.stringify({
          dataOrderUrl: '/data-orders/67890',
          dataResponsesUrl: '/data-responses',
        }),
        { from: buyer },
      );

      const transaction = await dataExchange.closeDataOrder(orderAddress, { from: buyer });
      assertEvent(transaction, 'DataOrderClosed', 'did not emit `DataOrderClosed` event');
    });

    it('fails when called by other than the buyer', async () => {
      try {
        await dataExchange.closeDataOrder(orderAddress, { from: other });
        assert.fail();
      } catch (error) {
        assertRevert(error, 'sender can\'t close the order');
      }
    });

    it('fails when passed an order that is not open', async () => {
      await dataExchange.closeDataOrder(orderAddress, { from: buyer });

      try {
        await dataExchange.closeDataOrder(orderAddress, { from: buyer });
        assert.fail();
      } catch (error) {
        assertRevert(error, 'order already closed');
      }
    });

    it('fails when order does not exist', async () => {
      try {
        await dataExchange.closeDataOrder(other, { from: buyer });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('fails when order is invalid', async () => {
      try {
        await dataExchange.closeDataOrder('0x0', { from: buyer });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });
  });
});
