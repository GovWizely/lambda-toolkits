'use strict'

const CivilNuclearProcessor = require('./lib/processors/civil_nuclear_processor')
const NextGenProcessor = require('./lib/processors/next_gen_processor')

module.exports = {
  handler: () => {
    new NextGenProcessor('a31t0000000CyDG').process()
    new CivilNuclearProcessor('a31t0000000CyDB').process()
  }
}
