import * as express from 'express'

export const newSenryu = (req: express.Request, res: express.Response) => {
  return res.json({ message: 'done' })
}
