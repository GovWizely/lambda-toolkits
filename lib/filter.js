const _ = require('lodash')

class Filter {
  constructor (type, primaryIdType, name) {
    this._primaryIdType = primaryIdType
    this._attributes = {
      type: type,
      name: name,
      sfdc_id: [],
      summary: null
    }
    this._links = []
    this._relatedFilterNamesByType = {}
  }

  type () {
    return this._attributes.type
  }

  primaryIdType () {
    return this._primaryIdType
  }

  name () {
    return this._attributes.name
  }

  summary () {
    return this._attributes.summary
  }

  setSummary (summary) {
    this._attributes.summary = summary
  }

  addId (idFieldName, id) {
    let ids = this._attributes[idFieldName]
    if (_.isNil(ids)) ids = []
    ids.push(id)
    this._attributes[idFieldName] = _.sortBy(_.uniq(_.compact(_.flatten(ids))))
  }

  ids (idFieldName) {
    if (!_.includes(_.keys(this._attributes), idFieldName)) {
      let errorMessage = `missing idFieldName ${idFieldName}`
      console.error(errorMessage)
      throw errorMessage
    }
    return this._attributes[idFieldName]
  }

  addRelatedFilterName (filterType, filterName) {
    let relatedFilterNames = this._relatedFilterNamesByType[filterType]
    if (_.isNil(relatedFilterNames)) relatedFilterNames = []
    relatedFilterNames.push(filterName)
    this._relatedFilterNamesByType[filterType] = _.sortBy(_.uniq(_.compact(relatedFilterNames)))
  }

  getRelatedFilterNames (filterType) {
    return this._relatedFilterNamesByType[filterType]
  }

  links () {
    return this._links
  }

  addLink (displayName, url) {
    this._links.push({ display_name: displayName, url: url })
  }

  asJson () {
    return Object.assign(this._attributes, { links: this._links })
  }
}

module.exports = Filter
