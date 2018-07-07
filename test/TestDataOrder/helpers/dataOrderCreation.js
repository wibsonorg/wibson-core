const DataOrder = artifacts.require('./DataOrder.sol');

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
}) => DataOrder.new(
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

export default createDataOrder;
