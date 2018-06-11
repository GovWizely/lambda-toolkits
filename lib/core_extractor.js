const _ = require('lodash')

const Filter = require('./filter')

const PROVIDER_URL = 'https://www.export.gov/provider'
const SFDC_ID = 'sfdc_id'

var CoreExtractor = {
  extractProduct: (params) => {
    let sfdcProduct = params.sfdcObject.Product2
    let name = sfdcProduct.Name
    let filter = params.filterMapByType[params.type][name]
    if (_.isNil(filter)) {
      let id = params.idFactory.next(params.idType)
      filter = new Filter(params.type, params.idType, name)
      filter.addId(params.idType, id)
      params.filterMapByType[params.type][name] = filter
    }
    filter.addId(SFDC_ID, sfdcProduct.Id)
    return filter
  },

  extractProvider: (params) => {
    if (_.isNil(params.sfdcObject.Participant__r)) return

    let sfdcParticipant = params.sfdcObject.Participant__r
    let name = sfdcParticipant.Name
    let sfdcId = sfdcParticipant.Id
    let filter = params.filterMapByType[params.type][sfdcId]
    if (_.isNil(filter)) {
      let id = params.idFactory.next(params.idType)
      filter = new Filter(params.type, params.idType, name)
      filter.addId(params.idType, id)
      filter.addLink(sfdcParticipant.Name, `${PROVIDER_URL}?id=${sfdcParticipant.Id}`)
      params.filterMapByType[params.type][sfdcId] = filter
    }
    filter.addId(SFDC_ID, sfdcId)
    return filter
  },

  extractProductAttribute: (params) => {
    let sfdcProduct = params.sfdcObject.Product2
    let name = sfdcProduct[params.productAttributeName]

    if (!_.isNil(name)) {
      let filter = params.filterMapByType[params.type][name]
      if (_.isNil(filter)) {
        let id = params.idFactory.next(params.idType)
        filter = new Filter(params.type, params.idType, name)
        filter.addId(params.idType, id)
        params.filterMapByType[params.type][name] = filter
      }
      return filter
    }
  },

  extractWebResource: (params) => {
    let webResource = params.sfdcObject
    let name = webResource.Name
    let sfdcId = webResource.Id

    let filter = params.filterMapByType[params.type][sfdcId]
    if (_.isNil(filter)) {
      let id = params.idFactory.next(params.idType)
      filter = new Filter(params.type, params.idType, name)
      filter.addId(params.idType, id)
      filter.setSummary(webResource.Summary__c)
      params.filterMapByType[params.type][sfdcId] = filter
    }
    return filter
  },

  extractProductIds: (assets) => {
    let productIds = _.map(assets, (asset) => {
      return asset.Product2.Id
    })
    return _.uniq(productIds)
  }
}

module.exports = CoreExtractor
