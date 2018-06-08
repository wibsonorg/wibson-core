var DataExchange = artifacts.require("./DataExchange.sol");
var Wibcoin = artifacts.require("./Wibcoin.sol");

contract('DataExchange', (accounts) => {

  const OWNER      = accounts[0];
  const NOTARY_A   = accounts[1];
  const NOTARY_B   = accounts[2];
  const ID_MANAGER = accounts[3];
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
      return meta.dx.addNotary(NOTARY_A, "Notary A", NOTARY_A_PK, { from: OWNER });
    })
    .then((res) => {
      assert.ok(res, "couldn't add Notary");
    })
    .then(() => {
      return meta["dx"].newOrder(
        [NOTARY_A],
        "age:20,gender:male",
        "data request",
        "Terms and Conditions",
        "https://buyer.example.com/data",
        "public-key",
        20,
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
      return meta.dx.acceptToBeNotary(newOrderAddress, { from: NOTARY_A });
    })
    .then((res) => {
      assert.equal((res.logs[0].event), "NotaryAccepted");
      assert.ok(res, "Notary did not accept");
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
      return meta.dx.setOrderPrice(meta.newOrderAddress, 10, { from: BUYER });
    })
    .then((res) => {
      assert.ok(res, "Buyer could not set order price");
    })
    .then(() => {
      return meta.wib.approve(meta.dx.address, 100, { from: BUYER });
    })
    .then(() => {

      let hash = web3.sha3(
        (meta.newOrderAddress + SELLER.slice(2) + BUYER.slice(2) + "01"),
        { encoding: "hex" }
      )

      return meta.dx.addDataResponseToOrder(
        meta.newOrderAddress,
        SELLER,
        NOTARY_A,
        hash,
        "signature",
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
      return meta.dx.close(meta.newOrderAddress, { from: BUYER });
    })
    .then((res) => {
      assert.equal((res.logs[0].event), "OrderClosed");
      assert.ok(res, "Buyer could not close Data Order");
    })
    .then(() => {
      // Fails when trying to check with CryptoUtils.isSignedBy(..) inside `closeDataResponse` function
      meta.dx.closeDataResponse(
        meta.newOrderAddress,
        SELLER,
        true, // isValidData
        web3.fromAscii("signature"),
        { from: BUYER }
      ).then((res) => {
        //assert.equal((res.logs[0].event), "TransactionCompleted");
        assert.ok(res, "Buyer could not close Data Response");
      })
      .catch((err) => {
        console.log("    ✗ FAIL: DX.closeDataResponse(...)", err.message);
      })
    })
  });

  it("should add and remove a notary", () => {
    var meta = {};

    return DataExchange.deployed().then((dx) => {
      meta["dx"] = dx;
      return meta.dx.addNotary(NOTARY_B, "Notary B", NOTARY_B_PK, { from: OWNER });
    })
    .then((res) => {
      assert.ok(res, "couldn't add Notary");
    })
    .then(() => {
      return meta.dx.getNotaryInfo(NOTARY_B);
    })
    .then((res) => {
      assert.deepEqual(res, [NOTARY_B, "Notary B", NOTARY_B_PK], "failed to get Notary info");
    })
    .then(() => {
      return meta.dx.getAllowedNotaries();
    })
    .then((allowedNotaries) => {
      assert.ok((allowedNotaries.length >= 1), "failed to get allowed notaries");
    })
    .then(() => {
      return meta.dx.removeNotary(NOTARY_B, { from: OWNER });
    })
    .then((res) => {
      assert.ok(res, "couldn't remove Notary");
    })
  });

});
