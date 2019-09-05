import ethCrypto from 'eth-crypto';

const buildSignedNotaryInfo = (signerPrivateKey) => {
  const publicKey = ethCrypto.publicKeyByPrivateKey(signerPrivateKey);

  const message = {
    name: 'A Notary',
    address: ethCrypto.publicKey.toAddress(publicKey),
    publicKey,
    notarizationUrl: 'https://example.com/buyers/notarization-request',
    dataResponsesUrl: 'https://example.com/data-responses',
    headsUpUrl: 'https://example.com/sellers/heads-up',
  };

  // 1. we sign the message
  const messageHash = ethCrypto.hash.keccak256(message);
  const signature = ethCrypto.sign(signerPrivateKey, messageHash);

  // 2. we create the payload with the message and the signature
  return {
    message,
    signature,
  };
};

const getSignerFromMessage = (message, signature) => {
  const messageHash = ethCrypto.hash.keccak256(message);
  return ethCrypto.recover(signature, messageHash);
};

export { buildSignedNotaryInfo, getSignerFromMessage };
