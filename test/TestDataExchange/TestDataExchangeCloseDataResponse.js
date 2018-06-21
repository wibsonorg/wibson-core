const DataExchange = artifacts.require("./DataExchange.sol");
const Wibcoin = artifacts.require("./Wibcoin.sol");

import { createDataOrder } from "../TestDataOrder/helpers/dataOrderCreation";
import { newOrder, addNotaryToOrder, addDataResponseToOrder } from "./helpers";
import signMessage from "../helpers/signMessage";
import assertRevert from "../helpers/assertRevert";
import assertEvent from "../helpers/assertEvent";

contract('DataExchange', async accounts => {
  const notary = accounts[1];
  const buyer = accounts[4];
  const seller = accounts[5];
  const owner = accounts[6];
  const notOwner = accounts[7];
  const tokenAddress = Wibcoin.address;
  const token = Wibcoin.at(tokenAddress);

  let dataExchange;

  beforeEach(async function () {
    dataExchange = await DataExchange.new(tokenAddress, owner)
    await dataExchange.registerNotary(
      notary,
      "Notary A",
      "https://nota.ry",
      "notary public key",
      { from: owner }
    )
    await token.approve(dataExchange.address, 3000, { from: buyer });
  });

  describe('closeDataResponse', async function () {
    it('can not close a DataResponse of an invalid DataOrder', async function () {
      try {
        await dataExchange.closeDataResponse(
          '0x0',
          seller,
          true,
          true,
          "a signature",
          { from: buyer }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not close a DataResponse of a DataOrder that does not belong to the DataExchange contract', async function () {
      const order = await createDataOrder({ buyer, from: buyer });

      try {
        await dataExchange.closeDataResponse(
          order.address,
          seller,
          true,
          true,
          "a signature",
          { from: buyer }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not close a DataResponse if sender is other than buyer or notary', async function () {
      const tx = await newOrder(dataExchange, { from: buyer });
      const orderAddress = tx.logs[0].args.orderAddr;
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });

      try {
        await dataExchange.closeDataResponse(
          orderAddress,
          seller,
          true,
          true,
          "a signature",
          { from: notOwner }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not close a DataResponse if there is not DataResponse for the Seller', async function () {
      const tx = await newOrder(dataExchange, { from: buyer });
      const orderAddress = tx.logs[0].args.orderAddr;
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });

      try {
        await dataExchange.closeDataResponse(
          orderAddress,
          seller,
          true,
          true,
          "a signature",
          { from: buyer }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not close a DataResponse if the notary signature is invalid', async function () {
      const tx = await newOrder(dataExchange, { from: buyer });
      const orderAddress = tx.logs[0].args.orderAddr;
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
      await addDataResponseToOrder(dataExchange, { orderAddress, seller, notary, from: buyer });

      try {
        await dataExchange.closeDataResponse(
          orderAddress,
          seller,
          true,
          true,
          signMessage([orderAddress, seller, true, false], notary),
          { from: buyer }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not close a DataResponse of a closed DataOrder', async function () {
      const tx = await newOrder(dataExchange, { from: buyer });
      const orderAddress = tx.logs[0].args.orderAddr;
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
      await dataExchange.closeOrder(orderAddress, { from: buyer });

      try {
        await dataExchange.closeDataResponse(
          orderAddress,
          seller,
          true,
          true,
          "a signature",
          { from: buyer }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not close a DataResponse of an invalid Seller', async function () {
      const tx = await newOrder(dataExchange, { from: buyer });
      const orderAddress = tx.logs[0].args.orderAddr;
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });

      try {
        await dataExchange.closeDataResponse(
          orderAddress,
          '0x0',
          true,
          true,
          "a signature",
          { from: buyer }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not close an already-closed DataResponse', async function () {
      const tx = await newOrder(dataExchange, { from: buyer });
      const orderAddress = tx.logs[0].args.orderAddr;
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
      await addDataResponseToOrder(dataExchange, { orderAddress, seller, notary, from: buyer });
      const signature = signMessage([orderAddress, seller, true, true], notary);
      await dataExchange.closeDataResponse(
        orderAddress,
        seller,
        true,
        true,
        signature,
        { from: buyer }
      );

      try {
        await dataExchange.closeDataResponse(
          orderAddress,
          seller,
          true,
          true,
          signature,
          { from: buyer }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('closes a DataResponse', async function () {
      const tx = await newOrder(dataExchange, { from: buyer });
      const orderAddress = tx.logs[0].args.orderAddr;
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
      await addDataResponseToOrder(dataExchange, { orderAddress, seller, notary, from: buyer });

      const closeTransaction = await dataExchange.closeDataResponse(
        orderAddress,
        seller,
        true,
        true,
        signMessage([orderAddress, seller, true, true], notary),
        { from: buyer }
      );

      assertEvent(closeTransaction, "TransactionCompleted", "DataOrder was not closed correctly");
    });
  });
})
