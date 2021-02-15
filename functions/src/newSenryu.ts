import * as express from 'express'
import Busboy from 'busboy'
import * as fs from 'fs'
import joinImages from 'join-images'
import * as sharp from 'sharp'
import { upload } from './lib/storage'
import { v4 as uuidv4 } from 'uuid'

const os = require('os')
const path = require('path')

interface uploadImages {
  [key: string]: string
}

export const newSenryu = (req: any, res: express.Response) => {
  // const bucket = admin.storage().bucket('gs://one-phrase.appspot.com')
  const busboy = new Busboy({ headers: req.headers })
  const tmpdir = os.tmpdir()
  // This object will accumulate all the fields, keyed by their name
  const fields: any = {}
  // This object will accumulate all the uploaded files, keyed by their name.
  const uploads: uploadImages = {}
  // This code will process each non-file field in the form.
  busboy.on('field', (fieldname, val) => {
    // console.log(`Processed field ${fieldname}: ${val}.`)
    fields[fieldname] = val
  })

  const fileWrites: any = []

  // This code will process each file uploaded.
  busboy.on('file', (fieldname, file, filename) => {
    // uploads[fieldname] = file

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
      return
    }
    if (!(uploads.image1 && uploads.image2 && uploads.image3)) {
      res.status(422).json({ message: 'image1, image2, image3 is required.' })
      return
    }
    // concatenate here
    const newSenryuPath = path.join(tmpdir, `${uuidv4()}.png`)
    let newImage: sharp.Sharp
    try {
      newImage = await joinImages(Object.values(uploads).reverse(), {
        direction: 'horizontal'
      })
      await newImage
        .png({ compressionLevel: 8, adaptiveFiltering: true, force: true })
        .toFile(newSenryuPath)
    } catch (error) {
      // failed to join images
      res.status(500).json({
        message: 'failed to merge image. please refer to the logs',
        error: JSON.stringify(error)
      })
      // console.error(error)
      return
    }

    let imageURL: string | undefined
    try {
      imageURL = await upload(newSenryuPath)
      console.log(imageURL)
    } catch (error) {
      // failed to upload to cloud firestore
      res.status(500).json({
        message:
          'failed to upload merged image to cloud storage. please refer to the logs',
        error: JSON.stringify(error)
      })
      // console.error(error)
      return
    } finally {
      fs.unlinkSync(newSenryuPath)
    }

    for (const file in uploads) {
      fs.unlinkSync(uploads[file])
    }

    // imageURLをゲットしたのでfirestoreに保存していきたい
    res.status(201).json({
      message: 'properly received all data! but not saved in firestore yet'
    })
  })

  busboy.end(req.rawBody)
}
