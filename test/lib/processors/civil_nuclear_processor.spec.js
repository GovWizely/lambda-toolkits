const _ = require('lodash')
const expect = require('chai').expect
const sinon = require('sinon')
const helper = require('../../spec_helper')

describe('CivilNuclearProcessor', function () {
  describe('.buildFilters()', function () {
    context('when multiple asset.Product2 with the same Name are present', function () {
      let assets, processor

      beforeEach(function () {
        assets = [
          {
            Product2: {
              Id: 'sfdc_product_1',
              Name: 'Product Name',
              Class__c: 'Product class 1',
              Category__c: 'Product category 1'
            },
            Participant__r: {
              Id: 'sfdc_participant_1',
              Name: 'Same Name Different ID'
            }
          },
          {
            Product2: {
              Id: 'sfdc_product_2',
              Name: 'Product Name',
              Class__c: 'Product class 2'
            },
            Participant__r: {
              Id: 'sfdc_participant_2',
              Name: 'Same Name Different ID'
            }
          }
        ]

        processor = new helper.CivilNuclearProcessor('sfdc_program_1')

        sinon.stub(processor, '_queryAssets')
          .returns(Promise.resolve(assets))
      })

      it('returns a Product filter with multiple sfdc_id', function () {
        return new Promise(function (resolve, reject) {
          processor.buildFilters()
            .then((filterMapByType) => {
              let products = _.values(filterMapByType.Product)
              expect(products).to.have.length(1)

              let product = products[0]
              expect(product.name()).to.equal('Product Name')
              expect(product.ids('sfdc_id')).to.have.members(['sfdc_product_1', 'sfdc_product_2'])
              expect(product.ids('product_id')).to.have.members([1])
              expect(product.ids('provider_id')).to.have.members([1, 2])
              expect(product.ids('sector_id')).to.have.members([1, 2])
              expect(product.ids('sub_sector_id')).to.have.members([1])
              resolve()
            })
            .catch((err) => {
              reject(err)
            })
        })
      })

      it('returns Provider filters', function () {
        return new Promise(function (resolve, reject) {
          processor.buildFilters('sfdc_program_1')
            .then((filterMapByType) => {
              let providers = _.values(filterMapByType.Provider)
              expect(providers).to.have.length(2)

              let provider = providers[0].asJson()
              let expectedProvider = {
                name: 'Same Name Different ID',
                type: 'Provider',
                summary: null,
                sfdc_id: ['sfdc_participant_1'],
                product_id: [1],
                provider_id: [1],
                sector_id: [1],
                sub_sector_id: [1],
                links: [
                  {
                    display_name: 'Same Name Different ID',
                    url: 'https://www.export.gov/provider?id=sfdc_participant_1'
                  }
                ]
              }
              expect(provider).to.deep.equal(expectedProvider)
              resolve()
            })
            .catch((err) => {
              reject(err)
            })
        })
      })

      it('returns Sector filters', function () {
        return new Promise(function (resolve, reject) {
          processor.buildFilters('sfdc_program_1')
            .then((filterMapByType) => {
              let sectors = _.values(filterMapByType.Sector)
              expect(sectors).to.have.length(2)

              let sector = sectors[1].asJson()
              let expectedSector = {
                name: 'Product class 2',
                type: 'Sector',
                summary: null,
                sfdc_id: [],
                product_id: [1],
                provider_id: [2],
                sector_id: [2],
                links: []
              }
              expect(sector).to.deep.equal(expectedSector)
              resolve()
            })
            .catch((err) => {
              reject(err)
            })
        })
      })

      it('returns Sub-Sector filters', function () {
        return new Promise(function (resolve, reject) {
          processor.buildFilters('sfdc_program_1')
            .then((filterMapByType) => {
              let subSectors = _.values(filterMapByType['Sub-Sector'])
              expect(subSectors).to.have.length(1)

              let subSector = subSectors[0].asJson()
              let expectedSubSector = {
                name: 'Product category 1',
                type: 'Sub-Sector',
                summary: null,
                sfdc_id: [],
                product_id: [1],
                provider_id: [1],
                sector_id: [1],
                sub_sector_id: [1],
                links: []
              }
              expect(subSector).to.deep.equal(expectedSubSector)
              resolve()
            })
            .catch((err) => {
              reject(err)
            })
        })
      })
    })
  })
})
