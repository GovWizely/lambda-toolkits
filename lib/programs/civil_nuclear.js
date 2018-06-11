'use strict'

const _ = require('lodash')
const jsforceUtil = require('../jsforce_util')
const request = require('request')

const Filter = require('../filter')
const Loader = require('../loader')

const SECTOR = 'Sector'
const SUB_SECTOR = 'Sub-Sector'

const PRODUCT_ID = 'product_id'
const PROVIDER_ID = 'provider_id'
const SECTOR_ID = 'sector_id'
const SFDC_ID = 'sfdc_id'
const SUB_SECTOR_ID = 'sub_sector_id'

const PROVIDER_URL = 'https://www.export.gov/provider'

var CN = {
  migrate: () => {
    jsforceUtil.queryAssets('a31t0000000CyDB')
      .then((assets) => {
        jsforceUtil.getProducts(assets, {})
          .then(sfdcObjects => jsforceUtil.getProviders(assets, sfdcObjects))
          .then(sfdcObjects => CN._buildFilters(sfdcObjects))
          .then((filterMapByType) => {
            _.forEach(filterMapByType, (filters, _type) => {
              console.log(`type: ${_type}`)
              _.forEach(filters, (filter) => {
                console.log(JSON.stringify(filter.asJson()))
              })
            })
            return filterMapByType
          })
          .then((filterMapByType) => {
            let data = _.map(_.flatten(_.values(filterMapByType)), (filter) => {
              return filter.asJson()
            })
            return data
          })
          .then((data) => {
            Loader.loadToS3Bucket('civil_nuclear.json', data)
              .then(() => Loader.loadToFs('civil_nuclear.json', data))
              .then(() => CN._freshenEndpoint())
              .catch(function (error) {
                console.error(error)
              })

            // .then(() => {}, (error) => { console.error(error) })
          })
      })
  },

  _buildFilters: (sfdcObjects) => {
    console.log(`sfdcProducts: ${sfdcObjects.Product.length}`)

    return new Promise((resolve) => {
      CN._buildProducts(sfdcObjects, {})
        .then(filterMapByType => CN._buildProviders(sfdcObjects, filterMapByType))
        .then(filterMapByType => CN._buildRelatedFilters(filterMapByType))
        .then((filterMapByType) => resolve(filterMapByType))
    })
  },

  _buildProducts: (sfdcObjects, filterMapByType) => {
    return new Promise((resolve) => {
      console.log('buildProducts')
      let index = 0
      let products = _.map(sfdcObjects.Product, (sfdcProduct) => {
        // console.log(sfdcProduct)
        let product = new Filter('Product', sfdcProduct.Name)
        product.addId(PRODUCT_ID, ++index)
        product.addId(SFDC_ID, sfdcProduct.Id)
        product.relatedParticipantIds = sfdcProduct.relatedParticipantIds
        product.addId(SECTOR_ID, null)
        product.addId(SUB_SECTOR_ID, null)
        if (!_.isNil(sfdcProduct.Class__c)) {
          product.addRelatedFilterName('Sector', sfdcProduct.Class__c)
        }

        if (!_.isNil(sfdcProduct.Category__c)) {
          product.addRelatedFilterName('Sub-Sector', sfdcProduct.Category__c)
        }

        return product
      })
      filterMapByType.Product = products
      console.log('done buildProducts')
      resolve(filterMapByType)
    })
  },

  _buildProviders: (sfdcObjects, filterMapByType) => {
    return new Promise((resolve) => {
      console.log('buildProviders')
      let providerMap = {}
      let index = 0
      let providers = _.map(sfdcObjects.Provider, (sfdcProvider) => {
        let provider = new Filter('Provider', sfdcProvider.Name)
        provider.addId(PROVIDER_ID, ++index)
        provider.addId(SFDC_ID, sfdcProvider.Id)
        provider.addId(PRODUCT_ID, null)
        provider.addId(SECTOR_ID, null)
        provider.addId(SUB_SECTOR_ID, null)
        provider.addLink(sfdcProvider.Name, `${PROVIDER_URL}?id=${sfdcProvider.Id}`)
        providerMap[sfdcProvider.Id] = provider
        return provider
      })

      _.forEach(filterMapByType.Product, (product) => {
        _.forEach(product.relatedParticipantIds, (participantId) => {
          let provider = providerMap[participantId]
          product.addId(PROVIDER_ID, provider.ids(PROVIDER_ID))
          provider.addId(PRODUCT_ID, product.ids(PRODUCT_ID))
        })
      })
      filterMapByType.Provider = providers
      console.log('done buildProviders')
      resolve(filterMapByType)
    })
  },

  _buildRelatedFilters: (filterMapByType) => {
    return new Promise((resolve) => {
      console.log('buildRelatedFilters')
      CN._buildSectors(filterMapByType)
        .then(CN._buildSubSectors(filterMapByType))
        .then(CN._updateRelatedFilterIds(filterMapByType))
        .then(resolve(filterMapByType))
    })
  },

  _buildSectors: (filterMapByType) => {
    console.log('building sectors')
    return new Promise((resolve) => {
      let sectorNames = _.map(filterMapByType.Product, (product) => {
        return product.getRelatedFilterNames(SECTOR)
      })
      sectorNames = _.uniq(_.compact(_.flatten(sectorNames))).sort()

      let sectorMap = {}
      let index = 0
      _.forEach(sectorNames, (sectorName) => {
        let sector = new Filter('Sector', sectorName)
        sector.addId(SECTOR_ID, ++index)
        sectorMap[sectorName] = sector
      })

      _.forEach(filterMapByType.Product, (product) => {
        _.forEach(product.getRelatedFilterNames(SECTOR), (sectorName) => {
          let sector = sectorMap[sectorName]
          product.addId(SECTOR_ID, sector.ids(SECTOR_ID))
          sector.addId(PRODUCT_ID, product.ids(PRODUCT_ID))
        })
      })
      let sectors = _.values(sectorMap)
      filterMapByType.Sector = sectors
      resolve(filterMapByType)
    })
  },

  _buildSubSectors: (filterMapByType) => {
    let subSectorMap = {}
    let index = 0
    _.forEach(filterMapByType.Product, (product) => {
      _.forEach(product.getRelatedFilterNames(SUB_SECTOR), (sectorName) => {
        let subSector = subSectorMap[sectorName]
        let subSectorId = null
        if (_.isNil(subSector)) {
          subSector = new Filter('Sub-Sector', sectorName)
          subSectorId = ++index
          subSector.addId(SUB_SECTOR_ID, subSectorId)
        } else {
          subSectorId = subSector.ids(SUB_SECTOR_ID)
        }
        product.addId(SUB_SECTOR_ID, subSectorId)
        subSector.addId(PRODUCT_ID, product.ids(PRODUCT_ID))

        subSectorMap[sectorName] = subSector
      })
    })
    let subSectors = _.values(subSectorMap)
    filterMapByType['Sub-Sector'] = subSectors
    return subSectors
  },

  _updateRelatedFilterIds: (filterMapByType) => {
    console.log('updating related filter IDs')
    let productMap = {}
    _.forEach(filterMapByType.Product, (product) => {
      console.log(JSON.stringify(product))
      productMap[product.ids(PRODUCT_ID)[0]] = product
    })

    _.forEach(filterMapByType.Provider, (provider) => {
      _.forEach(provider.ids(PRODUCT_ID), (productId) => {
        let product = productMap[productId]
        provider.addId(SECTOR_ID, product.ids(SECTOR_ID))
        provider.addId(SUB_SECTOR_ID, product.ids(SUB_SECTOR_ID))
      })
    })

    _.forEach(filterMapByType.Sector, (sector) => {
      _.forEach(sector.ids(PRODUCT_ID), (productId) => {
        let product = productMap[productId]
        sector.addId(PROVIDER_ID, product.ids(PROVIDER_ID))
        sector.addId(SUB_SECTOR_ID, product.ids(SUB_SECTOR_ID))
      })
    })

    _.forEach(filterMapByType['Sub-Sector'], (subSector) => {
      _.forEach(subSector.ids(PRODUCT_ID), (productId) => {
        let product = productMap[productId]
        subSector.addId(PROVIDER_ID, product.ids(PROVIDER_ID))
        subSector.addId(SECTOR_ID, product.ids(SECTOR_ID))
      })
    })
  },

  _freshenEndpoint: () => {
    return new Promise((resolve, reject) => {
      let freshenUrl = `https://api.trade.gov/v1/civil_nuclear/freshen.json?api_key=${process.env.API_KEY}`
      request(freshenUrl, (err, res) => {
        if (res.statusCode !== 200) {
          console.error('An error occurred while freshening the endpoint.')
          reject(err)
        } else {
          console.log(`Endpoint successfully updated: ${freshenUrl}`)
          resolve(res)
        }
      })
    })
  }
}

module.exports = CN
