import { createHardcodedDataOrder } from './helpers/dataOrderCreation';
import assertRevert from '../helpers/assertRevert';

contract('DataOrder', (accounts) => {
  const notary = accounts[1];
  const buyer = accounts[2];
  const owner = accounts[3];
  const other = accounts[4];


  let order;
  beforeEach('setup DataOrder for each test', async () => {
    order = await createHardcodedDataOrder(owner, buyer);
  });

  it('can not add a notary if order is closed', async () => {
    await order.close({ from: owner });
    try {
      await order.addNotary(
        notary,
        50,
        10,
        'Sample TOS',
        { from: owner },
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not add a notary if responsesPercentage is not between 0 and 100', async () => {
    try {
      await order.addNotary(
        notary,
        -1,
        10,
        'Sample TOS',
        { from: owner },
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
        'Sample TOS',
        { from: owner },
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not add a notary if notary is 0x0', async () => {
    try {
      await order.addNotary(
        '0x0',
        10,
        20,
        'Sample TOS',
        { from: owner },
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not add a notary if notary is already added', async () => {
    await order.addNotary(
      notary,
      50,
      10,
      'Sample TOS',
      { from: owner },
    );

    try {
      await order.addNotary(
        notary,
        10,
        20,
        'Another Sample TOS',
        { from: owner },
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not add a notary if caller is not the owner', async () => {
    try {
      await order.addNotary(
        notary,
        50,
        10,
        'Sample TOS',
        { from: other },
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not add a notary if caller is the buyer', async () => {
    try {
      await order.addNotary(
        notary,
        50,
        10,
        'Sample TOS',
        { from: buyer },
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should succesfully add a notary', async () => {
    const res = await order.addNotary(
      notary,
      50,
      10,
      'Sample TOS',
      { from: owner },
    );
    assert(res, 'addNotary did not return true');

    const orderStatus = await order.orderStatus();
    assert.equal(orderStatus.toNumber(), 1, 'order status is not NotaryAdded');
  });

  it('checks if a notary has been added', async () => {
    await order.addNotary(
      notary,
      50,
      10,
      'Sample TOS',
      { from: owner },
    );

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
    await order.addNotary(
      notary,
      50,
      10,
      'Sample TOS',
      { from: owner },
    );

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
