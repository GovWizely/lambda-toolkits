const fs = require('fs')
const S3 = require('aws-sdk/clients/s3')

var Loader = {
  loadToFs: (filename, filters) => {
    return new Promise((resolve, reject) => {
      console.log('writing to file')
      fs.writeFile(`./output/${filename}`, JSON.stringify(filters, null, 2), (err) => {
        if (err) throw err
        console.log('The ' + filename + ' file was saved!')
        resolve(filters)
      })
    })
  },

  loadToS3Bucket: (filename, filters) => {
    return new Promise((resolve) => {
      console.log('loading to S3')
      let params = {
        Body: JSON.stringify(filters, null, 2),
        Bucket: process.env.S3_BUCKET,
        Key: filename,
        ACL: 'public-read',
        ContentType: 'application/json'
      }
      let s3 = new S3()
      s3.putObject(params, (err) => {
        if (err) throw err
        console.log(`File successfully uploaded: ${filename}`)
        resolve(filters)
      })
    })
  }
}

module.exports = Loader
