import { QuerySnapshot } from '@google-cloud/firestore'
import * as express from 'express'
import { db } from './firebase'

export const getSenryus = async (req: any, res: express.Response) => {
  let snapshot: QuerySnapshot
  const userRef = db.collection('senryus')
  try {
    snapshot = await userRef.get()
    const items = snapshot.docs.map((doc: any) => {
      const data = doc.data()
      return {
        id: doc.id,
        user: data.user.id,
        imageURL: data.imageURL,
        height: data.height,
        lat: data.location._latitude,
        lng: data.location._longitude
      }
    })
    res.status(200).json({ message: 'here is all senryus.', items: items })
  } catch (error) {
    res.status(500).json({ message: 'something went wrong', error: error })
    console.log('Error getting documents: ', error)
  }
}
