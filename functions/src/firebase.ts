import * as admin from 'firebase-admin'

let firebaseApp: admin.app.App

interface Cert {
  projectId: string | undefined
  clientEmail: string | undefined
  privateKey: string
}

if (!process.env.FIREBASE_PROJECT_ID) {
  // Cloud Functionsで実行している場合
  firebaseApp = admin.initializeApp()
  console.info(`initialized firebase!`)
} else {
  const cert: Cert = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: (process.env.FIREBASE_PRIVATE_KEY as string).replace(
      /\\n/g,
      '\n'
    )
  }

  const appOptions: admin.AppOptions = {
    credential: admin.credential.cert(cert)
  }
  firebaseApp = admin.initializeApp(appOptions)
  console.info(`initialized firebase as emulator!`)
}

export const bucket = firebaseApp
  .storage()
  .bucket(`gs://${process.env.FIREBASE_PROJECT_ID}.appspot.com`)

export default firebaseApp
