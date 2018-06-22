const web3Utils = require('web3-utils');

/**
 * @param {Object} transaction the transaction where the event was emitted.
 * @param {String} eventName the name of emitted event.
 * @param {String} message to display on error.
 * @throws {AssertionError} when the error is not originated from a revert.
 */
export function assertEvent(transaction, eventName, message = '') {
  assert.equal(transaction.logs[0].event, eventName, message);
}

/**
 * @param {Error} error the error where the assertion is made.
 * @throws {AssertionError} when the error is not originated from a revert.
 */
export function assertRevert(error) {
  assert(error.toString().includes('revert'), error.toString());
}

/**
 * Hash and sign arguments with the signer's account.
 * @param {array} args an array of values to sign off.
 * @param {string} signer the signer's address.
 * @return {string} the signature over the arguments passed.
 */
export function signMessage(args, signer) {
  const hash = web3Utils.soliditySha3(...args);
  return web3.eth.sign(signer, hash);
}
