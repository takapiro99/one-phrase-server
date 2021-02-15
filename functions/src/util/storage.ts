import { v4 as uuidv4 } from 'uuid'
import { bucket } from '../firebase'

const STORAGE_ROOT = 'https://firebasestorage.googleapis.com/v0/b'
const ext = 'jpg'

export const upload = async (
  buf: Buffer,
  fileName: string
): Promise<string | undefined> => {
  const uuid = uuidv4()
  try {
    const file = bucket.file(`${fileName}.${ext}`)
    await file.save(buf, {
      metadata: {
        contentType: 'image/jpeg',
        metadata: {
          // uuidv4をトークンに指定すると画像が外部で表示できる
          firebaseStorageDownloadTokens: uuid
        }
      }
    })
    return `${STORAGE_ROOT}/${bucket.name}/o/${fileName}.${ext}?alt=media&token=${uuid}`
  } catch (error) {
    console.error('error uploading images')
    console.error(JSON.stringify(error))
    return undefined
  }
}
