import { v4 as uuidv4 } from 'uuid'
// import { UploadResponse } from '@google-cloud/storage'
import { bucket } from '../firebase'
// import * as fs from 'fs'
const STORAGE_ROOT = 'https://firebasestorage.googleapis.com/v0/b'

export const upload = async (
  buf: Buffer,
  fileName: string
): Promise<string | undefined> => {
  const uuid = uuidv4()
  // let uploadRes: UploadResponse

  // fs.writeFileSync(localFilePath, buf)

  console.info('upload: ' + fileName)
  try {
    const file = bucket.file(`${fileName}.jpg`)
    console.log(file.bucket.id)
    await file.save(buf, {
      metadata: {
        contentType: 'image/jpeg',
        metadata: {
          // uuidv4をトークンに指定すると画像が外部で表示できる
          firebaseStorageDownloadTokens: uuid
        }
      }
    })
    // uploadRes = await bucket.upload(localFilePath, {
    //   metadata: {

    //   }
    // })
    // fs.unlinkSync(localFilePath)
    // console.log("cleared cache")
    // console.info(JSON.stringify(uploadRes))
    // const dlPath = encodeURIComponent(uploadRes[0].name)
    return `${STORAGE_ROOT}/${bucket.name}/o/${fileName}?alt=media&token=${uuid}`
  } catch (error) {
    console.error('error uploading images')
    console.error(JSON.stringify(error))
    return undefined
  }
}
