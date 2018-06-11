const _ = require('lodash')

var Transformer = {
  transform: (...filters) => {
    Transformer._exchangeIds(filters)
  },

  _exchangeIds: (filters) => {
    let validFilters = _.compact(filters)
    _.forEach(validFilters, (sourceFilter) => {
      if (_.isNil(sourceFilter)) return

      _.forEach(validFilters, (filter) => {
        if (sourceFilter === filter) return
        let idType = sourceFilter.primaryIdType()
        filter.addId(idType, sourceFilter.ids(idType))
      })
    })
  }
}

module.exports = Transformer
