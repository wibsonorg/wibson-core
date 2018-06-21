import assertRevert from '../helpers/assertRevert';

const DataExchange = artifacts.require('./DataExchange.sol');
const Wibcoin = artifacts.require('./Wibcoin.sol');

const newOrder = async (dataExchange, {
  filters = 'age:20,gender:male',
  dataRequest = 'data request',
  price = 20,
  initialBudgetForAudits = 10,
  termsAndConditions = 'DataOrder T&C',
  buyerUrl = 'https://buyer.example.com/data',
  buyerPublicKey = 'public-key',
  from,
}) => dataExchange.newOrder(
  filters,
  dataRequest,
  price,
  initialBudgetForAudits,
  termsAndConditions,
  buyerUrl,
  buyerPublicKey,
  { from },
);

contract('DataExchange', async (accounts) => {
  const owner = accounts[0];
  const buyer = accounts[4];
  const anotherBuyer = accounts[5];
  const tokenAddress = Wibcoin.address;
  const token = Wibcoin.at(tokenAddress);
  let dataExchange;

  beforeEach(async () => {
    dataExchange = await DataExchange.new(tokenAddress, owner);
    await token.approve(dataExchange.address, 3000, { from: buyer });
  });

  describe('newOrder', async () => {
    it('creates a new DataOrder', async () => {
      const orderAddr = await newOrder(dataExchange, {
        price: 0,
        initialBudgetForAudits: 0,
        from: buyer,
      });
      assert(orderAddr, 'DataOrder was not created properly');
    });

    it('can not create a DataOrder with an initial budget for audits lower than the minimun', async () => {
      try {
        await dataExchange.setMinimumInitialBudgetForAudits(10);
        await newOrder(dataExchange, {
          price: 0,
          initialBudgetForAudits: 0,
          from: buyer,
        });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not create a DataOrder when there is now allowance for the sender', async () => {
      try {
        await newOrder(dataExchange, { from: anotherBuyer });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not create a DataOrder with Zero Address as Buyer', async () => {
      try {
        await newOrder(dataExchange, { from: '0x0' });
        assert.fail();
      } catch (error) {
        // Client-side generated error: Transaction never reaches the contract.
        assert.equal(error.message, 'invalid address');
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
});
