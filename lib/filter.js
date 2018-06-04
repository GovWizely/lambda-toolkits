const _ = require('lodash')

class Filter {
  constructor (type, name) {
    this.attributes = {
      type: type,
      name: name,
      sfdc_id: []
    }
    this.links = []
    this.relatedFilters = {}
  }

  name () {
    return this.attributes.name
  }

  addId (idFieldName, id) {
    let ids = this.attributes[idFieldName]
    if (_.isNil(ids)) ids = []
    ids.push(id)
    this.attributes[idFieldName] = _.sortedUniq(_.compact(_.flatten(ids)))
  }

  getIds (idFieldName) {
    if (!_.includes(_.keys(this.attributes), idFieldName)) {
      let errorMessage = `missing idFieldName ${idFieldName}`
      console.error(errorMessage)
      throw errorMessage
    }
    return this.attributes[idFieldName]
  }

  addRelatedFilterName (filterType, filterName) {
    if (_.isUndefined(this.relatedFilters[filterType])) this.relatedFilters[filterType] = []
    this.relatedFilters[filterType].push(filterName)
    this.relatedFilters[filterType] = _.sortedUniq(this.relatedFilters[filterType])
  }

  addLink (displayName, url) {
    this.links.push({ display_name: displayName, url: url })
  }

  asJson () {
    return Object.assign(this.attributes, { links: this.links })
  }
}

module.exports = Filter
