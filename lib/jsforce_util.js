const _ = require('lodash')
const jsforce = require('jsforce')

var JsforceUtil = {
  login: () => {
    return new Promise((resolve) => {
      var conn = new jsforce.Connection({
        loginUrl: 'https://trade.my.salesforce.com'
      })

      conn.login(process.env.SF_USERNAME, process.env.SF_PASSWORD, function (err) {
        if (err) throw err
        resolve(conn)
      })
    })
  },

  getProducts: (assets, sfdcObjects) => {
    return new Promise((resolve) => {
      JsforceUtil._extractProducts(assets)
        .then((products) => {
          sfdcObjects.Product = products
          resolve(sfdcObjects)
        })
    })
  },

  getProviders: (assets, sfdcObjects) => {
    return new Promise((resolve) => {
      JsforceUtil._extractProviders(assets)
        .then((providers) => {
          sfdcObjects.Provider = providers
          resolve(sfdcObjects)
        })
    })
  },

  queryAssets: (programId) => {
    return new Promise((resolve) => {
      console.log('calling query on Asset')
      JsforceUtil.login()
        .then((conn) => {
          conn.sobject('Asset')
            .find(
              {
                Program__c: programId,
                Status: 'Active',
                'Product2.IsActive': true
              },
              '*, Participant__r.*, Product2.*'
            )
            .sort({'Product2.Name': 'ASC'})
            .execute((err, assets) => {
              if (err) throw err
              console.log('fetched: ' + assets.length)
              resolve(assets)
            })
        })
    })
  },

  queryRelatedResources: (productIds) => {
    return new Promise((resolve) => {
      console.log('calling query on Related_Resource__c')
      JsforceUtil.login()
        .then((conn) => {
          conn.sobject('Related_Resource__c')
            .find(
              {
                Product__c: {
                  $in: productIds
                },
                'Primary_Web_Resource__r.Id': {
                  $ne: null
                }
              },
              '*, Primary_Web_Resource__r.*, Related_Web_Resource__r.*'
            )
            .sort({'Related_Resource__c.Product__c': 'ASC'})
            .execute((err, relatedResources) => {
              if (err) throw err
              console.log('fetched: ' + relatedResources.length)
              resolve(relatedResources)
            })
        })
    })
  },

  queryWebResourceLinks: (webResourceIds) => {
    return new Promise((resolve) => {
      console.log('calling query on Web_Resource_Link__c')
      JsforceUtil.login()
        .then((conn) => {
          conn.sobject('Web_Resource_Link__c')
            .find(
              {
                Id: {
                  $in: webResourceIds
                }
              },
              '*'
            )
            .sort({'DisplayName__c': 'ASC'})
            .execute((err, webResourceLinks) => {
              if (err) throw err
              console.log('fetched: ' + webResourceLinks.length)
              resolve(webResourceLinks)
            })
        })
    })
  },

  // queryRelatedResources: (productIds) => {
  //   return new Promise((resolve) => {
  //     console.log('calling query on RelatedResource')
  //     JsforceUtil.login()
  //       .then((conn) => {
  //         conn.sobject('Related_Resource__c')
  //           .find(
  //             {
  //               Product__c: {
  //                 $in: productIds
  //               },
  //               'Primary_Web_Resource__r.Id': {
  //                 $ne: null
  //               }
  //             },
  //             '*, Primary_Web_Resource__r.*'
  //           )
  //           .sort({'Related_Resource__c.Product__c': 'ASC'})
  //           .execute((err, relatedResources) => {
  //             if (err) throw err
  //             console.log('fetched: ' + relatedResources.length)
  //             resolve(relatedResources)
  //           })
  //       })
  //   })
  // },

  _extractProducts: (assets) => {
    return new Promise((resolve) => {
      let productMap = {}
      let products = _.map(assets, (asset) => {
        if (_.isNil(productMap[asset.Product2.Id])) {
          productMap[asset.Product2.Id] = asset.Product2
        }

        if (_.isNil(productMap[asset.Product2.Id].relatedParticipantIds)) {
          productMap[asset.Product2.Id].relatedParticipantIds = []
        }

        if (!_.isNil(asset.Participant__r)) {
          productMap[asset.Product2.Id].relatedParticipantIds.push(asset.Participant__r.Id)
        }

        return productMap[asset.Product2.Id]
      })
      resolve(_.uniqBy(products, 'Id'))
    })
  },

  _extractProviders: (assets) => {
    return new Promise((resolve) => {
      var providers = _.sortBy(_.uniqBy(_.map(assets, 'Participant__r'), 'Id'), 'Name')
      resolve(providers)
    })
  }

}

module.exports = JsforceUtil
