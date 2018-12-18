const Web3 = require('web3');
const crypto = require('crypto');

/**
 * @param {Object} transaction the transaction where the event was emitted.
 * @param {String} eventName the name of emitted event.
 * @param {String} message to display on error.
 * @throws {AssertionError} when the error is not originated from a revert.
 */
export function assertEvent(transaction, eventName, message = '') {
  const hasEvent = transaction.logs.some(log => log.event === eventName);
  assert(hasEvent, message);
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
 * @param {Object} transaction the transaction
 * @param {Number} gasLimit maximum of gas units to consume. 
 * @throws {AssertionError} when the condition is not met.
 */
export function assertGasConsumptionNotExceeds({ receipt: { gasUsed } }, gasLimit) {
  assert(gasUsed < gasLimit, `Gas consumption exceeds ${gasLimit} (gasUsed: ${gasUsed})`);
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
