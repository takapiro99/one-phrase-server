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

<<<<<<< Updated upstream
=======
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

>>>>>>> Stashed changes
export const newSenryu = (req: any, res: express.Response) => {
  const busboy = new Busboy({ headers: req.headers })
  const tmpdir = os.tmpdir()
  // This object will accumulate all the fields, keyed by their name
  const fields: any = {}
  // This object will accumulate all the uploaded files, keyed by their name.
  const uploads: uploadImages = {}
  // This code will process each non-file field in the form.
<<<<<<< Updated upstream
  busboy.on('field', (fieldname, val) => {
    // console.log(`Processed field ${fieldname}: ${val}.`)
=======
  busboy.on('field', (fieldname: any, val) => {
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    if (!(fields.height && fields.userID && fields.lat && fields.lng)) {
      res.status(422).json({ message: 'height, userID, lat, lng is required.' })
=======
    if (!(fields.height && fields.userId && fields.lat && fields.lng)) {
      res.status(422).json({ message: 'height, userId, lat, lng is required.' })
      return
    }
    const lat = Number(fields.lat)
    const lng = Number(fields.lng)
    if (Number(fields.height) === NaN || lat === NaN || lng === NaN) {
      res.status(422).json({ message: 'height, lat, lng must be a number.' })
      return
    }
    if (lat >= 90 || lat <= -90 || lng >= 180 || lng <= -180) {
      res.status(422).json({ message: 'lat, lng must be a valid number.' })
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      imageURL = await upload(newSenryuPath)
      console.log(imageURL)
=======
      imageURL = await upload(newImageBuffer, newSenryuFileName)
      if (!imageURL) {
        throw Error('no image URL was generated')
      }
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
    res.status(201).json({
      message: 'properly received all data! but not saved in firestore yet'
    })
=======
    let newSenryuData: SenryusScheme
    const userRef = db.collection('users').doc(fields.userId)
    const doc = await userRef.get()
    if (!doc.exists) {
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
      res.status(500).json({
        message: 'failed to create senryu data.',
        error: JSON.stringify(error)
      })
      return
    }
    try {
      const ref = await db.collection('senryus').add(newSenryuData)
      console.log(`uploaded new senryu! : ${ref.id}`)
      res.status(201).json({
        message: 'new senryu has uploaded!'
      })
    } catch (error) {
      res.status(500).json({
        message: 'failed to set data to firestore. please refer to the logs',
        imageURL: imageURL,
        error: JSON.stringify(error)
      })
    }
>>>>>>> Stashed changes
  })

  busboy.end(req.rawBody)
}
