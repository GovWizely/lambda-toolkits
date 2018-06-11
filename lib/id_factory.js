const _ = require('lodash')

class IdFactory {
  constructor (...types) {
    this.ids = {}
    _.forEach(types, (type) => {
      this.ids[type] = 0
    })
  }

  next (idType) {
    return ++this.ids[idType]
  }
}

module.exports = IdFactory
