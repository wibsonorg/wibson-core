import { hashMessage, hashMerkle } from './helpers';

const merkle = require('merkle-lib');
const fastRoot = require('merkle-lib/fastRoot');
const merkleProof = require('merkle-lib/proof');
const Web3 = require('web3');

const DataExchange = artifacts.require('./DataExchange2.sol');
const DataOrder = artifacts.require('./DataOrder2.sol');
const WIBToken = artifacts.require('./WIBToken.sol');

contract('DataExchange2', (accounts) => {
  let dataExchange;
  let token;
  // const OWNER = accounts[6];
  const NOTARY_A = accounts[1];
  const BUYER = accounts[4];
  const SELLER = accounts[5];
  const SELLER2 = accounts[6];
  const SELLER3 = accounts[7];

  /*

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
    // 1. Buyer places the order on the Smart Contract
    const newOrder = await dataExchange.createDataOrder(
      'age:20,gender:male',
      20,
      'data request',
      'Terms and Conditions',
      'https://buyer.example.com/data',
      { from: BUYER },
    );
    // 2. Sellers listen for new Data Orders
    assert.equal(newOrder.logs[0].event, 'NewDataOrder');
    /*
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
     Send `{order_address, hashes_of_keys, hash(hashes_of_keys) }` to the Notary and asks to sign it
    4d -> Notary signs the message (complies)
    */
    const newOrderAddress = newOrder.logs[0].args.dataOrder;
    // 5. Sends sellerId list and notary.
    // Send locked payment that needs the master key to be unlocked
    const sellers = [SELLER, SELLER2, SELLER3].map(s => s.slice(2)); // Remove the 0x
    const sellersBuffer = sellers.map(s => Buffer.from(s, 'hex'));

    const root = fastRoot(sellersBuffer, hashMerkle);
    assert.ok(root.toString('hex') !== '', 'Root hash cannot be empty');

    const tree = merkle(sellersBuffer, hashMerkle);
    const proof = merkleProof(tree, sellersBuffer[0]);
    assert.ok(proof !== null, 'Proof does not exist');

    const sellerIsInRootHash = merkleProof.verify(proof, hashMerkle);
    assert.ok(sellerIsInRootHash, 'Seller must be in merkle tree');

    const tx = await dataExchange.addDataResponses(newOrderAddress, root.toString('hex'), { from: BUYER });

    const index = tx.logs[0].args.keyHashIndex;

    // assert.ok(Web3.utils.isBN(index), 'Data response must have an index');

    // const dataHash = '9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d';
    // const sig = signMessage([newOrderAddress, NOTARY_A, dataHash], SELLER);

    // return meta.dx.addDataResponseToOrder(
    //   meta.newOrderAddress,
    //   SELLER,
    //   NOTARY_A,
    //   dataHash,
    //   sig,
    //   { from: BUYER },
    // );
  });
});
