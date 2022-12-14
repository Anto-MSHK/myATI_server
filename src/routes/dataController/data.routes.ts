import { Router } from 'express'
import { RT } from '@src/routes/resTypes'
import DataController from '@src/controllers/DataController'

const data = Router()

data.get<string, any, RT>('/week', [], DataController.getCurWeek)

export default data
