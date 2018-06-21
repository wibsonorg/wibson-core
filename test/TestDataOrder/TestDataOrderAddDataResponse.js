import { createDataOrder } from './helpers/dataOrderCreation';
import { signMessage, assertRevert } from '../helpers';

const web3Utils = require('web3-utils');

contract('DataOrder', (accounts) => {
  const notary = accounts[1];
  const inexistentNotary = accounts[2];
  const buyer = accounts[4];
  const seller = accounts[5];
  const owner = accounts[6];
  const notOwner = accounts[7];
  const other = accounts[8];

  const dataHash = '9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d';

  let signature;
  let order;

  beforeEach('setup DataOrder for each test', async () => {
    order = await createDataOrder({ buyer, from: owner });
    await order.addNotary(
      notary,
      10,
      1,
      'terms',
      { from: owner },
    );
    signature = signMessage([order.address, seller, notary, dataHash], seller);
  });

  it('can not add a data response if order is closed', async () => {
    await order.close({ from: owner });
    try {
      await order.addDataResponse(
        seller,
        notary,
        dataHash,
        signature,
        { from: owner },
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not add a data response if seller is 0x0', async () => {
    try {
      const sig = signMessage([order.address, 0x0, notary, dataHash], seller);
      await order.addDataResponse(
        '0x0',
        notary,
        dataHash,
        sig,
        { from: owner },
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not add a data response if seller has same address as Data Order', async () => {
    try {
      const sig = signMessage([order.address, order.address, notary, dataHash], seller);
      await order.addDataResponse(
        order.address,
        notary,
        dataHash,
        sig,
        { from: owner },
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not add a data response if notary is 0x0', async () => {
    try {
      const sig = signMessage([order.address, seller, 0x0, dataHash], seller);
      await order.addDataResponse(
        seller,
        '0x0',
        dataHash,
        sig,
        { from: owner },
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not add a data response if notary has same address as Data Order', async () => {
    try {
      const sig = signMessage([order.address, seller, order.address, dataHash], seller);
      await order.addDataResponse(
        seller,
        order.address,
        dataHash,
        sig,
        { from: owner },
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not add a data response if notary was not added to Data Order', async () => {
    try {
      const sig = signMessage([order.address, seller, inexistentNotary, dataHash], seller);
      await order.addDataResponse(
        seller,
        inexistentNotary,
        dataHash,
        sig,
        { from: owner },
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not add a data response twice', async () => {
    try {
      await order.addDataResponse(
        seller,
        notary,
        dataHash,
        signature,
        { from: owner },
      );
    } catch (error) {
      assert.fail();
    }
    try {
      await order.addDataResponse(
        seller,
        notary,
        dataHash,
        signature,
        { from: owner },
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not add a data response with invalid signature', async () => {
    try {
      await order.addDataResponse(
        seller,
        notary,
        dataHash,
        '0x4931ac3b001414eeff2c',
        { from: owner },
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('can not add a data response if caller is not owner', async () => {
    try {
      await order.addDataResponse(
        seller,
        notary,
        dataHash,
        signature,
        { from: notOwner },
      );
      assert.fail();
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should add a data response if notary is in Data Order and signature is valid', async () => {
    try {
      await order.addDataResponse(
        seller,
        notary,
        dataHash,
        signature,
        { from: owner },
      );
      const sellerWasAdded = await order.hasSellerBeenAccepted(seller);
      assert(sellerWasAdded, 'Seller was not added correctly');
    } catch (error) {
      assert.fail();
    }
  });

  it('should add a data response even if dataHash is empty', async () => {
    try {
      const sig = signMessage([order.address, seller, notary, ''], seller);
      await order.addDataResponse(
        seller,
        notary,
        '',
        sig,
        { from: owner },
      );
      const sellerWasAdded = await order.hasSellerBeenAccepted(seller);
      assert(sellerWasAdded, 'Seller was not added correctly');
    } catch (error) {
      assert.fail();
    }
  });

  it('should check if seller has been accepted', async () => {
    await order.addDataResponse(
      seller,
      notary,
      dataHash,
      signature,
      { from: owner },
    );
    const sellerWasAdded = await order.hasSellerBeenAccepted(seller);
    assert(sellerWasAdded, 'Seller was not added correctly');

    try {
      await order.hasSellerBeenAccepted('0x0');
      assert.fail('Did not fail for 0x0 seller');
    } catch (error) {
      assertRevert(error);
    }

    const sellerNotExists = await order.hasSellerBeenAccepted(other);
    assert.isNotOk(sellerNotExists, 'Seller that not exists has been accepted');
  });

  it('should get seller info', async () => {
    await order.addDataResponse(
      seller,
      notary,
      dataHash,
      signature,
      { from: owner },
    );
    const res = await order.getSellerInfo(seller);
    assert(res, 'Could not get seller info');
    assert.equal(res[0], seller, 'seller differs');
    assert.equal(res[1], notary, 'notary differs');
    assert.equal(res[2], dataHash, 'hash differs');
    assert.equal(res[3], signature, 'signature differs');
    assert.equal(web3Utils.hexToUtf8(res[6]), 'DataResponseAdded', 'Status differs');

    try {
      await order.getSellerInfo('0x0');
      assert.fail('Did not fail for 0x0 seller');
    } catch (error) {
      assertRevert(error);
    }

    try {
      await order.getSellerInfo(other);
      assert.fail('Did not fail for nonexistent seller');
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should get notary for seller', async () => {
    await order.addDataResponse(
      seller,
      notary,
      dataHash,
      signature,
      { from: owner },
    );
    const res = await order.getNotaryForSeller(seller);
    assert.equal(res, notary, 'notary differs');

    try {
      await order.getNotaryForSeller('0x0');
      assert.fail('Did not fail for 0x0 seller');
    } catch (error) {
      assertRevert(error);
    }

    try {
      await order.getNotaryForSeller(other);
      assert.fail('Did not fail for nonexistent seller');
    } catch (error) {
      assertRevert(error);
    }
  });
});
