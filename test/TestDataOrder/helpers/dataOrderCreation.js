var DataOrder = artifacts.require("./DataOrder.sol");

const createHardcodedDataOrder = async (owner, buyer) => {
  return DataOrder.new(
    buyer,
    "age:20,gender:male",
    "data request",
    20,
    10,
    "Order T&C",
    "https://buyer.example.com/data",
    "public-key",
    { from: owner, gas: 3000000 }
  );
}

export {
  createHardcodedDataOrder
};
