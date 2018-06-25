import { createDataOrder } from '../TestDataOrder/helpers/dataOrderCreation';
import { newOrder, addNotaryToOrder, addDataResponseToOrder } from './helpers';
import { assertEvent, assertRevert, signMessage } from '../helpers';

const DataExchange = artifacts.require('./DataExchange.sol');
const Wibcoin = artifacts.require('./Wibcoin.sol');

const extractAddress = transaction => transaction.logs[0].args.orderAddr;

contract('DataExchange', async (accounts) => {
  const notary = accounts[1];
  const buyer = accounts[4];
  const seller = accounts[5];
  const owner = accounts[6];
  const notOwner = accounts[7];
  const tokenAddress = Wibcoin.address;
  const token = Wibcoin.at(tokenAddress);
  const zeroAddress = '0x0000000000000000000000000000000000000000';

  const balanceOf = async address => {
    const balance = await token.balanceOf(address);
    return balance.toNumber();
  }

  let dataExchange;

  beforeEach(async () => {
    dataExchange = await DataExchange.new(tokenAddress, owner);
    await dataExchange.registerNotary(notary, 'Notary A', 'https://nota.ry', 'notary public key', {
      from: owner,
    });
    await token.approve(dataExchange.address, 3000, { from: buyer });
  });

  describe('closeDataResponse', async () => {
    it('can not close a DataResponse of an invalid DataOrder', async () => {
      try {
        await dataExchange.closeDataResponse(
          zeroAddress,
          seller,
          true,
          true,
          signMessage([zeroAddress, seller, true, true], notary),
          { from: buyer },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not close a DataResponse of a DataOrder that does not belong to the DataExchange contract', async () => {
      const order = await createDataOrder({ buyer, from: buyer });

      try {
        await dataExchange.closeDataResponse(
          order.address,
          seller,
          true,
          true,
          signMessage([order.address, seller, true, true], notary),
          { from: buyer },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not close a DataResponse of an invalid Seller', async () => {
      const orderAddress = extractAddress(await newOrder(dataExchange, { from: buyer }));
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
      await addDataResponseToOrder(dataExchange, {
        orderAddress,
        seller,
        notary,
        from: buyer,
      });

      try {
        await dataExchange.closeDataResponse(
          orderAddress,
          zeroAddress,
          true,
          true,
          signMessage([orderAddress, zeroAddress, true, true], notary),
          { from: buyer },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not close a DataResponse if there is not DataResponse for the Seller', async () => {
      const orderAddress = extractAddress(await newOrder(dataExchange, { from: buyer }));
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });

      try {
        await dataExchange.closeDataResponse(
          orderAddress,
          seller,
          true,
          true,
          signMessage([orderAddress, seller, true, true], notary),
          { from: buyer },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not close a DataResponse if sender is other than buyer or notary', async () => {
      const orderAddress = extractAddress(await newOrder(dataExchange, { from: buyer }));
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
      await addDataResponseToOrder(dataExchange, {
        orderAddress,
        seller,
        notary,
        from: buyer,
      });

      try {
        await dataExchange.closeDataResponse(
          orderAddress,
          seller,
          true,
          true,
          signMessage([orderAddress, seller, true, true], notary),
          { from: notOwner },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not close a DataResponse if the notary signature is invalid', async () => {
      const orderAddress = extractAddress(await newOrder(dataExchange, { from: buyer }));
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
      await addDataResponseToOrder(dataExchange, {
        orderAddress,
        seller,
        notary,
        from: buyer,
      });

      try {
        await dataExchange.closeDataResponse(
          orderAddress,
          seller,
          true,
          true,
          signMessage([orderAddress, seller, true, false], notary),
          { from: buyer },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not close a DataResponse of a closed DataOrder', async () => {
      const orderAddress = extractAddress(await newOrder(dataExchange, { from: buyer }));
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
      await addDataResponseToOrder(dataExchange, {
        orderAddress,
        seller,
        notary,
        from: buyer,
      });
      await dataExchange.closeOrder(orderAddress, { from: buyer });

      try {
        await dataExchange.closeDataResponse(
          orderAddress,
          seller,
          true,
          true,
          signMessage([orderAddress, seller, true, true], notary),
          { from: buyer },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not close an already-closed DataResponse', async () => {
      const orderAddress = extractAddress(await newOrder(dataExchange, { from: buyer }));
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
      await addDataResponseToOrder(dataExchange, {
        orderAddress,
        seller,
        notary,
        from: buyer,
      });
      const signature = signMessage([orderAddress, seller, true, true], notary);
      await dataExchange.closeDataResponse(orderAddress, seller, true, true, signature, {
        from: buyer,
      });

      try {
        await dataExchange.closeDataResponse(orderAddress, seller, true, true, signature, {
          from: buyer,
        });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('closes a DataResponse', async () => {
      const orderAddress = extractAddress(await newOrder(dataExchange, { from: buyer }));
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
      await addDataResponseToOrder(dataExchange, {
        orderAddress,
        seller,
        notary,
        from: buyer,
      });

      const closeTransaction = await dataExchange.closeDataResponse(
        orderAddress,
        seller,
        true,
        true,
        signMessage([orderAddress, seller, true, true], notary),
        { from: buyer },
      );

      assertEvent(
        closeTransaction,
        'TransactionCompleted',
        'DataResponse was not closed correctly',
      );
    });

    it('closes a DataResponse if sender is the notary', async () => {
      const orderAddress = extractAddress(await newOrder(dataExchange, { from: buyer }));
      await addNotaryToOrder(dataExchange, { orderAddress, notary, from: buyer });
      await addDataResponseToOrder(dataExchange, {
        orderAddress,
        seller,
        notary,
        from: buyer,
      });

      const closeTransaction = await dataExchange.closeDataResponse(
        orderAddress,
        seller,
        true,
        true,
        signMessage([orderAddress, seller, true, true], notary),
        { from: notary },
      );

      assertEvent(
        closeTransaction,
        'TransactionCompleted',
        'DataResponse was not closed correctly',
      );
    });

    describe('payPlayers', async () => {
      const initialBudgetForAudits = 10;
      const orderPrice = 50;
      const notarizationFee = 5;

      it('transfers tokens to players', async () => {
        const orderAddress = extractAddress(await newOrder(dataExchange, {
          price: orderPrice, initialBudgetForAudits, from: buyer
        }));
        await addNotaryToOrder(dataExchange, {
          orderAddress, notary, notarizationFee, from: buyer
        });
        await addDataResponseToOrder(dataExchange, {
          orderAddress, seller, notary, from: buyer,
        });

        const notaryBalanceBefore = await balanceOf(notary);
        const sellerBalanceBefore = await balanceOf(seller);

        await dataExchange.closeDataResponse(
          orderAddress,
          seller,
          true,
          true,
          signMessage([orderAddress, seller, true, true], notary),
          { from: buyer },
        );

        const notaryBalanceAfter = await balanceOf(notary);
        const sellerBalanceAfter = await balanceOf(seller);
        const dxBalanceAfter = await balanceOf(dataExchange.address);

        assert.equal(notaryBalanceAfter, notaryBalanceBefore + notarizationFee, 'Notary balance was not updated correctly');
        assert.equal(sellerBalanceAfter, sellerBalanceBefore + orderPrice, 'Seller balance was not updated correctly');
        assert.equal(dxBalanceAfter, initialBudgetForAudits - notarizationFee, 'DataExchange balance was not updated correctly');
      });

      it('does not allow buyer to transfer tokens before closing a DataResponse', async () => {
        const orderAddress = extractAddress(await newOrder(dataExchange, {
          price: orderPrice, initialBudgetForAudits, from: buyer
        }));
        await addNotaryToOrder(dataExchange, {
          orderAddress, notary, notarizationFee, from: buyer
        });
        await addDataResponseToOrder(dataExchange, {
          orderAddress, seller, notary, from: buyer,
        });

        const dxBalanceBefore = await balanceOf(dataExchange.address);

        try {
          // You can not send a transaction as a contract
          await token.transfer(buyer, dxBalanceBefore, { from: dataExchange.address });
          await dataExchange.closeDataResponse(
            orderAddress,
            seller,
            true,
            true,
            signMessage([orderAddress, seller, true, true], notary),
            { from: buyer },
          );

          assert.fail();
        } catch (error) {
          // Can not send a transaction as a contract
          assert.equal(error.message, 'sender account not recognized')
        }
      });
    });
  });
});
