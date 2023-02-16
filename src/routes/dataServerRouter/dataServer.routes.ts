import { Router } from 'express'
import { RT } from '../routes/resTypes'
import DataServerController from '../controllers/DataServerController'

const dataServer = Router()

// dataServer.get('/week', DataServerController.getCurWeek)
export default dataServer
