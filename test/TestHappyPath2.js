const DataExchange = artifacts.require('./DataExchange.sol');
const WIBToken = artifacts.require('./WIBToken.sol');

contract.only('DataExchange', () => {
  let token;

  beforeEach('setup', async () => {
    WIBToken.deployed().then((wib) => { token = wib; });

    await DataExchange.new(token);
  });
});
