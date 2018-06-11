const Filter = require('./filter')

const PROVIDER_URL = 'https://www.export.gov/provider'

class Provider extends Filter {
  constructor (name, id, sfdcId, displayName) {
    super('Provider', name)
    this.addId('provider_id', id)
    this.addId('sfdc_id', sfdcId)
    this.addLink(displayName, `${PROVIDER_URL}?id=${sfdcId}`)
  }
}

module.exports = Provider
