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

  it('can not close an order if caller is not the owner', async function () {
    try {
      await order.close({ from: other });
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  })

  it('can not close an order if caller is the buyer', async function () {
    try {
      await order.close({ from: buyer });
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  })

  it('can not close an order if caller is the notary', async function () {
    await order.addNotary(
      notary,
      1,
      10,
      "Sample TOS",
      { from: owner }
    );

    try {
      await order.close({ from: notary });
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  })

  it('can not close an order if is already closed', async function () {
    await order.close({ from: owner });
    try {
      await order.close({ from: owner });
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  })

  it('can close an open order without a notary', async function () {
    let res = await order.close({ from: owner });
    assert(res, 'Could not close an open order without a notary');
  })

  it('can close an open order with a notary', async function () {
    await order.addNotary(
      notary,
      1,
      10,
      "Sample TOS",
      { from: owner }
    );

    let res = await order.close({ from: owner });
    assert(res, 'Could not close an open order with a notary');
  })

  it('should succesfully close an order', async function () {
    let res = await order.close({ from: owner });
    assert(res, 'close() did not return true');

    let orderStatus = await order.orderStatus()
    assert(orderStatus.toNumber() === 2, 'order status is not TransactionCompleted')
  })

});
