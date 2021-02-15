import { v4 as uuidv4 } from 'uuid'
import { UploadResponse } from '@google-cloud/storage'
import { bucket } from '../firebase'
const STORAGE_ROOT = 'https://firebasestorage.googleapis.com/v0/b'

export const upload = async (localFilePath: string): Promise<string> => {
  const uuid = uuidv4()
  const uploadRes: UploadResponse = await bucket.upload(localFilePath, {
    metadata: {
      metadata: {
        // uuidv4をトークンに指定すると画像が外部で表示できる
        firebaseStorageDownloadTokens: uuid
      }
    }
  })
  const dlPath = encodeURIComponent(uploadRes[0].name)

  return `${STORAGE_ROOT}/${bucket.name}/o/${dlPath}?alt=media&token=${uuid}`
}
