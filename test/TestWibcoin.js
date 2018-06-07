const Wibcoin = artifacts.require('./Wibcoin.sol');

contract('Wibcoin', accounts => {
  let token;
  const creator = accounts[0];

  beforeEach(async function () {
    token = await Wibcoin.new({ from: creator });
  });

  it('has a name', async function () {
    const name = await token.name();
    assert.equal(name, 'Wibcoin');
  });

  it('has a symbol', async function () {
    const symbol = await token.symbol();
    assert.equal(symbol, 'WIB');
  });

  it('has 9 decimals', async function () {
    const decimals = await token.decimals();
    assert.equal(decimals.toNumber(), 9);
  });

  it('has an initial supply of 9e18 tokens', async function () {
    const totalSupply = await token.totalSupply();
    assert.equal(totalSupply.toNumber(), 9000000000000000000);
  });

  it('assigns the initial total supply to the creator', async function () {
    const totalSupply = await token.totalSupply();
    const creatorBalance = await token.balanceOf(creator);

    assert.equal(creatorBalance.toNumber(), totalSupply.toNumber());


    const receipt = web3.eth.getTransactionReceipt(token.transactionHash);

    assert.equal(receipt.logs.length, 1);
    const log = receipt.logs[0];

    assert.equal(log.type, 'mined');
    assert.equal(log.topics[1], 0x0); // from
    assert.equal(parseInt(log.topics[2], 16), parseInt(creator, 16)); // to
  });
});
