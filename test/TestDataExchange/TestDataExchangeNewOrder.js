const DataExchange = artifacts.require("./DataExchange.sol");
const Wibcoin = artifacts.require("./Wibcoin.sol");

import assertRevert from "../helpers/assertRevert";
import createDataOrder from "./helpers/createDataOrder";

contract('DataExchange', async accounts => {
  const owner = accounts[0];
  const buyer = accounts[4];
  const anotherBuyer = accounts[5];
  const tokenAddress = Wibcoin.address;
  const token = Wibcoin.at(tokenAddress);
  let dataExchange;
  let allowance = 3000;

  beforeEach(async function () {
    dataExchange = await DataExchange.new(tokenAddress, owner)
    await token.approve(dataExchange.address, 3000, { from: buyer });
  });

  describe('newOrder', async function () {
    it('creates a new DataOrder', async function () {
      const orderAddr = await createDataOrder(dataExchange, {
        price: 0,
        initialBudgetForAudits: 0,
        from: buyer
      });
      assert(orderAddr, 'DataOrder was not created properly');
    });

    it('can not create a DataOrder with an initial budget for audits lower than the minimun', async function () {
      try {
        await dataExchange.setMinimumInitialBudgetForAudits(10);
        await createDataOrder(dataExchange, {
          price: 0,
          initialBudgetForAudits: 0,
          from: buyer
        });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not create a DataOrder when there is now allowance for the sender', async function () {
      try {
        await createDataOrder(dataExchange, { from: anotherBuyer });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not create a DataOrder with Zero Address as Buyer', async function () {
      try {
        await createDataOrder(dataExchange, { from: '0x0' });
        assert.fail();
      } catch (error) {
        // Client-side generated error: Transaction never reaches the contract.
        assert.equal(error.message, 'invalid address');
      }
    });

    it('can not create a DataOrder with an empty Buyer URL', async function () {
      try {
        await createDataOrder(dataExchange, { buyerUrl: '', from: buyer });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not create a DataOrder with an empty Buyer Public Key', async function () {
      try {
        await createDataOrder(dataExchange, { buyerPublicKey: '', from: buyer });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });
  });
})
