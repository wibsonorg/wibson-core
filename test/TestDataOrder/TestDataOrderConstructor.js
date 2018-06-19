const DataOrder = artifacts.require("./DataOrder.sol");

// TODO: Move to helpers
const createDataOrder = async ({
  buyer,
  filters = "age:20,gender:male",
  dataRequest = "data request",
  price = 20,
  initialBudgetForAudits = 10,
  termsAndConditions = "DataOrder T&C",
  buyerUrl = "https://buyer.example.com/data",
  buyerPublicKey = "public-key",
  owner
}) => {
  return await DataOrder.new(
    buyer,
    filters,
    dataRequest,
    price,
    initialBudgetForAudits,
    termsAndConditions,
    buyerUrl,
    buyerPublicKey,
    { from: owner }
  );
}

// TODO: Move to helpers
const assertRevert = (error) =>
  assert(error.toString().includes('revert'), error.toString());

contract('DataOrder', async (accounts) => {
  const owner = accounts[0];
  const buyer = accounts[4];

  describe('Constructor', async function () {
    it('creates a DataOrder', async function () {
      const dataOrder = await createDataOrder({ owner, buyer });
      assert(dataOrder, "DataOrder was not created properly");
    });

    it('can not create a DataOrder with Zero Address as Buyer', async function () {
      try {
        await createDataOrder({ owner, buyer: '0x0' });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not create a DataOrder with an empty Buyer URL', async function () {
      try {
        await createDataOrder({ owner, buyer, buyerUrl: '' });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not create a DataOrder with an empty Buyer Public Key', async function () {
      try {
        await createDataOrder({ owner, buyer, buyerPublicKey: '' });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('creates a DataOrder with the Sender as Buyer', async function () {
      const dataOrder = await createDataOrder({ owner, buyer: owner });
      assert(dataOrder, "The buyer can be the sender of the transaction");
    });

    it('creates a DataOrder with zero Price', async function () {
      const dataOrder = await createDataOrder({ owner, buyer, price: 0 });
      assert(dataOrder, "The price can be zero");
    });

    it('creates a DataOrder with empty Filters', async function () {
      const dataOrder = await createDataOrder({ owner, buyer, filters: '' });
      assert(dataOrder, "Filters can be empty");
    });

    it('creates a DataOrder with empty Data Request', async function () {
      const dataOrder = await createDataOrder({ owner, buyer, dataRequest: '' });
      assert(dataOrder, "Data Request can be empty");
    });

    it('creates a DataOrder with empty Terms and Conditions', async function () {
      const dataOrder = await createDataOrder({ owner, buyer, termsAndConditions: '' });
      assert(dataOrder, "Terms and Conditions can be empty");
    });
  });
});
