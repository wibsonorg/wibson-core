const Web3 = require('web3');
const crypto = require('crypto');

/**
 * @param {Object} transaction the transaction where the event was emitted.
 * @param {String} eventName the name of emitted event.
 * @param {String[]} argNames the name of the event arguments.
 * @throws {AssertionError} when the error is not originated from a revert.
 */
export function assertEvent(transaction, eventName, ...argNames) {
  const event = transaction.logs.find(log => log.event === eventName);
  assert(event, `Event emit missing: ${eventName}`);
  const args = Object.keys(event.args);
  argNames.forEach(argName => assert(
    args.some(arg => arg === argName),
    `Event arg missing: ${argName}`,
  ));
}

/**
 * @param {Error} error the error where the assertion is made.
 * @param {String} message string that should match the revert message.
 * @throws {AssertionError} when the error is not originated from a revert.
 */
export function assertRevert(error, message = 'revert') {
  assert(error.toString().includes(message), error.toString());
}


/**
 * @param {Object} transaction the transaction where the event was emitted.
 */
export function extractEventArgs(transaction) {
  return transaction.logs[0].args;
}

/**
 * Hash and sign arguments with the signer's account.
 * @param {array} args an array of values to sign off.
 * @param {string} signer the signer's address.
 * @return {string} the signature over the arguments passed.
 */
export function signMessage(args, signer) {
  const hash = Web3.utils.soliditySha3(...args);
  return web3.eth.sign(signer, hash);
}

/**
 * Hash payload.
 * @param {array} args an array of values hash.
 * @return {string} the hash over the arguments passed.
 */
export function hashMessage(args) {
  return Web3.utils.soliditySha3(...args);
}

/**
 * Hash Buffer payload.
 * @param {Buffer} Buffer to be hashed.
 * @return {string} the hash over the Buffer param.
 */
export function hashMerkle(buffer) {
  return crypto.createHash('sha256').update(buffer).digest();
}

/**
 * Builds a DataOrder payload.
 * @param {Object} override params that override builder defaults.
 * @return {Array} the DataOrder payload.
 */
export const buildDataOrder = ({
  audience = [
    { name: 'age', value: '20' },
    { name: 'gender', value: 'male' },
  ],
  price = 20000000000,
  requestedData = ['geolocation'],
  termsAndConditions = 'DataOrder T&C',
  buyerUrl = '/data-orders/12345',
} = {}) => Object.values({
  audience: audience ? JSON.stringify(audience) : '',
  price: price.toString(),
  requestedData: requestedData ? JSON.stringify(requestedData) : '',
  termsAndConditionsHash: termsAndConditions ? hashMessage(termsAndConditions) : '0x0',
  buyerUrl,
});

/**
 * @typedef DataOrder
 * @property {string} buyer
 * @property {Object<string, *>} audience
 * @property {Number} price
 * @property {string[]} requestedData
 * @property {string} termsAndConditionsHash
 * @property {string} buyerUrl
 * @property {Number} createdAt
 * @property {Number} closedAt
 *
 * Gets the dataOrder from the DataExchange
 * @param {Object} dx DataExchange contract object.
 * @param {number} idx dataOrder index in the DataExchange.
 * @return {DataOrder} the DataOrder.
 */
export async function getDataOrder(dx, idx) {
  const [
    buyer,
    audience,
    price,
    requestedData,
    termsAndConditionsHash,
    buyerUrl,
    createdAt,
    closedAt,
  ] = Object.values(await dx.getDataOrder(idx));
  return {
    buyer,
    audience,
    price,
    requestedData,
    termsAndConditionsHash,
    buyerUrl,
    createdAt,
    closedAt,
  };
}
