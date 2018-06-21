const DataExchange = artifacts.require("./DataExchange.sol");
const Wibcoin = artifacts.require("./Wibcoin.sol");

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

contract('DataExchange', async accounts => {
  const notary = accounts[1];
  const buyer = accounts[4];
  const seller = accounts[5];
  const owner = accounts[6];
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

    // it('asd', async function () {
    //   const orderAddress = await newOrder(dataExchange, { from: buyer });
    //   const dataHash = "9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d";
    //   const signature = signMessage([order.address, seller, notary, dataHash], seller);

    //   await dataExchange.addDataResponse(
    //     orderAddress,
    //     seller,
    //     notary,
    //     dataHash,
    //     signature,
    //     { from: owner }
    //   );

    //   try {
    //     assert.fail();
    //   } catch (error) {
    //     assertRevert(error);
    //   }
    // });
  });
})
