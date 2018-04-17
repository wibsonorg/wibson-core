var utils = require("./utils.js")
var DataExchange = artifacts.require("./DataExchange.sol");

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
    return DataExchange.deployed().then((dx) => {
      meta["dx"] = dx;
      return meta.dx.addNotary(NOTARY_A, "Notary A", NOTARY_A_PK, { from: OWNER });
    })
    .then((res) => {
      assert.ok(res, "couldn't add Notary");
    })
    .then(() => {
      return meta.dx.setIdentityManager(ID_MANAGER);
    })
    .then((res) => {
      assert.ok(res, "couldn't add Identity Manager");
    })
    .then(() => {
      return meta.dx.newOrder(
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
      utils.assertEvent(meta.dx, { event: "NewOrder" });
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
      utils.assertEvent(meta.dx, { event: "NotaryAccepted" });
      assert.ok(res, "Notary did not accept");
    })
    .then(() => {
      return meta.dx.getOpenOrders();
    })
    .then((openOrders) => {
      assert.ok((openOrders.indexOf(meta.newOrderAddress) >= 0), "Order not in Open Orders");
    })
    .then(() => {
      return meta.dx.setOrderPrice(meta.newOrderAddress, 10, { from: BUYER });
    })
    .then((res) => {
      assert.ok(res, "Buyer could not set order price");
    })
    .then(() => {
      console.log("1")
      return meta.dx.addDataResponseToOrder(
        meta.newOrderAddress,
        SELLER,
        NOTARY_A,
        "TODO: hash",
        "TODO: signature",
        { from: BUYER }
      );
    })
    .then((res) => {
      console.log("2")
      utils.assertEvent(meta.dx, { event: "DataAdded" });
      assert.ok(res, "Buyer could not add data response to order");
    })
    .then(() => {
      return meta.dx.notarizeDataResponse(
        meta.newOrderAddress,
        SELLER,
        NOTARY_A,
        true, // approved
        { from: NOTARY_A }
      );
    })
    .then((res) => {
      utils.assertEvent(meta.dx, { event: "DataResponseNotarized" });
      assert.ok(res, "Notary couldn't notarize DataResponse");
    })
    .then(() => {
      return meta.dx.hasDataResponseBeenAccepted(meta.newOrderAddress, { from: SELLER });
    })
    .then((res) => {
      assert.ok(res, "Data response has not been accepted");
    })
    .then(() => {
      return meta.dx.closeDataResponse(
        meta.newOrderAddress,
        SELLER,
        true, // isValidData
        "TODO: signature",
        { from: BUYER }
      );
    })
    .then((res) => {
      utils.assertEvent(meta.dx, { event: "TransactionCompleted" });
      assert.ok(res, "Buyer could not close Data Response");
    })
    .then(() => {
      return meta.dx.close(meta.newOrderAddress, { from: BUYER }).call();
    })
    .then((res) => {
      utils.assertEvent(meta.dx, { event: "OrderClosed" });
      assert.ok(res, "Buyer could not close Data Order");
    })
  });

});
