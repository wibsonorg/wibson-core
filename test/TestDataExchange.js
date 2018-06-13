const web3Utils = require('web3-utils');
var DataExchange = artifacts.require("./DataExchange.sol");
var Wibcoin = artifacts.require("./Wibcoin.sol");

contract('DataExchange', (accounts) => {

  const OWNER      = accounts[0];
  const NOTARY_A   = accounts[1];
  const NOTARY_B   = accounts[2];
  const BUYER      = accounts[4];
  const SELLER     = accounts[5];

  const NOTARY_A_PK = "abcd123xyz9-fo00o42bar-1fed019n1"
  const NOTARY_B_PK = "abcd123xyz9-fo00o42bar-1fed019n2"

  it("should do complete flow", () => {
    var meta = {};

    Wibcoin.deployed().then((wib) => {
      meta["wib"] = wib;
    });

    return DataExchange.deployed().then((dx) => {
      meta["dx"] = dx;
      return meta.dx.registerNotary(NOTARY_A, "Notary A", "https://notary-a.com/data", NOTARY_A_PK, { from: OWNER });
    })
    .then((res) => {
      assert.ok(res, "couldn't register Notary");
    })
    .then(() => {
      return meta["dx"].newOrder(
        "age:20,gender:male",
        "data request",
        20,
        3000,
        false,
        "Terms and Conditions",
        "https://buyer.example.com/data",
        "public-key",
        { from: BUYER }
      );
    })
    .then((newOrder) => {
      meta["order"] = newOrder;
      assert.equal((newOrder.logs[0].event), "NewOrder");
    })
    .then(() => {
      var newOrderAddress;
      for (var i = 0; i < meta.order.logs.length; i++) {
        var log = meta.order.logs[i];

        if (log.event == "NewOrder") {
          newOrderAddress = log.args.orderAddr;
          break;
        }
      }

      meta["newOrderAddress"] = newOrderAddress;

      const responsesPercentage = 30;
      const notaryFee = 1;
      const hash = web3Utils.soliditySha3(newOrderAddress, responsesPercentage, notaryFee);
      const sig = web3.eth.sign(NOTARY_A, hash);

      return meta.dx.addNotaryToOrder(
        newOrderAddress,
        NOTARY_A,
        responsesPercentage,
        notaryFee,
        sig,
        { from: BUYER }
      );
    })
    .then((res) => {
      assert.equal((res.logs[0].event), "NotaryAdded");
      assert.ok(res, "Notary was not added");
    })
    .then(() => {
      return meta.dx.getOpenOrders();
    })
    .then((openOrders) => {
      assert.ok((openOrders.indexOf(meta.newOrderAddress) >= 0), "Order not in Open Orders");
    })
    .then(() => {
      return meta.dx.getOrdersForNotary(NOTARY_A);
    })
    .then((ordersForNotary) => {
      assert.ok((ordersForNotary.length >= 1), "Order not in orders for Notary");
    })
    .then(() => {
      return meta.dx.getOrdersForBuyer(BUYER);
    })
    .then((ordersForBuyer) => {
      assert.ok((ordersForBuyer.length >= 1), "Order not in orders for Buyer");
    })
    .then(() => {
      return meta.wib.approve(meta.dx.address, 100, { from: BUYER });
    })
    .then(() => {
      const dataHash = web3.sha3("0x40932840983001", { encoding: "hex" });
      const hash = web3Utils.soliditySha3(
        meta.newOrderAddress,
        SELLER,
        NOTARY_A,
        dataHash
      );
      const sig = web3.eth.sign(SELLER, hash);

      return meta.dx.addDataResponseToOrder(
        meta.newOrderAddress,
        SELLER,
        NOTARY_A,
        dataHash,
        sig,
        { from: BUYER }
      );
    })
    .then((res) => {
      assert.equal((res.logs[0].event), "DataAdded");
      assert.ok(res, "Buyer could not add data response to order");
    })
    .then(() => {
      return meta.dx.hasDataResponseBeenAccepted(meta.newOrderAddress, { from: SELLER });
    })
    .then((res) => {
      assert.ok(res, "Data response has not been accepted");
    })
    .then(() => {
      return meta.dx.getOrdersForSeller(SELLER);
    })
    .then((ordersForSeller) => {
      assert.ok((ordersForSeller.length >= 1), "Order not in orders for Seller");
    })
    .then(() => {
      const hash = web3Utils.soliditySha3(
        meta.newOrderAddress,
        SELLER,
        BUYER,
        true,
        true
      );
      const sig = web3.eth.sign(NOTARY_A, hash);

      meta.dx.closeDataResponse(
        meta.newOrderAddress,
        SELLER,
        true, // wasAudited
        true, // isDataValid
        sig,
        { from: BUYER }
      ).then((res) => {
        assert.ok(res, "Buyer could not close Data Response");
      })
      .catch((err) => {
        console.log("    ✗ FAIL: DX.closeDataResponse(...)", err.message);
      })
    })
    .then(() => {
      return meta.dx.close(meta.newOrderAddress, { from: BUYER });
    })
    .then((res) => {
      assert.equal((res.logs[0].event), "OrderClosed");
      assert.ok(res, "Buyer could not close Data Order");
    })
  });

  it("should add and remove a notary", () => {
    var meta = {};

    return DataExchange.deployed().then((dx) => {
      meta["dx"] = dx;
      return meta.dx.registerNotary(NOTARY_B, "Notary B", "https://notary-b.com/data", NOTARY_B_PK, { from: OWNER });
    })
    .then((res) => {
      assert.ok(res, "couldn't register Notary");
    })
    .then(() => {
      return meta.dx.getNotaryInfo(NOTARY_B);
    })
    .then((res) => {
      assert.deepEqual(res, [NOTARY_B, "Notary B", "https://notary-b.com/data", NOTARY_B_PK], "failed to get Notary info");
    })
    .then(() => {
      return meta.dx.getAllowedNotaries();
    })
    .then((allowedNotaries) => {
      assert.ok((allowedNotaries.length >= 1), "failed to get allowed notaries");
    })
    .then(() => {
      return meta.dx.unregisterNotary(NOTARY_B, { from: OWNER });
    })
    .then((res) => {
      assert.ok(res, "couldn't unregister Notary");
    })
  });

});
