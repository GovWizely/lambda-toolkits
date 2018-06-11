const _ = require('lodash')

const CoreExtractor = require('../core_extractor')
const IdFactory = require('../id_factory')
const JsforceUtil = require('../jsforce_util')
const Loader = require('../loader')
const Transformer = require('../transformer')

const CAPABILITY = 'Capability'
const PIA = 'Performance Improvement Area'
const PROVIDER = 'Provider'
const SOLUTION = 'Solution'

const CAPABILITY_ID = 'capability_id'
const PIA_ID = 'improvement_area_id'
const PROVIDER_ID = 'provider_id'
const SOLUTION_ID = 'solution_id'

class NextGenProcessor {
  constructor (programId) {
    this.programId = programId
    this.filterMapByType = {
      Capability: {},
      'Performance Improvement Area': {},
      Solution: {},
      Provider: {}
    }
    this.filters = []
    this.idFactory = new IdFactory(PIA_ID, CAPABILITY_ID, SOLUTION_ID, PROVIDER_ID)
  }

  process () {
    this.buildFilters()
      .then(() => Loader.load('next_gen', this._jsonFilters()))
  }

  buildFilters () {
    return new Promise((resolve) => {
      this._queryAssets(this.programId)
        .then((assets) => {
          let productIds = _.uniq(CoreExtractor.extractProductIds(assets))
          this._queryWebResources(productIds)
            .then((webResourcesByProductId) => {
              _.forEach(assets, (asset) => {
                let capability = this._buildCapability(asset)
                let product = this._buildProduct(asset)
                let provider = this._buildProvider(asset)
                _.forEach(webResourcesByProductId[asset.Product2.Id], (webResource) => {
                  let pia = this._buildPia(webResource)
                  Transformer.transform(pia, capability, product, provider)
                })
              })
              resolve(this.filterMapByType)
            })
        })
    })
  }

  _queryAssets () {
    return JsforceUtil.queryAssets(this.programId)
  }

  _queryWebResources (productIds) {
    return new Promise((resolve) => {
      this._queryRelatedResources(productIds)
        .then((relatedResources) => {
          let webResourcesByProductId = {}
          _.forEach(relatedResources, (relatedResource) => {
            if (_.isNil(relatedResource.Primary_Web_Resource__r)) return

            let webResources = webResourcesByProductId[relatedResource.Product__c]
            if (_.isNil(webResources)) webResources = []

            webResources.push(relatedResource.Primary_Web_Resource__r)
            webResourcesByProductId[relatedResource.Product__c] = _.uniqBy(webResources, 'Id')
          })
          resolve(webResourcesByProductId)
        })
    })
  }

  _queryRelatedResources (productIds) {
    return JsforceUtil.queryRelatedResources(productIds)
  }

  _buildCapability (asset) {
    let params = this._buildExtractParams(CAPABILITY, CAPABILITY_ID, asset)
    params.productAttributeName = 'Class__c'
    return CoreExtractor.extractProductAttribute(params)
  }

  _buildPia (webResource) {
    let params = this._buildExtractParams(PIA, PIA_ID, webResource)
    return CoreExtractor.extractWebResource(params)
  }

  _buildProduct (asset) {
    let params = this._buildExtractParams(SOLUTION, SOLUTION_ID, asset)
    return CoreExtractor.extractProduct(params)
  }

  _buildProvider (asset) {
    let params = this._buildExtractParams(PROVIDER, PROVIDER_ID, asset)
    return CoreExtractor.extractProvider(params)
  }

  _buildExtractParams (type, idType, sfdcObject) {
    return {
      filterMapByType: this.filterMapByType,
      idFactory: this.idFactory,
      sfdcObject: sfdcObject,
      type: type,
      idType: idType
    }
  }

  _jsonFilters () {
    return _.flatten(_.map(_.values(this.filterMapByType), (values) => {
      return _.map(values, (filter) => {
        return filter.asJson()
      })
    }))
  }
}

module.exports = NextGenProcessor
