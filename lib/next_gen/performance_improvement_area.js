const Filter = require('../filter')

const IMPROVEMENT_AREA_ID = 'improvement_area_id'
const SFDC_ID = 'sfdc_id'

class PerformanceImprovementArea extends Filter {
  constructor (name, id, sfdcId, summary) {
    super('Performance Improvement Area', name)
    this.addId(IMPROVEMENT_AREA_ID, id)
    this.addId(SFDC_ID, sfdcId)
    this.setSummary(summary)
  }
}

module.exports = PerformanceImprovementArea
