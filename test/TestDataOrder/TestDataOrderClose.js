import { createDataOrder } from './helpers/dataOrderCreation';
import { assertRevert } from '../helpers';

contract('DataOrder', (accounts) => {
  const notary = accounts[1];
  const other = accounts[2];
  const owner = accounts[3];
  const buyer = accounts[4];
  const seller = accounts[5];

  let order;

  const assertClosed = async (anOrder) => {
    const orderStatus = await anOrder.orderStatus();
    const transactionCompletedAt = await anOrder.transactionCompletedAt();
    assert.equal(orderStatus.toNumber(), 2, 'order status is not TransactionCompleted');
    assert.notEqual(
      transactionCompletedAt,
      0,
      'transactionCompletedAt timestamp should be different from zero',
    );
  };

  beforeEach('setup DataOrder for each test', async () => {
    order = await createDataOrder({ buyer, from: owner });
  });

  it('can not close an order if caller is not the owner', async () => {
    try {
      await order.close({ from: other });
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not close an order if caller is the buyer', async () => {
    try {
      await order.close({ from: buyer });
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not close an order if caller is the notary', async () => {
    await order.addNotary(notary, 1, 10, 'Sample TOS', { from: owner });

    try {
      await order.close({ from: notary });
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not close an order if is already closed', async () => {
    await order.close({ from: owner });
    try {
      await order.close({ from: owner });
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can close an open order without a notary', async () => {
    await order.close({ from: owner });
    await assertClosed(order);
  });

  it('can close an open order with a notary', async () => {
    await order.addNotary(notary, 1, 10, 'Sample TOS', { from: owner });

    await order.close({ from: owner });
    await assertClosed(order);
  });

  it('should succesfully close an order', async () => {
    await order.close({ from: owner });
    await assertClosed(order);
  });

  it('should succesfully close an order with an opened data response', async () => {
    await order.addNotary(notary, 1, 10, 'Sample TOS', { from: owner });
    const dataHash = '9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d';
    await order.addDataResponse(seller, notary, dataHash, { from: owner });
    await order.close({ from: owner });
    await assertClosed(order);
  });

  it('should succesfully close an order with a closed data response', async () => {
    await order.addNotary(notary, 1, 10, 'Sample TOS', { from: owner });
    const dataHash = '9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d';
    await order.addDataResponse(seller, notary, dataHash, { from: owner });
    await order.closeDataResponse(seller, true, { from: owner });
    await order.close({ from: owner });
    await assertClosed(order);
  });
});
