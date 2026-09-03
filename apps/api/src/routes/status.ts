import { Router } from 'express'

import { checkJackett } from '../lib/status.ts'

export const statusRouter: Router = Router()

statusRouter.get('/', async (_req, res) => {
  res.json(await checkJackett())
})
