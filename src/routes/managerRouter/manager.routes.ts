import { Router } from 'express'
import { RT } from '../../routes/resTypes'
import ManagerController from '../../controllers/ManagerController'

const manager = Router()
manager.get<string, any, RT, any, any>('/', ManagerController.reloadServer)
export default manager
