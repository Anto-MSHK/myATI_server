import { Router } from 'express'
import {
  BT_addGroup,
  BT_changeGroup,
  BT_deleteGroup,
  QT_changeGroup,
  QT_deleteGroup,
  QT_getGroup,
} from '@src/routes/groupRouter/group.types'
import GroupController from '@src/controllers/GroupController'
import { accessRights_maximum } from '../authRouter/auth.routes'
import { RT } from '@src/routes/resTypes'
import { check } from 'express-validator'
import { query } from 'express-validator'
import { errorsMSG } from './../../exceptions/API/errorsConst'

const group = Router()
group.post<string, any, RT, BT_addGroup, any>(
  '/add',
  [
    check('name', errorsMSG.NO_EMPTY).notEmpty(),
    check('faculty', errorsMSG.NO_EMPTY)
      .optional()
      .custom(value => value === 'FVO' || value === 'SPO'),
    ...accessRights_maximum,
  ],
  GroupController.addGroup
)
group.put<string, any, RT, BT_changeGroup, QT_changeGroup>(
  '/',
  [
    check('name', errorsMSG.NO_EMPTY).optional().notEmpty(),
    check('faculty', errorsMSG.NO_EMPTY)
      .optional()
      .custom(value => value === 'FVO' || value === 'SPO'),
    query('name', errorsMSG.QUERY_NO_EMPTY).notEmpty(),
    ...accessRights_maximum,
  ],
  GroupController.changeGroup
)
group.delete<string, any, RT, BT_deleteGroup, QT_deleteGroup>(
  '/',
  [query('name', errorsMSG.QUERY_NO_EMPTY).notEmpty(), ...accessRights_maximum],
  GroupController.deleteGroup
)

group.get<string, any, RT, any, QT_getGroup>('/', GroupController.getGroups)
export default group
