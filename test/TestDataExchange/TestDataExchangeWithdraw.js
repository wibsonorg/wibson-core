import { assertEvent, assertRevert } from '../helpers';
import { newOrder } from './helpers';

const DataExchange = artifacts.require('./DataExchange.sol');
const WIBToken = artifacts.require('./WIBToken.sol');

const range = length => [...Array(length)];

const buildWitnesses = (sellers) => {
  const hashes = sellers
    .map(seller => ({ seller }))
    .map(node => node.hash = web3.sha3(node.seller) && node)
    .map(node => node.bn = web3.toBigNumber(node.hash) && node)
    .sort((a, b) => {
      if (a.gt(b)) return 1;
      if (a.lt(b)) return -1;
      return 0;
    });

  let leafs = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const node = {
      l: hashes[i],
      r: hashes[i + 1],
    };
    let parts = node.l;
    if (node.r) parts = `${parts}${node.r}`;
    node.hash = web3.sha3(parts);
    leafs = [...leafs, node];
  }

  console.log('leafs', leafs);
};

contract.only('DataExchange', async (accounts) => {
  const owner = accounts[0];
  const buyer = accounts[1];
  const sellers = range(10).map(() => web3.personal.newAccount());
  const tokenAddress = WIBToken.address;
  const token = WIBToken.at(tokenAddress);

  let dataExchange;
  let orderAddress;
  let orderEvents;

  beforeEach(async () => {
    dataExchange = await DataExchange.new(tokenAddress, owner);
    await token.approve(dataExchange.address, '300e9', { from: buyer });

    const txs = await Promise.all(range(2).map(() => newOrder(dataExchange, { from: buyer })));
    orderEvents = txs.map(tx => tx.logs[0].args);
    orderAddress = orderEvents[0].orderAddr;
  });

  describe('withdraw', async () => {
    // it('fails to add sellers to order when sender is not the buyer', async () => {
    //   try {
    //     await dataExchange.addSellersToOrder(orderAddress, sellers, {
    //       from: owner,
    //     });
    //     assert.fail();
    //   } catch (error) {
    //     assertRevert(error);
    //   }
    // });

    it('withdraws WIBs from specified orders', async () => {
      // const witnesses = buildWitnesses(sellers);
      // const witnesses = [
      //   [
      //     '0x87c2d362de99f75a4f2755cdaaad2d11bf6cc65dc71356593c445535ff28f43d',
      //     '0x87c2d362de99f75a4f2755cdaaad2d11bf6cc65dc71356593c445535ff28f43d',
      //     '0x87c2d362de99f75a4f2755cdaaad2d11bf6cc65dc71356593c445535ff28f43d',
      //     '0x87c2d362de99f75a4f2755cdaaad2d11bf6cc65dc71356593c445535ff28f43d',
      //   ],
      //   [
      //     '0x87c2d362de99f75a4f2755cdaaad2d11bf6cc65dc71356593c445535ff28f43d',
      //     '0x87c2d362de99f75a4f2755cdaaad2d11bf6cc65dc71356593c445535ff28f43d',
      //     '0x87c2d362de99f75a4f2755cdaaad2d11bf6cc65dc71356593c445535ff28f43d',
      //     '0x87c2d362de99f75a4f2755cdaaad2d11bf6cc65dc71356593c445535ff28f43d',
      //   ],
      // ];
      const witness = [
        '0x87c2d362de99f75a4f2755cdaaad2d11bf6cc65dc71356593c445535ff28f43d',
        '0x87c2d362de99f75a4f2755cdaaad2d11bf6cc65dc71356593c445535ff28f43d',
        '0x87c2d362de99f75a4f2755cdaaad2d11bf6cc65dc71356593c445535ff28f43d',
        '0x87c2d362de99f75a4f2755cdaaad2d11bf6cc65dc71356593c445535ff28f43d',
      ];

      console.log('here 1');
      await dataExchange.addSellersToOrderForFullWithdraw(orderAddress, sellers, {
        from: buyer,
      });
      // const positions = [0, 1];
      // console.log('here 2', { witnesses, positions, seller: sellers[0] });
      // await dataExchange.withdraw(
      //   witnesses,
      //   positions,
      //   sellers[0],
      //   {
      //     from: buyer,
      //   },
      // );

      console.log('here 3');
      const { tx } = await dataExchange.withdrawFromOrder(
        witness,
        0,
        sellers[0],
        {
          from: buyer,
        },
      );
      console.log('withdraw tx', tx);
    });
  });
});
