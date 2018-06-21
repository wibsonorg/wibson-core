const web3Utils = require('web3-utils');

/**
 * Hash and sign arguments with the signer's account.
 * @param {array} args an array of values to sign off.
 * @param {string} signer the signer's address.
 * @return {string} the signature over the arguments passed.
 */
export default (args, signer) => {
  const hash = web3Utils.soliditySha3(...args);
  return web3.eth.sign(signer, hash);
};
