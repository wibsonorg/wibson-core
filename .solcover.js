module.exports = {
  norpc: true,
  compileCommand: '../node_modules/.bin/truffle compile  --network coverage',
  testCommand: '../node_modules/.bin/truffle test  --network coverage',
  copyPackages: [
    'zeppelin-solidity'
  ]
}
