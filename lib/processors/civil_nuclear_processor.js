const _ = require('lodash')

const CoreExtractor = require('../core_extractor')
const IdFactory = require('../id_factory')
const JsforceUtil = require('../jsforce_util')
const Loader = require('../loader')
const Transformer = require('../transformer')

const PRODUCT = 'Product'
const PROVIDER = 'Provider'
const SECTOR = 'Sector'
const SUB_SECTOR = 'Sub-Sector'

const PRODUCT_ID = 'product_id'
const PROVIDER_ID = 'provider_id'
const SECTOR_ID = 'sector_id'
const SUB_SECTOR_ID = 'sub_sector_id'

class CivilNuclearProcessor {
  constructor (programId) {
    this.programId = programId
    this.filterMapByType = {
      Sector: {},
      'Sub-Sector': {},
      Product: {},
      Provider: {}
    }
    this.filters = []
    this.idFactory = new IdFactory(PRODUCT_ID, PROVIDER_ID, SECTOR_ID, SUB_SECTOR_ID)
  }

  process () {
    this.buildFilters()
      .then(() => Loader.load('civil_nuclear', this._jsonFilters()))
  }

  buildFilters () {
    return this._queryAssets(this.programId)
      .then((assets) => {
        _.forEach(assets, (asset) => {
          let product = this._buildProduct(asset)
          let provider = this._buildProvider(asset)
          let sector = this._buildSector(asset)
          let subSector = this._buildSubSector(asset)
          Transformer.transform(product, provider, sector, subSector)
        })
        return this.filterMapByType
      })
  }

  _queryAssets () {
    return JsforceUtil.queryAssets(this.programId)
  }

  _buildProduct (asset) {
    let params = this._buildExtractParams(PRODUCT, PRODUCT_ID, asset)
    return CoreExtractor.extractProduct(params)
  }

  _buildProvider (asset) {
    let params = this._buildExtractParams(PROVIDER, PROVIDER_ID, asset)
    return CoreExtractor.extractProvider(params)
  }

  _buildSector (asset) {
    let params = this._buildExtractParams(SECTOR, SECTOR_ID, asset)
    params.productAttributeName = 'Class__c'
    return CoreExtractor.extractProductAttribute(params)
  }

  _buildSubSector (asset) {
    let params = this._buildExtractParams(SUB_SECTOR, SUB_SECTOR_ID, asset)
    params.productAttributeName = 'Category__c'
    return CoreExtractor.extractProductAttribute(params)
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

module.exports = CivilNuclearProcessor
