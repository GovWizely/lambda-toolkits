const fs = require('fs')
const S3 = require('aws-sdk/clients/s3')

const Endpointme = require('./endpointme')

var Loader = {
  load: (toolkitPath, filters) => {
    let filtersString = JSON.stringify(filters, null, 2)
    Loader.loadToFs(toolkitPath, filtersString)
      .then(() => Loader.loadToS3Bucket(toolkitPath, filtersString))
      .then(() => Endpointme.freshen(toolkitPath))
  },

  loadToFs: (toolkitPath, filtersString) => {
    return new Promise((resolve) => {
      console.log('writing to file')
      if (fs.existsSync('./output')) {
        fs.writeFile(`./output/${toolkitPath}.json`, filtersString, (err) => {
          if (err) throw err
          console.log('The ' + toolkitPath + ' file was saved!')
          resolve()
        })
      } else {
        console.warn('skipping loadToFs: output directory is not present')
        resolve()
      }
    })
  },

  loadToS3Bucket: (filename, filtersString) => {
    return new Promise((resolve) => {
      console.log('loading to S3')
      let params = {
        Body: filtersString,
        Bucket: process.env.S3_BUCKET,
        Key: filename,
        ACL: 'public-read',
        ContentType: 'application/json'
      }
      let s3 = new S3()
      s3.putObject(params, (err) => {
        if (err) throw err
        console.log(`File successfully uploaded: ${filename}`)
        resolve()
      })
    })
  }
}

module.exports = Loader
