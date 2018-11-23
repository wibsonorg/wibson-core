const DataExchange2 = artifacts.require('./DataExchange2.sol');
const WIBToken = artifacts.require('./WIBToken.sol');

contract.only('DataExchange2', (accounts) => {
  let dataExchange;
  let token;

  beforeEach('setup', async () => {
    WIBToken.deployed().then((wib) => { token = wib; });

    dataExchange = await DataExchange2.new(token);
  });
})
