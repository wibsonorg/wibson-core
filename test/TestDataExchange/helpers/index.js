import signMessage from "../../helpers/signMessage";

const newOrder = async (dataExchange, {
  filters = "age:20,gender:male",
  dataRequest = "data request",
  price = 20,
  initialBudgetForAudits = 10,
  termsAndConditions = "DataOrder T&C",
  buyerUrl = "https://buyer.example.com/data",
  buyerPublicKey = "public-key",
  from
}) => {
  return await dataExchange.newOrder(
    filters,
    dataRequest,
    price,
    initialBudgetForAudits,
    termsAndConditions,
    buyerUrl,
    buyerPublicKey,
    { from }
  );
}

const addNotaryToOrder = async (dataExchange, {
  orderAddress,
  notary,
  responsesPercentage = 50,
  notarizationFee = 10,
  notarizationTermsOfService = "Sample TOS",
  from
}) => {
  return await dataExchange.addNotaryToOrder(
    orderAddress,
    notary,
    responsesPercentage,
    notarizationFee,
    notarizationTermsOfService,
    signMessage([
      orderAddress,
      responsesPercentage,
      notarizationFee,
      notarizationTermsOfService
    ], notary),
    { from }
  );
}

const addDataResponseToOrder = async (dataExchange, {
  orderAddress,
  seller,
  notary,
  dataHash = "9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d",
  from
}) => {
  return await dataExchange.addDataResponseToOrder(
    orderAddress,
    seller,
    notary,
    dataHash,
    signMessage([
      orderAddress,
      seller,
      notary,
      dataHash
    ], seller),
    { from }
  );
}

export {
  newOrder,
  addNotaryToOrder,
  addDataResponseToOrder
}
