import { createHardcodedDataOrder } from "./helpers/dataOrderCreation";
import assertRevert from "../helpers/assertRevert";

contract('DataOrder', (accounts) => {

  const notary = accounts[1];
  const buyer = accounts[2];
  const owner = accounts[3];
  const other = accounts[4];


  let order;
  beforeEach('setup DataOrder for each test', async function () {
    order = await createHardcodedDataOrder(owner, buyer);
  })

  it('can not add a notary if order is closed', async function () {
    await order.close({ from: owner });
    try {
      await order.addNotary(
        notary,
        50,
        10,
        "Sample TOS",
        { from: owner }
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  })

  it('can not add a notary if responsesPercentage is not between 0 and 100', async function () {
    try {
      await order.addNotary(
        notary,
        -1,
        10,
        "Sample TOS",
        { from: owner }
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }

    try {
      await order.addNotary(
        notary,
        101,
        10,
        "Sample TOS",
        { from: owner }
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  })

  it('can not add a notary if notary is 0x0', async function () {
    try {
      await order.addNotary(
        '0x0',
        10,
        20,
        "Sample TOS",
        { from: owner }
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  })

  it('can not add a notary if notary is already added', async function () {
    await order.addNotary(
      notary,
      50,
      10,
      "Sample TOS",
      { from: owner }
    );

    try {
      await order.addNotary(
        notary,
        10,
        20,
        "Another Sample TOS",
        { from: owner }
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  })

  it('can not add a notary if caller is not the owner', async function () {
    try {
      await order.addNotary(
        notary,
        50,
        10,
        "Sample TOS",
        { from: other }
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  })

  it('can not add a notary if caller is the buyer', async function () {
    try {
      await order.addNotary(
        notary,
        50,
        10,
        "Sample TOS",
        { from: buyer }
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  })

  it('should succesfully add a notary', async function () {
    let res = await order.addNotary(
      notary,
      50,
      10,
      "Sample TOS",
      { from: owner }
    );
    assert(res, 'addNotary did not return true');

    let orderStatus = await order.orderStatus()
    assert(orderStatus.toNumber() === 1, 'order status is not NotaryAdded')
  })

});
