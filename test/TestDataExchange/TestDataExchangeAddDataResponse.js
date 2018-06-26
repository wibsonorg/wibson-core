import { assertRevert, signMessage } from '../helpers';
import { newOrder } from './helpers';

const DataExchange = artifacts.require('./DataExchange.sol');
const Wibcoin = artifacts.require('./Wibcoin.sol');

contract('DataExchange', (accounts) => {
  let wibcoin;
  let dataExchange;

  const owner = accounts[0];
  const notary = accounts[1];
  const inexistentNotary = accounts[2];
  const unregisteredNotary = accounts[3];
  const buyer = accounts[4];
  const sellerA = accounts[5];
  const sellerB = accounts[6];
  const sellerC = accounts[7];
  const notBuyer = accounts[8];

  const dataHash = '9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d';

  let orderAddress;
  let orderAddressWithoutBudget;

  let signature;
  let signatureWithoutBudget;

  const orderPrice = 20;
  const notarizationFee = 1;

  const setUpDataOrder = async (initialBudgetForAudits) => {
    let approval = initialBudgetForAudits > 0 ? initialBudgetForAudits : notarizationFee;
    approval += orderPrice;

    await wibcoin.increaseApproval(dataExchange.address, approval, {
      from: buyer,
    });

    const tx = await newOrder(dataExchange, {
      price: orderPrice,
      initialBudgetForAudits,
      from: buyer,
    });
    const { orderAddr } = tx.logs[0].args;

    const responsesPercentage = 30;
    const notarizationTermsOfService = 'Notary Terms and Conditions';
    const sig = signMessage(
      [orderAddr, responsesPercentage, notarizationFee, notarizationTermsOfService],
      notary,
    );

    await dataExchange.addNotaryToOrder(
      orderAddr,
      notary,
      responsesPercentage,
      notarizationFee,
      notarizationTermsOfService,
      sig,
      { from: buyer },
    );
    return orderAddr;
  };

  beforeEach('setup DataExchange for each test', async () => {
    wibcoin = await Wibcoin.deployed();
    dataExchange = await DataExchange.new(Wibcoin.address, owner);
    await dataExchange.registerNotary(
      notary,
      'Notary A',
      'https://notary-a.com/data',
      'public-key-a',
      { from: owner },
    );
    await dataExchange.registerNotary(
      inexistentNotary,
      'Notary B',
      'https://notary-b.com/data',
      'public-key-b',
      { from: owner },
    );

    await wibcoin.approve(dataExchange.address, 0, { from: buyer });

    orderAddress = await setUpDataOrder(2);
    orderAddressWithoutBudget = await setUpDataOrder(0);
    signature = signMessage([orderAddress, notary, dataHash], sellerA);
    signatureWithoutBudget = signMessage([orderAddressWithoutBudget, notary, dataHash], sellerA);
  });

  describe('addDataResponse', () => {
    it('can not add a data response if order is closed', async () => {
      await dataExchange.closeOrder(orderAddress, { from: buyer });
      try {
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          notary,
          dataHash,
          signature,
          {
            from: buyer,
          },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not add a data response if seller is 0x0', async () => {
      try {
        await dataExchange.addDataResponseToOrder(orderAddress, 0x0, notary, dataHash, signature, {
          from: buyer,
        });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not add a data response if seller has same address as Data Order', async () => {
      try {
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          orderAddress,
          notary,
          dataHash,
          signature,
          {
            from: buyer,
          },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not add a data response if seller has same address as Data Exchange', async () => {
      try {
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          dataExchange.address,
          notary,
          dataHash,
          signature,
          {
            from: buyer,
          },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not add a data response if notary is 0x0', async () => {
      const sig = signMessage([orderAddress, 0x0, dataHash], sellerA);
      try {
        await dataExchange.addDataResponseToOrder(orderAddress, sellerA, 0x0, dataHash, sig, {
          from: buyer,
        });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not add a data response if notary has same address as Data Order', async () => {
      const sig = signMessage([orderAddress, orderAddress, dataHash], sellerA);
      try {
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          orderAddress,
          dataHash,
          sig,
          {
            from: buyer,
          },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not add a data response if notary has same address as Data Exchange', async () => {
      const sig = signMessage([orderAddress, dataExchange.address, dataHash], sellerA);
      try {
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          dataExchange.address,
          dataHash,
          sig,
          {
            from: buyer,
          },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not add a data response if notary was not added to Data Order', async () => {
      const sig = signMessage([orderAddress, inexistentNotary, dataHash], sellerA);
      try {
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          inexistentNotary,
          dataHash,
          sig,
          {
            from: buyer,
          },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not add a data response if notary was not registered in Data Exchange', async () => {
      const sig = signMessage([orderAddress, unregisteredNotary, dataHash], sellerA);
      try {
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          unregisteredNotary,
          dataHash,
          sig,
          {
            from: buyer,
          },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not add a data response twice', async () => {
      try {
        await wibcoin.increaseApproval(dataExchange.address, orderPrice, {
          from: buyer,
        });

        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          notary,
          dataHash,
          signature,
          {
            from: buyer,
          },
        );
      } catch (error) {
        assert.fail();
      }
      try {
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          notary,
          dataHash,
          signature,
          {
            from: buyer,
          },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not add a data response with invalid signature', async () => {
      try {
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          notary,
          dataHash,
          '0x4931ac3b001414eeff2c',
          {
            from: buyer,
          },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not add a data response if caller is not the buyer', async () => {
      try {
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          notary,
          dataHash,
          signature,
          {
            from: notBuyer,
          },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not add a data response if does not pay for order price', async () => {
      try {
        await wibcoin.approve(dataExchange.address, notarizationFee, {
          from: buyer,
        });
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          notary,
          dataHash,
          signature,
          {
            from: buyer,
          },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not add a data response if does not pay for notarization fee', async () => {
      try {
        await wibcoin.approve(dataExchange.address, orderPrice, {
          from: buyer,
        });
        await dataExchange.addDataResponseToOrder(
          orderAddressWithoutBudget,
          sellerA,
          notary,
          dataHash,
          signatureWithoutBudget,
          {
            from: buyer,
          },
        );
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not add a data response if does not pay for notarization fee when initial budget does not cover it', async () => {
      const sellers = [sellerA, sellerB, sellerC];
      let txOk = 0;

      try {
        // initial budget set in `beforeEach` covers only two notarization fees,
        // it must fail on the third
        for (let i = 0; i < sellers.length; i += 1) {
          /* eslint-disable no-await-in-loop */
          // https://eslint.org/docs/rules/no-await-in-loop#when-not-to-use-it
          await wibcoin.approve(dataExchange.address, orderPrice, {
            from: buyer,
          });
          const seller = sellers[i];
          const sig = signMessage([orderAddress, notary, dataHash], seller);
          const tx = await dataExchange.addDataResponseToOrder(
            orderAddress,
            seller,
            notary,
            dataHash,
            sig,
            {
              from: buyer,
            },
          );
          const wasEventEmitted = tx.logs[0].event === 'DataAdded';
          txOk += wasEventEmitted ? 1 : 0;
          /* eslint-enable no-await-in-loop */
        }
        assert.fail();
      } catch (error) {
        // if threw revert on the third seller (budget reached zero), then it works as expected
        const result = txOk === sellers.length - 1 && error.toString().includes('revert');
        assert(result, error.toString());
      }
    });

    it('should not pay the notarization fee if there still is initial budget available', async () => {
      try {
        const initialBalance = await wibcoin.balanceOf(buyer);
        await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          notary,
          dataHash,
          signature,
          {
            from: buyer,
          },
        );
        const finalBalance = await wibcoin.balanceOf(buyer);
        assert.equal(
          Number(initialBalance),
          Number(finalBalance) + orderPrice,
          'Buyer should not spend more than the order price',
        );
      } catch (error) {
        assert.fail();
      }
    });

    it('should add the data response if the notary is in the Data Order and the Data Exchange', async () => {
      try {
        const tx = await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          notary,
          dataHash,
          signature,
          {
            from: buyer,
          },
        );
        assert.equal(
          tx.logs[0].event,
          'DataAdded',
          'Seller should be able to pick a notary that is in the Data Order and Data Exchange',
        );
      } catch (error) {
        assert.fail();
      }
    });

    it('should add a data response even if dataHash is empty', async () => {
      const sig = signMessage([orderAddress, notary], sellerA);
      try {
        const tx = await dataExchange.addDataResponseToOrder(
          orderAddress,
          sellerA,
          notary,
          '',
          sig,
          {
            from: buyer,
          },
        );
        assert.equal(
          tx.logs[0].event,
          'DataAdded',
          'Data Response should be added even with an empty data hash',
        );
      } catch (error) {
        assert.fail(error);
      }
    });
  });
});
