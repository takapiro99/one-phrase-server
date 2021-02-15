import { v4 as uuidv4 } from 'uuid'
import { UploadResponse } from '@google-cloud/storage'
import { bucket } from '../firebase'
const STORAGE_ROOT = 'https://firebasestorage.googleapis.com/v0/b'

export const upload = async (
  localFilePath: string
): Promise<string | undefined> => {
  const uuid = uuidv4()
  let uploadRes: UploadResponse
  try {
    uploadRes = await bucket.upload(localFilePath, {
      metadata: {
        metadata: {
          // uuidv4をトークンに指定すると画像が外部で表示できる
          firebaseStorageDownloadTokens: uuid
        }
      }
    })
    console.info(JSON.stringify(uploadRes))
    const dlPath = encodeURIComponent(uploadRes[0].name)
    return `${STORAGE_ROOT}/${bucket.name}/o/${dlPath}?alt=media&token=${uuid}`
  } catch (error) {
    console.error(JSON.stringify(error))
    return undefined
  }
}
