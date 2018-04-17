var _ = require('lodash')
var Promise = require('bluebird')

module.exports = {

  // See: https://ethereum.stackexchange.com/a/21661
  assertEvent: function (contract, filter) {
    return new Promise((resolve, reject) => {
      var event = contract[filter.event]()
      event.watch()
      event.get((error, logs) => {
        var log = _.filter(logs, filter)
        if (!_.isEmpty(log)) {
          resolve(log)
        } else {
          console.log('Failed to find filtered event for ' + filter.event)
        }
      })
      event.stopWatching()
    })
  }

}
