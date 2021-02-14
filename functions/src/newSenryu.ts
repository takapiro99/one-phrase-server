import * as express from 'express'
import * as Busboy from 'busboy'
import * as fs from 'fs'
import { upload } from './lib/storage'

const os = require('os')
const path = require('path')

export const newSenryu = (req: any, res: express.Response) => {
  // const bucket = admin.storage().bucket('gs://one-phrase.appspot.com')
  const busboy = new Busboy({ headers: req.headers })
  const tmpdir = os.tmpdir()
  // This object will accumulate all the fields, keyed by their name
  const fields: any = {}
  // This object will accumulate all the uploaded files, keyed by their name.
  const uploads: any = {}
  // This code will process each non-file field in the form.
  busboy.on('field', (fieldname, val) => {
    // console.log(`Processed field ${fieldname}: ${val}.`)
    fields[fieldname] = val
  })

  const fileWrites: any = []

  // This code will process each file uploaded.
  busboy.on('file', (fieldname, file, filename) => {
    // console.log(`Processed file ${filename}`)
    uploads[fieldname] = file

    const filepath = path.join(tmpdir, filename)
    uploads[fieldname] = filepath

    const writeStream = fs.createWriteStream(filepath)
    file.pipe(writeStream)

    // 全部書き終わるのを待つ
    const promise = new Promise((resolve, reject) => {
      file.on('end', () => {
        writeStream.end()
      })
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })
    fileWrites.push(promise)
  })

  // Triggered once all uploaded files are processed by Busboy.
  busboy.on('finish', async () => {
    await Promise.all(fileWrites)
    if (!(fields.height && fields.userID && fields.lat && fields.lng)) {
      res.status(422).json({ message: 'height, userID, lat, lng is required.' })
      busboy.end(req.rawBody)
      return
    }
    if (!(uploads.image1 && uploads.image2 && uploads.image3)) {
      res.status(422).json({ message: 'image1, image2, image3 is required.' })
      busboy.end(req.rawBody)
      return
    }
    upload(uploads[2])
      .then(() => console.log('done'))
      .catch((e) => console.error(e))
    // process file here

    for (const file in uploads) {
      fs.unlinkSync(uploads[file])
    }
    res.json({
      message: 'properly received all data! but not saved in firestore yet'
    })
  })

  busboy.end(req.rawBody)
}
