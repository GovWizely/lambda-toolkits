'use strict'

const _ = require('lodash')
const jsforceUtil = require('../jsforce_util')

const Filter = require('../filter')

var ES = {
  migrate: () => {
    jsforceUtil.getProducts('a31t0000000CyD6', 'solution_id')
      .then(products => ES._buildSolutions(products))
  },

  _buildSolutions: (products) => {
    return new Promise((resolve) => {
      var index = 0
      var solutions = _.map(products, (product) => {
        var solution = new Filter('Solution', product.Name)
        solution.addId('solution_id', ++index)
        return solution
      })
      resolve(solutions)
    })
  }
}

module.exports = ES
