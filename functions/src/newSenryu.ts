import * as express from 'express'
import Busboy from 'busboy'
import * as fs from 'fs'
import joinImages from 'join-images'
import * as sharp from 'sharp'
import { upload } from './util/storage'
import { v4 as uuidv4 } from 'uuid'
import { db } from './firebase'
import { DocumentReference, GeoPoint, Timestamp } from '@google-cloud/firestore'

const os = require('os')
const path = require('path')

interface uploadImages {
  [key: string]: string
}

// interface reqFields {
//   userId?: string
//   height?: string
//   lat?: string
//   lng?: string
// }

interface SenryusScheme {
  imageURL: string
  height: number
  location: GeoPoint
  user: DocumentReference
  createdAt: Timestamp
}

export const newSenryu = (req: any, res: express.Response) => {
  const busboy = new Busboy({ headers: req.headers })
  const tmpdir = os.tmpdir()
  // This object will accumulate all the fields, keyed by their name
  const fields: any = {}
  // This object will accumulate all the uploaded files, keyed by their name.
  const uploads: uploadImages = {}

  // This code will process each non-file field in the form.
  busboy.on('field', (fieldname: any, val) => {
    fields[fieldname] = val
  })

  const fileWrites: any = []

  // This code will process each file uploaded.
  busboy.on('file', (fieldname, file, filename) => {
    const filepath = path.join(tmpdir, filename)
    uploads[fieldname] = filepath
    const writeStream = fs.createWriteStream(filepath)
    file.pipe(writeStream)
    // 全部書き終わるのを待つ
    const promise = new Promise((resolve, reject) => {
      file.on('end', () => writeStream.end())
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
    })
    fileWrites.push(promise)
  })

  // Triggered once all uploaded files are processed by Busboy.
  busboy.on('finish', async () => {
    await Promise.all(fileWrites)
    if (!(fields.height && fields.userId && fields.lat && fields.lng)) {
      console.info("422, height, userId, lat, lng is required. ")
      res.status(422).json({ message: 'height, userId, lat, lng is required.' })
      return
    }
    const lat = Number(fields.lat)
    const lng = Number(fields.lng)
    if (Number(fields.height) === NaN || lat === NaN || lng === NaN) {
      console.info("422 height, lat, lng must be a number.")
      res.status(422).json({ message: 'height, lat, lng must be a number.' })
      return
    }
    if (lat >= 90 || lat <= -90 || lng >= 180 || lng <= -180) {
      console.info("422 lat, lng must be a valid number.")
      res.status(422).json({ message: 'lat, lng must be a valid number.' })

      return
    }
    if (!(uploads.image1 && uploads.image2 && uploads.image3)) {
      console.info("422, image1, image2, image3 is required.")
      res.status(422).json({ message: 'image1, image2, image3 is required.' })
      return
    }
    // concatenate here
    const newSenryuFileName = uuidv4()
    let newImage: sharp.Sharp
    let newImageBuffer: Buffer
    try {
      newImage = await joinImages(Object.values(uploads).reverse(), {
        direction: 'horizontal'
      })
      newImageBuffer = await newImage.jpeg().toBuffer()
    } catch (error) {
      // failed to join images
      console.info("500 failed to merge image: " + JSON.stringify(error))
      res.status(500).json({
        message: 'failed to merge image. please refer to the logs',
        error: JSON.stringify(error)
      })
      return
    }

    let imageURL: string | undefined
    try {
      imageURL = await upload(newImageBuffer, newSenryuFileName)
      if (!imageURL) {
        throw Error('no image URL was generated')
      }
    } catch (error) {
      // failed to upload to cloud firestore
      console.info("500 failed to upload to cloud storage: " + JSON.stringify(error))
      res.status(500).json({
        message:
          'failed to upload merged image to cloud storage. please refer to the logs',
        error: JSON.stringify(error)
      })
      return
    }

    // /tmpに置いたファイルたちをお掃除
    for (const file in uploads) {
      fs.unlinkSync(uploads[file])
    }

    let newSenryuData: SenryusScheme
    const userRef = db.collection('users').doc(fields.userId)
    const doc = await userRef.get()
    if (!doc.exists) {
      console.info("500 no user: " + fields.userId)
      res.status(500).json({
        message: `there was no user: ${fields.userId}. we're working on this problem.`
      })
      return
    }
    try {
      newSenryuData = {
        imageURL: imageURL,
        height: fields.height as number,
        location: new GeoPoint(lat, lng),
        user: db.collection('users').doc(fields.userId),
        createdAt: Timestamp.now()
      }
    } catch (error) {
      console.info("500 failed to create senryu data: " + JSON.stringify(error))
      res.status(500).json({
        message: 'failed to create senryu data.',
        error: JSON.stringify(error)
      })
      return
    }
    try {
      const ref = await db.collection('senryus').add(newSenryuData)
      console.log(`uploaded new senryu! : ${ref.id}`, imageURL)
      res.status(201).json({
        message: 'new senryu has uploaded!',
        imageURL: imageURL
      })
    } catch (error) {
      console.info("500 failed to set to firestore: " + JSON.stringify(error))
      res.status(500).json({
        message: 'failed to set data to firestore. please refer to the logs',
        imageURL: imageURL,
        error: JSON.stringify(error)
      })
    }
  })
  busboy.end(req.rawBody)
}
