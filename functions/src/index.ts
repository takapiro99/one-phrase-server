import * as functions from 'firebase-functions'
import { app } from './app'

const api = functions.region('asia-northeast1').https.onRequest(app)

export { api }
