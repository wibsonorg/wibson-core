const DataExchange = artifacts.require("./DataExchange.sol");
const Wibcoin = artifacts.require("./Wibcoin.sol");

import { createDataOrder } from "../TestDataOrder/helpers/dataOrderCreation";
import signMessage from "../helpers/signMessage";
import assertRevert from "../helpers/assertRevert";

const newOrder = async (dataExchange, {
  filters = "age:20,gender:male",
  dataRequest = "data request",
  price = 20,
  initialBudgetForAudits = 10,
  termsAndConditions = "DataOrder T&C",
  buyerUrl = "https://buyer.example.com/data",
  buyerPublicKey = "public-key",
  from
}) => {
  return await dataExchange.newOrder(
    filters,
    dataRequest,
    price,
    initialBudgetForAudits,
    termsAndConditions,
    buyerUrl,
    buyerPublicKey,
    { from }
  );
}

const addNotaryToOrder = async (dataExchange, {
  orderAddress,
  notary,
  responsesPercentage = 50,
  notarizationFee = 10,
  notarizationTermsOfService = "Sample TOS",
  from
}) => {
  return await dataExchange.addNotaryToOrder(
    orderAddress,
    notary,
    responsesPercentage,
    notarizationFee,
    notarizationTermsOfService,
    signMessage([
      orderAddress,
      responsesPercentage,
      notarizationFee,
      notarizationTermsOfService
    ], notary),
    { from }
  );
}

const addDataResponseToOrder = async (dataExchange, {
  orderAddress,
  seller,
  notary,
  dataHash = "9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d",
  from
}) => {
  return await dataExchange.addDataResponseToOrder(
    orderAddress,
    seller,
    notary,
    dataHash,
    signMessage([
      orderAddress,
      seller,
      notary,
      dataHash
    ], seller),
    { from }
  );
}

contract('DataExchange', async accounts => {
  const notary = accounts[1];
  const buyer = accounts[4];
  const seller = accounts[5];
  const owner = accounts[6];
  const notOwner = accounts[7];
  const tokenAddress = Wibcoin.address;
  const token = Wibcoin.at(tokenAddress);
  const dataHash = "9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d";

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
          signMessage([
            orderAddress,
            seller,
            true,
            false
          ], notary),
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

  });
})
