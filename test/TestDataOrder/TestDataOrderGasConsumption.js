const DataOrder = artifacts.require('./DataOrder.sol');

contract('DataOrder', async (accounts) => {
  const owner = accounts[0];
  const notary = accounts[1];
  const buyer = accounts[4];
  const seller = accounts[5];
  let dataOrder;

  const expectedGas = {
    addNotary: 154000,
    addDataResponse: 180000,
    closeDataResponse: 37000,
    close: 28000,
  };

  const filters =
    '[{ "filter": "age", values: ["between_21_and_30_years_old"] }]';
  const dataRequest = '["geolocation"]';
  const price = 10;
  const termsAndConditions =
    '0xd107c0801782889264da2e00ad0a19ba38435f84cbbf0689ed46b56a0ec7b4ea';
  const buyerURL =
    '{ "api": "http://buyer.com", "storage": "s3://key:secret@wibson-storage"}';
  const publicKey = 'pub key';

  const responsesPercentage = 30;
  const notarizationFee = 5;
  const notarizationTermsOfService = 'Sample TOS';

  beforeEach(async () => {
    dataOrder = await DataOrder.new(
      buyer,
      filters,
      dataRequest,
      price,
      termsAndConditions,
      buyerURL,
      publicKey,
      { from: owner },
    );
  });

  describe('#addNotary', () => {
    it('consumes the expected amount of gas', async () => {
      const estimation = await dataOrder.addNotary.estimateGas(
        notary,
        responsesPercentage,
        notarizationFee,
        notarizationTermsOfService,
        { from: owner },
      );

      assert(
        estimation <= expectedGas.addNotary,
        `addNotary must consume ${
          expectedGas.addNotary
        } or less gas (actual consumption: ${estimation})`,
      );
    });
  });

  describe('#addDataResponse', () => {
    beforeEach(async () => {
      await dataOrder.addNotary(
        notary,
        responsesPercentage,
        notarizationFee,
        notarizationTermsOfService,
        { from: owner },
      );
    });

    it('consumes the expected amount of gas', async () => {
      const dataHash =
        '9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d';
      const estimation = await dataOrder.addDataResponse.estimateGas(
        seller,
        notary,
        dataHash,
        { from: owner },
      );

      assert(
        estimation <= expectedGas.addDataResponse,
        `addDataResponse must consume ${
          expectedGas.addDataResponse
        } or less gas (actual consumption: ${estimation})`,
      );
    });
  });

  describe('#closeDataResponse', () => {
    beforeEach(async () => {
      await dataOrder.addNotary(
        notary,
        responsesPercentage,
        notarizationFee,
        notarizationTermsOfService,
        { from: owner },
      );

      const dataHash =
        '9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d';
      await dataOrder.addDataResponse(seller, notary, dataHash, {
        from: owner,
      });
    });

    it('consumes the expected amount of gas', async () => {
      const estimation = await dataOrder.closeDataResponse.estimateGas(
        seller,
        true,
        { from: owner },
      );

      assert(
        estimation <= expectedGas.closeDataResponse,
        `closeDataResponse must consume ${
          expectedGas.closeDataResponse
        } or less gas (actual consumption: ${estimation})`,
      );
    });

    it('consumes the expected amount of gas when transaction is not completed', async () => {
      const estimation = await dataOrder.closeDataResponse.estimateGas(
        seller,
        false,
        { from: owner },
      );

      assert(
        estimation <= expectedGas.closeDataResponse,
        `closeDataResponse must consume ${
          expectedGas.closeDataResponse
        } or less gas (actual consumption: ${estimation})`,
      );
    });
  });

  describe('#close', () => {
    beforeEach(async () => {
      await dataOrder.addNotary(
        notary,
        responsesPercentage,
        notarizationFee,
        notarizationTermsOfService,
        { from: owner },
      );

      const dataHash =
        '9eea36c42a56b62380d05f8430f3662e7720da6d5be3bdd1b20bb16e9d';
      await dataOrder.addDataResponse(seller, notary, dataHash, {
        from: owner,
      });

      await dataOrder.closeDataResponse(seller, true, { from: owner });
    });

    it('consumes the expected amount of gas', async () => {
      const estimation = await dataOrder.close.estimateGas({
        from: owner,
      });

      assert(
        estimation <= expectedGas.close,
        `close must consume ${
          expectedGas.close
        } or less gas (actual consumption: ${estimation})`,
      );
    });
  });
});
