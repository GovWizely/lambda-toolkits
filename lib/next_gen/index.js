const _ = require('lodash')

const JsforceUtil = require('../jsforce_util')
const CoreExtractor = require('../core_extractor')
const Endpointme = require('../endpointme')
const Loader = require('../loader')

const CAPABILITY_ID = 'capability_id'
const PERFORMANCE_IMPROVEMENT_AREA_ID = 'improvement_area_id'
const PROVIDER_ID = 'provider_id'
const SOLUTION_ID = 'solution_id'

var NG = {
  Extractor: require('./extractor'),

  migrate: (programId) => {
    JsforceUtil.queryAssets(programId)
      .then((assets) => {
        let productIds = CoreExtractor.extractProductIds(assets)
        JsforceUtil.queryRelatedResources(productIds)
          .then((relatedResources) => {
            let idCounters = {
              CapabilityId: 0,
              PerformanceImprovementAreaId: 0,
              ProviderId: 0,
              SolutionId: 0
            }
            let relatedResourcesByProductSfdcId = _.keyBy(relatedResources, 'Product__c')
            let filterMapByType = {
              Capability: {},
              PerformanceImprovementArea: {},
              Provider: {},
              Solution: {}
            }

            _.forEach(assets, (asset) => {
              let sfdcRelatedResource = relatedResourcesByProductSfdcId[asset.Product2.Id]

              let solution = NG.Extractor.extractSolution(filterMapByType, idCounters, asset)
              let provider = CoreExtractor.extractProvider(filterMapByType, idCounters, asset)
              let capability = NG.Extractor.extractCapability(filterMapByType, idCounters, asset)
              let pia = NG.Extractor.extractPIA(filterMapByType, idCounters, sfdcRelatedResource)

              if (provider) {
                solution.addId(PROVIDER_ID, provider.ids(PROVIDER_ID))
                if (capability) capability.addId(PROVIDER_ID, provider.ids(PROVIDER_ID))
                if (pia) pia.addId(PROVIDER_ID, provider.ids(PROVIDER_ID))
                provider.addId(SOLUTION_ID, solution.ids(SOLUTION_ID))
              }

              if (capability) {
                solution.addId(CAPABILITY_ID, capability.ids(CAPABILITY_ID))
                if (provider) provider.addId(CAPABILITY_ID, capability.ids(CAPABILITY_ID))
                if (pia) pia.addId(CAPABILITY_ID, capability.ids(CAPABILITY_ID))
                capability.addId(SOLUTION_ID, solution.ids(SOLUTION_ID))
              }

              if (pia) {
                solution.addId(PERFORMANCE_IMPROVEMENT_AREA_ID, pia.ids(PERFORMANCE_IMPROVEMENT_AREA_ID))
                if (provider) provider.addId(PERFORMANCE_IMPROVEMENT_AREA_ID, pia.ids(PERFORMANCE_IMPROVEMENT_AREA_ID))
                if (capability) capability.addId(PERFORMANCE_IMPROVEMENT_AREA_ID, pia.ids(PERFORMANCE_IMPROVEMENT_AREA_ID))
                pia.addId(SOLUTION_ID, solution.ids(SOLUTION_ID))
              }

              console.log(`solution: ${JSON.stringify(solution.asJson(), null, 2)}`)
              if (provider) console.log(`provider: ${JSON.stringify(provider.asJson(), null, 2)}`)
              console.log(`capability: ${JSON.stringify(capability.asJson(), null, 2)}`)
              console.log(`PerformanceImprovementArea: ${JSON.stringify(pia.asJson(), null, 2)}`)
            })

            let data = _.flatten(_.map(_.values(filterMapByType), (values) => {
              return _.map(values, (filter) => {
                return filter.asJson()
              })
            }))

            Loader.loadToFs('dev_next_gen.json', data)
            // Loader.loadToS3Bucket('next_gen.json', data)
            //   .then(() => Loader.loadToFs('next_gen.json', data))
              .then(() => Endpointme.freshen(('next_gen')))
              .catch((err) => {
                console.error(`NextGen Error: ${JSON.stringify(err)}`)
              })
          })
      })
  }
}

module.exports = NG
