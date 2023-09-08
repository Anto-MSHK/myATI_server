import { Router } from 'express'
import { RT } from '../../routes/resTypes'
import ManagerController from '../../controllers/ManagerController'

const manager = Router()
manager.get<string, any, RT, any, any>('/', ManagerController.reloadServer)
manager.get<string, any, RT, any, any>('/teacher/info', ManagerController.updateTeacherInfo)
export default manager
