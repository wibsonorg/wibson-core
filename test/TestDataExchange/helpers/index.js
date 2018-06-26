import { signMessage } from '../../helpers';

const newOrder = async (dataExchange, {
  filters = 'age:20,gender:male',
  dataRequest = 'data request',
  price = 20,
  initialBudgetForAudits = 10,
  termsAndConditions = 'DataOrder T&C',
  buyerUrl = 'https://buyer.example.com/data',
  buyerPublicKey = 'public-key',
  from,
}) => dataExchange.newOrder(
  filters,
  dataRequest,
  price,
  initialBudgetForAudits,
  termsAndConditions,
  buyerUrl,
  buyerPublicKey,
  { from },
);

const addNotaryToOrder = async (dataExchange, {
  orderAddress,
  notary,
  responsesPercentage = 50,
  notarizationFee = 10,
  notarizationTermsOfService = 'Sample TOS',
  from,
}) => dataExchange.addNotaryToOrder(
  orderAddress,
  notary,
  responsesPercentage,
  notarizationFee,
  notarizationTermsOfService,
  signMessage([
    orderAddress,
    responsesPercentage,
    notarizationFee,
    notarizationTermsOfService,
  ], notary),
  { from },
);

const addDataResponseToOrder = async (dataExchange, {
  orderAddress,
  seller,
  notary,
  dataHash = '9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d',
  from,
}) => dataExchange.addDataResponseToOrder(
  orderAddress,
  seller,
  notary,
  dataHash,
  signMessage([
    orderAddress,
    seller,
    notary,
    dataHash,
  ], seller),
  { from },
);

const closeDataResponse = async (dataExchange, {
  orderAddress,
  seller,
  notary,
  wasAudited = true,
  isDataValid = true,
  from,
}) => dataExchange.closeDataResponse(
  orderAddress,
  seller,
  wasAudited,
  isDataValid,
  signMessage([
    orderAddress,
    seller,
    wasAudited,
    isDataValid,
  ], notary),
  { from },
);

export {
  newOrder,
  addNotaryToOrder,
  addDataResponseToOrder,
  closeDataResponse,
};
