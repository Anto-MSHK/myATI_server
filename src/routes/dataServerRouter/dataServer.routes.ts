import { Router } from 'express'
import { RT } from '@src/routes/resTypes'
import DataServerController from '@src/controllers/DataServerController'

const dataServer = Router()

// dataServer.get('/week', DataServerController.getCurWeek)
export default dataServer
