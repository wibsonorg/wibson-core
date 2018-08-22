import createDataOrder from './helpers/dataOrderCreation';
import { assertRevert } from '../helpers';

contract('DataOrder', async (accounts) => {
  const owner = accounts[0];
  const buyer = accounts[4];

  const buyerLongUrl = () =>
    [
      'https://buyr.co/dat/eylhqusnlzhjmwngsoiikgbymcodwfctlvxmigmd',
      'rjknuinutuvdjzhdyixexvkfjyqntxxfuyghdncgfxezmqtmitbpzugyqhgw',
      'khunprrdktlgjtioazctzjosrxsmhgyomdfxwtxvfiorcrwpfokabowxdbxz',
      'dnxhjglcuxxwrgmspqfktellzgjjsqcovlsrlxwpbsbbjdzgbnurtsjvkofd',
      'ptrgygjpjmginrfckoszxvwpiqakdxkosumedoidlwenlmovctsnugdpvqcm',
      'hkiqwzqyzghrdcofooolpfcbpzlbgqognbuwkngmwysvatygczvfggekijxm',
      'fehzcndcaanlgwlzsghvwropkaynjovmdgvwhjrnfwvbyfjgmzlskqkauzua',
      'lgmpmtqsfbyijvgoouaizvhgsxodlhtlrjafxdgdenijvvyixgggtggnqkfy',
      'hgplyvffyozytnertfjhzpnapbpptdbmjcrzqnmbhwbxcunpprfginzczgxd',
      'zujwlsgsukovhodflcvotxwlyrkzlkryxvxicblapycqldymrqtmlcqvhagu',
      'lnfatztanyosyotrqzvqmkdubaalveowmeflejkyqwexddacopxryerqrrnr',
      'vsczeesmgtzvkqkcdwoolzxtwaxqvyzrdstxmopkbswopuyyjedthaxzrpop',
      'jcfvahlvqfcojsotcoqfcmpssloymskcpcfaxjlbemcflvhlbmrocomlganc',
      'biojhkldvltdaznmmnijwlgvxvlhwjnykzfmteqecegrlunawqljigenznnd',
      'xqrzvhgshjnkwcwynufnlqxkseksviskqyxuxtqctzpnylngamuxyzyjmxha',
      'qcvuhbawqcjflgusughjruquqwkedfdqsdgazwymvwiefwgutbbbgcsdapsu',
      'achrrhckaysobkzckzctaznqwobkkbizojbqmmwkagdbjvuudkmbcaygrnnc',
      'ccbkxgajqcmosisrhhfvnfvbjakxdmnvpmfyivzwpfsbkuttfitlfebmotbn',
      'ngyvcojbnvfktqpkcfgboajyqbyqvlupvpqunedgftmmhdcmxflgbpafkdew',
      'qdceltukbqtgnlbwtcvkpgpmghqlizxnirxqxtysbvzondjczovoklwwdrle',
      'ujkllzzbffpstyragoblwreyjlxjbzfekkiudguoixrhkxxomlafuarssbwf',
      'czqkkcliiusjeuhwwytvytpgqreykpefownjceqxaljlcpmonetwmzscovgt',
      'jukybiazrpbkaxktfanzmadelgrorqijjsoyabboayinjmfsvzepryfjlich',
      'uzjecggftuvsyycvvxlrmlhtnupeaisjfltaddnzfsccddcmltzcpovojysx',
      'tfijyyqktwhgqtzegxgqeinnybbxfcgkxkzdzbzqbdfsgnkcysquetjegyza',
      'qexhcfbsnkqxgxbtzxcjpiwgqysusumyppykdcyzfjpaxkryorlabdmtohuf',
      'krvlzuogxmqrujjnrmhspbgrykjvuxlzqilyxhroplppgudodmppagxaxpht',
      'xxalkwgbivkzcsxydekgabjmfmluvsxlmjdslrmmqdbywsgfnhvdxzyblzzb',
      'ascqozfulserpbxlsegrhlribvwkubkyzsbggkyonouiczjfhozmtemtuast',
      'binsuyaxsbwmjvatufgbsekmzacpgveikichjfynthqgldpqttcyckdzsrev',
      'moqwggxycdejszfrjvgxdvsuhmdyprnmebgvgfclxdgfqaiyacazstogytyz',
      'rbmgnhdwrlfoselanushcfztpkptfyucdadrdosqhnbvkccbpktnekeaeila',
      'kheozchodqrdohstaezboojaagxndsxvqwrbygtccwczjczjnvgucrqghkhm',
    ].join('');

  describe('Constructor', () => {
    it('creates a DataOrder', async () => {
      const dataOrder = await createDataOrder({ buyer, from: owner });
      assert(dataOrder, 'DataOrder was not created properly');
    });

    it('can not create a DataOrder with Zero Address as Buyer', async () => {
      try {
        await createDataOrder({ buyer: '0x0', from: owner });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('can not create a DataOrder with an empty Buyer URL', async () => {
      try {
        await createDataOrder({ buyer, buyerUrl: '', from: owner });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    // This test is for documentation purposes.
    // The string `buyerUrl` is not limited in length, so anyone can submit
    // an URL the size they want, but the longer the string the more expensive
    // the transaction (640 units of gas per byte aprox.).
    it('creates a DataOrder with a huge Buyer URL', async () => {
      const dataOrder = await createDataOrder({
        buyer,
        buyerUrl: buyerLongUrl(),
        from: owner,
      });
      assert(dataOrder, 'DataOrder was not created properly');
    });

    it('can not create a DataOrder with an empty Buyer Public Key', async () => {
      try {
        await createDataOrder({ buyer, buyerPublicKey: '', from: owner });
        assert.fail();
      } catch (error) {
        assertRevert(error);
      }
    });

    it('creates a DataOrder with the Sender as Buyer', async () => {
      const dataOrder = await createDataOrder({ buyer: owner, from: owner });
      assert(dataOrder, 'The buyer can be the sender of the transaction');
    });

    it('creates a DataOrder with zero Price', async () => {
      const dataOrder = await createDataOrder({ buyer, price: 0, from: owner });
      assert(dataOrder, 'The price can be zero');
    });

    it('creates a DataOrder with empty Filters', async () => {
      const dataOrder = await createDataOrder({ buyer, filters: '', from: owner });
      assert(dataOrder, 'Filters can be empty');
    });

    it('creates a DataOrder with empty Data Request', async () => {
      const dataOrder = await createDataOrder({ buyer, dataRequest: '', from: owner });
      assert(dataOrder, 'Data Request can be empty');
    });

    it('creates a DataOrder with empty Terms and Conditions', async () => {
      const dataOrder = await createDataOrder({ buyer, termsAndConditions: '', from: owner });
      assert(dataOrder, 'Terms and Conditions can be empty');
    });
  });
});
