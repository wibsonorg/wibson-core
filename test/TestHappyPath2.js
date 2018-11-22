const DataExchange = artifacts.require('./DataExchange2.sol');
const WIBToken = artifacts.require('./WIBToken.sol');

contract('DataExchange2', (accounts) => {
  let dataExchange;
  let token;
  // const OWNER = accounts[6];
  // const NOTARY_A = accounts[1];
  const BUYER = accounts[4];
  // const SELLER = accounts[5];

  /*
1. Buyer places the order on the Smart Contract
2. Sellers listen for new Data Orders
3a. If Seller accepts Data Order, sends a Data Response directly
to Buyer’s public URL. It includes the data encrypted
 with a key known only by the Notary and the Seller,
 and the hash of such key.
3b. Data is sent for validation, along with the key used for the buyer.
4a <- Buyer sends selected Sellers (addresses) to Notary.
4b -> Notary filters out bad ones,
 replies (seller address, hash of seller key, encrypted seller key with master key)
 + hash(master key)
4c <- Buyer selects sellers that notary could decrypt (the ones that match Buyer’s key hashes).
 Send `{order_address, hashes_of_keys, hash(hashes_of_keys) }` to the Notary and asks to sign it.
4d -> Notary signs the message (complies)
5. Sends sellerId list and notary. Send locked payment that needs the master key to be unlocked
6. Notary reveals the key used to encrypt sellers’ keys (through a broker?)
Challenge Period starts
7a. Seller gets paid
7b. Notary also gets paid for completed audits
*/
  beforeEach('setup', async () => {
    WIBToken.deployed().then((wib) => { token = wib; });
    dataExchange = await DataExchange.new(token);
    await token.approve(dataExchange.address, 3000, { from: BUYER });
  });

  it('should do complete flow', async () => {
    const newOrder = await dataExchange.createDataOrder(
      'age:20,gender:male',
      20,
      'data request',
      'Terms and Conditions',
      'https://buyer.example.com/data',
      { from: BUYER },
    );
    assert.equal(newOrder.logs[0].event, 'NewDataOrder');
  });
});
