import { Router } from 'express'
import GroupController from '../../controllers/GroupController'
import { accessRights_maximum } from '../authRouter/auth.routes'
import { RT } from '../../routes/resTypes'
import { check } from 'express-validator'
import { query } from 'express-validator'
import EduStructureController from '../../controllers/EduStructureController'
import {
  BT_addCabinet,
  BT_addSubject,
  BT_addTeacher,
  BT_changeCabinet,
  BT_changeSubject,
  BT_changeTeacher,
  QT_Cabinet,
  QT_Subject,
  QT_Teacher,
  QT_uniformTypes,
} from '../../routes/eduStructureRouter/eduStructure.types'
import Subject from '../../models/eduStructure/Subject/Subject.model'
import Teacher from '../../models/eduStructure/Teacher/Teacher.model'
import Cabinet from '../../models/eduStructure/Cabinet/Cabinet.model'
import { errorsMSG } from '../../exceptions/API/errorsConst'

const eduStructure = Router()
eduStructure.get<string, any, RT, any, QT_Subject>('/subject', [], EduStructureController.getSubject())
eduStructure.get<string, any, RT, any, QT_Teacher>('/teacher', [], EduStructureController.getTeacher())

eduStructure.post<string, any, RT, BT_addSubject>(
  '/subject/add',
  [
    check('title', errorsMSG.NO_EMPTY).notEmpty(),
    check('types', errorsMSG.IS_ARRAY).optional().isArray({ min: 1 }),
    check('cabinets_id', errorsMSG.IS_ARRAY).optional().isArray({ min: 1 }),
    ...accessRights_maximum,
  ],
  EduStructureController.add(Subject)
)

eduStructure.post<string, any, RT, BT_addTeacher>(
  '/teacher/add',
  [
    check('name', errorsMSG.NO_EMPTY).notEmpty(),
    check('degree', errorsMSG.IS_STRING).optional().isString(),
    check('subjects_id', errorsMSG.IS_ARRAY).optional().isArray({ min: 1 }),
    ...accessRights_maximum,
  ],
  EduStructureController.add(Teacher)
)
eduStructure.post<string, any, RT, BT_addCabinet>(
  '/cabinet/add',
  [check('item', errorsMSG.NO_EMPTY).notEmpty(), ...accessRights_maximum],
  EduStructureController.add(Cabinet)
)

eduStructure.put<string, any, RT, BT_changeSubject, QT_uniformTypes>(
  '/subject',
  [
    check('title', errorsMSG.NO_EMPTY).notEmpty(),
    check('types', errorsMSG.IS_ARRAY).optional().isArray({ min: 1 }),
    check('cabinets_id', errorsMSG.IS_ARRAY).optional().isArray({ min: 1 }),
    ...accessRights_maximum,
  ],
  EduStructureController.change(Subject)
)
eduStructure.put<string, any, RT, BT_changeTeacher, QT_uniformTypes>(
  '/teacher',
  [
    check('name', errorsMSG.NO_EMPTY).notEmpty(),
    check('degree', errorsMSG.IS_STRING).optional().isString(),
    check('subjects_id', errorsMSG.IS_ARRAY).optional().isArray({ min: 1 }),
    ...accessRights_maximum,
  ],
  EduStructureController.change(Teacher)
)
eduStructure.put<string, any, RT, BT_changeCabinet, QT_uniformTypes>(
  '/cabinet',
  [check('item', errorsMSG.NO_EMPTY).notEmpty(), ...accessRights_maximum],
  EduStructureController.change(Cabinet)
)

eduStructure.delete<string, any, RT, {}, QT_Subject>(
  '/subject',
  [query('title', errorsMSG.QUERY_NO_EMPTY).notEmpty(), ...accessRights_maximum],
  EduStructureController.delete(Subject)
)
eduStructure.delete<string, any, RT, {}, QT_Teacher>(
  '/teacher',
  [query('name', errorsMSG.QUERY_NO_EMPTY).notEmpty(), ...accessRights_maximum],
  EduStructureController.delete(Teacher)
)
eduStructure.delete<string, any, RT, {}, QT_Cabinet>(
  '/cabinet',
  [query('item', errorsMSG.QUERY_NO_EMPTY).notEmpty(), ...accessRights_maximum],
  EduStructureController.delete(Cabinet)
)

export default eduStructure
