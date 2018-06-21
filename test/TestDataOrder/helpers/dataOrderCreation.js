const DataOrder = artifacts.require('./DataOrder.sol');

// TODO: to be deprecated
const createHardcodedDataOrder = async (owner, buyer) => DataOrder.new(
  buyer,
  'age:20,gender:male',
  'data request',
  20,
  10,
  'Order T&C',
  'https://buyer.example.com/data',
  'public-key',
  { from: owner },
);

const createDataOrder = async ({
  buyer,
  filters = 'age:20,gender:male',
  dataRequest = 'data request',
  price = 20,
  initialBudgetForAudits = 10,
  termsAndConditions = 'DataOrder T&C',
  buyerUrl = 'https://buyer.example.com/data',
  buyerPublicKey = 'public-key',
  from,
}) => await DataOrder.new(
  buyer,
  filters,
  dataRequest,
  price,
  initialBudgetForAudits,
  termsAndConditions,
  buyerUrl,
  buyerPublicKey,
  { from },
);

export {
  createDataOrder,
  createHardcodedDataOrder,
};
