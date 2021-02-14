// tslint:disable-next-line:no-import-side-effect
import * as express from 'express'
import { newSenryu } from './newSenryu'

const cors = require('cors')
const app: express.Express = express()

// Automatically allow cross-origin requests
app.use(cors({ origin: true }))

// // CORSの許可
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   next();
// });

// if (process.env.NODE_ENV === 'development') {
//   app.use(express.urlencoded({ extended: true }))
//   app.use(express.json())
// }
// app.use(express.json()) //?

app.get('/', (req, res: express.Response) => {
  res.status(200).json({ message: 'hello' })
})

app.post('/new', newSenryu)

app.use((req, res: express.Response) =>
  res.status(404).json({ message: 'no content' })
)


export { app }
