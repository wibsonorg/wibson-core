const { buildDataOrder } = require('./helpers');

const calls = [
  ['registerNotary', 'Notary URL'],
  ['updateNotaryUrl', 'New Notary URL'],
  ['unregisterNotary'],
  ['createDataOrder', ...buildDataOrder()],
  ['closeDataOrder', 0],
];

module.exports = async () => {
  const [from] = web3.eth.accounts || await web3.eth.getAccounts();
  const DataExchange = await artifacts.require('DataExchange').deployed();
  const benchmarks = [];
  // eslint-disable-next-line no-restricted-syntax
  for (const [method, ...args] of calls) {
    // eslint-disable-next-line no-await-in-loop
    const tx = await DataExchange[method](...args, { from });
    const [title, gas] = [
      (`${method}() `).padEnd(20, '_'),
      (` ${tx.receipt.gasUsed}`).toString().padStart(10, '_'),
    ];
    benchmarks.push(`\n\t${title}${gas}`);
  }
  // eslint-disable-next-line no-console
  console.log(`
  Contract: DataExchange
  \tMethod ___________________ Gas${benchmarks.join('')}
  `);
};
