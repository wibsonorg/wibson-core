import createDataOrder from './helpers/dataOrderCreation';
import { assertRevert } from '../helpers';

contract('DataOrder', (accounts) => {
  const notary = accounts[1];
  const anotherNotary = accounts[2];
  const other = accounts[3];
  const buyer = accounts[4];
  const seller = accounts[5];
  const owner = accounts[6];

  let order;

  const assertNotaryAdded = async (anOrder, aNotary) => {
    const orderStatus = await anOrder.orderStatus();
    const notaryAdded = await anOrder.hasNotaryBeenAdded(aNotary);
    assert.equal(orderStatus.toNumber(), 1, 'order status is not NotaryAdded');
    assert(notaryAdded, 'Could not find added notary');
  };

  beforeEach('setup DataOrder for each test', async () => {
    order = await createDataOrder({ buyer, from: owner });
  });

  it('can not add a notary if order is closed', async () => {
    await order.close({ from: owner });
    try {
      await order.addNotary(notary, 50, 10, 'Sample TOS', { from: owner });
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not add a notary if responsesPercentage is not between 0 and 100', async () => {
    try {
      await order.addNotary(notary, -1, 10, 'Sample TOS', { from: owner });
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }

    try {
      await order.addNotary(notary, 101, 10, 'Sample TOS', { from: owner });
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not add a notary if notary is 0x0', async () => {
    try {
      await order.addNotary('0x0', 10, 20, 'Sample TOS', { from: owner });
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not add a notary if notary is already added', async () => {
    await order.addNotary(notary, 50, 10, 'Sample TOS', { from: owner });

    try {
      await order.addNotary(notary, 10, 20, 'Another Sample TOS', { from: owner });
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not add a notary if caller is not the owner', async () => {
    try {
      await order.addNotary(notary, 50, 10, 'Sample TOS', { from: other });
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not add a notary if caller is the buyer', async () => {
    try {
      await order.addNotary(notary, 50, 10, 'Sample TOS', { from: buyer });
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should succesfully add a notary', async () => {
    await order.addNotary(notary, 50, 10, 'Sample TOS', { from: owner });
    await assertNotaryAdded(order, notary);
  });

  it('should succesfully add a second notary after a data response was added', async () => {
    await order.addNotary(notary, 50, 10, 'Sample TOS', { from: owner });
    await assertNotaryAdded(order, notary);

    const dataHash = '9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d';
    await order.addDataResponse(seller, notary, dataHash, { from: owner });

    await order.addNotary(anotherNotary, 30, 5, 'Sample TOS II', { from: owner });
    await assertNotaryAdded(order, anotherNotary);
  });

  it('should succesfully add a second notary after a data response was closed', async () => {
    await order.addNotary(notary, 50, 10, 'Sample TOS', { from: owner });
    await assertNotaryAdded(order, notary);

    const dataHash = '9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d';
    await order.addDataResponse(seller, notary, dataHash, { from: owner });
    await order.closeDataResponse(seller, true, { from: owner });

    await order.addNotary(anotherNotary, 30, 5, 'Sample TOS II', { from: owner });
    await assertNotaryAdded(order, anotherNotary);
  });

  it('checks if a notary has been added', async () => {
    await order.addNotary(notary, 50, 10, 'Sample TOS', { from: owner });

    const res = await order.hasNotaryBeenAdded(notary);
    assert(res, 'Could not find added notary');

    try {
      await order.hasNotaryBeenAdded('0x0');
      assert.fail('Does not validate 0x0 address');
    } catch (error) {
      assertRevert(error);
    }

    const res2 = await order.hasNotaryBeenAdded(other);
    assert.isNotOk(res2, 'Returned true for an inexistent notary');
  });

  it('gets notary info', async () => {
    await order.addNotary(notary, 50, 10, 'Sample TOS', { from: owner });

    const res = await order.getNotaryInfo(notary);
    assert(res, 'Could not find added notary');
    assert.equal(res[0], notary, 'Notary address is different');
    assert.equal(res[1].toNumber(), 50, 'responses percentage is different');
    assert.equal(res[2].toNumber(), 10, 'notarization fee is different');
    assert.equal(res[3], 'Sample TOS', 'terms of service is different');

    try {
      await order.getNotaryInfo('0x0');
      assert.fail('Does not validate 0x0 address');
    } catch (error) {
      assertRevert(error);
    }

    try {
      await order.getNotaryInfo(other);
      assert.fail('Does not get info for a notary that was not added');
    } catch (error) {
      assertRevert(error);
    }
  });
});
