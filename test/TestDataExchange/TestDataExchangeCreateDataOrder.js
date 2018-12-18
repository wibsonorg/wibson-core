import { assertRevert, assertEvent, assertGasConsumptionNotExceeds } from '../helpers';

const Web3 = require('web3');
const sha3 = Web3.utils.soliditySha3;

const DataExchange = artifacts.require('./DataExchange.sol');
const WIBToken = artifacts.require('./WIBToken.sol');

contract.only('DataExchange', async (accounts) => {
  const buyer = accounts[4];
  const tokenAddress = WIBToken.address;
  let dataExchange;

  beforeEach(async () => {
    dataExchange = await DataExchange.new(tokenAddress);
  });

  describe('createDataOrder', () => {
    it('creates a DataOrder', async () => {
      const transaction = await dataExchange.createDataOrder(
        JSON.stringify([
          { name: 'age', value: '20' }, 
          { name: 'gender', value: 'male' }
        ]),
        '20000000000',
        JSON.stringify(['geolocation']),
        sha3('DataOrder T&C'),
        JSON.stringify({
          dataOrderUrl: '/data-orders/12345',
          dataResponsesUrl: '/data-responses'
        }),
        { from: buyer },
      );

      assertEvent(transaction, 'DataOrderCreated', 'Expected event');
      assertGasConsumptionNotExceeds(transaction, 700000);
    });

    it('cannot create a DataOrder if buyerURLs field is empty', async () => {
      try {
        const transaction = await dataExchange.createDataOrder(
          JSON.stringify([
            { name: 'age', value: '20' }, 
            { name: 'gender', value: 'male' }
          ]),
          '20000000000',
          JSON.stringify(['geolocation']),
          sha3('DataOrder T&C'),
          '',
          { from: buyer },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error, 'buyerURLs must not be empty');
      }
    });
  });
});
