var utils = require("./utils.js")
var Wibcoin = artifacts.require("./DataExchangeV1.sol");

contract('DataExchange', (accounts) => {

  const OWNER    = accounts[0];
  const NOTARY_A = accounts[1];
  const NOTARY_B = accounts[2];
  const NOTARY_C = accounts[3];
  const BUYER    = accounts[4];
  const SELLER   = accounts[5];

  const NOTARY_A_PK = "abcd123xyz9-fo00o42bar-1fed019n1"
  const NOTARY_B_PK = "abcd123xyz9-fo00o42bar-1fed019n2"
  const NOTARY_C_PK = "abcd123xyz9-fo00o42bar-1fed019n3"

  it("should add Notary, create new DataOrder, and accept Notary", () => {
    var meta = {};
    return DataExchangeV1.deployed().then((dx) => {
      meta["dx"] = dx;
      return meta["dx"].addNotary(NOTARY_A, "Notary A", NOTARY_A_PK, { from: OWNER }).call();
    })
    .then((res) => {
      assert.equal(res, true, "couldn't add Notary");
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
      utils.assertEvent(metaDX, { event: "NewOrder" });
    })
    .then(() => {
      return meta["dx"].acceptToBeNotary(meta["order"], { from: NOTARY_A });
    })
    .then((res) => {
      utils.assertEvent(metaDX, { event: "NotaryAccepted" });
      assert.equal(res, true, "Notary did not accept");
    })
  });

});
