const web3Utils = require('web3-utils');

import { createHardcodedDataOrder } from "./helpers/dataOrderCreation";
import signMessage from "../helpers/signMessage";

contract('DataOrder', (accounts) => {

  const notary = accounts[1];
  const inexistentNotary = accounts[2];
  const buyer = accounts[4];
  const seller = accounts[5];
  const owner = accounts[6];
  const notOwner = accounts[7];

  const dataHash = "9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d";

  let signature;
  let order;

  beforeEach('setup DataOrder for each test', async function () {
    order = await createHardcodedDataOrder(owner, buyer);
    await order.addNotary(
      notary,
      10,
      1,
      "terms",
      { from: owner }
    );
    signature = signMessage([order.address, seller, notary, dataHash], seller);
  })

  it('can not add a data response if order is closed', async function () {
    await order.close({ from: owner });
    try {
      await order.addDataResponse(
        seller,
        notary,
        dataHash,
        signature,
        { from: owner }
      );
      assert.fail();
    } catch (error) {
      assert(error.toString().includes('revert'), error.toString());
    }
  })

  it('can not add a data response if seller is 0x0', async function () {
    try {
      const sig = signMessage([order.address, 0x0, notary, dataHash], seller);
      await order.addDataResponse(
        0x0,
        notary,
        dataHash,
        sig,
        { from: owner }
      );
      assert.fail();
    } catch (error) {
      assert(error.toString().includes('revert'), error.toString());
    }
  })

  it('can not add a data response if seller has same address as Data Order', async function () {
    try {
      const sig = signMessage([order.address, order.address, notary, dataHash], seller);
      await order.addDataResponse(
        order.address,
        notary,
        dataHash,
        sig,
        { from: owner }
      );
      assert.fail();
    } catch (error) {
      assert(error.toString().includes('revert'), error.toString());
    }
  })

  it('can not add a data response if notary is 0x0', async function () {
    try {
      const sig = signMessage([order.address, seller, 0x0, dataHash], seller);
      await order.addDataResponse(
        seller,
        0x0,
        dataHash,
        sig,
        { from: owner }
      );
      assert.fail();
    } catch (error) {
      assert(error.toString().includes('revert'), error.toString());
    }
  })

  it('can not add a data response if notary has same address as Data Order', async function () {
    try {
      const sig = signMessage([order.address, seller, order.address, dataHash], seller);
      await order.addDataResponse(
        seller,
        order.address,
        dataHash,
        sig,
        { from: owner }
      );
      assert.fail();
    } catch (error) {
      assert(error.toString().includes('revert'), error.toString());
    }
  })

  it('can not add a data response if notary was not added to Data Order', async function () {
    try {
      const sig = signMessage([order.address, seller, inexistentNotary, dataHash], seller);
      await order.addDataResponse(
        seller,
        inexistentNotary,
        dataHash,
        sig,
        { from: owner }
      );
      assert.fail();
    } catch (error) {
      assert(error.toString().includes('revert'), error.toString());
    }
  })

  it('can not add a data response twice', async function () {
    try {
      await order.addDataResponse(
        seller,
        notary,
        dataHash,
        signature,
        { from: owner }
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
        { from: owner }
      );
      assert.fail();
    } catch (error) {
      assert(error.toString().includes('revert'), error.toString());
    }
  })

  it('can not add a data response with invalid signature', async function () {
    try {
      await order.addDataResponse(
        seller,
        notary,
        dataHash,
        "0x4931ac3b001414eeff2c",
        { from: owner }
      );
      assert.fail();
    } catch (error) {
      assert(error.toString().includes('revert'), error.toString());
    }
  })

  it('can not add a data response if caller is not owner', async function () {
    try {
      await order.addDataResponse(
        seller,
        notary,
        dataHash,
        signature,
        { from: notOwner }
      );
      assert.fail();
    } catch (error) {
      assert(error.toString().includes('revert'), error.toString());
    }
  })

  it('should add a data response if notary is in Data Order and signature is valid', async function () {
    try {
      await order.addDataResponse(
        seller,
        notary,
        dataHash,
        signature,
        { from: owner }
      );
      const sellerWasAdded = await order.hasSellerBeenAccepted(seller);
      assert(sellerWasAdded, "Seller was not added correctly");
    } catch (error) {
      assert.fail();
    }
  })

  it('should add a data response even if dataHash is empty', async function () {
    try {
      const sig = signMessage([order.address, seller, notary, ""], seller);
      await order.addDataResponse(
        seller,
        notary,
        "",
        sig,
        { from: owner }
      );
      const sellerWasAdded = await order.hasSellerBeenAccepted(seller);
      assert(sellerWasAdded, "Seller was not added correctly");
    } catch (error) {
      assert.fail();
    }
  })

});
