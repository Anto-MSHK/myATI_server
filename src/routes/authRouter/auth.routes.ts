import { Router } from 'express'
import AuthController from '@src/controllers/AuthController'
import { BT_login } from './auth.types'
import { RT } from '@src/routes/resTypes'
import { check } from 'express-validator'
import { errorsMSG } from '../../exceptions/API/errorsConst'
import { BT_addRights } from './auth.types'
import authMiddleware from './../../middlewares/authMiddleware'
import roleMiddleware from './../../middlewares/roleMiddleware'

const auth = Router()

export const accessRights_extended = [authMiddleware, roleMiddleware(1)]
export const accessRights_maximum = [authMiddleware, roleMiddleware(2)]

auth.post<string, any, RT, BT_addRights>(
  '/addrights',
  [
    check('login', errorsMSG.NO_EMPTY).notEmpty(),
    check('password', errorsMSG.MIN_MAX(4, 10)).isLength({ min: 4, max: 10 }),
    ...accessRights_maximum,
  ],
  AuthController.addRights
)
auth.post<string, any, RT, BT_login>(
  '/login',
  [check('login', errorsMSG.NO_EMPTY).notEmpty(), check('password', errorsMSG.NO_EMPTY).notEmpty()],
  AuthController.login
)
auth.post<string, any, RT, BT_login>(
  '/logout',
  [check('login', errorsMSG.NO_EMPTY).notEmpty(), check('password', errorsMSG.NO_EMPTY).notEmpty()],
  AuthController.login
)
auth.get('/refresh')
auth.get<string>('/all', AuthController.getAllUsers)

export default auth
