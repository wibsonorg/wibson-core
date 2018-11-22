const DataExchange = artifacts.require('./DataExchange2.sol');
const WIBToken = artifacts.require('./WIBToken.sol');

contract('DataExchange', (accounts) => {
  let dataExchange;
  let token;

  beforeEach('setup', async () => {
    WIBToken.deployed().then((wib) => { token = wib; });

    dataExchange = await DataExchange.new(token);
  });
})
