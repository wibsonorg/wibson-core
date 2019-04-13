const { buildDataOrder } = require('./helpers');

const calls = [
  ['registerNotary', 'Notary URL'],
  ['updateNotaryUrl', 'New Notary URL'],
  ['unregisterNotary'],
  ['createDataOrder', ...buildDataOrder()],
  ['closeDataOrder', 0],
];

async function doStuff() {
  const from = web3.eth.accounts[0] || (await web3.eth.getAccounts())[0];
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
  return (`
  Contract: DataExchange
  \tMethod ___________________ Gas${benchmarks.join('')}
  `);
}

// eslint-disable-next-line no-console
module.exports = done => doStuff().then(console.log).catch(console.log).then(done);
