const _ = require('lodash')

const Filter = require('../filter')
const PerformanceImprovementArea = require('./performance_improvement_area')

const SFDC_ID = 'sfdc_id'

var Extractor = {
  extractProduct: (filterMapByType, idFactory, asset) => {
  },

  extractSolution: (filterMapByType, idCounters, asset) => {
    let sfdcProduct = asset.Product2
    let name = sfdcProduct.Name
    let solution = filterMapByType.Solution[name]
    if (_.isNil(solution)) {
      let id = ++idCounters.SolutionId
      solution = new Filter('Solution', name)
      solution.addId('solution_id', id)
      filterMapByType.Solution[solution.name()] = solution
    }
    solution.addId(SFDC_ID, sfdcProduct.Id)
    return solution
  },

  extractCapability: (filterMapByType, idCounters, asset) => {
    let name = asset.Product2.Class__c
    let capability = filterMapByType.Capability[name]
    if (_.isNil(capability)) {
      let id = ++idCounters.CapabilityId
      capability = new Filter('Capability', name)
      capability.addId('capability_id', id)
      filterMapByType.Capability[capability.name()] = capability
    }
    return capability
  },

  extractPIA: (filterMapByType, idCounters, relatedResource) => {
    let primaryWebResource = relatedResource.Primary_Web_Resource__r
    let sfdcId = primaryWebResource.Id
    let name = primaryWebResource.Name
    let pia = filterMapByType.PerformanceImprovementArea[sfdcId]
    if (_.isNil(pia)) {
      let id = ++idCounters.PerformanceImprovementAreaId
      pia = new PerformanceImprovementArea(name, id, sfdcId, primaryWebResource.Summary__c)
      pia.addId(SFDC_ID, sfdcId)
      filterMapByType.PerformanceImprovementArea[sfdcId] = pia
    }
    return pia
  }
}

module.exports = Extractor
