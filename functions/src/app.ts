// tslint:disable-next-line:no-import-side-effect
import express from 'express'
import { getSenryus } from './getSenryus'
import { newSenryu } from './newSenryu'

const cors = require('cors')
const app: express.Express = express()

// Automatically allow cross-origin requests
app.use(cors({ origin: true }))

const router: express.Router = express.Router()

router.get('/', (req, res: express.Response) => {
  res.status(200).json({ message: 'hello' })
})

router.post('/new', newSenryu)

router.get('/get-all-senryus', getSenryus)

router.use((req, res: express.Response) => {
  console.info('not found')
  res.status(404).json({ message: 'no content' })
})

app.use('/', router)

export { app }
