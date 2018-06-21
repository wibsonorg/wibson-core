const createDataOrder = async (dataExchange, {
  filters = "age:20,gender:male",
  dataRequest = "data request",
  price = 20,
  initialBudgetForAudits = 10,
  termsAndConditions = "DataOrder T&C",
  buyerUrl = "https://buyer.example.com/data",
  buyerPublicKey = "public-key",
  from
}) =>
  dataExchange.newOrder(
    filters,
    dataRequest,
    price,
    initialBudgetForAudits,
    termsAndConditions,
    buyerUrl,
    buyerPublicKey,
    { from }
  );


export default createDataOrder
