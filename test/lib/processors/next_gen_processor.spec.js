const _ = require('lodash')
const expect = require('chai').expect
const sinon = require('sinon')
const helper = require('../../spec_helper')

describe('NextGenProcessor', function () {
  describe('.buildFilters()', function () {
    context('when multiple asset.Product2 with the same Name are present', function () {
      let processor

      beforeEach(function () {
        let assets = [
          {
            Product2: {
              Id: 'sfdc_product_1',
              Name: 'Product Name',
              Class__c: 'Product class 1'
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

        processor = new helper.NextGenProcessor('sfdc_program_1')

        sinon.stub(processor, '_queryAssets')
          .returns(Promise.resolve(assets))

        let relatedResources = [
          {
            Product__c: 'sfdc_product_1',
            Primary_Web_Resource__r: {
              Id: 'sfdc_web_resource_1',
              Name: 'Web Resource 1'
            }
          },
          {
            Product__c: 'sfdc_product_2',
            Primary_Web_Resource__r: {
              Id: 'sfdc_web_resource_2',
              Name: 'Web Resource 2',
              Summary__c: 'Web Resource 2 Summary'
            }
          }
        ]

        sinon.stub(processor, '_queryRelatedResources')
          .returns(Promise.resolve(relatedResources))
      })

      it('returns a Performance Improvement Area filter', function () {
        return new Promise(function (resolve, reject) {
          processor.buildFilters()
            .then((filterMapByType) => {
              let areas = _.values(filterMapByType['Performance Improvement Area'])
              expect(areas).to.have.length(2)

              let area = areas[1].asJson()
              let expectedArea = {
                name: 'Web Resource 2',
                type: 'Performance Improvement Area',
                summary: 'Web Resource 2 Summary',
                sfdc_id: [],
                improvement_area_id: [2],
                capability_id: [2],
                solution_id: [1],
                provider_id: [2],
                links: []
              }

              expect(area).to.deep.equal(expectedArea)
              resolve()
            })
            .catch((err) => {
              reject(err)
            })
        })
      })

      it('returns a Capability filter', function () {
        return new Promise(function (resolve, reject) {
          processor.buildFilters()
            .then((filterMapByType) => {
              let capabilities = _.values(filterMapByType.Capability)
              expect(capabilities).to.have.length(2)

              let capability = capabilities[1].asJson()
              let expectedCapability = {
                name: 'Product class 2',
                type: 'Capability',
                summary: null,
                sfdc_id: [],
                improvement_area_id: [2],
                capability_id: [2],
                solution_id: [1],
                provider_id: [2],
                links: []
              }

              expect(capability).to.deep.equal(expectedCapability)
              resolve()
            })
            .catch((err) => {
              reject(err)
            })
        })
      })

      it('returns a Solution filter', function () {
        return new Promise(function (resolve, reject) {
          processor.buildFilters()
            .then((filterMapByType) => {
              let solutions = _.values(filterMapByType.Solution)
              expect(solutions).to.have.length(1)

              let solution = solutions[0].asJson()
              let expectedSolution = {
                name: 'Product Name',
                type: 'Solution',
                summary: null,
                sfdc_id: [
                  'sfdc_product_1',
                  'sfdc_product_2'
                ],
                improvement_area_id: [1, 2],
                capability_id: [1, 2],
                solution_id: [1],
                provider_id: [1, 2],
                links: []
              }

              expect(solution).to.deep.equal(expectedSolution)
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
                improvement_area_id: [1],
                capability_id: [1],
                solution_id: [1],
                provider_id: [1],
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
    })
  })
})
