import { signMessage, extractEventArgs } from '../helpers';

const DataExchange = artifacts.require('./DataExchange.sol');
const WIBToken = artifacts.require('./WIBToken.sol');

contract('DataExchange', async (accounts) => {
  const owner = accounts[0];
  const notary = accounts[1];
  const buyer = accounts[4];
  const seller = accounts[5];
  const tokenAddress = WIBToken.address;
  const token = WIBToken.at(tokenAddress);
  let dataExchange;

  const expectedGas = {
    newOrder: 1769000,
    registerNotary: 170000,
    unregisterNotary: 33000,
    addNotaryToOrder: 318000,
    addDataResponseToOrder: 332000,
    closeDataResponse: 85000,
    closeOrder: 68000,
  };

  const filters =
    '[{ "filter": "age", values: ["between_21_and_30_years_old"] }]';
  const dataRequest = '["geolocation"]';
  const price = '10';
  const initialBudgetForAudits = '0';
  const termsAndConditions =
    'd107c0801782889264da2e00ad0a19ba38435f84cbbf0689ed46b56a0ec7b4ea';
  const buyerURL =
    '{ "api": "http://buyer.com", "storage": "s3://key:secret@wibson-storage"}';
  const publicKey = 'pub key';

  const responsesPercentage = 30;
  const notarizationFee = 5;
  const notarizationTermsOfService =
    '028675a595387b2d32de68477f7a4a36a05b57a44957bf5ceb5d6d1f159e80d0';

  beforeEach(async () => {
    dataExchange = await DataExchange.new(token.address, owner);
  });

  describe('#newOrder', () => {
    it('consumes the expected amount of gas', async () => {
      const estimation = await dataExchange.newOrder.estimateGas(
        filters,
        dataRequest,
        price,
        initialBudgetForAudits,
        termsAndConditions,
        buyerURL,
        publicKey,
      );

      assert(
        estimation <= expectedGas.newOrder,
        `newOrder must consume ${
          expectedGas.newOrder
        } or less gas (actual consumption: ${estimation})`,
      );
    });
  });

  describe('#registerNotary', () => {
    it('consumes the expected amount of gas', async () => {
      const estimation = await dataExchange.registerNotary.estimateGas(
        notary,
        'Notary',
        'Notary URL',
        'Notary Public Key',
        { from: owner },
      );

      assert(
        estimation <= expectedGas.registerNotary,
        `registerNotary must consume ${
          expectedGas.registerNotary
        } or less gas (actual consumption: ${estimation})`,
      );
    });
  });

  describe('#unregisterNotary', () => {
    it('consumes the expected amount of gas', async () => {
      await dataExchange.registerNotary(
        notary,
        'Notary',
        'Notary URL',
        'Notary Public Key',
        { from: owner },
      );

      const estimation = await dataExchange.unregisterNotary.estimateGas(
        notary,
        { from: owner },
      );

      assert(
        estimation <= expectedGas.unregisterNotary,
        `unregisterNotary must consume ${
          expectedGas.unregisterNotary
        } or less gas (actual consumption: ${estimation})`,
      );
    });
  });

  describe('#addNotaryToOrder', () => {
    let orderAddress;

    beforeEach(async () => {
      await token.approve(dataExchange.address, 3000, { from: buyer });
      await dataExchange.registerNotary(
        notary,
        'Notary',
        'Notary URL',
        'Notary Public Key',
        { from: owner },
      );
      const newOrderTx = await dataExchange.newOrder(
        filters,
        dataRequest,
        price,
        initialBudgetForAudits,
        termsAndConditions,
        buyerURL,
        publicKey,
        { from: buyer },
      );
      const args = extractEventArgs(newOrderTx);
      orderAddress = args.orderAddr;
    });

    it('consumes the expected amount of gas', async () => {
      const estimation = await dataExchange.addNotaryToOrder.estimateGas(
        orderAddress,
        notary,
        responsesPercentage,
        notarizationFee,
        notarizationTermsOfService,
        signMessage(
          [
            orderAddress,
            responsesPercentage,
            notarizationFee,
            notarizationTermsOfService,
          ],
          notary,
        ),
        { from: buyer },
      );

      assert(
        estimation <= expectedGas.addNotaryToOrder,
        `addNotaryToOrder must consume ${
          expectedGas.addNotaryToOrder
        } or less gas (actual consumption: ${estimation})`,
      );
    });
  });

  describe('#addDataResponseToOrder', () => {
    let orderAddress;

    beforeEach(async () => {
      await token.approve(dataExchange.address, 3000, { from: buyer });
      await dataExchange.registerNotary(
        notary,
        'Notary',
        'Notary URL',
        'Notary Public Key',
        { from: owner },
      );
      const newOrderTx = await dataExchange.newOrder(
        filters,
        dataRequest,
        price,
        initialBudgetForAudits,
        termsAndConditions,
        buyerURL,
        publicKey,
        { from: buyer },
      );
      const args = extractEventArgs(newOrderTx);
      orderAddress = args.orderAddr;
      await dataExchange.addNotaryToOrder(
        orderAddress,
        notary,
        responsesPercentage,
        notarizationFee,
        notarizationTermsOfService,
        signMessage(
          [
            orderAddress,
            responsesPercentage,
            notarizationFee,
            notarizationTermsOfService,
          ],
          notary,
        ),
        { from: buyer },
      );
    });

    it('consumes the expected amount of gas', async () => {
      const dataHash =
        '9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d';
      const estimation = await dataExchange.addDataResponseToOrder.estimateGas(
        orderAddress,
        seller,
        notary,
        dataHash,
        signMessage([orderAddress, notary, dataHash], seller),
        { from: buyer },
      );

      assert(
        estimation <= expectedGas.addDataResponseToOrder,
        `addDataResponseToOrder must consume ${
          expectedGas.addDataResponseToOrder
        } or less gas (actual consumption: ${estimation})`,
      );
    });
  });

  describe('#closeDataResponse', () => {
    let orderAddress;

    beforeEach(async () => {
      await token.approve(dataExchange.address, 3000, { from: buyer });
      await dataExchange.registerNotary(
        notary,
        'Notary',
        'Notary URL',
        'Notary Public Key',
        { from: owner },
      );
      const newOrderTx = await dataExchange.newOrder(
        filters,
        dataRequest,
        price,
        initialBudgetForAudits,
        termsAndConditions,
        buyerURL,
        publicKey,
        { from: buyer },
      );
      const args = extractEventArgs(newOrderTx);
      orderAddress = args.orderAddr;
      await dataExchange.addNotaryToOrder(
        orderAddress,
        notary,
        responsesPercentage,
        notarizationFee,
        notarizationTermsOfService,
        signMessage(
          [
            orderAddress,
            responsesPercentage,
            notarizationFee,
            notarizationTermsOfService,
          ],
          notary,
        ),
        { from: buyer },
      );

      const dataHash =
        '9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d';
      await dataExchange.addDataResponseToOrder(
        orderAddress,
        seller,
        notary,
        dataHash,
        signMessage([orderAddress, notary, dataHash], seller),
        { from: buyer },
      );
    });

    it('consumes the expected amount of gas', async () => {
      const wasAudited = true;
      const isDataValid = true;
      const estimation = await dataExchange.closeDataResponse.estimateGas(
        orderAddress,
        seller,
        wasAudited,
        isDataValid,
        signMessage([orderAddress, seller, wasAudited, isDataValid], notary),
        { from: buyer },
      );

      assert(
        estimation <= expectedGas.closeDataResponse,
        `closeDataResponse must consume ${
          expectedGas.closeDataResponse
        } or less gas (actual consumption: ${estimation})`,
      );
    });
  });

  describe('#closeOrder', () => {
    let orderAddress;

    beforeEach(async () => {
      await token.approve(dataExchange.address, 3000, { from: buyer });
      await dataExchange.registerNotary(
        notary,
        'Notary',
        'Notary URL',
        'Notary Public Key',
        { from: owner },
      );
      const newOrderTx = await dataExchange.newOrder(
        filters,
        dataRequest,
        price,
        initialBudgetForAudits,
        termsAndConditions,
        buyerURL,
        publicKey,
        { from: buyer },
      );
      const args = extractEventArgs(newOrderTx);
      orderAddress = args.orderAddr;
      await dataExchange.addNotaryToOrder(
        orderAddress,
        notary,
        responsesPercentage,
        notarizationFee,
        notarizationTermsOfService,
        signMessage(
          [
            orderAddress,
            responsesPercentage,
            notarizationFee,
            notarizationTermsOfService,
          ],
          notary,
        ),
        { from: buyer },
      );

      const dataHash =
        '9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d';
      await dataExchange.addDataResponseToOrder(
        orderAddress,
        seller,
        notary,
        dataHash,
        signMessage([orderAddress, notary, dataHash], seller),
        { from: buyer },
      );

      const wasAudited = true;
      const isDataValid = true;
      await dataExchange.closeDataResponse(
        orderAddress,
        seller,
        wasAudited,
        isDataValid,
        signMessage([orderAddress, seller, wasAudited, isDataValid], notary),
        { from: buyer },
      );
    });

    it('consumes the expected amount of gas', async () => {
      const estimation = await dataExchange.closeOrder.estimateGas(
        orderAddress,
        { from: buyer },
      );

      assert(
        estimation <= expectedGas.closeOrder,
        `closeOrder must consume ${
          expectedGas.closeOrder
        } or less gas (actual consumption: ${estimation})`,
      );
    });
  });
});
