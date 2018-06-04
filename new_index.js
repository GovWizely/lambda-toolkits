'use strict'

const Programs = require('./lib/programs')

module.exports = {
  handler: () => {
    Programs.CN.migrate()
  }
}
