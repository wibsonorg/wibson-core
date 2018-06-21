const web3Utils = require("web3-utils");
import signMessage from "../helpers/signMessage";
import assertRevert from "../helpers/assertRevert";
import createDataOrder from "./helpers/createDataOrder";

var DataExchange = artifacts.require("./DataExchange.sol");
var DataOrder = artifacts.require("./DataOrder.sol");
var Wibcoin = artifacts.require("./Wibcoin.sol");

contract("DataExchange", accounts => {
  let wibcoin;
  let dataExchange;

  const owner = accounts[0];
  const notary = accounts[1];
  const inexistentNotary = accounts[2];
  const unregisteredNotary = accounts[3];
  const buyer = accounts[4];
  const sellerA = accounts[5];
  const sellerB = accounts[6];
  const sellerC = accounts[7];
  const notBuyer = accounts[8];

  const dataHash = "9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d";

  let orderAddress;
  let orderAddressWithoutBudget;

  let signature;
  let signatureWithoutBudget;

  const orderPrice = 20;
  const notarizationFee = 1;

  const setUpDataOrder = async initialBudgetForAudits => {
    let approval =
      initialBudgetForAudits > 0 ? initialBudgetForAudits : notarizationFee;
    approval += orderPrice;

    await wibcoin.increaseApproval(dataExchange.address, approval, {
      from: buyer
    });

    const tx = await createDataOrder(dataExchange, {
      price: orderPrice,
      initialBudgetForAudits,
      from: buyer
    });
    const orderAddr = tx.logs[0].args.orderAddr;

    const responsesPercentage = 30;
    const notarizationTermsOfService = "Notary Terms and Conditions";
    const sig = signMessage(
      [
        orderAddr,
        responsesPercentage,
        notarizationFee,
        notarizationTermsOfService
      ],
      notary
    );

    await dataExchange.addNotaryToOrder(
      orderAddr,
      notary,
      responsesPercentage,
      notarizationFee,
      notarizationTermsOfService,
      sig,
      { from: buyer }
    );
    return orderAddr;
  };

  beforeEach("setup DataExchange for each test", async function() {
    wibcoin = await Wibcoin.deployed();
    dataExchange = await DataExchange.new(Wibcoin.address, owner);
    await dataExchange.registerNotary(
      notary,
      "Notary A",
      "https://notary-a.com/data",
      "public-key-a",
      { from: owner }
    );
    await dataExchange.registerNotary(
      inexistentNotary,
      "Notary B",
      "https://notary-b.com/data",
      "public-key-b",
      { from: owner }
    );

    await wibcoin.approve(dataExchange.address, 0, { from: buyer });

    orderAddress = await setUpDataOrder(2);
    orderAddressWithoutBudget = await setUpDataOrder(0);
    signature = signMessage([orderAddress, sellerA, notary, dataHash], sellerA);
    signatureWithoutBudget = signMessage(
      [orderAddressWithoutBudget, sellerA, notary, dataHash],
      sellerA
    );
  });

  describe("addDataResponse", function() {
    it("can not add a data response if order is closed", async function() {
      await dataExchange.closeOrder(orderAddress, { from: buyer });
      try {
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          notary,
          dataHash,
          signature,
          {
            from: buyer
          }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it("can not add a data response if seller is 0x0", async function() {
      try {
        const sig = signMessage([orderAddress, 0x0, notary, dataHash], sellerA);
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          0x0,
          notary,
          dataHash,
          sig,
          {
            from: buyer
          }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it("can not add a data response if seller has same address as Data Order", async function() {
      try {
        const sig = signMessage(
          [orderAddress, orderAddress, notary, dataHash],
          sellerA
        );
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          orderAddress,
          notary,
          dataHash,
          sig,
          {
            from: buyer
          }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it("can not add a data response if seller has same address as Data Exchange", async function() {
      try {
        const sig = signMessage(
          [orderAddress, dataExchange.address, notary, dataHash],
          sellerA
        );
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          dataExchange.address,
          notary,
          dataHash,
          sig,
          {
            from: buyer
          }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it("can not add a data response if notary is 0x0", async function() {
      try {
        const sig = signMessage(
          [orderAddress, sellerA, 0x0, dataHash],
          sellerA
        );
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          0x0,
          dataHash,
          sig,
          {
            from: buyer
          }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it("can not add a data response if notary has same address as Data Order", async function() {
      try {
        const sig = signMessage(
          [orderAddress, sellerA, orderAddress, dataHash],
          sellerA
        );
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          orderAddress,
          dataHash,
          sig,
          {
            from: buyer
          }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it("can not add a data response if notary has same address as Data Exchange", async function() {
      try {
        const sig = signMessage(
          [orderAddress, sellerA, dataExchange.address, dataHash],
          sellerA
        );
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          dataExchange.address,
          dataHash,
          sig,
          {
            from: buyer
          }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it("can not add a data response if notary was not added to Data Order", async function() {
      try {
        const sig = signMessage(
          [orderAddress, sellerA, inexistentNotary, dataHash],
          sellerA
        );
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          inexistentNotary,
          dataHash,
          sig,
          {
            from: buyer
          }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it("can not add a data response if notary was not registered in Data Exchange", async function() {
      try {
        const sig = signMessage(
          [orderAddress, sellerA, unregisteredNotary, dataHash],
          sellerA
        );
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          unregisteredNotary,
          dataHash,
          sig,
          {
            from: buyer
          }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it("can not add a data response twice", async function() {
      try {
        await wibcoin.increaseApproval(dataExchange.address, orderPrice, {
          from: buyer
        });

        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          notary,
          dataHash,
          signature,
          {
            from: buyer
          }
        );
      } catch (error) {
        assert.fail();
      }
      try {
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          notary,
          dataHash,
          signature,
          {
            from: buyer
          }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it("can not add a data response with invalid signature", async function() {
      try {
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          notary,
          dataHash,
          "0x4931ac3b001414eeff2c",
          {
            from: buyer
          }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it("can not add a data response if caller is not the buyer", async function() {
      try {
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          notary,
          dataHash,
          signature,
          {
            from: notBuyer
          }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it("can not add a data response if does not pay for order price", async function() {
      try {
        await wibcoin.approve(dataExchange.address, notarizationFee, {
          from: buyer
        });
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          notary,
          dataHash,
          signature,
          {
            from: buyer
          }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it("can not add a data response if does not pay for notarization fee", async function() {
      try {
        await wibcoin.approve(dataExchange.address, orderPrice, {
          from: buyer
        });
        await dataExchange.addDataResponseToOrder(
          orderAddressWithoutBudget,
          sellerA,
          notary,
          dataHash,
          signatureWithoutBudget,
          {
            from: buyer
          }
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it("can not add a data response if does not pay for notarization fee when initial budget does not cover it", async function() {
      // initial budget set covers only two notarization fees, it must fail on the third
      const sellers = [sellerA, sellerB, sellerC];
      let txOk = 0;

      try {
        for (let i = 0; i < sellers.length; i++) {
          await wibcoin.approve(dataExchange.address, orderPrice, {
            from: buyer
          });
          const seller = sellers[i];
          const sig = signMessage(
            [orderAddress, seller, notary, dataHash],
            seller
          );
          const tx = await dataExchange.addDataResponseToOrder(
            orderAddress,
            seller,
            notary,
            dataHash,
            sig,
            {
              from: buyer
            }
          );
          const wasEventEmitted = tx.logs[0].event === "DataAdded";
          txOk += wasEventEmitted ? 1 : 0;
        }
        assert.fail();
      } catch (error) {
        const result =
          txOk === sellers.length - 1 && error.toString().includes("revert");
        assert(result, error.toString());
      }
    });

    it("should not pay the notarization fee if there still is initial budget available", async function() {
      try {
        const initialBalance = await wibcoin.balanceOf(buyer);
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          notary,
          dataHash,
          signature,
          {
            from: buyer
          }
        );
        const finalBalance = await wibcoin.balanceOf(buyer);
        assert.equal(
          Number(initialBalance),
          Number(finalBalance) + orderPrice,
          "Buyer should not spend more than the order price"
        );
      } catch (error) {
        assert.fail();
      }
    });

    it("should add the data response if the notary is in the Data Order and the Data Exchange", async function() {
      try {
        const tx = await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          notary,
          dataHash,
          signature,
          {
            from: buyer
          }
        );
        assert.equal(
          tx.logs[0].event,
          "DataAdded",
          "Seller should be able to pick a notary that is in the Data Order and Data Exchange"
        );
      } catch (error) {
        assert.fail();
      }
    });

    it("should add a data response even if dataHash is empty", async function() {
      try {
        const sig = signMessage([orderAddress, sellerA, notary, ""], sellerA);
        const tx = await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          notary,
          "",
          sig,
          {
            from: buyer
          }
        );
        assert.equal(
          tx.logs[0].event,
          "DataAdded",
          "Data Response should be added even with an empty data hash"
        );
      } catch (error) {
        assert.fail();
      }
    });
  });
});
