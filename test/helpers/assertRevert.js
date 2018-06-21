/**
 * @param {Error} error the error where the assertion is made.
 * @throws {AssertionError} when the error is not originated from a revert.
 */
export default (error) =>
  assert(error.toString().includes('revert'), error.toString());
