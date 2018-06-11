const Product = require('../product')

class Solution extends Product {
  constructor (name, id) {
    super('Solution', name)
    this.addId('solution_id', id)
  }
}

module.exports = Solution
